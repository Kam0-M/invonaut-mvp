'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, X, Lock } from 'lucide-react'

interface CancelSubscriptionButtonProps {
  currentTier: string
}

export default function CancelSubscriptionButton({ currentTier }: CancelSubscriptionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleCancel = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      if (data.redirect) {
        router.push(data.redirect)
      } else if (data.immediate) {
        router.push('/dashboard/billing?trial_canceled=true')
      } else {
        router.push('/cancellation-pending')
      }
      
      router.refresh()
    } catch (error: any) {
      console.error('Cancellation error:', error)
      alert(error.message || 'Failed to cancel subscription')
      setIsLoading(false)
    }
  }

  const planName = currentTier === 'professional' ? 'Professional' : currentTier === 'business' ? 'Business' : 'Starter'

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all hover:scale-105"
      >
        Cancel Subscription
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-2xl sticky top-0 z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">Cancel Subscription?</h2>
                    <p className="text-red-100 text-sm mt-1">
                      You'll lose the ability to create new content
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* What you'll lose */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Features You'll Lose:
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3 h-3 text-red-600" />
                    </div>
                    <span className="text-gray-700 text-sm font-medium">
                      <strong>Create new invoices</strong> - Can't send new invoices
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3 h-3 text-red-600" />
                    </div>
                    <span className="text-gray-700 text-sm font-medium">
                      <strong>Add new clients</strong> - Can't add client records
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3 h-3 text-red-600" />
                    </div>
                    <span className="text-gray-700 text-sm font-medium">
                      <strong>Edit existing data</strong> - Everything becomes view-only
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3 h-3 text-red-600" />
                    </div>
                    <span className="text-gray-700 text-sm font-medium">
                      <strong>Automated follow-ups</strong> - No reminder emails
                    </span>
                  </li>
                  {currentTier === 'professional' && (
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="w-3 h-3 text-red-600" />
                      </div>
                      <span className="text-gray-700 text-sm font-medium">
                        <strong>White label branding</strong> - Loses custom logo & colors
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              {/* What you CAN still do */}
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-green-900 text-sm mb-2">✅ You can still:</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• View all your invoices and clients</li>
                  <li>• See dashboard analytics and charts</li>
                  <li>• Export your data anytime</li>
                  <li>• Resubscribe to unlock all features again</li>
                </ul>
              </div>

              {/* What happens */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-blue-900 text-sm mb-2">What happens next:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Subscription ends immediately (no charge)</li>
                  <li>• You'll see a "Subscribe" prompt instead of features</li>
                  <li>• Your data stays safe - nothing is deleted</li>
                  <li>• Click any "Subscribe" button to reactivate</li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all disabled:opacity-50"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Confirm Cancellation
                    </>
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