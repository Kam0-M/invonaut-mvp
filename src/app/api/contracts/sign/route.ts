import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { Resend } from 'resend'
import { generateContractPDF } from '@/lib/contracts/generate-contract-pdf'

const resend = new Resend(process.env.RESEND_API_KEY)
const OWNER_EMAIL = 'kamohelo.thakhisi@gmail.com'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractId, token, slug, signerName, signatureData } = body

    if (!contractId || !token || !slug) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 })
    }
    if (!signerName?.trim()) {
      return NextResponse.json({ success: false, error: 'Please enter your full name.' }, { status: 400 })
    }
    if (!signatureData) {
      return NextResponse.json({ success: false, error: 'Please provide your signature.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Resolve portal settings from slug
    const { data: portalRow } = await supabase
      .from('portal_settings')
      .select('user_id, is_enabled')
      .eq('slug', slug)
      .maybeSingle()

    if (!portalRow) {
      return NextResponse.json({ success: false, error: 'Portal not found.' }, { status: 404 })
    }
    if (!portalRow.is_enabled) {
      return NextResponse.json({ success: false, error: 'This portal is currently paused.' }, { status: 403 })
    }

    // 2. Validate token
    const { data: tokenRow } = await supabase
      .from('client_portal_tokens')
      .select('client_id, expires_at')
      .eq('token', token)
      .eq('user_id', portalRow.user_id)
      .maybeSingle()

    const tokenValid =
      tokenRow &&
      tokenRow.client_id &&
      new Date(tokenRow.expires_at) > new Date()

    if (!tokenValid) {
      return NextResponse.json({ success: false, error: 'Signing link has expired. Ask for a new one.' }, { status: 401 })
    }

    const clientId = tokenRow.client_id as string

    // 3. Verify contract belongs to this user and this client
    const { data: contract } = await supabase
      .from('contracts')
      .select('id, status, title')
      .eq('id', contractId)
      .eq('user_id', portalRow.user_id)
      .eq('client_id', clientId)
      .maybeSingle()

    if (!contract) {
      return NextResponse.json({ success: false, error: 'Contract not found.' }, { status: 404 })
    }

    if (!['sent', 'awaiting_signature'].includes(contract.status)) {
      return NextResponse.json({
        success: false,
        error: 'This contract is not currently available for signing.',
      }, { status: 400 })
    }

    // 4. Check not already signed by this client
    const { data: existingSig } = await supabase
      .from('contract_signatures')
      .select('id')
      .eq('contract_id', contractId)
      .eq('signer_role', 'client')
      .maybeSingle()

    if (existingSig) {
      return NextResponse.json({ success: false, error: 'This contract has already been signed.' }, { status: 400 })
    }

    // 5. Get client info for the signature record
    const { data: clientRow } = await supabase
      .from('clients')
      .select('name, email')
      .eq('id', clientId)
      .single()

    // 6. Get IP and user agent for audit trail
    const headersList = await headers()
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    // 7. Insert signature
    const { error: sigError } = await supabase
      .from('contract_signatures')
      .insert({
        contract_id: contractId,
        signer_name: signerName.trim(),
        signer_email: clientRow?.email || '',
        signer_role: 'client',
        signature_data: signatureData,
        ip_address: ipAddress,
        user_agent: userAgent,
        signed_at: new Date().toISOString(),
      })

    if (sigError) {
      console.error('Signature insert error:', sigError)
      return NextResponse.json({ success: false, error: 'Could not save signature. Try again.' }, { status: 500 })
    }

    // 8. Mark contract as active
    const { error: updateError } = await supabase
      .from('contracts')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', contractId)

    if (updateError) {
      console.error('Contract status update error:', updateError)
    }

    // 9. Send confirmation emails to both the client and the owner
    try {
      // Fetch owner profile for name + email
      const { data: ownerProfile } = await supabase
        .from('user_profiles')
        .select('business_name, full_name, email, address, logo_url, brand_color, subscription_tier')
        .eq('id', portalRow.user_id)
        .single()

      const businessName = ownerProfile?.business_name || ownerProfile?.full_name || 'Invonaut'
      const ownerEmail = ownerProfile?.email || OWNER_EMAIL
      const clientEmail = clientRow?.email || ''
      const clientName = clientRow?.name || signerName

      const signedAt = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })

      const sharedHtml = (recipientName: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p>Hi ${recipientName},</p>
  <p>This confirms that <strong>${contract.title}</strong> has been signed by <strong>${signerName.trim()}</strong> on ${signedAt}.</p>
  <p>The contract is now active. Both parties are bound by its terms. A signed copy is attached to this email.</p>
  <p style="font-size: 13px; color: #666; margin-top: 32px;">Powered by Invonaut · From contract to cash. Automated.</p>
</body>
</html>`.trim()

      // Fetch full contract content for PDF (we only selected id/status/title earlier)
      const { data: fullContract } = await supabase
        .from('contracts')
        .select('content, created_at')
        .eq('id', contractId)
        .single()

      // Generate signed contract PDF
      const isWhiteLabel =
        ownerProfile?.subscription_tier === 'professional' ||
        ownerProfile?.subscription_tier === 'business'

      const pdfArrayBuffer = await generateContractPDF({
        title: contract.title,
        status: 'active',
        created_at: fullContract?.created_at ?? new Date().toISOString(),
        signed_at: new Date().toISOString(),
        signer_name: signerName.trim(),
        signer_email: clientEmail,
        signature_image: signatureData,  // base64 canvas data URL
        content: (fullContract?.content ?? []) as Array<{ title: string; content: string; category: string }>,
        client: {
          name: clientName,
          email: clientEmail,
          company: null,
        },
        owner: {
          business_name: ownerProfile?.business_name ?? null,
          full_name: ownerProfile?.full_name ?? null,
          email: ownerProfile?.email ?? null,
          address: ownerProfile?.address ?? null,
          logo_url: isWhiteLabel ? (ownerProfile?.logo_url ?? null) : null,
          brand_color: isWhiteLabel ? (ownerProfile?.brand_color ?? null) : null,
        },
      })

      const pdfBuffer = Buffer.from(pdfArrayBuffer)
      const pdfFilename = `contract-${contract.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.pdf`

      // Email to client (only if their email matches OWNER_EMAIL in demo mode)
      if (clientEmail && clientEmail === OWNER_EMAIL) {
        await resend.emails.send({
          from: 'Invonaut <onboarding@resend.dev>',
          to: clientEmail,
          subject: `Contract signed: ${contract.title}`,
          html: sharedHtml(clientName),
          attachments: [{ filename: pdfFilename, content: pdfBuffer }],
        })
      }

      // Email to owner (only if their email matches OWNER_EMAIL in demo mode)
      if (ownerEmail && ownerEmail === OWNER_EMAIL) {
        await resend.emails.send({
          from: 'Invonaut <onboarding@resend.dev>',
          to: ownerEmail,
          subject: `${clientName} has signed: ${contract.title}`,
          html: sharedHtml(businessName),
          attachments: [{ filename: pdfFilename, content: pdfBuffer }],
        })
      }
    } catch (emailErr) {
      // Email errors are non-fatal — the signature was already saved successfully
      console.error('Contract confirmation email error:', emailErr)
    }

    return NextResponse.json({ success: true, message: 'Contract signed successfully.' })
  } catch (err: unknown) {
    console.error('Contract sign error:', err)
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 })
  }
}