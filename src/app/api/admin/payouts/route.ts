// src/app/api/admin/payouts/route.ts
// Admin-only: list all pending payout requests with affiliate details.

import { createClient }         from '@/lib/supabase/server'
import { createClient as admin } from '@supabase/supabase-js'
import { NextResponse }          from 'next/server'

const ADMIN_EMAIL = 'kamohelo.thakhisi@gmail.com'

function adminSupabase() {
  return admin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const db = adminSupabase()

    // Get all payouts with affiliate account info
    const { data: payouts, error } = await db
      .from('affiliate_payouts')
      .select(`
        id, amount, commission_count, status,
        payout_method, payout_reference, requested_at, paid_at, notes,
        affiliate_accounts (
          id, payout_email,
          user_id
        )
      `)
      .order('requested_at', { ascending: false })

    if (error) throw error

    // Enrich with user email from auth (service role can read auth.users via admin API)
    const enriched = await Promise.all(
      (payouts || []).map(async (p: any) => {
        const acct = Array.isArray(p.affiliate_accounts) ? p.affiliate_accounts[0] : p.affiliate_accounts
        let affiliateEmail = acct?.payout_email || '—'

        if (acct?.user_id) {
          const { data: profile } = await db
            .from('user_profiles')
            .select('email, full_name, business_name')
            .eq('id', acct.user_id)
            .single()
          if (profile?.email) affiliateEmail = profile.email
          return {
            ...p,
            affiliate_email:   profile?.email || acct?.payout_email || '—',
            affiliate_name:    profile?.full_name || profile?.business_name || '—',
            payout_email:      acct?.payout_email || '—',
            affiliate_id:      acct?.id,
          }
        }

        return {
          ...p,
          affiliate_email: affiliateEmail,
          affiliate_name:  '—',
          payout_email:    acct?.payout_email || '—',
          affiliate_id:    acct?.id,
        }
      })
    )

    const pending = enriched.filter((p: any) => p.status === 'pending')
    const history = enriched.filter((p: any) => p.status !== 'pending')

    return NextResponse.json({ ok: true, pending, history })
  } catch (err) {
    console.error('admin payouts GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
