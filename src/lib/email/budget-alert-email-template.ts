export type BudgetAlertEmailData = {
    ownerName: string
    category: string
    categoryLabel: string
    monthlyLimit: number
    amountSpent: number
    percentUsed: number
    threshold: 80 | 100
    expensesUrl: string
  }
  
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  
  export function generateBudgetAlertEmailHTML(data: BudgetAlertEmailData): string {
    const isExceeded = data.threshold === 100
    const accentColor = isExceeded ? '#DC2626' : '#D97706'
    const bgColor    = isExceeded ? '#FEF2F2' : '#FFFBEB'
    const borderColor = isExceeded ? '#FECACA' : '#FDE68A'
  
    const subject = isExceeded
      ? `🚨 Budget exceeded: ${data.categoryLabel} (${data.percentUsed}% used)`
      : `⚠️ Budget alert: ${data.categoryLabel} is at ${data.percentUsed}%`
  
    const headline = isExceeded
      ? `You've exceeded your ${data.categoryLabel} budget`
      : `Your ${data.categoryLabel} budget is at ${data.percentUsed}%`
  
    const barWidth = Math.min(data.percentUsed, 100)
  
    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#F3F4F6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F4F6;padding:40px 20px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
  
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,${accentColor} 0%,#1E40AF 100%);padding:36px 30px;text-align:center;">
                <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:700;">${headline}</h1>
                <p style="margin:10px 0 0;color:#FFFFFF;font-size:15px;opacity:0.9;">Invonaut · Budget Alert</p>
              </td>
            </tr>
  
            <!-- Body -->
            <tr>
              <td style="padding:36px 30px;">
                <p style="margin:0 0 24px;color:#1F2937;font-size:16px;line-height:1.6;">
                  Hi ${data.ownerName},
                </p>
                <p style="margin:0 0 28px;color:#4B5563;font-size:16px;line-height:1.6;">
                  ${isExceeded
                    ? `You've spent <strong>${formatCurrency(data.amountSpent)}</strong> in <strong>${data.categoryLabel}</strong> this month — that's <strong>${data.percentUsed}%</strong> of your <strong>${formatCurrency(data.monthlyLimit)}</strong> monthly budget.`
                    : `You've spent <strong>${formatCurrency(data.amountSpent)}</strong> in <strong>${data.categoryLabel}</strong> this month — <strong>${data.percentUsed}%</strong> of your <strong>${formatCurrency(data.monthlyLimit)}</strong> monthly budget.`
                  }
                </p>
  
                <!-- Budget card -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${bgColor};border:2px solid ${borderColor};border-radius:10px;margin-bottom:28px;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                        <tr>
                          <td style="padding:10px 14px;background-color:${accentColor};border-radius:6px;">
                            <p style="margin:0;color:#FFFFFF;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;opacity:0.85;">Category</p>
                            <p style="margin:4px 0 0;color:#FFFFFF;font-size:17px;font-weight:700;">${data.categoryLabel}</p>
                          </td>
                        </tr>
                      </table>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                        <tr>
                          <td width="50%" style="padding:10px 14px;background-color:#FFFFFF;border:1px solid #E5E7EB;border-radius:6px;margin-right:8px;">
                            <p style="margin:0;color:#6B7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Spent</p>
                            <p style="margin:4px 0 0;color:#1F2937;font-size:16px;font-weight:700;">${formatCurrency(data.amountSpent)}</p>
                          </td>
                          <td width="8px"></td>
                          <td width="50%" style="padding:10px 14px;background-color:#FFFFFF;border:1px solid #E5E7EB;border-radius:6px;">
                            <p style="margin:0;color:#6B7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Budget</p>
                            <p style="margin:4px 0 0;color:#1F2937;font-size:16px;font-weight:700;">${formatCurrency(data.monthlyLimit)}</p>
                          </td>
                        </tr>
                      </table>
                      <!-- Progress bar -->
                      <p style="margin:0 0 6px;color:#6B7280;font-size:12px;font-weight:600;">${data.percentUsed}% used</p>
                      <div style="background-color:#E5E7EB;border-radius:999px;height:10px;overflow:hidden;">
                        <div style="background-color:${accentColor};width:${barWidth}%;height:100%;border-radius:999px;"></div>
                      </div>
                    </td>
                  </tr>
                </table>
  
                <!-- CTA -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                  <tr>
                    <td align="center">
                      <a href="${data.expensesUrl}" style="display:inline-block;background-color:${accentColor};color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:13px 28px;border-radius:8px;">
                        View Expenses →
                      </a>
                    </td>
                  </tr>
                </table>
  
                <p style="margin:0;color:#6B7280;font-size:14px;line-height:1.6;">
                  You can update or remove this budget at any time from the Expenses page in your Invonaut dashboard.
                </p>
              </td>
            </tr>
  
            <!-- Footer -->
            <tr>
              <td style="background-color:#F9FAFB;padding:20px 30px;text-align:center;border-top:1px solid #E5E7EB;">
                <p style="margin:0;color:#9CA3AF;font-size:12px;">Invonaut · From contract to cash. Automated.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`
  }
  
  export function generateBudgetAlertEmailText(data: BudgetAlertEmailData): string {
    const isExceeded = data.threshold === 100
    return `
  ${isExceeded ? 'BUDGET EXCEEDED' : 'BUDGET ALERT'} — Invonaut
  
  Hi ${data.ownerName},
  
  ${isExceeded
    ? `You've exceeded your ${data.categoryLabel} budget this month.`
    : `Your ${data.categoryLabel} budget is at ${data.percentUsed}%.`
  }
  
  Category: ${data.categoryLabel}
  Spent:    ${formatCurrency(data.amountSpent)}
  Budget:   ${formatCurrency(data.monthlyLimit)}
  Used:     ${data.percentUsed}%
  
  View your expenses: ${data.expensesUrl}
  
  You can update or remove this budget from the Expenses page in your Invonaut dashboard.
  
  ---
  Invonaut · From contract to cash. Automated.
    `.trim()
  }