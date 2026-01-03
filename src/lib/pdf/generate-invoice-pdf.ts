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
  download?: boolean
}

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

  const addText = (text: string, x: number, y: number, options?: any) => {
    pdf.text(text, x, y, options)
  }

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

  // === HEADER SECTION ===
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  addText('INVOICE', margin, yPosition)
  yPosition += 10

  // Business Info (Left) - with text wrapping
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  const businessName = invoiceData.user_profile.business_name ||
    invoiceData.user_profile.full_name ||
    'Your Business'
  const businessNameLines = pdf.splitTextToSize(businessName, 80)
  businessNameLines.forEach((line: string) => {
    addText(line, margin, yPosition)
    yPosition += 6
  })

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  if (invoiceData.user_profile.email) {
    const emailLines = pdf.splitTextToSize(invoiceData.user_profile.email, 80)
    emailLines.forEach((line: string) => {
      addText(line, margin, yPosition)
      yPosition += 5
    })
  }
  if (invoiceData.user_profile.address) {
    const addressLines = invoiceData.user_profile.address.split('\n')
    addressLines.forEach((line) => {
      const wrappedLines = pdf.splitTextToSize(line, 80)
      wrappedLines.forEach((wrappedLine: string) => {
        addText(wrappedLine, margin, yPosition)
        yPosition += 5
      })
    })
  }

  // Client Info (Right) - improved text wrapping
  let clientYPosition = 30
  const clientInfoX = pageWidth - margin - 70
  const clientInfoMaxWidth = 70

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  addText('Bill To:', clientInfoX, clientYPosition)
  clientYPosition += 6

  pdf.setFont('helvetica', 'normal')
  
  // Client name - wrapped properly
  if (invoiceData.client.name) {
    const clientNameLines = pdf.splitTextToSize(invoiceData.client.name, clientInfoMaxWidth)
    clientNameLines.forEach((line: string) => {
      addText(line, clientInfoX, clientYPosition)
      clientYPosition += 5
    })
  }

  // Company - wrapped properly
  if (invoiceData.client.company) {
    const companyLines = pdf.splitTextToSize(invoiceData.client.company, clientInfoMaxWidth)
    companyLines.forEach((line: string) => {
      addText(line, clientInfoX, clientYPosition)
      clientYPosition += 5
    })
  }

  // Client address - wrapped properly
  if (invoiceData.client.address) {
    const clientAddressLines = invoiceData.client.address.split('\n')
    clientAddressLines.forEach((line) => {
      const wrappedLines = pdf.splitTextToSize(line, clientInfoMaxWidth)
      wrappedLines.forEach((wrappedLine: string) => {
        addText(wrappedLine, clientInfoX, clientYPosition)
        clientYPosition += 5
      })
    })
  }

  // Email - wrapped properly
  if (invoiceData.client.email) {
    const emailLines = pdf.splitTextToSize(invoiceData.client.email, clientInfoMaxWidth)
    emailLines.forEach((line: string) => {
      addText(line, clientInfoX, clientYPosition)
      clientYPosition += 5
    })
  }

  // Phone
  if (invoiceData.client.phone) {
    addText(invoiceData.client.phone, clientInfoX, clientYPosition)
    clientYPosition += 5
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

  // Table Header - perfectly aligned columns
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  const qtyX = pageWidth - margin - 75
  const priceX = pageWidth - margin - 50
  const totalX = pageWidth - margin - 25
  
  addText('Description', margin, yPosition)
  addText('Qty', qtyX, yPosition)
  addText('Price', priceX, yPosition)
  addText('Total', totalX, yPosition)
  yPosition += 5

  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 6

  // Table Rows - with description wrapping
  pdf.setFont('helvetica', 'normal')
  const descriptionMaxWidth = 90 // Reduced width to prevent overlap with Qty column

  invoiceData.items.forEach((item) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      pdf.addPage()
      yPosition = margin
      
      // Redraw table header on new page
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      addText('Description', margin, yPosition)
      addText('Qty', qtyX, yPosition)
      addText('Price', priceX, yPosition)
      addText('Total', totalX, yPosition)
      yPosition += 5
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 6
      pdf.setFont('helvetica', 'normal')
    }

    // Split long descriptions into multiple lines
    const descriptionLines = pdf.splitTextToSize(item.description, descriptionMaxWidth)
    const itemStartY = yPosition
    const lineHeight = 5

    // Calculate total height needed for this item
    const totalItemHeight = descriptionLines.length * lineHeight + 2

    // Check if entire item fits on current page
    if (yPosition + totalItemHeight > pageHeight - 60) {
      pdf.addPage()
      yPosition = margin
      
      // Redraw table header on new page
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      addText('Description', margin, yPosition)
      addText('Qty', qtyX, yPosition)
      addText('Price', priceX, yPosition)
      addText('Total', totalX, yPosition)
      yPosition += 5
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 6
      pdf.setFont('helvetica', 'normal')
    }

    const finalItemStartY = yPosition

    // Print ALL description lines
    descriptionLines.forEach((line: string) => {
      addText(line, margin, yPosition)
      yPosition += lineHeight
    })

    // Print qty, price, total - PERFECTLY ALIGNED under headers
    addText(item.quantity.toString(), qtyX, finalItemStartY)
    addText(formatCurrency(item.unit_price), priceX, finalItemStartY)
    addText(formatCurrency(item.total), totalX, finalItemStartY)
    
    yPosition += 2 // Small space between items
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

  const arrayBuffer = pdf.output('arraybuffer') as ArrayBuffer

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