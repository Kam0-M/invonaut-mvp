'use client'

import { useState } from 'react'
import { Mail, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'

type SendInvoiceButtonProps = {
  invoiceId: string
  clientEmail: string
  invoiceNumber: string
  clientName: string
}

type Toast = {
  type: 'success' | 'error'
  message: string
} | null

export function SendInvoiceButton({
  invoiceId,
  clientEmail,
  invoiceNumber,
  clientName
}: SendInvoiceButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState(clientEmail)
  const [isSending, setIsSending] = useState(false)
  const [toast, setToast] = useState<Toast>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  const handleSend = async () => {
    if (!email || isSending) return
  
    setIsSending(true)
  
    try {
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
        
        // Show appropriate error message
        if (errorMessage.includes('Demo mode')) {
          showToast('error', '⚠️ Demo Mode: Can only send to kamohelo.thakhisi@gmail.com')
        } else {
          showToast('error', errorMessage)
        }
        
        setIsSending(false)
        return
      }
  
      showToast('success', '✅ Invoice sent successfully!')
      setIsSending(false)
      
      // Close modal after 2 seconds on success
      setTimeout(() => {
        setIsOpen(false)
        setToast(null)
      }, 2000)
      
    } catch (error) {
      showToast('error', '❌ Failed to send invoice. Please try again.')
      setIsSending(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setToast(null)
    setIsSending(false)
  }

  const subjectLine = `Invoice ${invoiceNumber} from Flowance`

  return (
    <>
      <Button
        onClick={() => {
          setIsOpen(true)
          setEmail(clientEmail)
          setToast(null)
          setIsSending(false)
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

          {/* Toast Notification */}
          {toast && (
            <div
              className={`flex items-center gap-2 p-3 rounded-md ${
                toast.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          )}

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
                  <span className="animate-spin mr-2">⏳</span>
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

