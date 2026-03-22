import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateInvoicePDF } from '@/lib/pdf/generate-invoice-pdf'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const invoiceId = searchParams.get('id')

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required. Please provide an invoice ID.' },
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
        { error: 'You must be logged in to download invoices. Please sign in and try again.' },
        { status: 401 }
      )
    }

    // Fetch invoice with client info
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        status,
        issue_date,
        due_date,
        subtotal,
        tax_amount,
        total_amount,
        notes,
        clients (
          id,
          name,
          email,
          phone,
          company,
          address
        )
      `)
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found. This invoice may have been deleted or you may not have permission to access it.' },
        { status: 404 }
      )
    }

    // Fetch invoice items
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)

    if (itemsError) {
      return NextResponse.json(
        { error: 'Could not load invoice details. Please refresh the page and try again.' },
        { status: 500 }
      )
    }

    // Fetch user profile for business info AND white label branding
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('full_name, email, business_name, address, logo_url, brand_color, secondary_brand_color, subscription_tier')
      .eq('id', user.id)
      .single()

    const isWhiteLabel =
      userProfile?.subscription_tier === 'professional' ||
      userProfile?.subscription_tier === 'business'

    const clientData = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients

    // Generate PDF with white label branding
    const pdfArrayBuffer = await generateInvoicePDF({
      invoice_number: invoice.invoice_number,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      status: invoice.status,
      subtotal: invoice.subtotal,
      tax_amount: invoice.tax_amount,
      total_amount: invoice.total_amount,
      notes: invoice.notes || '',
      client: {
        name: clientData?.name,
        email: clientData?.email || '',
        phone: clientData?.phone || '',
        company: clientData?.company || '',
        address: clientData?.address || ''
      },
      user_profile: {
        business_name: userProfile?.business_name || null,
        full_name: userProfile?.full_name || null,
        email: userProfile?.email || null,
        address: userProfile?.address || null,
        logo_url: isWhiteLabel ? (userProfile?.logo_url || null) : null,
        brand_color: isWhiteLabel ? (userProfile?.brand_color || null) : null,
        secondary_brand_color: isWhiteLabel ? (userProfile?.secondary_brand_color || null) : null
      },
      items: (items || []).map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total
      }))
    })

    // Convert ArrayBuffer to Uint8Array for NextResponse
    const pdfData = new Uint8Array(pdfArrayBuffer)

    // Return PDF as response with proper headers
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `attachment; filename="invoice-${invoice.invoice_number}.pdf"`)

    return new NextResponse(pdfData, { headers })
  } catch (error: any) {
    console.error('Download invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF. Please try again later.' },
      { status: 500 }
    )
  }
}