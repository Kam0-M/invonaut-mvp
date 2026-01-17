type InvoiceEmailData = {
  invoice_number: string
  client_name: string
  total_amount: number
  due_date: string
  business_name: string
  invoice_link?: string
  logo_url?: string | null
  brand_color?: string | null
  secondary_brand_color?: string | null
}

export function generateInvoiceEmailHTML(data: InvoiceEmailData): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // White label colors (defaults to Flowance colors)
  const primaryColor = data.brand_color || '#0066FF'
  const secondaryColor = data.secondary_brand_color || '#00D4AA'
  const hasLogo = !!data.logo_url
  const showFlowanceBranding = !hasLogo

  // Debug logging
  console.log('Email Template - White Label Data:', {
    primaryColor,
    secondaryColor,
    logo_url: data.logo_url,
    hasLogo
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${data.invoice_number}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header with White Label Colors -->
          <tr>
            <td style="background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); padding: 40px 30px; text-align: center;">
              ${hasLogo && data.logo_url ? `
                <div style="margin-bottom: 20px;">
                  <img src="${data.logo_url}" alt="${data.business_name}" style="max-height: 60px; max-width: 200px; display: inline-block;" />
                </div>
              ` : ''}
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                ${data.invoice_number}
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
                From ${data.business_name}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                Hello ${data.client_name},
              </p>
              
              <p style="margin: 0 0 30px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                Thank you for your business! Please find your invoice attached to this email.
              </p>
              
              <!-- Invoice Summary Box with Brand Colors -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 8px; border: 2px solid ${primaryColor}20; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666666;">
                          Invoice Number:
                        </td>
                        <td align="right" style="padding: 8px 0; font-size: 14px; color: #333333; font-weight: 600;">
                          ${data.invoice_number}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666666;">
                          Amount Due:
                        </td>
                        <td align="right" style="padding: 8px 0; font-size: 18px; color: ${primaryColor}; font-weight: bold;">
                          ${formatCurrency(data.total_amount)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666666;">
                          Due Date:
                        </td>
                        <td align="right" style="padding: 8px 0; font-size: 14px; color: #333333; font-weight: 600;">
                          ${formatDate(data.due_date)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                The invoice is attached as a PDF to this email. If you have any questions or concerns, please don't hesitate to reach out.
              </p>
              
              <p style="margin: 0 0 10px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                Best regards,<br>
                <strong style="color: ${primaryColor};">${data.business_name}</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer - Only show Flowance branding if no white label -->
          ${showFlowanceBranding ? `
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 12px; color: #666666; line-height: 1.5;">
                This invoice was generated by Flowance<br>
                <a href="https://flowance.com" style="color: #0066FF; text-decoration: none;">AI-Powered Invoicing for Freelancers</a>
              </p>
            </td>
          </tr>
          ` : `
          <tr>
            <td style="padding: 20px; text-align: center;">
              <div style="height: 4px; background: linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%); border-radius: 2px;"></div>
            </td>
          </tr>
          `}
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export function generateInvoiceEmailText(data: InvoiceEmailData): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const showFlowanceBranding = !data.logo_url

  return `
Invoice ${data.invoice_number}
From ${data.business_name}

Hello ${data.client_name},

Thank you for your business! Please find your invoice attached to this email.

Invoice Details:
- Invoice Number: ${data.invoice_number}
- Amount Due: ${formatCurrency(data.total_amount)}
- Due Date: ${formatDate(data.due_date)}

If you have any questions or concerns, please don't hesitate to reach out.

Best regards,
${data.business_name}

${showFlowanceBranding ? `
---
This invoice was generated by Flowance - AI-Powered Invoicing for Freelancers
` : ''}
  `
}