// src/app/api/affiliate/track-signup/route.ts
// Called after signup if an inv_ref cookie was present.
// Looks up the affiliate account and creates a referral row.

import { createClient }    from '@/lib/supabase/server'
import { NextResponse }    from 'next/server'

export async function POST(req: Request) {
  try {
    const { referral_code, referred_user_id } = await req.json()

    if (!referral_code || !referred_user_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // Look up the affiliate account for this code
    const { data: affiliate, error: affErr } = await supabase
      .from('affiliate_accounts')
      .select('id, user_id, status')
      .eq('referral_code', referral_code.toUpperCase())
      .single()

    if (affErr || !affiliate) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
    }

    if (affiliate.status !== 'active') {
      return NextResponse.json({ error: 'Affiliate account not active' }, { status: 403 })
    }

    // Don't let users refer themselves
    if (affiliate.user_id === referred_user_id) {
      return NextResponse.json({ ok: true, skipped: 'self_referral' })
    }

    // Check if this user was already referred by someone
    const { data: existing } = await supabase
      .from('affiliate_referrals')
      .select('id')
      .eq('referred_user_id', referred_user_id)
      .single()

    if (existing) {
      return NextResponse.json({ ok: true, skipped: 'already_referred' })
    }

    // Create the referral row
    const { error: insertErr } = await supabase
      .from('affiliate_referrals')
      .insert({
        affiliate_id:     affiliate.id,
        referred_user_id,
        referral_code:    referral_code.toUpperCase(),
        status:           'pending',
        signup_date:      new Date().toISOString(),
      })

    if (insertErr) {
      console.error('Referral insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to record referral' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('track-signup error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
