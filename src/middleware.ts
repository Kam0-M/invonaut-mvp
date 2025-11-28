import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export default async function middleware(request: NextRequest) {
  const cookieStore = request.cookies
  const pendingCookies: Parameters<typeof cookieStore.set>[] = []

  const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        pendingCookies.push(...cookiesToSet)
      }
    }
  })

  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (!error) {
      user = data.user
    }
  } catch {
    user = null
  }

  const pathname = request.nextUrl.pathname
  const isDashboardPath = pathname.startsWith('/dashboard')
  const isAuthPage = pathname === '/login' || pathname === '/signup'

  let response = NextResponse.next()

  if (!user && isDashboardPath) {
    response = NextResponse.redirect(new URL('/login', request.url))
  } else if (user && isAuthPage) {
    response = NextResponse.redirect(new URL('/dashboard', request.url))
  }

  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}

