import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }

export async function POST(request: NextRequest) {
  try {
    const { name, email, website, audience, reason } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'Name and email are required.' }, { status: 400 })
    }

    // Notify Kamohelo
    await getResend().emails.send({
      from: 'Invonaut <noreply@invonaut.app>',
      to: 'kamohelo.thakhisi@gmail.com',
      subject: `New Affiliate Application — ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #0066FF; margin-bottom: 24px;">New Affiliate Application</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold; color: #374151; width: 140px;">Name</td><td style="padding: 8px 0; color: #111827;">${name}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Email</td><td style="padding: 8px 0; color: #111827;">${email}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Website</td><td style="padding: 8px 0; color: #111827;">${website || '—'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Audience</td><td style="padding: 8px 0; color: #111827;">${audience || '—'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #374151; vertical-align: top;">Reason</td><td style="padding: 8px 0; color: #111827;">${reason || '—'}</td></tr>
          </table>
        </div>
      `
    })

    // Confirm to applicant
    await getResend().emails.send({
      from: 'Invonaut <noreply@invonaut.app>',
      to: email,
      subject: "We received your affiliate application",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #0066FF; margin-bottom: 16px;">Thanks, ${name}.</h2>
          <p style="color: #374151; line-height: 1.6;">We received your affiliate application and we'll review it within 2–3 business days. If approved, you'll get your unique referral link and access to our affiliate dashboard.</p>
          <p style="color: #374151; line-height: 1.6; margin-top: 16px;">Questions? Reply directly to this email.</p>
          <p style="color: #6B7280; font-size: 13px; margin-top: 32px;">— The Invonaut Team</p>
        </div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Affiliate apply error:', err)
    return NextResponse.json({ success: false, error: 'Failed to submit application.' }, { status: 500 })
  }
}
