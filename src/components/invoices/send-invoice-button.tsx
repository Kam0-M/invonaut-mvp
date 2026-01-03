'use client'

import { useState } from 'react'
import { Mail, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type SendInvoiceButtonProps = {
  invoiceId: string
  clientEmail: string
  invoiceNumber: string
  clientName: string
}

export function SendInvoiceButton({
  invoiceId,
  clientEmail,
  invoiceNumber,
  clientName
}: SendInvoiceButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState(clientEmail)
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (!email || isSending) return
  
    setIsSending(true)
    const loadingToast = toast.loading('Sending invoice...')
  
    try {
      // Send the invoice email
      const response = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          recipientEmail: email,
        }),
      })
  
      const data = await response.json()
  
      if (!response.ok) {
        const errorMessage = data.error || 'Failed to send invoice'
        
        if (errorMessage.includes('Demo mode')) {
          toast.error('⚠️ Demo Mode: Can only send to kamohelo.thakhisi@gmail.com', { id: loadingToast, duration: 3000 })
        } else {
          toast.error('⚠️ ' + errorMessage, { id: loadingToast, duration: 3000 })
        }
        
        setIsSending(false)
        return
      }

      // ✨ AUTO-MARK AS SENT: Update invoice status to "sent"
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoiceId)

      if (updateError) {
        console.error('Failed to update invoice status:', updateError)
        toast.success('Invoice sent successfully!', { id: loadingToast, duration: 3000 })
      } else {
        toast.success('Invoice sent successfully!', { id: loadingToast, duration: 3000 })
      }
  
      setIsSending(false)
      
      // Close modal and refresh page after 1 second
      setTimeout(() => {
        setIsOpen(false)
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      toast.error('⚠️ Failed to send invoice', { id: loadingToast, duration: 3000 })
      setIsSending(false)
    }
  }

  const handleClose = () => {
    if (!isSending) {
      setIsOpen(false)
    }
  }

  const subjectLine = `Invoice ${invoiceNumber} from Flowance`

  return (
    <>
      <Button
        onClick={() => {
          setIsOpen(true)
          setEmail(clientEmail)
        }}
        className="bg-primary hover:bg-primary/90 text-white"
      >
        <Mail className="w-4 h-4 mr-2" />
        Send Invoice
      </Button>

      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        title="Send Invoice"
      >
        <div className="space-y-6">
          {/* Email Input */}
          <div>
            <label htmlFor="recipient-email" className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Email
            </label>
            <Input
              id="recipient-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              disabled={isSending}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Invoice will be sent to this email address
            </p>
          </div>

          {/* Email Preview */}
          <Card className="p-4 bg-gray-50 border-gray-200">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                  Subject Line
                </p>
                <p className="text-sm text-gray-900 font-medium">
                  {subjectLine}
                </p>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                  Recipient
                </p>
                <p className="text-sm text-gray-900">
                  {clientName}
                </p>
                <p className="text-sm text-gray-600">
                  {email || clientEmail}
                </p>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Note:</span> A PDF copy of invoice {invoiceNumber} will be attached to this email.
                </p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || !email.trim()}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invoice
                </>
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}