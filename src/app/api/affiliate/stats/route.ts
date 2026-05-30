// src/app/api/affiliate/stats/route.ts
// Returns full stats for the logged-in user's affiliate account.

import { createClient } from '@/lib/supabase/server'
import { NextResponse }  from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get affiliate account
    const { data: account } = await supabase
      .from('affiliate_accounts')
      .select('id, referral_code, status, payout_method, payout_email, total_earned, total_paid')
      .eq('user_id', user.id)
      .single()

    if (!account) {
      return NextResponse.json({ affiliated: false })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://invonaut-mvp.vercel.app'

    // Referrals
    const { data: referrals } = await supabase
      .from('affiliate_referrals')
      .select('id, referred_user_id, status, signup_date, conversion_date, current_plan')
      .eq('affiliate_id', account.id)
      .order('signup_date', { ascending: false })

    // Commissions
    const { data: commissions } = await supabase
      .from('affiliate_commissions')
      .select('id, referral_id, amount, status, period_start, period_end, created_at, stripe_invoice_id')
      .eq('affiliate_id', account.id)
      .order('created_at', { ascending: false })

    // Payouts
    const { data: payouts } = await supabase
      .from('affiliate_payouts')
      .select('id, amount, commission_count, status, payout_method, payout_reference, requested_at, paid_at')
      .eq('affiliate_id', account.id)
      .order('requested_at', { ascending: false })

    // Calculate payout-eligible amount (approved commissions not yet paid)
    const eligibleAmount = (commissions || [])
      .filter(c => c.status === 'approved')
      .reduce((sum, c) => sum + Number(c.amount), 0)

    const totalReferrals  = (referrals || []).length
    const activeReferrals = (referrals || []).filter(r => r.status === 'active').length
    const pendingEarnings = (commissions || [])
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + Number(c.amount), 0)

    return NextResponse.json({
      affiliated:      true,
      account: {
        referral_code:  account.referral_code,
        referral_link:  `${appUrl}/signup?ref=${account.referral_code}`,
        status:         account.status,
        payout_method:  account.payout_method,
        payout_email:   account.payout_email,
        total_earned:   Number(account.total_earned),
        total_paid:     Number(account.total_paid),
      },
      stats: {
        total_referrals:  totalReferrals,
        active_referrals: activeReferrals,
        pending_earnings: pendingEarnings,
        eligible_amount:  eligibleAmount,
        total_earned:     Number(account.total_earned),
      },
      referrals:   referrals   || [],
      commissions: commissions || [],
      payouts:     payouts     || [],
    })
  } catch (err) {
    console.error('affiliate stats error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
