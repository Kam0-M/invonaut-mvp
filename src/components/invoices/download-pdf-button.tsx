'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateInvoicePDF } from '@/lib/pdf/generate-invoice-pdf'

type DownloadPDFButtonProps = {
  invoiceData: {
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
}

export function DownloadPDFButton({ invoiceData }: DownloadPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      await generateInvoicePDF(invoiceData, { download: true })
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={isGenerating}
      className="bg-primary hover:bg-primary/90 text-white"
    >
      <Download className="w-4 h-4 mr-2" />
      {isGenerating ? 'Generating PDF...' : 'Download PDF'}
    </Button>
  )
}