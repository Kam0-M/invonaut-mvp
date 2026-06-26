// src/lib/storage/signed-url.ts
//
// Checklist #22 fix. client-files, invoice-attachments, payment-attachments, and
// receipts are now private buckets (were all public, which made every
// "Users can read their own X" RLS policy moot — files were served via
// Supabase's unauthenticated public CDN path, which never consults RLS at all).
//
// The DB still stores the old "/storage/v1/object/public/<bucket>/<path>" URL
// shape from when these buckets were public — no schema migration was needed,
// that string is just being reused purely as a path carrier now. This helper
// parses the bucket + object path back out of it and exchanges it for a
// short-lived signed URL, generated server-side with the service-role key.
// Callers are server components/routes that have already confirmed ownership
// via the DB row this URL came from (scoped by user_id), so using the admin
// client here is safe and sidesteps any per-bucket RLS-policy inconsistency.
import { createClient as createServiceRoleClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createServiceRoleClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const PUBLIC_URL_PATTERN = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/

/**
 * Exchange a stored (formerly-public) Supabase storage URL for a fresh signed
 * URL. Returns null if the input is empty or signing fails (e.g. the object
 * was deleted) — callers should treat null as "no attachment available"
 * rather than throwing. Returns the input unchanged if it doesn't match the
 * expected stored-public-url shape (e.g. a logos URL — that bucket
 * intentionally stays public, nothing needs to change for it).
 */
export async function resolveSignedUrl(
  storedUrl: string | null | undefined,
  expiresInSeconds = 3600
): Promise<string | null> {
  if (!storedUrl) return null

  const match = storedUrl.match(PUBLIC_URL_PATTERN)
  if (!match) return storedUrl

  const [, bucket, encodedPath] = match
  const path = decodeURIComponent(encodedPath)

  try {
    const { data, error } = await getAdminClient()
      .storage.from(bucket)
      .createSignedUrl(path, expiresInSeconds)

    if (error || !data?.signedUrl) {
      console.error(`resolveSignedUrl: failed to sign ${bucket}/${path}`, error)
      return null
    }
    return data.signedUrl
  } catch (err) {
    console.error(`resolveSignedUrl: unexpected error signing ${bucket}/${path}`, err)
    return null
  }
}

/**
 * Batch version — resolves many stored URLs concurrently. Useful for list
 * pages (expenses, payments, client files) rendering several attachments at once.
 */
export async function resolveSignedUrls(
  storedUrls: (string | null | undefined)[],
  expiresInSeconds = 3600
): Promise<(string | null)[]> {
  return Promise.all(storedUrls.map(u => resolveSignedUrl(u, expiresInSeconds)))
}
