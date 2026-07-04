import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }

// Follow-up email template
function generateFollowUpEmailHTML({
  invoice_number,
  client_name,
  due_date,
  total_amount,
  days_overdue,
  business_name
}: {
  invoice_number: string
  client_name: string
  due_date: string
  total_amount: number
  days_overdue: number
  business_name: string
}) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(total_amount)

  const formattedDate = new Date(due_date + 'T12:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder - Invoice ${invoice_number}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Payment Reminder</h1>
    <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 14px;">${business_name}</p>
  </div>

  <!-- Content -->
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151;">
      Hi ${client_name},
    </p>

    <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151;">
      This is a friendly reminder that invoice <strong>${invoice_number}</strong> is now <strong>${days_overdue} day${days_overdue !== 1 ? 's' : ''} overdue</strong>.
    </p>

    <!-- Invoice Details Card -->
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Invoice Number:</td>
          <td style="padding: 8px 0; font-size: 14px; color: #1f2937; font-weight: 600; text-align: right;">${invoice_number}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Due Date:</td>
          <td style="padding: 8px 0; font-size: 14px; color: #ef4444; font-weight: 600; text-align: right;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px;">Amount Due:</td>
          <td style="padding: 8px 0; font-size: 18px; color: #1f2937; font-weight: 700; text-align: right; border-top: 1px solid #e5e7eb; padding-top: 16px;">${formattedAmount}</td>
        </tr>
      </table>
    </div>

    <p style="margin: 24px 0 20px 0; font-size: 16px; color: #374151;">
      If you've already sent the payment, please disregard this message. If you have any questions or need to discuss payment arrangements, feel free to reach out.
    </p>

    <p style="margin: 0 0 8px 0; font-size: 16px; color: #374151;">
      Thank you for your prompt attention to this matter.
    </p>

    <p style="margin: 24px 0 0 0; font-size: 16px; color: #374151;">
      Best regards,<br>
      <strong>${business_name}</strong>
    </p>

  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">This is an automated payment reminder from ${business_name}</p>
    <p style="margin: 8px 0 0 0;">Powered by Invonaut</p>
  </div>

</body>
</html>
  `
}

function generateFollowUpEmailText({
  invoice_number,
  client_name,
  due_date,
  total_amount,
  days_overdue,
  business_name
}: {
  invoice_number: string
  client_name: string
  due_date: string
  total_amount: number
  days_overdue: number
  business_name: string
}) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(total_amount)

  const formattedDate = new Date(due_date + 'T12:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
PAYMENT REMINDER

Hi ${client_name},

This is a friendly reminder that invoice ${invoice_number} is now ${days_overdue} day${days_overdue !== 1 ? 's' : ''} overdue.

Invoice Details:
- Invoice Number: ${invoice_number}
- Due Date: ${formattedDate}
- Amount Due: ${formattedAmount}

If you've already sent the payment, please disregard this message. If you have any questions or need to discuss payment arrangements, feel free to reach out.

Thank you for your prompt attention to this matter.

Best regards,
${business_name}

---
This is an automated payment reminder from ${business_name}
Powered by Invonaut
  `
}

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json()

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required. Please select an invoice and try again.' },
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
        error: 'You must be logged in to send follow-up reminders. Please sign in and try again.' 
      }, { status: 401 })
    }

    // Fetch invoice with client info
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        status,
        due_date,
        total_amount,
        last_followed_up,
        clients (
          id,
          name,
          email
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

    // Check if invoice has been sent — drafts cannot receive reminders
    if (invoice.status === 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: 'This invoice is still a draft and has not been sent. Send the invoice to your client before sending a follow-up reminder.',
        },
        { status: 400 }
      )
    }

    // Check if invoice is actually overdue
    const now = new Date()
    const dueDate = new Date(invoice.due_date + 'T12:00:00')
    const isOverdue = dueDate < now

    if (!isOverdue) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'This invoice is not overdue yet. Follow-up reminders can only be sent for invoices that are past their due date.' 
        },
        { status: 400 }
      )
    }

    // Calculate days overdue
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

    // Check if already followed up recently (prevent spam)
    if (invoice.last_followed_up) {
      const lastFollowUp = new Date(invoice.last_followed_up)
      const hoursSinceLastFollowUp = (now.getTime() - lastFollowUp.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceLastFollowUp < 48) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Already followed up ${Math.floor(hoursSinceLastFollowUp)} hours ago. Please wait 48 hours between follow-ups.` 
          },
          { status: 400 }
        )
      }
    }

    // Fetch user profile for business info
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('full_name, business_name')
      .eq('id', user.id)
      .single()

    const clientData = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients

    if (!clientData?.email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Client email address not found. Please add an email address for this client before sending a follow-up reminder.' 
        },
        { status: 400 }
      )
    }

    const businessName = userProfile?.business_name || userProfile?.full_name || 'Invonaut'
    const subject = `Payment Reminder: Invoice ${invoice.invoice_number} is overdue`
    
    const html = generateFollowUpEmailHTML({
      invoice_number: invoice.invoice_number,
      client_name: clientData.name || 'Client',
      due_date: invoice.due_date,
      total_amount: invoice.total_amount,
      days_overdue: daysOverdue,
      business_name: businessName
    })

    const text = generateFollowUpEmailText({
      invoice_number: invoice.invoice_number,
      client_name: clientData.name || 'Client',
      due_date: invoice.due_date,
      total_amount: invoice.total_amount,
      days_overdue: daysOverdue,
      business_name: businessName
    })

    // Resend free tier restriction
    const OWNER_EMAIL = 'kamohelo.thakhisi@gmail.com'
    const recipientEmail = clientData.email
    
    if (recipientEmail !== OWNER_EMAIL) {
      return NextResponse.json(
        {
          success: false,
          error: `Demo mode: Emails can only be sent to ${OWNER_EMAIL}. This follow-up would have been sent to ${recipientEmail}.`,
        },
        { status: 400 }
      )
    }

    // Send email via Resend
    const { error: emailError } = await getResend().emails.send({
      from: 'Invonaut <onboarding@resend.dev>',
      to: recipientEmail,
      subject,
      html,
      text,
    })

    if (emailError) {
      const errorMsg = emailError.message?.includes('invalid') || emailError.message?.includes('email')
        ? 'Follow-up email could not be sent. Verify the client\'s email address is correct and try again.'
        : 'Follow-up email could not be sent. Please check your email service configuration and try again.'
      
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 500 }
      )
    }

    // Update last_followed_up timestamp
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ last_followed_up: now.toISOString() })
      .eq('id', invoiceId)

    if (updateError) {
      console.error('Failed to update last_followed_up:', updateError)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Follow-up sent successfully' 
    })

  } catch (error: any) {
    console.error('Follow-up error:', error)
    const errorMessage = error?.message?.includes('network') || error?.message?.includes('connection')
      ? 'Follow-up email could not be sent. Please check your internet connection and try again.'
      : 'Follow-up email could not be sent. Please verify the client\'s email address is correct and try again.'
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}