'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { ArrowLeft, Save, Send } from 'lucide-react'
import Link from 'next/link'

export default function NewInvoicePage() {
  const [isSaving, setIsSaving] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // TODO: Implement save logic
    setTimeout(() => {
      setIsSaving(false)
    }, 1000)
  }

  const handleSend = async () => {
    setIsSending(true)
    // TODO: Implement send logic
    setTimeout(() => {
      setIsSending(false)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">New Invoice</h1>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={handleSend}
            disabled={isSending}
          >
            <Send className="w-4 h-4 mr-2" />
            {isSending ? 'Sending...' : 'Send Invoice'}
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <InvoiceForm />
      </Card>
    </div>
  )
}
