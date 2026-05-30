// src/middleware.ts
// Required by @supabase/ssr — refreshes the auth session on every request so
// server components always see a valid user. Without this, cookies expire
// between requests and auth breaks on Vercel (causing false "invalid credentials").

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do NOT remove this line. It keeps the session alive.
  await supabase.auth.getUser()

  // ── Referral cookie: persist ?ref=CODE for 30 days ──────────────────────
  const ref = request.nextUrl.searchParams.get('ref')
  if (ref && /^[A-Z0-9]{6,20}$/i.test(ref)) {
    supabaseResponse.cookies.set('inv_ref', ref.toUpperCase(), {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      sameSite: 'lax',
      httpOnly: false, // needs to be readable by client JS on signup
    })
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and image assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
