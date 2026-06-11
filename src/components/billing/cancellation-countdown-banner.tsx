'use client'

import { useState, useEffect } from 'react'
import ReactivateSubscriptionButton from './reactivate-subscription-button'

interface CountdownBannerProps {
  cancelAt: number // Unix timestamp
  currentTier: string
}

export default function CancellationCountdownBanner({ cancelAt, currentTier }: CountdownBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState('')

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = Date.now()
      const diff = cancelAt * 1000 - now

      if (diff <= 0) {
        setTimeRemaining('Subscription ended')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`)
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [cancelAt])

  const cancelDate = new Date(cancelAt * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8">
      <div className="flex items-start gap-4">
        {/* Warning Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Subscription Canceling Soon
          </h3>
          
          <div className="space-y-3 mb-4">
            <p className="text-gray-700">
              Your <span className="font-bold capitalize">{currentTier}</span> plan will be canceled on{' '}
              <span className="font-bold text-orange-600">{cancelDate}</span>
            </p>

            {/* Countdown Timer */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-orange-200">
              <p className="text-sm text-gray-600 mb-1">Time remaining:</p>
              <p className="text-3xl font-bold text-orange-600 font-mono">
                {timeRemaining}
              </p>
            </div>

            {/* What You'll Lose */}
            <div className="bg-white/70 rounded-lg p-4 border border-orange-200">
              <p className="font-semibold text-gray-900 mb-2">After cancellation, you'll lose:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {currentTier === 'professional' || currentTier === 'business' ? (
                  <>
                    <li>• White label branding (custom logo & colors)</li>
                    <li>• Unlimited invoices (limited to 25/month)</li>
                    <li>• Advanced AI insights</li>
                    <li>• Priority email support</li>
                  </>
                ) : (
                  <li>• All premium features</li>
                )}
              </ul>
            </div>
          </div>

          {/* Reactivate Button */}
          <ReactivateSubscriptionButton />
        </div>
      </div>
    </div>
  )
}