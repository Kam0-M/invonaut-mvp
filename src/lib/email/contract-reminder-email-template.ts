export type ContractReminderEmailData = {
    ownerName: string
    contractTitle: string
    clientName: string
    expiryDate: string
    daysUntilExpiry: number
    contractUrl: string
  }
  
  export function generateContractReminderEmailHTML(data: ContractReminderEmailData): string {
    const formattedExpiry = new Date(data.expiryDate + 'T12:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  
    const urgencyColor =
      data.daysUntilExpiry <= 1
        ? '#DC2626'   // red — 1 day
        : data.daysUntilExpiry <= 7
        ? '#D97706'   // amber — 7 days
        : '#2563EB'   // blue — 15 or 30 days
  
    const urgencyLabel =
      data.daysUntilExpiry <= 1
        ? 'Expires tomorrow'
        : data.daysUntilExpiry <= 7
        ? `Expires in ${data.daysUntilExpiry} days`
        : `Expires in ${data.daysUntilExpiry} days`
  
    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contract Expiry Reminder</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F3F4F6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
  
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, ${urgencyColor} 0%, #1E40AF 100%); padding: 40px 30px; text-align: center;">
                <h1 style="margin: 0; color: #FFFFFF; font-size: 26px; font-weight: 700;">Contract Expiry Reminder</h1>
                <p style="margin: 10px 0 0; color: #FFFFFF; font-size: 16px; opacity: 0.9;">Invonaut · From contract to cash. Automated.</p>
              </td>
            </tr>
  
            <!-- Body -->
            <tr>
              <td style="padding: 40px 30px;">
                <p style="margin: 0 0 20px; color: #1F2937; font-size: 16px; line-height: 1.6;">
                  Hi ${data.ownerName},
                </p>
                <p style="margin: 0 0 30px; color: #4B5563; font-size: 16px; line-height: 1.6;">
                  This is a reminder that one of your contracts is approaching its expiry date.
                </p>
  
                <!-- Contract details card -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; border-radius: 8px; border: 2px solid #E5E7EB; margin-bottom: 30px;">
                  <tr>
                    <td style="padding: 24px;">
  
                      <!-- Urgency badge -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                        <tr>
                          <td style="padding: 12px 16px; background-color: ${urgencyColor}; border-radius: 6px;">
                            <p style="margin: 0; color: #FFFFFF; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.85;">Status</p>
                            <p style="margin: 4px 0 0; color: #FFFFFF; font-size: 18px; font-weight: 700;">${urgencyLabel}</p>
                          </td>
                        </tr>
                      </table>
  
                      <!-- Contract title -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                        <tr>
                          <td style="padding: 12px 16px; background-color: #FFFFFF; border: 2px solid #E5E7EB; border-radius: 6px;">
                            <p style="margin: 0; color: #6B7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Contract</p>
                            <p style="margin: 4px 0 0; color: #1F2937; font-size: 16px; font-weight: 600;">${data.contractTitle}</p>
                          </td>
                        </tr>
                      </table>
  
                      <!-- Client -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                        <tr>
                          <td style="padding: 12px 16px; background-color: #FFFFFF; border: 2px solid #E5E7EB; border-radius: 6px;">
                            <p style="margin: 0; color: #6B7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Client</p>
                            <p style="margin: 4px 0 0; color: #1F2937; font-size: 16px; font-weight: 600;">${data.clientName}</p>
                          </td>
                        </tr>
                      </table>
  
                      <!-- Expiry date -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 12px 16px; background-color: #FFFFFF; border: 2px solid #E5E7EB; border-radius: 6px;">
                            <p style="margin: 0; color: #6B7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Expiry Date</p>
                            <p style="margin: 4px 0 0; color: #1F2937; font-size: 16px; font-weight: 600;">${formattedExpiry}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
  
                <!-- CTA -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                  <tr>
                    <td align="center">
                      <a href="${data.contractUrl}" style="display: inline-block; background-color: ${urgencyColor}; color: #FFFFFF; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                        View Contract →
                      </a>
                    </td>
                  </tr>
                </table>
  
                <p style="margin: 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                  If you no longer need reminders for this contract, you can dismiss them from the contract detail page in your dashboard.
                </p>
              </td>
            </tr>
  
            <!-- Footer -->
            <tr>
              <td style="background-color: #F9FAFB; padding: 24px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
                <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                  Invonaut · From contract to cash. Automated.
                </p>
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
  
  export function generateContractReminderEmailText(data: ContractReminderEmailData): string {
    const formattedExpiry = new Date(data.expiryDate + 'T12:00:00').toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
    return `
  Contract Expiry Reminder — Invonaut
  
  Hi ${data.ownerName},
  
  This is a reminder that one of your contracts is approaching its expiry date.
  
  Contract: ${data.contractTitle}
  Client:   ${data.clientName}
  Expires:  ${formattedExpiry} (${data.daysUntilExpiry} day${data.daysUntilExpiry === 1 ? '' : 's'} away)
  
  View contract: ${data.contractUrl}
  
  If you no longer need reminders for this contract, you can dismiss them from the contract detail page in your Invonaut dashboard.
  
  ---
  Invonaut · From contract to cash. Automated.
    `.trim()
  }