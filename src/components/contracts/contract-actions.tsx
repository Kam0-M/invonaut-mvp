'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Loader2, CalendarClock, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface ContractActionsProps {
  contractId: string
  status: string
  clientEmail: string | null
  expiryDate?: string | null
}

export default function ContractActions({
  contractId,
  status,
  clientEmail,
  expiryDate,
}: ContractActionsProps) {
  const router = useRouter()

  // Send / resend state
  const [isSending, setIsSending] = useState(false)

  // Extend state
  const [showExtendPicker, setShowExtendPicker] = useState(false)
  const [newExpiryDate, setNewExpiryDate] = useState('')
  const [isExtending, setIsExtending] = useState(false)

  // Renew state
  const [isRenewing, setIsRenewing] = useState(false)

  // ── Send / Resend ────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!clientEmail) {
      toast.error('This client has no email address. Add one in their profile first.')
      return
    }
    setIsSending(true)
    try {
      const res = await fetch('/api/contracts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Could not send contract.')
        return
      }
      toast.success('Contract sent to client.')
      router.refresh()
    } catch {
      toast.error('Could not send contract. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  // ── Extend ───────────────────────────────────────────────────────────────────
  const handleExtend = async () => {
    if (!newExpiryDate) { toast.error('Pick a new expiry date.'); return }
    setIsExtending(true)
    try {
      const res = await fetch('/api/contracts/extend', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, newExpiryDate }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Could not extend contract.')
        return
      }
      toast.success('Contract extended. Reminder cycle reset.')
      setShowExtendPicker(false)
      setNewExpiryDate('')
      router.refresh()
    } catch {
      toast.error('Could not extend contract.')
    } finally {
      setIsExtending(false)
    }
  }

  // ── Renew ────────────────────────────────────────────────────────────────────
  const handleRenew = async () => {
    setIsRenewing(true)
    try {
      const res = await fetch('/api/contracts/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Could not create renewal.')
        return
      }
      toast.success('Renewal draft created.')
      router.push(`/dashboard/contracts/${data.contractId}`)
    } catch {
      toast.error('Could not create renewal.')
    } finally {
      setIsRenewing(false)
    }
  }

  const isSendable = ['draft', 'sent', 'awaiting_signature'].includes(status)
  const isExtendable = ['active', 'expired'].includes(status)
  const isResend = status === 'sent' || status === 'awaiting_signature'

  // Minimum date for the extend picker — tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2 justify-end">

        {/* Send / Resend */}
        {isSendable && (
          <button
            onClick={handleSend}
            disabled={isSending}
            className={
              isResend
                ? 'inline-flex items-center gap-2 border-2 border-blue-300 text-blue-700 bg-white hover:bg-blue-50 px-5 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50'
                : 'inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transition-all disabled:opacity-50'
            }
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isSending ? 'Sending...' : isResend ? 'Resend to Client' : 'Send to Client'}
          </button>
        )}

        {/* Extend */}
        {isExtendable && (
          <button
            onClick={() => setShowExtendPicker(!showExtendPicker)}
            className="inline-flex items-center gap-2 border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 px-5 py-2.5 rounded-xl font-bold transition-all"
          >
            <CalendarClock className="w-4 h-4" />
            Extend
          </button>
        )}

        {/* Renew */}
        {isExtendable && (
          <button
            onClick={handleRenew}
            disabled={isRenewing}
            className="inline-flex items-center gap-2 border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 px-5 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {isRenewing
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <RefreshCw className="w-4 h-4" />
            }
            {isRenewing ? 'Creating...' : 'Renew'}
          </button>
        )}
      </div>

      {/* Resend note */}
      {isResend && (
        <p className="text-xs text-gray-400">
          A new signing link will be generated and emailed.
        </p>
      )}

      {/* Extend date picker — inline dropdown */}
      {showExtendPicker && (
        <div className="border-2 border-blue-100 rounded-xl p-4 bg-blue-50/30 space-y-3 w-full sm:w-72">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              New expiry date
            </label>
            <input
              type="date"
              min={minDate}
              value={newExpiryDate}
              onChange={e => setNewExpiryDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm text-gray-900 bg-white focus:border-blue-500 outline-none transition-all"
            />
            {expiryDate && (
              <p className="text-xs text-gray-400 mt-1.5">
                Current expiry: {new Date(expiryDate).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExtend}
              disabled={isExtending || !newExpiryDate}
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isExtending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <CalendarClock className="w-3.5 h-3.5" />
              }
              {isExtending ? 'Extending...' : 'Confirm'}
            </button>
            <button
              onClick={() => { setShowExtendPicker(false); setNewExpiryDate('') }}
              className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}