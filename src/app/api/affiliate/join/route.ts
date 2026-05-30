// src/app/api/affiliate/join/route.ts
// Creates an affiliate_accounts row for the logged-in user.
// Generates a unique 6-char alphanumeric referral code.

import { createClient } from '@/lib/supabase/server'
import { NextResponse }  from 'next/server'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no O, 0, I, 1 (ambiguous)
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if already an affiliate
    const { data: existing } = await supabase
      .from('affiliate_accounts')
      .select('id, referral_code')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://invonaut-mvp.vercel.app'
      return NextResponse.json({
        ok: true,
        already_exists: true,
        referral_code: existing.referral_code,
        referral_link: `${appUrl}/signup?ref=${existing.referral_code}`,
      })
    }

    // Generate a unique code (retry on collision)
    let code = ''
    let attempts = 0
    while (attempts < 10) {
      const candidate = generateCode()
      const { data: clash } = await supabase
        .from('affiliate_accounts')
        .select('id')
        .eq('referral_code', candidate)
        .single()
      if (!clash) { code = candidate; break }
      attempts++
    }

    if (!code) {
      return NextResponse.json({ error: 'Could not generate unique code' }, { status: 500 })
    }

    const { data: account, error: insertErr } = await supabase
      .from('affiliate_accounts')
      .insert({
        user_id:       user.id,
        referral_code: code,
        status:        'active',
        total_earned:  0,
        total_paid:    0,
      })
      .select('id, referral_code')
      .single()

    if (insertErr || !account) {
      console.error('Affiliate insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://invonaut-mvp.vercel.app'
    return NextResponse.json({
      ok: true,
      referral_code: account.referral_code,
      referral_link: `${appUrl}/signup?ref=${account.referral_code}`,
    })
  } catch (err) {
    console.error('affiliate join error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
