// src/lib/security/pwned-password.ts
//
// Client-side helper for checking a password against the HaveIBeenPwned
// "Pwned Passwords" breach corpus — without ever sending the plaintext
// password (or even its full hash) off the user's device unnecessarily.
//
// How it works (k-anonymity, the same model HaveIBeenPwned itself
// recommends and Supabase's own Pro-tier feature is built on):
//   1. Hash the password with SHA-1 in the browser (Web Crypto API).
//   2. Send only the full hash to our own /api/auth/check-password-leak route.
//   3. That route splits it into a 5-char prefix + 35-char suffix and asks
//      the Pwned Passwords range API for every suffix sharing that prefix.
//   4. We check server-side whether our suffix is in that list.
// The plaintext password itself never leaves the browser in any form.
//
// Why this lives in app code instead of a Supabase toggle: leaked-password
// protection is gated behind the Supabase Pro plan. Auth Hooks were
// evaluated as a free-tier alternative but don't work for this — the
// "Before User Created" hook (free plan) never receives the plaintext
// password in its payload, and the one hook that does relate to passwords
// ("Password Verification Attempt") is Teams/Enterprise-only and only
// fires on sign-in, not signup. So this check has to happen here, before
// supabase.auth.signUp() or supabase.auth.updateUser() is ever called.
//
// Failure behavior: if the breach API is unreachable, we fail OPEN (don't
// block signup/reset over a third-party outage) but report checked:false
// so callers can log it honestly instead of pretending a check happened.

export type PwnedCheckResult = {
  /** true if we actually got an answer from the breach API */
  checked: boolean
  /** true only when checked === true AND the password was found in a breach */
  pwned: boolean
  /** number of times seen in known breaches, when pwned */
  count?: number
}

async function sha1Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-1', bytes)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

/**
 * Call from client components only ('use client'). Hashes the password
 * locally, then asks our server route to check the hash against the
 * Pwned Passwords range API. Never sends the plaintext password anywhere.
 */
export async function checkPasswordLeaked(password: string): Promise<PwnedCheckResult> {
  try {
    const hash = await sha1Hex(password)
    const res = await fetch('/api/auth/check-password-leak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash }),
    })

    if (!res.ok) {
      console.warn('Password breach check unavailable (non-OK response) — allowing by default.')
      return { checked: false, pwned: false }
    }

    const data = await res.json()
    return { checked: !!data.checked, pwned: !!data.pwned, count: data.count }
  } catch (err) {
    console.warn('Password breach check unavailable (network error) — allowing by default.', err)
    return { checked: false, pwned: false }
  }
}
