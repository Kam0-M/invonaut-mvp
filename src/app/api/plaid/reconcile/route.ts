import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { transaction_id, action, invoice_id, payment_id } = await req.json()
  // action: 'confirm' | 'dismiss'

  if (action === 'dismiss') {
    await supabase
      .from('bank_transactions')
      .update({ match_status: 'dismissed' })
      .eq('id', transaction_id)
      .eq('user_id', user.id)
    return NextResponse.json({ success: true })
  }

  if (action === 'confirm') {
    await supabase
      .from('bank_transactions')
      .update({
        match_status:       'matched',
        matched_invoice_id: invoice_id ?? null,
        matched_payment_id: payment_id ?? null,
      })
      .eq('id', transaction_id)
      .eq('user_id', user.id)

    // If matched to invoice, mark invoice as paid
    if (invoice_id) {
      await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoice_id)
        .eq('user_id', user.id)
        .eq('status', 'sent') // only update if still sent/outstanding
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
