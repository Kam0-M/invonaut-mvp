import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { generateInvoicePDF } from '@/lib/pdf/generate-invoice-pdf'
import { isSubscriptionActive } from '@/lib/subscription-status'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const invoiceId = searchParams.get('invoiceId')
    const token     = searchParams.get('token')
    const slug      = searchParams.get('slug')

    if (!invoiceId || !token || !slug) {
      return NextResponse.json(
        { error: 'Missing required parameters.' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 1. Resolve portal settings from slug
    const { data: portalRow } = await supabase
      .from('portal_settings')
      .select('user_id, is_enabled')
      .eq('slug', slug)
      .maybeSingle()

    if (!portalRow) {
      return NextResponse.json({ error: 'Portal not found.' }, { status: 404 })
    }

    if (!portalRow.is_enabled) {
      return NextResponse.json(
        { error: 'This portal is currently paused.' },
        { status: 403 }
      )
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
      return NextResponse.json(
        { error: 'Access link has expired or is invalid.' },
        { status: 401 }
      )
    }

    const clientId = tokenRow.client_id as string

    // 3. Fetch invoice — must belong to this client AND this user
    const { data: invoice } = await supabase
      .from('invoices')
      .select(
        'id, invoice_number, status, issue_date, due_date, subtotal, tax_amount, total_amount, notes'
      )
      .eq('id', invoiceId)
      .eq('client_id', clientId)
      .eq('user_id', portalRow.user_id)
      .maybeSingle()

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found or access denied.' },
        { status: 404 }
      )
    }

    // 4. Fetch invoice items
    const { data: items } = await supabase
      .from('invoice_items')
      .select('description, quantity, unit_price, total')
      .eq('invoice_id', invoiceId)

    // 5. Fetch owner profile for branding + business info
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select(
        'full_name, email, business_name, address, logo_url, brand_color, secondary_brand_color, subscription_tier, stripe_subscription_id, subscription_status, trial_end_date'
      )
      .eq('id', portalRow.user_id)
      .single()

    // White label branding only applies to Professional and Business tier
    // owners who currently have an active subscription (Checklist #32).
    const isWhiteLabel =
      isSubscriptionActive(userProfile) &&
      (userProfile?.subscription_tier === 'professional' ||
        userProfile?.subscription_tier === 'business')

    // 6. Fetch client details
    const { data: clientRow } = await supabase
      .from('clients')
      .select('name, email, phone, company, address')
      .eq('id', clientId)
      .single()

    // 7. Generate PDF — identical shape to download-invoice/route.ts
    const pdfArrayBuffer = await generateInvoicePDF({
      invoice_number: invoice.invoice_number,
      issue_date:     invoice.issue_date,
      due_date:       invoice.due_date,
      status:         invoice.status,
      subtotal:       invoice.subtotal,
      tax_amount:     invoice.tax_amount,
      total_amount:   invoice.total_amount,
      notes:          invoice.notes || '',
      client: {
        name:    clientRow?.name    ?? '',
        email:   clientRow?.email   ?? '',
        phone:   clientRow?.phone   ?? '',
        company: clientRow?.company ?? '',
        address: clientRow?.address ?? '',
      },
      user_profile: {
        business_name:         userProfile?.business_name         ?? null,
        full_name:             userProfile?.full_name             ?? null,
        email:                 userProfile?.email                 ?? null,
        address:               userProfile?.address               ?? null,
        logo_url:              isWhiteLabel ? (userProfile?.logo_url              ?? null) : null,
        brand_color:           isWhiteLabel ? (userProfile?.brand_color           ?? null) : null,
        secondary_brand_color: isWhiteLabel ? (userProfile?.secondary_brand_color ?? null) : null,
      },
      items: (items ?? []).map((item) => ({
        description: item.description,
        quantity:    item.quantity,
        unit_price:  item.unit_price,
        total:       item.total,
      })),
    })

    const pdfData = new Uint8Array(pdfArrayBuffer)

    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set(
      'Content-Disposition',
      `attachment; filename="invoice-${invoice.invoice_number}.pdf"`
    )

    return new NextResponse(pdfData, { headers })
  } catch (error: unknown) {
    console.error('Portal download-invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF. Please try again.' },
      { status: 500 }
    )
  }
}