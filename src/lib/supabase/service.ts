import { createClient } from '@supabase/supabase-js'

/**
 * Service role client — bypasses Row Level Security.
 * Use ONLY in server-side cron jobs and admin routes.
 * Never expose to the client.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken:  false,
        persistSession:    false,
      },
    }
  )
}
