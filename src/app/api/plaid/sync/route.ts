import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid/client'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { connected_account_id } = await req.json()

  // Fetch the connected account — verify ownership
  const { data: account, error: accountErr } = await supabase
    .from('connected_accounts')
    .select('*')
    .eq('id', connected_account_id)
    .eq('user_id', user.id)
    .single()

  if (accountErr || !account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  try {
    // Pull last 90 days of transactions
    const now = new Date()
    const start = new Date(now)
    start.setDate(start.getDate() - 90)

    const txRes = await plaidClient.transactionsGet({
      access_token: account.plaid_access_token,
      start_date:   start.toISOString().split('T')[0],
      end_date:     now.toISOString().split('T')[0],
      options:      { count: 500, offset: 0 },
    })

    const transactions = txRes.data.transactions

    // Upsert transactions — ignore duplicates by plaid_transaction_id
    if (transactions.length > 0) {
      const rows = transactions.map(tx => ({
        user_id:              user.id,
        connected_account_id: account.id,
        plaid_transaction_id: tx.transaction_id,
        amount:               tx.amount,           // Plaid: positive = debit, negative = credit
        date:                 tx.date,
        merchant_name:        tx.merchant_name ?? null,
        description:          tx.name,
        category:             tx.personal_finance_category?.primary
                              ?? (tx.category ? tx.category[0] : null),
        category_source:      'plaid',
        pending:              tx.pending,
        currency:             tx.iso_currency_code ?? 'USD',
        match_status:         'unmatched',
      }))

      await supabase
        .from('bank_transactions')
        .upsert(rows, { onConflict: 'plaid_transaction_id', ignoreDuplicates: true })
    }

    // Update balance + last synced
    const balanceRes = await plaidClient.accountsGet({ access_token: account.plaid_access_token })
    const freshAccount = balanceRes.data.accounts[0]

    await supabase
      .from('connected_accounts')
      .update({
        current_balance:   freshAccount.balances.current,
        available_balance: freshAccount.balances.available,
        last_synced_at:    new Date().toISOString(),
        sync_status:       'active',
      })
      .eq('id', account.id)

    return NextResponse.json({ success: true, synced: transactions.length })
  } catch (err: any) {
    console.error('[plaid/sync]', err?.response?.data ?? err)
    // Mark account as error state
    await supabase
      .from('connected_accounts')
      .update({ sync_status: 'error' })
      .eq('id', account.id)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
