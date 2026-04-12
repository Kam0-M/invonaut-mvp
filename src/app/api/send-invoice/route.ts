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
        { success: false, error: 'Missing required information. Please provide both invoice ID and recipient email address.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'You must be logged in to send invoices. Please sign in and try again.' 
      }, { status: 401 })
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
        attachment_url,
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
      return NextResponse.json({ 
        success: false, 
        error: 'Invoice not found. This invoice may have been deleted or you may not have permission to access it.' 
      }, { status: 404 })
    }

    // Fetch invoice items
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)

    if (itemsError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Could not load invoice details. Please refresh the page and try again.' 
      }, { status: 500 })
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

    // Convert ArrayBuffer to Buffer for Resend
    const pdfBuffer = Buffer.from(pdfArrayBuffer)

    // ── Fetch optional attachment ──────────────────────────────────────────
    // If the invoice has an attachment_url, download it and include it as a
    // second email attachment alongside the PDF.
    let secondAttachment: { filename: string; content: Buffer } | null = null
    const attachmentUrl = (invoice as any).attachment_url
    if (attachmentUrl) {
      try {
        const attachmentResponse = await fetch(attachmentUrl)
        if (attachmentResponse.ok) {
          const attachmentBuffer = Buffer.from(await attachmentResponse.arrayBuffer())
          // Extract clean filename: strip leading {timestamp}- prefix if present
          const rawName = decodeURIComponent(attachmentUrl.split('/').pop() || 'attachment')
          const cleanName = rawName.replace(/^\d{13}-/, '') || rawName
          secondAttachment = { filename: cleanName, content: attachmentBuffer }
        }
      } catch (err) {
        // Non-fatal — log but still send the invoice PDF
        console.error('Could not fetch invoice attachment for email:', err)
      }
    }

    const businessName = userProfile?.business_name || userProfile?.full_name || 'Invonaut'
    const subject = `Invoice ${invoice.invoice_number} from ${businessName}`
    
    // Generate email with white label branding
    const html = generateInvoiceEmailHTML({
      invoice_number: invoice.invoice_number,
      client_name: clientData?.name || 'Client',
      due_date: invoice.due_date,
      total_amount: invoice.total_amount,
      business_name: businessName,
      logo_url: userProfile?.logo_url || null,
      brand_color: userProfile?.brand_color || null,
      secondary_brand_color: userProfile?.secondary_brand_color || null
    })
    
    const text = generateInvoiceEmailText({
      invoice_number: invoice.invoice_number,
      client_name: clientData?.name || 'Client',
      due_date: invoice.due_date,
      total_amount: invoice.total_amount,
      business_name: businessName,
      logo_url: userProfile?.logo_url || null,
      brand_color: userProfile?.brand_color || null,
      secondary_brand_color: userProfile?.secondary_brand_color || null
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
      from: 'Invonaut <onboarding@resend.dev>',
      to: recipientEmail,
      subject,
      html,
      text,
      attachments: [
        {
          filename: `invoice-${invoice.invoice_number}.pdf`,
          content: pdfBuffer,
        },
        ...(secondAttachment ? [{ filename: secondAttachment.filename, content: secondAttachment.content }] : []),
      ],
    })

    if (emailError) {
      const errorMsg = emailError.message?.includes('invalid') || emailError.message?.includes('email')
        ? 'Email could not be sent. Verify the client\'s email address is correct and try again.'
        : 'Email could not be sent. Please check your email service configuration and try again.'
      
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 500 }
      )
    }

    // Update invoice status to 'sent' after successful email
    await supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', invoiceId)

    return NextResponse.json({ success: true, message: 'Invoice sent successfully with your branding!' })
  } catch (error: any) {
    console.error('Send invoice error:', error)
    const errorMessage = error?.message?.includes('network') || error?.message?.includes('connection')
      ? 'Email could not be sent. Please check your internet connection and try again.'
      : 'Email could not be sent. Please verify the client\'s email address is correct and try again.'
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}