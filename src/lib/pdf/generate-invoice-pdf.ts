import jsPDF from 'jspdf'

type InvoiceData = {
  invoice_number: string
  issue_date: string
  due_date: string
  status: string
  subtotal: number
  tax_amount: number
  total_amount: number
  notes: string | null
  client: {
    name: string
    email: string | null
    phone: string | null
    company: string | null
    address: string | null
  }
  user_profile: {
    full_name: string | null
    email: string | null
    business_name: string | null
    address: string | null
  }
  items: Array<{
    description: string
    quantity: number
    unit_price: number
    total: number
  }>
}

type GenerateInvoicePDFOptions = {
  /**
   * When true (browser only), trigger a download after creating the PDF.
   * On the server this is ignored.
   */
  download?: boolean
}

/**
 * Generate a professional invoice PDF using jsPDF.
 * Returns an ArrayBuffer so callers can convert to Buffer (Node) or Blob (browser).
 */
export async function generateInvoicePDF(
  invoiceData: InvoiceData,
  options: GenerateInvoicePDFOptions = {}
): Promise<ArrayBuffer> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20

  let yPosition = margin

  // Helper function to add text
  const addText = (text: string, x: number, y: number, options?: any) => {
    pdf.text(text, x, y, options)
  }

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // === HEADER SECTION ===
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  addText('INVOICE', margin, yPosition)
  yPosition += 10

  // Business Info (Left)
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  addText(
    invoiceData.user_profile.business_name ||
      invoiceData.user_profile.full_name ||
      'Your Business',
    margin,
    yPosition
  )
  yPosition += 6

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  if (invoiceData.user_profile.email) {
    addText(invoiceData.user_profile.email, margin, yPosition)
    yPosition += 5
  }
  if (invoiceData.user_profile.address) {
    const addressLines = invoiceData.user_profile.address.split('\n')
    addressLines.forEach((line) => {
      addText(line, margin, yPosition)
      yPosition += 5
    })
  }

  // Client Info (Right)
  let clientYPosition = 30
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  addText('Bill To:', pageWidth - margin - 60, clientYPosition)
  clientYPosition += 6

  pdf.setFont('helvetica', 'normal')
  addText(invoiceData.client.name, pageWidth - margin - 60, clientYPosition)
  clientYPosition += 5

  if (invoiceData.client.company) {
    addText(invoiceData.client.company, pageWidth - margin - 60, clientYPosition)
    clientYPosition += 5
  }
  if (invoiceData.client.address) {
    const clientAddressLines = invoiceData.client.address.split('\n')
    clientAddressLines.forEach((line) => {
      addText(line, pageWidth - margin - 60, clientYPosition)
      clientYPosition += 5
    })
  }
  if (invoiceData.client.email) {
    addText(invoiceData.client.email, pageWidth - margin - 60, clientYPosition)
    clientYPosition += 5
  }
  if (invoiceData.client.phone) {
    addText(invoiceData.client.phone, pageWidth - margin - 60, clientYPosition)
  }

  yPosition = Math.max(yPosition, clientYPosition) + 10

  // === INVOICE DETAILS ===
  pdf.setDrawColor(200, 200, 200)
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  const detailsY = yPosition
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  addText('Invoice Number:', margin, detailsY)
  addText('Issue Date:', margin + 50, detailsY)
  addText('Due Date:', margin + 100, detailsY)
  addText('Status:', margin + 150, detailsY)

  pdf.setFont('helvetica', 'normal')
  addText(invoiceData.invoice_number, margin, detailsY + 5)
  addText(formatDate(invoiceData.issue_date), margin + 50, detailsY + 5)
  addText(formatDate(invoiceData.due_date), margin + 100, detailsY + 5)
  addText(
    invoiceData.status.charAt(0).toUpperCase() + invoiceData.status.slice(1),
    margin + 150,
    detailsY + 5
  )

  yPosition = detailsY + 15

  // === LINE ITEMS TABLE ===
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 6

  // Table Header
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  addText('Description', margin, yPosition)
  addText('Qty', pageWidth - margin - 80, yPosition, { align: 'right' })
  addText('Price', pageWidth - margin - 50, yPosition, { align: 'right' })
  addText('Total', pageWidth - margin, yPosition, { align: 'right' })
  yPosition += 5

  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 6

  // Table Rows
  pdf.setFont('helvetica', 'normal')
  invoiceData.items.forEach((item) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      pdf.addPage()
      yPosition = margin
    }

    addText(item.description, margin, yPosition)
    addText(item.quantity.toString(), pageWidth - margin - 80, yPosition, {
      align: 'right'
    })
    addText(formatCurrency(item.unit_price), pageWidth - margin - 50, yPosition, {
      align: 'right'
    })
    addText(formatCurrency(item.total), pageWidth - margin, yPosition, {
      align: 'right'
    })
    yPosition += 6
  })

  yPosition += 4
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  // === TOTALS SECTION ===
  const totalsX = pageWidth - margin - 60

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  addText('Subtotal:', totalsX, yPosition)
  addText(formatCurrency(invoiceData.subtotal), pageWidth - margin, yPosition, {
    align: 'right'
  })
  yPosition += 6

  if (invoiceData.tax_amount > 0) {
    addText('Tax:', totalsX, yPosition)
    addText(formatCurrency(invoiceData.tax_amount), pageWidth - margin, yPosition, {
      align: 'right'
    })
    yPosition += 6
  }

  yPosition += 2
  pdf.setDrawColor(0, 0, 0)
  pdf.line(totalsX - 5, yPosition, pageWidth - margin, yPosition)
  yPosition += 6

  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  addText('Total:', totalsX, yPosition)
  addText(formatCurrency(invoiceData.total_amount), pageWidth - margin, yPosition, {
    align: 'right'
  })

  // === NOTES SECTION ===
  if (invoiceData.notes) {
    yPosition += 15

    if (yPosition > pageHeight - 40) {
      pdf.addPage()
      yPosition = margin
    }

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    addText('Notes:', margin, yPosition)
    yPosition += 6

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    const noteLines = pdf.splitTextToSize(invoiceData.notes, pageWidth - 2 * margin)
    noteLines.forEach((line: string) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage()
        yPosition = margin
      }
      addText(line, margin, yPosition)
      yPosition += 5
    })
  }

  // === FOOTER ===
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'italic')
  pdf.setTextColor(128, 128, 128)
  addText(
    'Generated by Flowance - AI-Powered Invoicing',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )

  // Produce ArrayBuffer for server/email attachments or client-side blob
  const arrayBuffer = pdf.output('arraybuffer') as ArrayBuffer

  // Optional browser download flow
  if (options.download && typeof window !== 'undefined') {
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${invoiceData.invoice_number}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  return arrayBuffer
}