import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid/client'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { public_token, metadata } = await req.json()
  if (!public_token) return NextResponse.json({ error: 'Missing public_token' }, { status: 400 })

  try {
    // Exchange public token for permanent access token
    const exchangeRes = await plaidClient.itemPublicTokenExchange({ public_token })
    const { access_token, item_id } = exchangeRes.data

    // Fetch account details
    const accountsRes = await plaidClient.accountsGet({ access_token })
    const account = accountsRes.data.accounts[0] // take first account from this item

    const institution = metadata?.institution ?? {}

    // Store in DB
    const { data: connectedAccount, error } = await supabase
      .from('connected_accounts')
      .insert({
        user_id:            user.id,
        plaid_access_token: access_token,
        plaid_item_id:      item_id,
        institution_name:   institution.name ?? account.name,
        institution_id:     institution.institution_id ?? null,
        account_id:         account.account_id,
        account_name:       account.name,
        account_type:       account.type,
        account_subtype:    account.subtype,
        current_balance:    account.balances.current,
        available_balance:  account.balances.available,
        currency:           account.balances.iso_currency_code ?? 'USD',
        last_synced_at:     new Date().toISOString(),
        sync_status:        'active',
      })
      .select()
      .single()

    if (error) throw error

    // Kick off initial transaction sync
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/plaid/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') ?? '' },
      body: JSON.stringify({ connected_account_id: connectedAccount.id }),
    })

    return NextResponse.json({ success: true, account: connectedAccount })
  } catch (err: any) {
    console.error('[plaid/exchange-token]', err?.response?.data ?? err)
    return NextResponse.json({ error: 'Failed to connect account' }, { status: 500 })
  }
}
