import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { generateInvoicePDF } from '@/lib/pdf/generate-invoice-pdf'
import { generateInvoiceEmailHTML, generateInvoiceEmailText } from '@/lib/email/invoice-email-template'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, recipientEmail } = await request.json()

    if (!invoiceId || !recipientEmail) {
      return NextResponse.json(
        { success: false, error: 'invoiceId and recipientEmail are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 })
    }

    // Fetch invoice items
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)

    if (itemsError) {
      return NextResponse.json({ success: false, error: 'Unable to fetch invoice items' }, { status: 500 })
    }

    // Fetch user profile for business info
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('full_name, email, business_name, address')
      .eq('id', user.id)
      .single()

    const clientData = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients

    // Generate PDF
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
        address: userProfile?.address || null
      },
      items: (items || []).map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total
      }))
    })

    // Convert ArrayBuffer to Buffer for Resend
    const pdfBuffer = Buffer.from(pdfArrayBuffer)

    const businessName = userProfile?.business_name || userProfile?.full_name || 'Flowance'
    const subject = `Invoice ${invoice.invoice_number} from ${businessName}`
    const html = generateInvoiceEmailHTML({
      invoice_number: invoice.invoice_number,
      client_name: clientData?.name || 'Client',
      due_date: invoice.due_date,
      total_amount: invoice.total_amount,
      business_name: businessName
    })
    const text = generateInvoiceEmailText({
      invoice_number: invoice.invoice_number,
      client_name: clientData?.name || 'Client',
      due_date: invoice.due_date,
      total_amount: invoice.total_amount,
      business_name: businessName
    })

    // Resend free tier restriction: can only send to verified email
    const OWNER_EMAIL = 'kamohelo.thakhisi@gmail.com'
    
    if (recipientEmail !== OWNER_EMAIL) {
      return NextResponse.json(
        {
          success: false,
          error: `Demo mode: Emails can only be sent to ${OWNER_EMAIL} until you verify a domain at resend.com/domains. This invoice would have been sent to ${recipientEmail}.`,
        },
        { status: 400 }
      )
    }

    // Send email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Flowance <onboarding@resend.dev>',
      to: recipientEmail,
      subject,
      html,
      text,
      attachments: [
        {
          filename: `invoice-${invoice.invoice_number}.pdf`,
          content: pdfBuffer,
        },
      ],
    })

    if (emailError) {
      return NextResponse.json(
        { success: false, error: emailError.message || 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Invoice sent successfully' })
  } catch (error: any) {
    console.error('Send invoice error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to send invoice' },
      { status: 500 }
    )
  }
}