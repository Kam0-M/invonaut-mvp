// src/app/api/auth/check-password-leak/route.ts
//
// Server-side half of the leaked-password check — see
// src/lib/security/pwned-password.ts for the full explanation of why this
// exists (Supabase's built-in leaked-password toggle is Pro-plan-only).
//
// Receives only a SHA-1 hash — never a plaintext password — and checks it
// against HaveIBeenPwned's free, keyless Pwned Passwords range API using
// the k-anonymity model (we only ever send a 5-character prefix upstream).

import { NextResponse } from 'next/server'

const HASH_RE = /^[0-9A-F]{40}$/

export async function POST(req: Request) {
  try {
    const { hash } = await req.json()

    if (typeof hash !== 'string' || !HASH_RE.test(hash)) {
      return NextResponse.json({ error: 'Invalid hash' }, { status: 400 })
    }

    const prefix = hash.slice(0, 5)
    const suffix = hash.slice(5)

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        // Pads the response with dummy entries so response size can't be
        // used as a side channel to infer whether there was a match.
        'Add-Padding': 'true',
        'User-Agent': 'Invonaut-Password-Check',
      },
    })

    if (!res.ok) {
      console.error('Pwned Passwords API returned non-OK status:', res.status)
      // Fail open — don't block signup/reset over a third-party outage.
      return NextResponse.json({ checked: false, pwned: false })
    }

    const body = await res.text()
    const match = body
      .split('\n')
      .map(line => line.trim())
      .find(line => line.startsWith(suffix))

    if (!match) {
      return NextResponse.json({ checked: true, pwned: false })
    }

    const count = parseInt(match.split(':')[1] ?? '0', 10)
    return NextResponse.json({ checked: true, pwned: true, count })
  } catch (err) {
    console.error('check-password-leak error:', err)
    // Fail open, same reasoning as above — an unreachable third-party API
    // should never be the reason a legitimate user can't sign up.
    return NextResponse.json({ checked: false, pwned: false })
  }
}
