'use client'

import { useState } from 'react'
import { AlertTriangle, X, ShieldCheck } from 'lucide-react'

interface Props { currentTier: string }

export default function CancelSubscriptionButton({ currentTier }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/cancel-subscription', { method: 'POST' })
      if (res.ok) window.location.reload()
      else { console.error('Failed to cancel'); setIsLoading(false) }
    } catch (e) {
      console.error('Error canceling:', e)
      setIsLoading(false)
    }
  }

  const isStarter      = currentTier === 'starter'
  const isProfessional = currentTier === 'professional'

  const loseItems: string[] = isStarter ? [
    'Creating new invoices and editing drafts',
    'AI payment predictions and automated follow-ups',
    'Expense tracking and contract management',
    'Sending invoices to clients',
  ] : isProfessional ? [
    'Creating new invoices and editing drafts',
    'White-label branding (logo and custom colours)',
    'Cash flow forecast and revenue intelligence',
    'AI predictions, contract review, and expense categorisation',
  ] : [
    'Budget tracking and daily AI financial briefings',
    'All Professional features (invoices, contracts, cash flow)',
    'Priority support and early feature access',
    'White-label branding and client portal',
  ]

  return (
    <>
      {/* Trigger — subtle destructive, not a red rectangle */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="w-full px-4 py-2.5 rounded-xl text-xs font-bold text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 hover:border-red-200 transition-colors text-center"
      >
        Cancel subscription
      </button>

      {/* Confirmation modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-100 overflow-hidden"
            style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>

            {/* Header — no gradient, just a clean warning bar */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-gray-900">Cancel subscription?</h2>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                      Takes effect at the end of your billing period
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">

              {/* What you lose */}
              <div>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3">
                  You will lose access to
                </p>
                <ul className="space-y-2">
                  {loseItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
                      <span className="text-sm text-gray-600 font-medium leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What you keep */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--inv-teal)]" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Your data stays safe
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {[
                    'All existing invoices, clients, and payment history',
                    'Dashboard analytics and revenue records',
                    'Resubscribe anytime to restore full access instantly',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--inv-teal)] flex-shrink-0 mt-1.5" />
                      <span className="text-xs text-gray-500 font-medium leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Downgrade nudge for Professional */}
              {isProfessional && (
                <div className="bg-[#EFF4FF] border border-[#0055FF]/15 rounded-xl p-4">
                  <p className="text-xs text-[#0055FF] font-medium leading-relaxed">
                    <span className="font-black">Prefer lower cost over no access?</span>{' '}
                    Use &quot;Switch to Starter&quot; ($29/mo) to keep creating invoices and managing
                    clients without losing everything.
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Keep my plan
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Canceling…
                    </>
                  ) : (
                    'Yes, cancel'
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}
