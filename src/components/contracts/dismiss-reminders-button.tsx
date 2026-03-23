'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BellOff, Bell, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface DismissRemindersButtonProps {
  contractId: string
  isDismissed: boolean
}

export default function DismissRemindersButton({
  contractId,
  isDismissed,
}: DismissRemindersButtonProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDismiss = async () => {
    setIsPending(true)
    try {
      const res = await fetch('/api/contracts/dismiss-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { toast.error(data.error || 'Could not dismiss reminders.'); return }
      toast.success("Reminders dismissed. You won't be notified about this contract again.")
      setShowConfirm(false)
      router.refresh()
    } catch {
      toast.error('Could not dismiss reminders.')
    } finally {
      setIsPending(false)
    }
  }

  const handleEnable = async () => {
    setIsPending(true)
    try {
      const res = await fetch('/api/contracts/enable-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { toast.error(data.error || 'Could not re-enable reminders.'); return }
      toast.success('Reminders re-enabled.')
      router.refresh()
    } catch {
      toast.error('Could not re-enable reminders.')
    } finally {
      setIsPending(false)
    }
  }

  // ── Dismissed state — show re-enable option ──────────────────────────────
  if (isDismissed) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <BellOff className="w-3.5 h-3.5" />
          Expiry reminders are off for this contract.
        </p>
        <button
          onClick={handleEnable}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors"
        >
          {isPending
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Bell className="w-3.5 h-3.5" />
          }
          {isPending ? 'Enabling...' : 'Re-enable reminders'}
        </button>
      </div>
    )
  }

  // ── Active state — show dismiss option ───────────────────────────────────
  if (showConfirm) {
    return (
      <div className="rounded-xl border-2 border-orange-100 bg-orange-50/40 p-4 space-y-3">
        <p className="text-xs font-bold text-gray-700 leading-relaxed">
          Stop all expiry reminders for this contract? You can re-enable them at any time.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {isPending
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <BellOff className="w-3 h-3" />
            }
            {isPending ? 'Dismissing...' : 'Yes, dismiss'}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-orange-500 transition-colors w-full"
    >
      <BellOff className="w-3.5 h-3.5" />
      Dismiss expiry reminders
    </button>
  )
}