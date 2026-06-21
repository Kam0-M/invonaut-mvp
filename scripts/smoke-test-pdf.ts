import { generateInvoicePDF } from '../src/lib/pdf/generate-invoice-pdf'
import { generateContractPDF } from '../src/lib/contracts/generate-contract-pdf'

function isValidPDF(buf: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buf)
  // Every valid PDF starts with "%PDF-" and ends with "%%EOF" (possibly followed by whitespace/newline)
  const header = Buffer.from(bytes.slice(0, 5)).toString('ascii')
  const tail = Buffer.from(bytes.slice(-32)).toString('ascii')
  return header === '%PDF-' && tail.includes('%%EOF') && bytes.length > 500
}

async function testInvoicePDF() {
  const data = {
    invoice_number: 'INV-SMOKE-0001',
    issue_date: '2026-06-01',
    due_date: '2026-06-15',
    status: 'sent',
    subtotal: 1000,
    tax_amount: 80,
    total_amount: 1080,
    notes: 'Smoke test invoice — verifying jsPDF 4.2.1 still renders correctly after the 3.0.4 -> 4.2.1 upgrade.',
    client: {
      name: 'Smoke Test Client',
      email: 'client@example.com',
      phone: '555-0100',
      company: 'Test Co',
      address: '123 Test St, Testville, TS 00000',
    },
    user_profile: {
      business_name: 'Invonaut Smoke Test',
      full_name: 'Kamo Motelle',
      email: 'kamohelo.thakhisi@gmail.com',
      address: '456 Owner Ave',
      logo_url: null,
      brand_color: '#0055FF',
      secondary_brand_color: '#00C4A0',
    },
    items: [
      { description: 'Consulting — Week 1', quantity: 10, unit_price: 80, total: 800 },
      { description: 'Consulting — Week 2', quantity: 2.5, unit_price: 80, total: 200 },
    ],
  }

  const buf = await generateInvoicePDF(data as any)
  const ok = isValidPDF(buf)
  console.log(`[invoice-pdf] bytes=${buf.byteLength} validHeaderFooter=${ok}`)
  if (!ok) throw new Error('Invoice PDF failed validity check')
  require('fs').writeFileSync('/home/claude/smoke-invoice.pdf', Buffer.from(buf))
}

async function testContractPDF() {
  const data = {
    title: 'Smoke Test Contract',
    status: 'sent',
    created_at: '2026-06-01T00:00:00.000Z',
    content: [
      {
        title: 'Scope of Work',
        category: 'scope',
        content: 'This is a smoke-test clause body, long enough to exercise splitTextToSize and force a page break across multiple pages so addPage()/setPage() both get exercised during this jsPDF 4.2.1 test run. '.repeat(30),
      },
      {
        title: 'Payment Terms',
        category: 'payment',
        content: 'Net 30. Smoke test clause two.',
      },
    ],
    client: {
      name: 'Smoke Test Client',
      email: 'client@example.com',
      company: 'Test Co',
    },
    owner: {
      business_name: 'Invonaut Smoke Test',
      full_name: 'Kamo Motelle',
      email: 'kamohelo.thakhisi@gmail.com',
      address: '456 Owner Ave',
      logo_url: null,
      brand_color: '#0055FF',
    },
  }

  const buf = await generateContractPDF(data as any)
  const ok = isValidPDF(buf)
  console.log(`[contract-pdf] bytes=${buf.byteLength} validHeaderFooter=${ok}`)
  if (!ok) throw new Error('Contract PDF failed validity check')
}

async function testExpensePDF() {
  // Mirrors src/app/api/expenses/export/route.ts's PDF-building logic exactly
  // (can't import it directly — it's an inline POST handler, not exported).
  // Exercises doc.internal.pageSize.getWidth() and the 'italic' font variant,
  // neither of which the invoice/contract tests above touch.
  const jsPDF = (await import('jspdf')).default
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()
  let y = 20

  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, pageW, 30, 'F')
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('Expense Report', 14, 12)
  y = 42

  const rows = [
    { date: '2026-06-01', description: 'Adobe Creative Cloud', category: 'software', amount: 54.99 },
    { date: '2026-06-05', description: 'Client lunch meeting', category: 'meals', amount: 87.32 },
  ]

  rows.forEach((e, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(252, 252, 253)
      doc.rect(14, y - 4, pageW - 28, 9, 'F')
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(30, 30, 30)
    doc.text(e.date, 14, y + 1)
    doc.text(e.description, 42, y + 1)
    doc.text(e.category, 110, y + 1)
    doc.setFont('helvetica', 'bold')
    doc.text(`$${e.amount.toFixed(2)}`, 165, y + 1)
    y += 9
  })

  doc.setDrawColor(200, 200, 200)
  doc.line(14, y, pageW - 14, y)
  y += 6
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  doc.text('DISCLAIMER: smoke test only.', 14, y)

  const buf = doc.output('arraybuffer') as ArrayBuffer
  const ok = isValidPDF(buf)
  console.log(`[expense-pdf] bytes=${buf.byteLength} validHeaderFooter=${ok} pageWidth=${pageW}`)
  if (!ok) throw new Error('Expense PDF failed validity check')
}

async function main() {
  await testInvoicePDF()
  await testContractPDF()
  await testExpensePDF()
  console.log('ALL PDF SMOKE TESTS PASSED')
}

main().catch((err) => {
  console.error('SMOKE TEST FAILED:', err)
  process.exit(1)
})
