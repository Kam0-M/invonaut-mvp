import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid/client'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { connected_account_id } = await req.json()

  const { data: account } = await supabase
    .from('connected_accounts')
    .select('plaid_access_token')
    .eq('id', connected_account_id)
    .eq('user_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    // Revoke the Plaid access token
    await plaidClient.itemRemove({ access_token: account.plaid_access_token })
  } catch {
    // Continue even if Plaid revocation fails — still clean up locally
  }

  // Delete from DB (cascades to bank_transactions)
  await supabase
    .from('connected_accounts')
    .delete()
    .eq('id', connected_account_id)
    .eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
