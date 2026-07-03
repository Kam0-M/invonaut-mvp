import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient, PLAID_PRODUCTS, PLAID_COUNTRY_CODES } from '@/lib/plaid/client'
import { isSubscriptionActive } from '@/lib/subscription-status'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Guard: env vars must be present
  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
    console.error('[plaid/create-link-token] Missing PLAID_CLIENT_ID or PLAID_SECRET env vars')
    return NextResponse.json(
      { error: 'Plaid is not configured. Add PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV to your .env.local file.' },
      { status: 500 }
    )
  }

  // Check tier limit
  // Checklist #36: was tier-only — Plaid is free in sandbox today but
  // becomes real usage-based cost at production pricing, and this let a
  // canceled account keep its stale tier's connection limit indefinitely
  // (subscription_tier is intentionally preserved on cancellation, #33).
  // Plaid connectivity is a paid-tier feature at every level (no free tier
  // in this product), so an inactive subscription gets 0 new slots rather
  // than falling back to the Starter limit.
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier, stripe_subscription_id, subscription_status, trial_end_date')
    .eq('id', user.id)
    .single()

  const tier = profile?.subscription_tier ?? 'starter'
  const limits: Record<string, number> = { starter: 1, professional: 3, business: 999 }
  const limit = isSubscriptionActive(profile) ? (limits[tier] ?? 1) : 0

  const { count } = await supabase
    .from('connected_accounts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('sync_status', 'active')

  if ((count ?? 0) >= limit) {
    const message = limit === 0
      ? 'Bank connectivity requires an active subscription. Reactivate your plan to connect an account.'
      : `Your ${tier} plan supports up to ${limit} connected account${limit === 1 ? '' : 's'}. Upgrade to connect more.`
    return NextResponse.json({ error: message }, { status: 403 })
  }

  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: 'Invonaut',
      products: PLAID_PRODUCTS,
      country_codes: PLAID_COUNTRY_CODES,
      language: 'en',
    })
    return NextResponse.json({ link_token: response.data.link_token })
  } catch (err: any) {
    const plaidError = err?.response?.data
    console.error('[plaid/create-link-token]', plaidError ?? err)
    const message = plaidError?.error_message ?? plaidError?.display_message ?? 'Failed to create link token'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
