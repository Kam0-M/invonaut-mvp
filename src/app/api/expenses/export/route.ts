import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCategoryLabel } from '@/lib/ai/expense-categorization'
import jsPDF from 'jspdf'

export async function POST(request: NextRequest) {
  try {
    const { format, startDate, endDate, category } = await request.json()

    if (!format || !['csv', 'pdf'].includes(format)) {
      return NextResponse.json({ success: false, error: 'Format must be csv or pdf.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'You must be logged in.' }, { status: 401 })
    }

    // Fetch user profile for business name
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('business_name, full_name')
      .eq('id', user.id)
      .single()

    // Build expenses query
    let query = supabase
      .from('expenses')
      .select('id, description, amount, date, vendor, category, notes, clients(name)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (startDate) query = query.gte('date', startDate)
    if (endDate)   query = query.lte('date', endDate)
    if (category && category !== 'all') query = query.eq('category', category)

    const { data: expenses, error: fetchError } = await query
    if (fetchError) {
      return NextResponse.json({ success: false, error: 'Could not fetch expenses.' }, { status: 500 })
    }

    const rows = (expenses ?? []) as any[]
    const total = rows.reduce((sum, e) => sum + Number(e.amount || 0), 0)
    const businessName = profile?.business_name || profile?.full_name || 'My Business'
    const formatCurrency = (n: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

    // ── CSV ───────────────────────────────────────────────────────────────────
    if (format === 'csv') {
      const headers = ['Date', 'Description', 'Vendor', 'Category', 'Client', 'Amount', 'Notes']
      const csvRows = rows.map(e => {
        const client = Array.isArray(e.clients) ? e.clients[0]?.name : e.clients?.name
        return [
          e.date,
          `"${(e.description ?? '').replace(/"/g, '""')}"`,
          `"${(e.vendor ?? '').replace(/"/g, '""')}"`,
          getCategoryLabel(e.category),
          `"${(client ?? '').replace(/"/g, '""')}"`,
          Number(e.amount).toFixed(2),
          `"${(e.notes ?? '').replace(/"/g, '""')}"`,
        ].join(',')
      })

      const disclaimer = '"DISCLAIMER: This report is for reference only and does not constitute tax advice. Consult a qualified tax professional."'
      const csv = [
        `"${businessName} — Expense Report"`,
        `"Period: ${startDate ?? 'All time'} to ${endDate ?? 'present'}"`,
        `"Total: ${formatCurrency(total)}"`,
        '',
        headers.join(','),
        ...csvRows,
        '',
        disclaimer,
      ].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="expense-report-${Date.now()}.csv"`,
        },
      })
    }

    // ── PDF ───────────────────────────────────────────────────────────────────
    const doc = new jsPDF()
    const pageW = doc.internal.pageSize.getWidth()
    let y = 20

    const addLine = (text: string, size = 10, bold = false, color: [number,number,number] = [30,30,30]) => {
      doc.setFontSize(size)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.setTextColor(...color)
      doc.text(text, 14, y)
      y += size * 0.5 + 4
    }

    const checkPage = () => {
      if (y > 270) { doc.addPage(); y = 20 }
    }

    // Header
    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, pageW, 30, 'F')
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('Expense Report', 14, 12)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(businessName, 14, 22)
    y = 42

    // Summary
    addLine(`Period: ${startDate ?? 'All time'} — ${endDate ?? 'present'}`, 10, false, [80, 80, 80])
    addLine(`Total expenses: ${formatCurrency(total)}`, 13, true, [30, 30, 30])
    addLine(`${rows.length} expense${rows.length !== 1 ? 's' : ''}`, 10, false, [80, 80, 80])
    y += 4

    // Table header
    doc.setFillColor(249, 250, 251)
    doc.rect(14, y - 4, pageW - 28, 10, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(80, 80, 80)
    doc.text('Date',        14,  y + 2)
    doc.text('Description', 42,  y + 2)
    doc.text('Category',    110, y + 2)
    doc.text('Amount',      165, y + 2)
    y += 12

    // Table rows
    rows.forEach((e, i) => {
      checkPage()
      if (i % 2 === 0) {
        doc.setFillColor(252, 252, 253)
        doc.rect(14, y - 4, pageW - 28, 9, 'F')
      }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(30, 30, 30)
      doc.text(e.date ?? '',                    14,  y + 1)
      doc.text((e.description ?? '').substring(0, 38), 42, y + 1)
      doc.text(getCategoryLabel(e.category),    110, y + 1)
      doc.setFont('helvetica', 'bold')
      doc.text(formatCurrency(Number(e.amount)), 165, y + 1)
      y += 9
    })

    // Total row
    y += 4
    doc.setDrawColor(200, 200, 200)
    doc.line(14, y, pageW - 14, y)
    y += 6
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(30, 30, 30)
    doc.text('Total', 110, y)
    doc.text(formatCurrency(total), 165, y)
    y += 16

    // Disclaimer
    checkPage()
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(140, 140, 140)
    doc.text(
      'DISCLAIMER: This report is for reference only and does not constitute tax advice.',
      14, y
    )
    y += 5
    doc.text('Consult a qualified tax professional for advice specific to your situation.', 14, y)

    const pdfBytes = doc.output('arraybuffer')

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="expense-report-${Date.now()}.pdf"`,
      },
    })
  } catch (err) {
    console.error('Export error:', err)
    return NextResponse.json({ success: false, error: 'Could not generate report.' }, { status: 500 })
  }
}