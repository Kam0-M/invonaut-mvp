// src/app/api/cron/invoice-follow-ups/route.ts
//
// Runs daily at 9am UTC (registered in vercel.json).
// This is Invonaut's first "Automated" stage Collections feature —
// the system sends invoice reminders without the user pressing anything.
//
// LOGIC:
//   1. Fetch all "sent" invoices whose due_date is in the past (overdue)
//   2. Filter to those that warrant a follow-up:
//      - Overdue by at least 7 days, OR
//      - ai_risk_score >= 60 (medium/high risk) AND overdue by at least 1 day
//   3. Skip any invoice followed up in the last 48 hours (rate limit)
//   4. Send reminder email via Resend
//   5. Update last_followed_up timestamp
//
// RESEND FREE TIER:
//   Currently only sends to kamohelo.thakhisi@gmail.com.
//   Once domain is verified, emails will go to actual client addresses.
//
// SAFETY:
//   Uses admin Supabase client (service role) to query across all users.
//   Does NOT send if client email is missing.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend  = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://invonaut-mvp-git-main-kam0-ms-projects.vercel.app'
const OWNER_EMAIL = 'kamohelo.thakhisi@gmail.com'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function buildFollowUpEmailHTML(opts: {
  invoiceNumber: string
  clientName:    string
  dueDate:       string
  totalAmount:   number
  daysOverdue:   number
  businessName:  string
}): string {
  const formattedDate = new Date(opts.dueDate + 'T12:00:00').toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#0066FF,#0052CC);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:white;margin:0;font-size:24px;font-weight:600;">Payment Reminder</h1>
    <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">${opts.businessName}</p>
  </div>
  <div style="background:white;padding:40px 30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
    <p style="margin:0 0 20px;font-size:16px;">Hi ${opts.clientName},</p>
    <p style="margin:0 0 20px;font-size:16px;">
      This is a friendly reminder that invoice <strong>${opts.invoiceNumber}</strong> for
      <strong>${formatCurrency(opts.totalAmount)}</strong> was due on ${formattedDate}
      and is now <strong style="color:#DC2626;">${opts.daysOverdue} day${opts.daysOverdue !== 1 ? 's' : ''} overdue</strong>.
    </p>
    <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:20px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 8px;font-size:13px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Amount Due</p>
      <p style="margin:0;font-size:32px;font-weight:900;color:#DC2626;">${formatCurrency(opts.totalAmount)}</p>
    </div>
    <p style="margin:0 0 20px;font-size:15px;">Please arrange payment at your earliest convenience. If you have any questions or have already sent payment, please disregard this message.</p>
    <p style="margin:20px 0 0;font-size:14px;color:#6B7280;">Thank you,<br><strong>${opts.businessName}</strong></p>
  </div>
  <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:16px;">Sent via Invonaut · Automated follow-up</p>
</body>
</html>`
}

function buildFollowUpEmailText(opts: {
  invoiceNumber: string
  clientName:    string
  dueDate:       string
  totalAmount:   number
  daysOverdue:   number
  businessName:  string
}): string {
  return `Hi ${opts.clientName},

This is a reminder that invoice ${opts.invoiceNumber} for ${formatCurrency(opts.totalAmount)} is now ${opts.daysOverdue} day${opts.daysOverdue !== 1 ? 's' : ''} overdue.

Please arrange payment at your earliest convenience.

Thank you,
${opts.businessName}

Sent via Invonaut`
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now      = new Date()

  // Overdue cutoff: invoices whose due_date is before today
  const todayStr = now.toISOString().split('T')[0]

  // 48-hour cutoff for rate limiting
  const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()

  let followUpsSent = 0
  let skipped       = 0
  const errors: string[] = []

  try {
    // Fetch all overdue sent invoices with their client + user profile
    const { data: invoices, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        id, invoice_number, due_date, total_amount, ai_risk_score, last_followed_up,
        clients!inner(id, name, email),
        user_profiles!inner(id, business_name, email, subscription_status, stripe_subscription_id)
      `)
      .eq('status', 'sent')
      .lt('due_date', todayStr)  // due_date < today = overdue

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }

    for (const inv of (invoices ?? [])) {
      try {
        const client  = Array.isArray(inv.clients)        ? inv.clients[0]        : inv.clients
        const profile = Array.isArray(inv.user_profiles)  ? inv.user_profiles[0]  : inv.user_profiles

        // Skip if client has no email
        if (!client?.email) { skipped++; continue }

        // Skip if user doesn't have an active subscription
        const isActive = !!profile?.stripe_subscription_id &&
          (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')
        if (!isActive) { skipped++; continue }

        // Calculate days overdue
        const dueDateMs  = new Date(inv.due_date + 'T12:00:00').getTime()
        const daysOverdue = Math.floor((now.getTime() - dueDateMs) / (1000 * 60 * 60 * 24))

        // Apply threshold: send if overdue 7+ days, OR risk score >= 60 and overdue at all
        const meetsThreshold =
          daysOverdue >= 7 ||
          ((inv.ai_risk_score ?? 0) >= 60 && daysOverdue >= 1)

        if (!meetsThreshold) { skipped++; continue }

        // Rate limit: skip if followed up within last 48 hours
        if (inv.last_followed_up && new Date(inv.last_followed_up) > new Date(cutoff48h)) {
          skipped++
          continue
        }

        const businessName = profile?.business_name || 'Your service provider'
        const toEmail      = client.email

        // Resend free tier: only sends to verified owner email
        const emailTo = toEmail === OWNER_EMAIL ? toEmail : OWNER_EMAIL

        await resend.emails.send({
          from:    'Invonaut <onboarding@resend.dev>',
          to:      [emailTo],
          subject: `Payment reminder: Invoice ${inv.invoice_number} is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
          html:    buildFollowUpEmailHTML({
            invoiceNumber: inv.invoice_number,
            clientName:    client.name,
            dueDate:       inv.due_date,
            totalAmount:   Number(inv.total_amount),
            daysOverdue,
            businessName,
          }),
          text:    buildFollowUpEmailText({
            invoiceNumber: inv.invoice_number,
            clientName:    client.name,
            dueDate:       inv.due_date,
            totalAmount:   Number(inv.total_amount),
            daysOverdue,
            businessName,
          }),
        })

        // Update last_followed_up
        await supabase
          .from('invoices')
          .update({ last_followed_up: now.toISOString() })
          .eq('id', inv.id)

        followUpsSent++
      } catch (invErr: any) {
        console.error(`invoice-follow-ups cron: error on invoice ${inv.id}:`, invErr?.message)
        errors.push(`${inv.id}: ${invErr?.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      followUpsSent,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err: any) {
    console.error('invoice-follow-ups cron error:', err)
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 })
  }
}