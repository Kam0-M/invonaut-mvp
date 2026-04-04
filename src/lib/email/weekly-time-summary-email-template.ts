// src/lib/email/weekly-time-summary-email-template.ts
// HTML + plain-text email template for the weekly time summary.
// Sent every Monday to Professional+ users who have unbilled time entries.

export type WeeklyTimeSummaryEmailData = {
    ownerName:       string       // e.g. "Kamohelo"
    weekStart:       string       // e.g. "Apr 7, 2026"
    weekEnd:         string       // e.g. "Apr 13, 2026"
    totalHours:      number       // decimal, e.g. 12.5
    billableHours:   number
    unbilledValue:   number       // dollar amount
    unbilledEntries: number       // count of entries not yet invoiced
    clientBreakdown: { name: string; hours: number; unbilledValue: number }[]
    timeUrl:         string
    invoiceUrl:      string
  }
  
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  
  const formatHours = (h: number) =>
    `${h.toFixed(2).replace(/\.00$/, '')} hr${h !== 1 ? 's' : ''}`
  
  export function generateWeeklyTimeSummaryHTML(d: WeeklyTimeSummaryEmailData): string {
    const clientRows = d.clientBreakdown.map(c => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;font-size:14px;color:#374151;font-weight:600;">
          ${c.name}
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;font-size:14px;color:#6B7280;text-align:right;">
          ${formatHours(c.hours)}
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;font-size:14px;color:#059669;font-weight:700;text-align:right;">
          ${c.unbilledValue > 0 ? formatCurrency(c.unbilledValue) : '—'}
        </td>
      </tr>
    `).join('')
  
    return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>Your weekly time summary</title>
  </head>
  <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background-color:#F3F4F6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F4F6;padding:40px 20px;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1D4ED8,#0066FF);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.7);">Invonaut · Weekly Summary</p>
              <h1 style="margin:0;font-size:26px;font-weight:900;color:#FFFFFF;letter-spacing:-0.5px;">Your Time This Week</h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.8);">${d.weekStart} – ${d.weekEnd}</p>
            </td>
          </tr>
  
          <!-- Body -->
          <tr>
            <td style="background:#FFFFFF;padding:36px 40px;">
  
              <p style="margin:0 0 24px;font-size:15px;color:#374151;font-weight:500;">
                Hi ${d.ownerName || 'there'}, here's what you tracked last week.
              </p>
  
              <!-- Stat pills -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding-right:8px;" width="33%">
                    <div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:12px;padding:16px;text-align:center;">
                      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#1D4ED8;">Total Hours</p>
                      <p style="margin:0;font-size:22px;font-weight:900;color:#1E3A8A;">${formatHours(d.totalHours)}</p>
                    </div>
                  </td>
                  <td style="padding-right:8px;" width="33%">
                    <div style="background:#F0FDF4;border:2px solid #BBF7D0;border-radius:12px;padding:16px;text-align:center;">
                      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#15803D;">Billable</p>
                      <p style="margin:0;font-size:22px;font-weight:900;color:#14532D;">${formatHours(d.billableHours)}</p>
                    </div>
                  </td>
                  <td width="33%">
                    <div style="background:#ECFDF5;border:2px solid #A7F3D0;border-radius:12px;padding:16px;text-align:center;">
                      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#047857;">Unbilled Value</p>
                      <p style="margin:0;font-size:22px;font-weight:900;color:#064E3B;">${d.unbilledValue > 0 ? formatCurrency(d.unbilledValue) : '—'}</p>
                    </div>
                  </td>
                </tr>
              </table>
  
              ${d.clientBreakdown.length > 0 ? `
              <!-- Client breakdown -->
              <h2 style="margin:0 0 12px;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#6B7280;">By Client</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #F3F4F6;border-radius:12px;overflow:hidden;margin-bottom:28px;">
                <thead>
                  <tr style="background:#F9FAFB;">
                    <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;">Client</th>
                    <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;">Hours</th>
                    <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;">Unbilled</th>
                  </tr>
                </thead>
                <tbody>${clientRows}</tbody>
              </table>
              ` : ''}
  
              ${d.unbilledEntries > 0 ? `
              <!-- CTA -->
              <div style="background:linear-gradient(135deg,#EFF6FF,#E0F2FE);border:2px solid #BFDBFE;border-radius:12px;padding:20px 24px;margin-bottom:28px;text-align:center;">
                <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#1E3A8A;">
                  You have ${d.unbilledEntries} unbilled entr${d.unbilledEntries === 1 ? 'y' : 'ies'} ready to invoice.
                </p>
                <a href="${d.invoiceUrl}"
                   style="display:inline-block;background:#0066FF;color:#FFFFFF;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.2px;">
                  Create Invoice from Time Entries →
                </a>
              </div>
              ` : ''}
  
              <p style="margin:0;font-size:13px;color:#9CA3AF;text-align:center;">
                <a href="${d.timeUrl}" style="color:#6B7280;text-decoration:none;">View all time entries</a>
                &nbsp;·&nbsp;
                <a href="${d.timeUrl}" style="color:#6B7280;text-decoration:none;">Manage in Invonaut</a>
              </p>
  
            </td>
          </tr>
  
          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;border-top:1px solid #E5E7EB;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;">
                Invonaut · From Contract to Cash. Automated.<br>
                You're receiving this because you're on a Professional or Business plan.
              </p>
            </td>
          </tr>
  
        </table>
      </td></tr>
    </table>
  </body>
  </html>`
  }
  
  export function generateWeeklyTimeSummaryText(d: WeeklyTimeSummaryEmailData): string {
    const lines = [
      `Your Weekly Time Summary — ${d.weekStart} to ${d.weekEnd}`,
      '',
      `Hi ${d.ownerName || 'there'},`,
      '',
      `Total hours:   ${formatHours(d.totalHours)}`,
      `Billable hours: ${formatHours(d.billableHours)}`,
      `Unbilled value: ${d.unbilledValue > 0 ? formatCurrency(d.unbilledValue) : 'No hourly rates set'}`,
      '',
    ]
  
    if (d.clientBreakdown.length > 0) {
      lines.push('By client:')
      d.clientBreakdown.forEach(c => {
        lines.push(`  ${c.name}: ${formatHours(c.hours)}${c.unbilledValue > 0 ? ` (${formatCurrency(c.unbilledValue)} unbilled)` : ''}`)
      })
      lines.push('')
    }
  
    if (d.unbilledEntries > 0) {
      lines.push(`You have ${d.unbilledEntries} unbilled entr${d.unbilledEntries === 1 ? 'y' : 'ies'} ready to invoice.`)
      lines.push(`Create invoice: ${d.invoiceUrl}`)
      lines.push('')
    }
  
    lines.push(`View time log: ${d.timeUrl}`)
    lines.push('')
    lines.push('— Invonaut')
  
    return lines.join('\n')
  }