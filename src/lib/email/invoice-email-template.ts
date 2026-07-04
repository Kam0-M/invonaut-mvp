type EmailTemplateData = {
  invoice_number: string
  client_name: string
  due_date: string
  total_amount: number
  business_name: string
  logo_url: string | null
  brand_color: string | null
  secondary_brand_color: string | null
  currency?: string
}

// ⬅️ CONTRAST HELPER: Determine if we should use light or dark text on a given background color
function shouldUseLightText(hexColor: string): boolean {
  // Remove # if present
  const hex = hexColor.replace('#', '')
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  // Calculate relative luminance (WCAG formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // If luminance > 0.5, color is light, use dark text
  // If luminance <= 0.5, color is dark, use light text
  return luminance <= 0.5
}

export function generateInvoiceEmailHTML(data: EmailTemplateData): string {
  // Use Invonaut brand colors from landing page as default
  const brandColor = data.brand_color || '#2563EB' // Landing page blue-600
  const secondaryColor = data.secondary_brand_color || '#14B8A6' // Landing page teal-500
  
  // ⬅️ DETERMINE TEXT COLOR BASED ON BACKGROUND for readability
  const textOnBrand = shouldUseLightText(brandColor) ? '#FFFFFF' : '#1F2937'
  const textOnSecondary = shouldUseLightText(secondaryColor) ? '#FFFFFF' : '#1F2937'
  
  const formattedDueDate = new Date(data.due_date + 'T12:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currency || 'USD'
  }).format(data.total_amount)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${data.invoice_number}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F3F4F6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Brand Color -->
          <tr>
            <td style="background: linear-gradient(135deg, ${brandColor} 0%, ${secondaryColor} 100%); padding: 40px 30px; text-align: center;">
              ${data.logo_url ? `
                <img src="${data.logo_url}" alt="${data.business_name}" style="max-width: 150px; max-height: 60px; margin-bottom: 20px;">
              ` : ''}
              <h1 style="margin: 0; color: ${textOnBrand}; font-size: 28px; font-weight: 700;">New Invoice</h1>
              <p style="margin: 10px 0 0; color: ${textOnBrand}; font-size: 16px; opacity: 0.9;">from ${data.business_name}</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #1F2937; font-size: 16px; line-height: 1.6;">
                Hello ${data.client_name},
              </p>
              
              <p style="margin: 0 0 30px; color: #4B5563; font-size: 16px; line-height: 1.6;">
                Here's your invoice. The PDF is attached to this email for your records.
              </p>

              <!-- Invoice Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; border-radius: 8px; border: 2px solid #E5E7EB; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <!-- Invoice Number with Contrast-Safe Text -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                      <tr>
                        <td style="padding: 12px 16px; background-color: ${brandColor}; border-radius: 6px;">
                          <p style="margin: 0; color: #6B7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: ${textOnBrand}; opacity: 0.8;">Invoice Number</p>
                          <p style="margin: 4px 0 0; color: ${textOnBrand}; font-size: 18px; font-weight: 700;">${data.invoice_number}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Amount Due with Contrast-Safe Text -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                      <tr>
                        <td style="padding: 12px 16px; background-color: ${secondaryColor}; border-radius: 6px;">
                          <p style="margin: 0; color: ${textOnSecondary}; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8;">Amount Due</p>
                          <p style="margin: 4px 0 0; color: ${textOnSecondary}; font-size: 24px; font-weight: 700;">${formattedAmount}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Due Date -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 12px 16px; background-color: #FFFFFF; border: 2px solid #E5E7EB; border-radius: 6px;">
                          <p style="margin: 0; color: #6B7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Due Date</p>
                          <p style="margin: 4px 0 0; color: #1F2937; font-size: 16px; font-weight: 600;">${formattedDueDate}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Attachment Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #EEF2FF; border-left: 4px solid ${brandColor}; border-radius: 6px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; color: #3730A3; font-size: 14px; font-weight: 600;">📎 Invoice attached</p>
                    <p style="margin: 8px 0 0; color: #4338CA; font-size: 14px; line-height: 1.5;">The invoice is attached as a PDF to this email.</p>
                  </td>
                </tr>
              </table>

              <!-- Questions Section -->
              <p style="margin: 0; color: #4B5563; font-size: 16px; line-height: 1.6;">
                If you have any questions or concerns, please don't hesitate to reach out.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0; color: #6B7280; font-size: 14px;">
                This invoice was sent by ${data.business_name}
              </p>
              ${!data.logo_url ? `
                <p style="margin: 10px 0 0; color: #9CA3AF; font-size: 12px;">
                  Invonaut · From contract to cash. Automated.
                </p>
              ` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

export function generateInvoiceEmailText(data: EmailTemplateData): string {
  const formattedDueDate = new Date(data.due_date + 'T12:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currency || 'USD'
  }).format(data.total_amount)

  return `
Invoice from ${data.business_name}

Hello ${data.client_name},

Here's your invoice. The PDF is attached to this email for your records.

Invoice Number: ${data.invoice_number}
Amount Due: ${formattedAmount}
Due Date: ${formattedDueDate}

The invoice is attached as a PDF to this email. If you have any questions or concerns, please don't hesitate to reach out.

---
This invoice was sent by ${data.business_name}
${!data.logo_url ? 'Invonaut · From contract to cash. Automated.' : ''}
  `.trim()
}