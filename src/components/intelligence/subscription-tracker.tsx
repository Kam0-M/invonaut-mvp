'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Check, X, CreditCard } from 'lucide-react'

interface Subscription {
  id: string
  merchant_name: string
  amount: number
  frequency: string
  occurrence_count: number
  first_seen_date: string
  last_seen_date: string
  suggested_category: string | null
  log_status: string
  currency: string
}

interface Props {
  subscriptions: Subscription[]
}

const FREQ_LABEL: Record<string, string> = {
  weekly: '/week', monthly: '/mo', quarterly: '/quarter', annual: '/yr'
}

export default function SubscriptionTracker({ subscriptions }: Props) {
  const router = useRouter()
  const [logging, setLogging] = useState<string | null>(null)

  const pending   = subscriptions.filter(s => s.log_status === 'pending')
  const logged    = subscriptions.filter(s => s.log_status === 'logged')
  const dismissed = subscriptions.filter(s => s.log_status === 'dismissed')

  const handleLog = async (id: string) => {
    setLogging(id)
    try {
      await fetch('/api/intelligence/log-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: id }),
      })
      router.refresh()
    } finally {
      setLogging(null)
    }
  }

  const handleDismiss = async (id: string) => {
    setLogging(id)
    try {
      await fetch('/api/intelligence/log-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: id, dismiss: true }),
      })
      router.refresh()
    } finally {
      setLogging(null)
    }
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm font-medium">No recurring charges detected yet</p>
        <p className="text-xs mt-1">Connect a bank account to start detecting subscriptions automatically</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Pending — needs action */}
      {pending.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Detected — not yet logged ({pending.length})
          </p>
          <div className="space-y-2">
            {pending.map(sub => (
              <div key={sub.id} className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">{sub.merchant_name}</p>
                  <p className="text-xs text-gray-400">
                    ${sub.amount}{FREQ_LABEL[sub.frequency] ?? '/mo'} · {sub.occurrence_count}× detected
                    {sub.suggested_category && ` · ${sub.suggested_category}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleLog(sub.id)}
                    disabled={logging === sub.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-black rounded-lg transition disabled:opacity-50"
                  >
                    {logging === sub.id
                      ? <RefreshCw className="w-3 h-3 animate-spin" />
                      : <Check className="w-3 h-3" />}
                    Log it
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDismiss(sub.id)}
                    disabled={logging === sub.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-500 text-xs font-bold rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    <X className="w-3 h-3" /> Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Already logged */}
      {logged.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Tracked ({logged.length})
          </p>
          <div className="space-y-2">
            {logged.map(sub => (
              <div key={sub.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 opacity-75">
                <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-teal-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">{sub.merchant_name}</p>
                  <p className="text-xs text-gray-400">
                    ${sub.amount}{FREQ_LABEL[sub.frequency] ?? '/mo'} · Logged as expense
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
