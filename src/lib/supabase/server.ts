import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * This client is configured for server-side usage and handles authentication state via cookies.
 * 
 * @returns A Supabase client instance configured for server usage
 * 
 * @example
 * ```tsx
 * import { createClient } from '@/lib/supabase/server'
 * 
 * export async function MyServerComponent() {
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('table').select('*')
 *   // Use data...
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // In API Route
 * import { createClient } from '@/lib/supabase/server'
 * 
 * export async function GET() {
 *   const supabase = await createClient()
 *   // Use supabase client...
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    )
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}