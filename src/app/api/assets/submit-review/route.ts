import { createClient }       from '@/lib/supabase/server'
import { createClient as adminClient } from '@supabase/supabase-js'
import { NextResponse }       from 'next/server'
import { Resend }             from 'resend'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }

function createAdmin() {
  return adminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { asset_id, reviewer_email, reviewer_name } = await req.json()
  if (!asset_id || !reviewer_email) {
    return NextResponse.json({ error: 'asset_id and reviewer_email are required' }, { status: 400 })
  }

  // Fetch asset + user profile
  const [{ data: asset, error: assetErr }, { data: profile }] = await Promise.all([
    supabase.from('assets').select('*').eq('id', asset_id).eq('user_id', user.id).single(),
    supabase.from('user_profiles').select('business_name, full_name').eq('id', user.id).single(),
  ])
  if (assetErr || !asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

  const admin = createAdmin()

  // Invalidate any existing unused tokens for this asset
  await admin.from('asset_review_tokens').delete().eq('asset_id', asset_id).is('used_at', null)

  // Create fresh token
  const { data: tokenRow, error: tokenErr } = await admin
    .from('asset_review_tokens')
    .insert({ asset_id, user_id: user.id, reviewer_email, reviewer_name: reviewer_name || null })
    .select()
    .single()
  if (tokenErr || !tokenRow) return NextResponse.json({ error: 'Failed to create review token' }, { status: 500 })

  // Update asset status
  await supabase.from('assets').update({
    workflow_status: 'pending_review',
    reviewer_email,
    submitted_at: new Date().toISOString(),
  }).eq('id', asset_id).eq('user_id', user.id)

  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/asset-review/${tokenRow.token}`
  const submitterName = profile?.business_name || profile?.full_name || 'Your colleague'
  const assetDate = new Date(asset.purchase_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFF;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#002ECC,#0055FF);padding:32px 36px 28px">
      <p style="margin:0 0 4px;font-size:.7rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.5)">Invonaut · Asset Review</p>
      <h1 style="margin:0;font-size:1.45rem;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1.2">Asset Registration<br>Requires Your Approval</h1>
    </div>
    <!-- Body -->
    <div style="padding:32px 36px">
      <p style="margin:0 0 20px;font-size:.9rem;color:#374151;line-height:1.6">
        Hi${reviewer_name ? ` ${reviewer_name}` : ''},<br><br>
        <strong>${submitterName}</strong> has submitted an asset for your review on Invonaut.
        Please check the details below and approve or reject the registration.
      </p>
      <!-- Asset card -->
      <div style="background:#F8FAFF;border:1px solid #E2E8F0;border-radius:12px;padding:20px 22px;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94A3B8;width:130px">Asset</td>
              <td style="padding:6px 0;font-size:.88rem;font-weight:700;color:#0A0A0A">${asset.name}</td></tr>
          <tr><td style="padding:6px 0;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94A3B8">Category</td>
              <td style="padding:6px 0;font-size:.88rem;color:#374151;text-transform:capitalize">${asset.category}</td></tr>
          <tr><td style="padding:6px 0;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94A3B8">Purchase Date</td>
              <td style="padding:6px 0;font-size:.88rem;color:#374151">${assetDate}</td></tr>
          <tr><td style="padding:6px 0;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94A3B8">Cost</td>
              <td style="padding:6px 0;font-size:.88rem;font-weight:800;color:#0055FF">$${Number(asset.purchase_cost).toLocaleString('en-US',{minimumFractionDigits:2})}</td></tr>
          ${asset.serial_number ? `<tr><td style="padding:6px 0;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94A3B8">Serial No.</td>
              <td style="padding:6px 0;font-size:.88rem;color:#374151;font-family:monospace">${asset.serial_number}</td></tr>` : ''}
          ${asset.description ? `<tr><td style="padding:6px 0;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94A3B8">Description</td>
              <td style="padding:6px 0;font-size:.88rem;color:#374151">${asset.description}</td></tr>` : ''}
        </table>
      </div>
      <!-- CTA -->
      <a href="${reviewUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#0044EE,#0066FF);color:#fff;font-weight:700;font-size:.9rem;padding:14px 24px;border-radius:10px;text-decoration:none;letter-spacing:-.01em">
        Review &amp; Respond →
      </a>
      <p style="margin:16px 0 0;font-size:.72rem;color:#94A3B8;text-align:center">This link expires in 7 days. No account required.</p>
    </div>
    <!-- Footer -->
    <div style="padding:16px 36px;border-top:1px solid #F1F5F9;background:#FAFAFA">
      <p style="margin:0;font-size:.7rem;color:#94A3B8">Sent via <strong style="color:#0055FF">Invonaut</strong> · invonaut-mvp.vercel.app</p>
    </div>
  </div>
</body>
</html>`

  try {
    await getResend().emails.send({
      from:    'Invonaut <onboarding@resend.dev>',
      to:      reviewer_email,
      subject: `Asset review requested: ${asset.name} — $${Number(asset.purchase_cost).toLocaleString()}`,
      html,
    })
  } catch (emailErr) {
    // Don't fail the whole request if email fails — asset is still in pending_review
    console.error('Email send failed:', emailErr)
  }

  return NextResponse.json({ ok: true, token: tokenRow.token })
}
