'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { refreshServerComponents } from '@/lib/router-refresh'

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
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState(clientEmail)
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (!email || isSending) return
  
    setIsSending(true)
    const loadingToast = toast.loading('Sending invoice...')
  
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
        
        if (errorMessage.includes('Demo mode')) {
          toast.error('Demo Mode: Can only send to kamohelo.thakhisi@gmail.com', { id: loadingToast, duration: 3000 })
        } else {
          toast.error(errorMessage, { id: loadingToast, duration: 3000 })
        }
        
        setIsSending(false)
        return
      }

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

      setTimeout(() => {
        setIsOpen(false)
        refreshServerComponents(router)
      }, 400)
      
    } catch (error) {
      toast.error('Failed to send invoice', { id: loadingToast, duration: 3000 })
      setIsSending(false)
    }
  }

  const handleClose = () => {
    if (!isSending) {
      setIsOpen(false)
    }
  }

  const subjectLine = `Invoice ${invoiceNumber} from Invonaut`

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true)
          setEmail(clientEmail)
        }}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl btn-primary transition-all duration-200 text-sm whitespace-nowrap"
      >
        <Mail className="w-4 h-4" />
        Send Invoice
      </button>

      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        title="Send Invoice"
      >
        <div className="space-y-6">
          <div>
            <label htmlFor="recipient-email" className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">
              Recipient Email
            </label>
            <Input
              id="recipient-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              disabled={isSending}
              className="w-full h-12 text-base"
            />
            <p className="text-xs text-gray-500 mt-2 font-medium">
              Invoice will be sent to this email address
            </p>
          </div>

          <div className="bg-[#F8FAFF] rounded-xl border border-gray-100 p-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-gray-500 mb-2">
                  Subject Line
                </p>
                <p className="text-sm text-gray-900 font-bold">
                  {subjectLine}
                </p>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-black uppercase tracking-wide text-gray-500 mb-2">
                  Recipient
                </p>
                <p className="text-sm text-gray-900 font-bold">
                  {clientName}
                </p>
                <p className="text-sm text-gray-600 font-medium">
                  {email || clientEmail}
                </p>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-600 font-medium">
                  <span className="font-bold">Note:</span> A PDF copy of invoice {invoiceNumber} will be attached to this email.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-gray-100">
            <button
              onClick={handleClose}
              disabled={isSending}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !email.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl btn-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send Invoice
                </>
              )}
            </button>
          </div>
        </div>
      </Dialog>
    </>
  )
}