import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const requestedNext = searchParams.get('next')
  const targetRedirect = requestedNext?.startsWith('/') ? requestedNext : '/dashboard'

  const encodeLoginRedirect = () => {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'auth_callback_error')
    return loginUrl
  }

  if (!code) {
    return NextResponse.redirect(encodeLoginRedirect())
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      throw error
    }

    return NextResponse.redirect(new URL(targetRedirect, request.url))
  } catch {
    return NextResponse.redirect(encodeLoginRedirect())
  }
}

