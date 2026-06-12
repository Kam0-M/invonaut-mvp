import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const clientId = typeof body.clientId === 'string' ? body.clientId : ''

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Missing client ID.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error:
            'You must be logged in to send portal links. Please sign in and try again.'
        },
        { status: 401 }
      )
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, email')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (clientError || !client) {
      return NextResponse.json(
        { success: false, error: 'Client not found.' },
        { status: 404 }
      )
    }

    if (!client.email || typeof client.email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'This client has no email address.' },
        { status: 400 }
      )
    }

    const { data: portalRow, error: portalError } = await supabase
      .from('portal_settings')
      .select('slug')
      .eq('user_id', user.id)
      .eq('is_enabled', true)
      .maybeSingle()

    if (portalError || !portalRow?.slug) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Your portal is not set up or is currently paused.'
        },
        { status: 400 }
      )
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('business_name, full_name')
      .eq('id', user.id)
      .single()

    const businessName =
      userProfile?.business_name ||
      userProfile?.full_name ||
      'Invonaut'

    const OWNER_EMAIL = 'kamohelo.thakhisi@gmail.com'

    if (client.email !== OWNER_EMAIL) {
      return NextResponse.json(
        {
          success: false,
          error: `Demo mode: Emails can only be sent to ${OWNER_EMAIL} until you verify a domain at resend.com/domains. This portal link would have been sent to ${client.email}.`,
        },
        { status: 400 }
      )
    }

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { error: tokenError } = await supabase
      .from('client_portal_tokens')
      .insert({
        user_id: user.id,
        client_id: clientId,
        token,
        expires_at: expiresAt
      })

    if (tokenError) {
      return NextResponse.json(
        { success: false, error: 'Could not create access link. Try again.' },
        { status: 500 }
      )
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://invonaut.app'
    const portalUrl = `${baseUrl.replace(/\/$/, '')}/portal/${portalRow.slug}?token=${token}`

    const clientName = client.name || 'there'
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p>Hi ${escapeHtml(clientName)},</p>
  <p><strong>${escapeHtml(businessName)}</strong> has given you access to your client portal where you can view your invoices and documents.</p>
  <p style="margin: 28px 0;">
    <a href="${escapeHtml(portalUrl)}" style="display: inline-block; background: #0066FF; color: #ffffff; padding: 14px 28px; border-radius: 8px; font-weight: bold; text-decoration: none;">View Your Portal →</a>
  </p>
  <p style="font-size: 13px; color: #666;">This link expires in 7 days. · Powered by Invonaut</p>
</body>
</html>
`.trim()

    const { error: emailError } = await getResend().emails.send({
      from: 'Invonaut <onboarding@resend.dev>',
      to: client.email,
      subject: `${businessName} has shared your client portal`,
      html
    })

    if (emailError) {
      return NextResponse.json(
        { success: false, error: 'Could not send email. Try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Portal access link sent'
    })
  } catch (err: unknown) {
    console.error('Portal send-magic-link error:', err)
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
