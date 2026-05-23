import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient, PLAID_PRODUCTS, PLAID_COUNTRY_CODES } from '@/lib/plaid/client'
import { redirect } from 'next/navigation'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check tier — starter gets 1 account, professional 3, business unlimited
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
      { error: `Your ${tier} plan supports up to ${limit} connected account${limit === 1 ? '' : 's'}.` },
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
    console.error('[plaid/create-link-token]', err?.response?.data ?? err)
    return NextResponse.json({ error: 'Failed to create link token' }, { status: 500 })
  }
}
