import { createClient } from '@/lib/supabase/server'
import { NextResponse }  from 'next/server'

export async function GET(request: Request) {
  const url        = new URL(request.url)
  const code       = url.searchParams.get('code')
  const token_hash = url.searchParams.get('token_hash')
  const type       = url.searchParams.get('type')
  const next       = url.searchParams.get('next') ?? '/dashboard'

  const supabase = await createClient()

  // ── OAuth code exchange (Google, Microsoft, etc.) ────────────────────────
  // When code is present but no token_hash, this is an OAuth callback.
  // The DB trigger handle_new_user creates the user_profile automatically.
  if (code && !token_hash) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin))
    }
    return NextResponse.redirect(new URL('/login?error=oauth_failed', url.origin))
  }

  // ── Email confirmation code (signup verify link) ─────────────────────────
  if (code && token_hash) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL('/verify-email', url.origin))
  }

  // ── OTP / magic link token ────────────────────────────────────────────────
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (!error) return NextResponse.redirect(new URL('/verify-email', url.origin))
  }

  return NextResponse.redirect(
    new URL('/login?error=Could not verify. Please try again.', url.origin)
  )
}
