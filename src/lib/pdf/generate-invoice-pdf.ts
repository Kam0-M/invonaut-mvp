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
    business_name: string | null
    full_name: string | null
    email: string | null
    address: string | null
    logo_url?: string | null
    brand_color?: string | null
    secondary_brand_color?: string | null
  }
  items: Array<{
    description: string
    quantity: number
    unit_price: number
    total: number
  }>
}

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 37, g: 99, b: 235 } // Default Invonaut blue (#2563EB - tailwind blue-600)
}

// Helper function to load image as base64 (Node.js compatible)
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch image')
    
    // Convert response to Buffer (Node.js)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Determine MIME type from URL extension
    let mimeType = 'image/png'
    if (url.toLowerCase().endsWith('.jpg') || url.toLowerCase().endsWith('.jpeg')) {
      mimeType = 'image/jpeg'
    } else if (url.toLowerCase().endsWith('.svg')) {
      mimeType = 'image/svg+xml'
    } else if (url.toLowerCase().endsWith('.webp')) {
      mimeType = 'image/webp'
    }
    
    // Convert to base64 data URL
    const base64 = buffer.toString('base64')
    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.error('Error loading image:', error)
    return null
  }
}

type PDFOptions = {
  download?: boolean
}

export async function generateInvoicePDF(data: InvoiceData, options?: PDFOptions): Promise<ArrayBuffer> {
  // Extract white label data - use Invonaut branding from landing page as default
  const brandColor = data.user_profile.brand_color || '#2563EB' // Landing page blue-600
  const secondaryColor = data.user_profile.secondary_brand_color || '#14B8A6' // Landing page teal-500
  const logoUrl = data.user_profile.logo_url
  const hasLogo = !!logoUrl

  // Convert colors to RGB
  const primaryColorRGB = hexToRgb(brandColor)
  const secondaryColorRGB = hexToRgb(secondaryColor)

  console.log('PDF Generator - Branding:', {
    brand_color: brandColor,
    secondary_brand_color: secondaryColor,
    logo_url: logoUrl,
    primaryColorRGB,
    secondaryColorRGB,
    hasLogo
  })

  // Load logo if available
  let logoBase64: string | null = null
  if (logoUrl) {
    logoBase64 = await loadImageAsBase64(logoUrl)
    console.log('Logo loaded:', logoBase64 ? 'Success' : 'Failed')
  }

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPosition = 20

  // Business info and logo section
  doc.setFontSize(10)
  doc.setTextColor(100)

  const businessName = data.user_profile.business_name || data.user_profile.full_name || 'Your Business'
  const businessEmail = data.user_profile.email || ''
  const businessAddress = data.user_profile.address || ''

  // Add logo if available
  if (logoBase64) {
    try {
      // Logo on the left (40x40px)
      doc.addImage(logoBase64, 'PNG', 20, yPosition, 40, 40)
      
      // Business info to the right of logo
      doc.text(businessName, 65, yPosition + 5)
      if (businessEmail) doc.text(businessEmail, 65, yPosition + 12)
      if (businessAddress) {
        const addressLines = doc.splitTextToSize(businessAddress, 80)
        doc.text(addressLines, 65, yPosition + 19)
      }
      
      yPosition += 50 // Move down after logo section
    } catch (error) {
      console.error('Error adding logo to PDF:', error)
      // Fallback: show business info without logo
      doc.text(businessName, 20, yPosition)
      if (businessEmail) doc.text(businessEmail, 20, yPosition + 7)
      if (businessAddress) {
        const addressLines = doc.splitTextToSize(businessAddress, 80)
        doc.text(addressLines, 20, yPosition + 14)
      }
      yPosition += 35
    }
  } else {
    // No logo - just business info
    doc.text(businessName, 20, yPosition)
    if (businessEmail) doc.text(businessEmail, 20, yPosition + 7)
    if (businessAddress) {
      const addressLines = doc.splitTextToSize(businessAddress, 80)
      doc.text(addressLines, 20, yPosition + 14)
    }
    yPosition += 35
  }

  // INVOICE title with primary brand color
  doc.setFontSize(28)
  doc.setTextColor(primaryColorRGB.r, primaryColorRGB.g, primaryColorRGB.b)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', pageWidth - 20, 30, { align: 'right' })

  // Invoice number with primary color
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(data.invoice_number, pageWidth - 20, 40, { align: 'right' })

  // Horizontal line with primary color
  doc.setDrawColor(primaryColorRGB.r, primaryColorRGB.g, primaryColorRGB.b)
  doc.setLineWidth(0.5)
  doc.line(20, yPosition, pageWidth - 20, yPosition)

  yPosition += 15

  // Invoice details
  doc.setFontSize(10)
  doc.setTextColor(60)
  doc.setFont('helvetica', 'bold')
  doc.text('Issue Date:', 20, yPosition)
  doc.text('Due Date:', 20, yPosition + 7)
  doc.text('Status:', 20, yPosition + 14)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(new Date(data.issue_date).toLocaleDateString(), 60, yPosition)
  doc.text(new Date(data.due_date).toLocaleDateString(), 60, yPosition + 7)
  
  // Status badge with colors
  const statusColors: Record<string, { bg: number[]; text: number[] }> = {
    draft: { bg: [243, 244, 246], text: [55, 65, 81] },
    sent: { bg: [219, 234, 254], text: [30, 64, 175] },
    paid: { bg: [220, 252, 231], text: [22, 101, 52] },
    overdue: { bg: [254, 226, 226], text: [153, 27, 27] }
  }
  const statusColor = statusColors[data.status] || statusColors.draft
  doc.text(data.status.toUpperCase(), 60, yPosition + 14)

  yPosition += 25

  // Bill To section
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(60)
  doc.text('BILL TO:', 20, yPosition)
  yPosition += 7

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(data.client.name, 20, yPosition)
  yPosition += 7

  if (data.client.company) {
    doc.text(data.client.company, 20, yPosition)
    yPosition += 7
  }

  if (data.client.email) {
    doc.text(data.client.email, 20, yPosition)
    yPosition += 7
  }

  if (data.client.phone) {
    doc.text(data.client.phone, 20, yPosition)
    yPosition += 7
  }

  if (data.client.address) {
    const addressLines = doc.splitTextToSize(data.client.address, 80)
    doc.text(addressLines, 20, yPosition)
    yPosition += addressLines.length * 7
  }

  yPosition += 10

  // ⬅️ FIXED: Items table header with wider columns for large numbers
  doc.setFillColor(primaryColorRGB.r, primaryColorRGB.g, primaryColorRGB.b)
  doc.rect(20, yPosition, pageWidth - 40, 10, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text('Description', 25, yPosition + 7)
  doc.text('Qty', pageWidth - 110, yPosition + 7) // ⬅️ Moved left to make room
  doc.text('Unit Price', pageWidth - 80, yPosition + 7) // ⬅️ Wider column for large prices
  doc.text('Total', pageWidth - 25, yPosition + 7, { align: 'right' }) // ⬅️ Right-aligned for large totals

  yPosition += 15

  // ⬅️ FIXED: Items with wider columns for large numbers
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  data.items.forEach((item, index) => {
    // Alternating row background
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251)
      doc.rect(20, yPosition - 5, pageWidth - 40, 10, 'F')
    }

    doc.setTextColor(60)
    const descLines = doc.splitTextToSize(item.description, 85) // ⬅️ Shortened description to make room
    doc.text(descLines, 25, yPosition)
    
    doc.text(item.quantity.toString(), pageWidth - 110, yPosition) // ⬅️ ALIGNED
    doc.text(`$${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 80, yPosition) // ⬅️ WIDER + comma formatting
    doc.text(`$${item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 25, yPosition, { align: 'right' }) // ⬅️ NOW HAS SPACE!

    yPosition += Math.max(descLines.length * 5, 10)
  })

  yPosition += 5

  // Totals section with primary color accents
  doc.setDrawColor(primaryColorRGB.r, primaryColorRGB.g, primaryColorRGB.b)
  doc.setLineWidth(0.5)
  doc.line(pageWidth - 100, yPosition, pageWidth - 20, yPosition)

  yPosition += 10

  // Subtotal with comma formatting for large amounts
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text('Subtotal:', pageWidth - 70, yPosition)
  doc.text(`$${data.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 25, yPosition, { align: 'right' })

  yPosition += 8

  // Tax with comma formatting
  doc.text('Tax:', pageWidth - 70, yPosition)
  doc.text(`$${data.tax_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 25, yPosition, { align: 'right' })

  yPosition += 12

  // Total with primary color and comma formatting
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(primaryColorRGB.r, primaryColorRGB.g, primaryColorRGB.b)
  doc.text('TOTAL:', pageWidth - 70, yPosition)
  doc.text(`$${data.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 25, yPosition, { align: 'right' })

  // Notes section if present
  if (data.notes) {
    yPosition += 20
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(60)
    doc.text('Notes:', 20, yPosition)
    yPosition += 7

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    const notesLines = doc.splitTextToSize(data.notes, pageWidth - 40)
    doc.text(notesLines, 20, yPosition)
  }

  // Footer with secondary color accent
  const footerY = pageHeight - 20
  doc.setDrawColor(secondaryColorRGB.r, secondaryColorRGB.g, secondaryColorRGB.b)
  doc.setLineWidth(1)
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5)

  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.setFont('helvetica', 'italic')
  
  // Only show "Generated by Invonaut" if no logo
  if (!hasLogo) {
    doc.text('Invonaut · From contract to cash. Automated.', pageWidth / 2, footerY, { align: 'center' })
  }

// Convert to ArrayBuffer
const pdfBlob = doc.output('arraybuffer')
  
// Handle download if requested
if (options?.download) {
  const blob = new Blob([pdfBlob], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${data.invoice_number}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}

return pdfBlob
}