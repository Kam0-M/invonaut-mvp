import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient, PLAID_PRODUCTS, PLAID_COUNTRY_CODES } from '@/lib/plaid/client'

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
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const tier = profile?.subscription_tier ?? 'starter'
  const limits: Record<string, number> = { starter: 1, professional: 3, business: 999 }
  const limit = limits[tier] ?? 1

  const { count } = await supabase
    .from('connected_accounts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('sync_status', 'active')

  if ((count ?? 0) >= limit) {
    return NextResponse.json(
      { error: `Your ${tier} plan supports up to ${limit} connected account${limit === 1 ? '' : 's'}. Upgrade to connect more.` },
      { status: 403 }
    )
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
