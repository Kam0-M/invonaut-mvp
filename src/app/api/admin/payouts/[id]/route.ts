// src/app/api/admin/payouts/[id]/route.ts
// Admin-only: mark a payout as paid, update commissions, send email to affiliate.

import { createClient }         from '@/lib/supabase/server'
import { createClient as admin } from '@supabase/supabase-js'
import { NextResponse }          from 'next/server'
import { Resend }                from 'resend'

const ADMIN_EMAIL = 'kamohelo.thakhisi@gmail.com'

function adminSupabase() {
  return admin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const { reference = 'manual' } = await req.json().catch(() => ({}))

    const db = adminSupabase()

    // 1. Get the payout record
    const { data: payout, error: fetchErr } = await db
      .from('affiliate_payouts')
      .select('id, affiliate_id, amount, payout_method, status')
      .eq('id', id)
      .single()

    if (fetchErr || !payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
    }

    if (payout.status === 'paid') {
      return NextResponse.json({ error: 'Already marked as paid' }, { status: 400 })
    }

    const now = new Date().toISOString()

    // 2. Mark payout as paid
    await db
      .from('affiliate_payouts')
      .update({ status: 'paid', paid_at: now, payout_reference: reference })
      .eq('id', id)

    // 3. Mark the affiliate's 'pending' commissions as 'paid'
    await db
      .from('affiliate_commissions')
      .update({ status: 'paid' })
      .eq('affiliate_id', payout.affiliate_id)
      .eq('status', 'pending')

    // 4. Update total_paid on affiliate account
    const { data: acct } = await db
      .from('affiliate_accounts')
      .select('total_paid, payout_email, user_id')
      .eq('id', payout.affiliate_id)
      .single()

    if (acct) {
      await db
        .from('affiliate_accounts')
        .update({ total_paid: Number(acct.total_paid) + Number(payout.amount) })
        .eq('id', payout.affiliate_id)

      // 5. Send confirmation email to affiliate
      if (acct.payout_email && process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY)
          const amt = `$${Number(payout.amount).toFixed(2)}`
          const method = payout.payout_method || 'your account'

          // Get affiliate's name from user_profiles
          let affiliateName = 'Partner'
          if (acct.user_id) {
            const { data: profile } = await db
              .from('user_profiles')
              .select('full_name, business_name')
              .eq('id', acct.user_id)
              .single()
            affiliateName = profile?.full_name || profile?.business_name || 'Partner'
          }

          await resend.emails.send({
            from:    'Invonaut <onboarding@resend.dev>',
            to:      acct.payout_email,
            subject: `Your Invonaut payout of ${amt} is on its way`,
            html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8FAFF;font-family:'Inter',sans-serif">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden">
  <div style="background:linear-gradient(135deg,#0055FF,#0040DD);padding:32px 40px">
    <img src="${process.env.NEXT_PUBLIC_APP_URL}/naut-white.svg" alt="Invonaut" style="height:28px;margin-bottom:16px"/>
    <h1 style="margin:0;color:#fff;font-size:1.4rem;font-weight:800;letter-spacing:-.02em">Payout on its way</h1>
  </div>
  <div style="padding:32px 40px">
    <p style="margin:0 0 12px;color:#374151;font-size:.95rem">Hi ${affiliateName},</p>
    <p style="margin:0 0 24px;color:#374151;font-size:.95rem">
      Your affiliate payout of <strong style="color:#0055FF">${amt}</strong> has been sent to your 
      <strong>${method}</strong> account${reference && reference !== 'manual' ? ` (ref: ${reference})` : ''}.
    </p>
    <div style="background:#F8FAFF;border-radius:12px;padding:20px 24px;margin-bottom:24px">
      <p style="margin:0;font-size:.8rem;color:#64748B;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Payout details</p>
      <p style="margin:0;font-size:1.5rem;font-weight:800;color:#0A0A0A">${amt}</p>
      <p style="margin:4px 0 0;font-size:.85rem;color:#64748B">via ${method} · ${new Date(now).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</p>
    </div>
    <p style="margin:0 0 24px;color:#374151;font-size:.9rem">
      Keep sharing your referral link — every time someone you refer pays for Invonaut, you earn 30% commission automatically.
    </p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/affiliate" 
       style="display:inline-block;background:linear-gradient(135deg,#0055FF,#0040DD);color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:.9rem">
      View your dashboard →
    </a>
  </div>
  <div style="padding:20px 40px;border-top:1px solid #E2E8F0;text-align:center">
    <p style="margin:0;font-size:.75rem;color:#94A3B8">Invonaut · From contract to cash. Automated.</p>
  </div>
</div>
</body></html>`,
          })
          console.log(`Payout email sent to ${acct.payout_email}`)
        } catch (emailErr) {
          // Non-fatal — payout is still marked paid even if email fails
          console.error('Payout email failed (non-fatal):', emailErr)
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('admin mark-paid error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
