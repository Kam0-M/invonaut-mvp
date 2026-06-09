// src/app/api/affiliate/request-payout/route.ts
// Creates a payout request. Commissions move to 'pending' (not 'paid') until
// admin actually marks the transfer done. total_paid is updated at that point too.

import { createClient } from '@/lib/supabase/server'
import { NextResponse }  from 'next/server'

const MIN_PAYOUT = 20 // $20 minimum

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: account } = await supabase
      .from('affiliate_accounts')
      .select('id, payout_method, payout_email, total_paid')
      .eq('user_id', user.id)
      .single()

    if (!account) {
      return NextResponse.json({ error: 'No affiliate account found' }, { status: 404 })
    }

    if (!account.payout_method || !account.payout_email) {
      return NextResponse.json(
        { error: 'Please set your payout method and email first' },
        { status: 400 }
      )
    }

    // Only grab commissions that are approved — not already pending or paid
    const { data: approved } = await supabase
      .from('affiliate_commissions')
      .select('id, amount')
      .eq('affiliate_id', account.id)
      .eq('status', 'approved')

    if (!approved || approved.length === 0) {
      return NextResponse.json(
        { error: 'No approved commissions to pay out' },
        { status: 400 }
      )
    }

    const total = approved.reduce((sum, c) => sum + Number(c.amount), 0)

    if (total < MIN_PAYOUT) {
      return NextResponse.json(
        { error: `Minimum payout is $${MIN_PAYOUT}. You have $${total.toFixed(2)} available.` },
        { status: 400 }
      )
    }

    // Create payout record (status: pending — awaiting admin confirmation)
    const { data: payoutRow, error: payoutErr } = await supabase
      .from('affiliate_payouts')
      .insert({
        affiliate_id:     account.id,
        amount:           total,
        commission_count: approved.length,
        status:           'pending',
        payout_method:    account.payout_method,
        requested_at:     new Date().toISOString(),
      })
      .select('id')
      .single()

    if (payoutErr || !payoutRow) {
      console.error('Payout insert error:', payoutErr)
      return NextResponse.json({ error: 'Failed to create payout request' }, { status: 500 })
    }

    // Move commissions to 'pending' — they leave 'approved' so they don't
    // show up in the eligible balance again, but aren't 'paid' yet either.
    const ids = approved.map(c => c.id)
    await supabase
      .from('affiliate_commissions')
      .update({ status: 'pending' })
      .in('id', ids)

    // NOTE: total_paid is NOT updated here — it's updated when admin marks paid.
    // This avoids showing affiliates a paid balance before you've sent the money.

    return NextResponse.json({ ok: true, amount: total, commission_count: approved.length })
  } catch (err) {
    console.error('request-payout error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  // Update payout method/email only
  try {
    const { payout_method, payout_email } = await req.json()
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('affiliate_accounts')
      .update({ payout_method, payout_email })
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('payout method update error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
