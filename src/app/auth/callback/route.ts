import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Successfully confirmed email - redirect BACK to verify-email page
      // The page will detect confirmation and auto-redirect to dashboard
      return NextResponse.redirect(new URL('/verify-email', requestUrl.origin))
    }
  }

  if (token_hash && type) {
    const supabase = await createClient()
    
    // Verify the email with token
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any
    })
    
    if (!error) {
      // Successfully confirmed email - redirect BACK to verify-email page
      return NextResponse.redirect(new URL('/verify-email', requestUrl.origin))
    }
  }

  // If something went wrong, redirect to login with error message
  return NextResponse.redirect(
    new URL('/login?error=Could not verify email. Please try again.', requestUrl.origin)
  )
}
