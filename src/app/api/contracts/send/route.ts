import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const OWNER_EMAIL = 'kamohelo.thakhisi@gmail.com'

export async function POST(request: NextRequest) {
  try {
    const { contractId } = await request.json()

    if (!contractId) {
      return NextResponse.json({ success: false, error: 'Contract ID is required.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'You must be logged in.' }, { status: 401 })
    }

    // Fetch contract with client info
    const { data: contract } = await supabase
      .from('contracts')
      .select('id, title, status, client_id, clients(name, email)')
      .eq('id', contractId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!contract) {
      return NextResponse.json({ success: false, error: 'Contract not found.' }, { status: 404 })
    }

    if (contract.status !== 'draft') {
      return NextResponse.json({
        success: false,
        error: 'Only draft contracts can be sent.',
      }, { status: 400 })
    }

    const clientData = Array.isArray(contract.clients) ? contract.clients[0] : contract.clients
    if (!clientData?.email) {
      return NextResponse.json({
        success: false,
        error: 'This client has no email address. Add one in their profile first.',
      }, { status: 400 })
    }

    // Check portal is set up
    const { data: portalRow } = await supabase
      .from('portal_settings')
      .select('slug')
      .eq('user_id', user.id)
      .eq('is_enabled', true)
      .maybeSingle()

    if (!portalRow?.slug) {
      return NextResponse.json({
        success: false,
        error: 'Set up your Client Portal first so the client can view and sign the contract.',
      }, { status: 400 })
    }

    // Fetch owner profile
    const { data: ownerProfile } = await supabase
      .from('user_profiles')
      .select('business_name, full_name')
      .eq('id', user.id)
      .single()

    const businessName = ownerProfile?.business_name || ownerProfile?.full_name || 'Invonaut'

    // Generate a portal access token so the client is identified when signing
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days for contracts

    const { error: tokenError } = await supabase
      .from('client_portal_tokens')
      .insert({
        user_id: user.id,
        client_id: contract.client_id,
        token,
        expires_at: expiresAt,
      })

    if (tokenError) {
      return NextResponse.json({ success: false, error: 'Could not create signing link.' }, { status: 500 })
    }

    // Mark contract as sent
    await supabase
      .from('contracts')
      .update({ status: 'awaiting_signature', updated_at: new Date().toISOString() })
      .eq('id', contractId)

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://invonaut.app').replace(/\/$/, '')
    const signingUrl = `${baseUrl}/portal/${portalRow.slug}/contracts/${contractId}?token=${token}`

    // Resend free-tier restriction
    if (clientData.email !== OWNER_EMAIL) {
      return NextResponse.json({
        success: false,
        error: `Demo mode: Emails can only be sent to ${OWNER_EMAIL} until you verify a domain at resend.com/domains. The contract is now awaiting signature. This email would have gone to ${clientData.email}.`,
      }, { status: 400 })
    }

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p>Hi ${escapeHtml(clientData.name)},</p>
  <p><strong>${escapeHtml(businessName)}</strong> has sent you a contract to review and sign: <strong>${escapeHtml(contract.title)}</strong>.</p>
  <p>Click the button below to read the contract and add your signature. No account is required.</p>
  <p style="margin: 28px 0;">
    <a href="${escapeHtml(signingUrl)}" style="display: inline-block; background: #0066FF; color: #ffffff; padding: 14px 28px; border-radius: 8px; font-weight: bold; text-decoration: none;">Review &amp; Sign Contract →</a>
  </p>
  <p style="font-size: 13px; color: #666;">This signing link is valid for 30 days. If you have any questions, contact ${escapeHtml(businessName)} directly. · Powered by Invonaut</p>
</body>
</html>`.trim()

    const { error: emailError } = await resend.emails.send({
      from: 'Invonaut <onboarding@resend.dev>',
      to: clientData.email,
      subject: `${businessName} has sent you a contract to sign`,
      html,
    })

    if (emailError) {
      return NextResponse.json({
        success: false,
        error: 'Contract marked as awaiting signature but email failed. Try again.',
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Contract sent for signature.' })
  } catch (err: unknown) {
    console.error('Contract send error:', err)
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 })
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}