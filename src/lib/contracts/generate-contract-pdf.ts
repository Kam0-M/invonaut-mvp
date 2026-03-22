import jsPDF from 'jspdf'

type ClauseBlock = {
  title: string
  content: string
  category: string
}

type ContractPDFData = {
  title: string
  status: string
  created_at: string
  signed_at?: string
  signer_name?: string
  signer_email?: string
  signature_image?: string | null  // base64 data URL from canvas
  content: ClauseBlock[]
  client: {
    name: string
    email: string | null
    company: string | null
  }
  owner: {
    business_name: string | null
    full_name: string | null
    email: string | null
    address: string | null
    logo_url?: string | null
    brand_color?: string | null
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 102, b: 255 } // default Invonaut blue
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mimeType = url.toLowerCase().endsWith('.jpg') || url.toLowerCase().endsWith('.jpeg')
      ? 'image/jpeg' : 'image/png'
    return `data:${mimeType};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}

// Wraps long text and returns the new Y position after drawing it
function drawWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  pageHeight: number,
  margin: number
): number {
  const lines = doc.splitTextToSize(text, maxWidth)
  for (const line of lines) {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
    doc.text(line, x, y)
    y += lineHeight
  }
  return y
}

export async function generateContractPDF(data: ContractPDFData): Promise<ArrayBuffer> {
  const brandColor = data.owner.brand_color || '#0066FF'
  const colorRGB = hexToRgb(brandColor)

  let logoBase64: string | null = null
  if (data.owner.logo_url) {
    logoBase64 = await loadImageAsBase64(data.owner.logo_url)
  }

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = margin

  // ── Header bar ────────────────────────────────────────────────────────────
  doc.setFillColor(colorRGB.r, colorRGB.g, colorRGB.b)
  doc.rect(0, 0, pageWidth, 22, 'F')

  // Logo or business name in header
  const businessName = data.owner.business_name || data.owner.full_name || 'Invonaut'
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, 3, 16, 16)
      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.text(businessName, margin + 20, 13)
    } catch {
      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.text(businessName, margin, 13)
    }
  } else {
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(businessName, margin, 13)
  }

  // "CONTRACT" label on the right
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('CONTRACT', pageWidth - margin, 13, { align: 'right' })

  y = 32

  // ── Contract title ─────────────────────────────────────────────────────────
  doc.setFontSize(18)
  doc.setTextColor(colorRGB.r, colorRGB.g, colorRGB.b)
  doc.setFont('helvetica', 'bold')
  const titleLines = doc.splitTextToSize(data.title, contentWidth)
  for (const line of titleLines) {
    doc.text(line, margin, y)
    y += 8
  }

  y += 4

  // ── Metadata row ───────────────────────────────────────────────────────────
  doc.setDrawColor(colorRGB.r, colorRGB.g, colorRGB.b)
  doc.setLineWidth(0.4)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)

  const dateStr = new Date(data.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  doc.text(`Created: ${dateStr}`, margin, y)
  doc.text(`Status: ${data.status.replace(/_/g, ' ').toUpperCase()}`, margin + 80, y)
  y += 5

  doc.text(`Between: ${businessName}`, margin, y)
  doc.text(`and: ${data.client.name}${data.client.company ? ` (${data.client.company})` : ''}`, margin + 80, y)
  y += 4

  doc.setLineWidth(0.4)
  doc.setDrawColor(220, 220, 220)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // ── Clauses ────────────────────────────────────────────────────────────────
  for (const clause of data.content) {
    // Check page space before drawing clause title
    if (y + 16 > pageHeight - margin) {
      doc.addPage()
      y = margin
    }

    // Clause title
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(40, 40, 40)
    const clauseTitleLines = doc.splitTextToSize(clause.title, contentWidth)
    for (const line of clauseTitleLines) {
      if (y + 7 > pageHeight - margin) { doc.addPage(); y = margin }
      doc.text(line, margin, y)
      y += 6
    }

    y += 2

    // Clause body
    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(70, 70, 70)

    // Handle \n in content
    const paragraphs = clause.content.split('\n')
    for (const para of paragraphs) {
      if (!para.trim()) {
        y += 3 // blank line gap
        continue
      }
      y = drawWrappedText(doc, para, margin, y, contentWidth, 5.5, pageHeight, margin)
    }

    y += 8 // gap between clauses

    // Light divider between clauses
    if (y < pageHeight - margin - 5) {
      doc.setDrawColor(230, 230, 230)
      doc.setLineWidth(0.2)
      doc.line(margin, y - 4, pageWidth - margin, y - 4)
    }
  }

  // ── Signature block ────────────────────────────────────────────────────────
  if (data.signer_name || data.signed_at) {
    // Reserve space: image (30h) + text rows (~30) + disclaimer (~10) + padding
    const sigBlockHeight = data.signature_image ? 85 : 50
    if (y + sigBlockHeight > pageHeight - margin) {
      doc.addPage()
      y = margin
    }

    y += 4
    doc.setDrawColor(colorRGB.r, colorRGB.g, colorRGB.b)
    doc.setLineWidth(0.4)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(40, 40, 40)
    doc.text('SIGNATURE', margin, y)
    y += 7

    // Embed the actual canvas signature image
    if (data.signature_image) {
      try {
        // Draw a light box behind the signature
        doc.setFillColor(250, 250, 250)
        doc.setDrawColor(220, 220, 220)
        doc.setLineWidth(0.3)
        doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'FD')

        // Add the signature image inside the box
        // Canvas is 600x144px — scale to fit the box width while keeping ratio
        const imgWidth = contentWidth - 4
        const imgHeight = 28
        doc.addImage(
          data.signature_image,
          'PNG',
          margin + 2,
          y + 1,
          imgWidth,
          imgHeight,
          undefined,
          'FAST'
        )
        y += 34
      } catch (err) {
        // If image embedding fails, fall back to a placeholder line
        console.error('Signature image embed error:', err)
        doc.setDrawColor(180, 180, 180)
        doc.setLineWidth(0.5)
        doc.line(margin, y + 15, margin + 80, y + 15)
        y += 20
      }
    }

    // Signature baseline label
    doc.setFontSize(7)
    doc.setTextColor(180, 180, 180)
    doc.text('Signature', margin, y)
    y += 6

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(70, 70, 70)

    if (data.signer_name) {
      doc.text(`Signed by: ${data.signer_name}`, margin, y)
      y += 5
    }
    if (data.signer_email) {
      doc.text(`Email: ${data.signer_email}`, margin, y)
      y += 5
    }
    if (data.signed_at) {
      const signedDateStr = new Date(data.signed_at).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
      doc.text(`Date: ${signedDateStr}`, margin, y)
      y += 5
    }

    y += 3
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      'This document was electronically signed. The signature is legally binding under the US ESIGN Act (2000) and UETA.',
      margin,
      y,
      { maxWidth: contentWidth }
    )
  }

  // ── Footer on every page ───────────────────────────────────────────────────
  const totalPages = (doc.internal as any).getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(180, 180, 180)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Powered by Invonaut · From contract to cash. Automated. · Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    )
  }

  return doc.output('arraybuffer')
}