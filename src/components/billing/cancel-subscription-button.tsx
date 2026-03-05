'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface CancelSubscriptionButtonProps {
  currentTier: string
}

export default function CancelSubscriptionButton({ currentTier }: CancelSubscriptionButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
      })

      if (response.ok) {
        window.location.reload()
      } else {
        console.error('Failed to cancel subscription')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      setIsLoading(false)
    }
  }

  const isStarter = currentTier === 'starter'
  const isProfessional = currentTier === 'professional'

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all hover:scale-105"
      >
        Cancel Subscription
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">Cancel Subscription?</h2>
                    <p className="text-red-100 text-sm mt-1">
                      This takes effect immediately
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* What you lose */}
              <div className="mb-4">
                <h3 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-2">
                  You will IMMEDIATELY lose access to:
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {isStarter && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-bold mt-0.5">✕</span>
                        <span>Creating new invoices and editing drafts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-bold mt-0.5">✕</span>
                        <span>Adding and editing clients</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-bold mt-0.5">✕</span>
                        <span>AI payment predictions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-bold mt-0.5">✕</span>
                        <span>Sending invoices and automated follow-ups</span>
                      </li>
                    </>
                  )}
                  {isProfessional && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-bold mt-0.5">✕</span>
                        <span>Creating new invoices and editing drafts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-bold mt-0.5">✕</span>
                        <span>Adding and editing clients</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-bold mt-0.5">✕</span>
                        <span>White label branding (logo and custom colors)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-bold mt-0.5">✕</span>
                        <span>Advanced AI predictions and sending invoices</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* What you keep */}
              <div className="mb-4">
                <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-2">
                  What stays safe:
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span>All your existing invoices and client data (view-only)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span>Dashboard analytics and revenue history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span>Your account — resubscribe anytime to restore full access</span>
                  </li>
                </ul>
              </div>

              {/* Downgrade note for Professional users only */}
              {isProfessional && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-5">
                  <p className="text-sm text-blue-900 font-medium">
                    <strong>Prefer a lower cost over no access?</strong> Use "Downgrade to Starter" ($30/mo) instead to keep creating invoices and managing clients without losing everything.
                  </p>
                </div>
              )}

              {/* Confirmation note for Starter users */}
              {isStarter && (
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 mb-5">
                  <p className="text-sm text-gray-700">
                    You won't be charged again. Your data will be waiting for you if you decide to come back.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isLoading}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all disabled:opacity-50"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Yes, Cancel Subscription'
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