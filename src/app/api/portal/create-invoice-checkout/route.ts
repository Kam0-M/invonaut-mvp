// src/app/api/portal/create-invoice-checkout/route.ts
// No user auth required — validates via portal token (magic-link).
// Creates a one-time Stripe Checkout Session for a client to pay an invoice.

import { NextRequest, NextResponse }                from 'next/server'
import { createClient as createSupabaseClient }     from '@supabase/supabase-js'
import Stripe                                        from 'stripe'

function getStripe() { return new Stripe(process.env.STRIPE_SECRET_KEY!) }

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const { invoiceId, token, slug } = await req.json()

    if (!invoiceId || !token || !slug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = adminClient()
    const appUrl   = (process.env.NEXT_PUBLIC_APP_URL || 'https://invonaut-mvp.vercel.app').replace(/\/$/, '')

    // 1. Validate portal token — must not be expired
    const { data: portalToken } = await supabase
      .from('client_portal_tokens')
      .select('id, client_id, expires_at')
      .eq('token', token)
      .single()

    if (!portalToken) {
      return NextResponse.json({ error: 'Invalid or expired portal link' }, { status: 401 })
    }

    if (new Date(portalToken.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Portal link has expired — please request a new one' }, { status: 401 })
    }

    // 2. Get invoice — must belong to this client
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, invoice_number, status, total_amount, user_id, client_id')
      .eq('id', invoiceId)
      .eq('client_id', portalToken.client_id)
      .single()

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'This invoice is already paid' }, { status: 400 })
    }

    if (invoice.status === 'draft' || invoice.status === 'cancelled') {
      return NextResponse.json({ error: 'This invoice cannot be paid online' }, { status: 400 })
    }

    // 3. Get owner profile for business name + currency
    const { data: ownerProfile } = await supabase
      .from('user_profiles')
      .select('business_name, full_name, stripe_customer_id')
      .eq('id', invoice.user_id)
      .single()

    const businessName = ownerProfile?.business_name || ownerProfile?.full_name || 'Invonaut'
    const amountCents  = Math.round(Number(invoice.total_amount) * 100)

    if (amountCents < 50) {
      return NextResponse.json({ error: 'Invoice amount too small to process online' }, { status: 400 })
    }

    // 4. Create Stripe Checkout Session (one-time payment, not subscription)
    const session = await getStripe().checkout.sessions.create({
      mode:                 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency:     'usd',
          product_data: {
            name:        `Invoice ${invoice.invoice_number}`,
            description: `Payment to ${businessName}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      success_url: `${appUrl}/portal/${slug}/invoices/${invoiceId}?token=${token}&payment_success=true`,
      cancel_url:  `${appUrl}/portal/${slug}/invoices/${invoiceId}?token=${token}`,
      metadata: {
        type:       'portal_invoice',
        invoice_id: invoiceId,
        user_id:    invoice.user_id,
        client_id:  invoice.client_id,
        slug,
        token,
      },
      payment_intent_data: {
        metadata: {
          type:       'portal_invoice',
          invoice_id: invoiceId,
          user_id:    invoice.user_id,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('create-invoice-checkout error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create checkout' }, { status: 500 })
  }
}
