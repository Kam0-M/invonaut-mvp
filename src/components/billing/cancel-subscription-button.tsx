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
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">Cancel Subscription?</h2>
                    <p className="text-red-100 text-sm mt-1">
                      This will end your paid subscription
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
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  What happens when you cancel:
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>Your <span className="font-bold capitalize">{currentTier}</span> subscription will be cancelled</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>You'll keep access to all features until your current billing period ends</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>After that, you'll lose access to ALL features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>You won't be charged again</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>You can resubscribe anytime</span>
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-900 font-medium">
                  <strong>Note:</strong> This is different from downgrading. Cancelling ends your subscription completely. If you want to keep using Invonaut with fewer features, choose "Switch to Professional" or "Switch to Starter" instead.
                </p>
              </div>

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