// Add this at the top of your pricing page, after the title/description

'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export function PricingErrorBanner() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    if (error) {
      setShowError(true)
      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => setShowError(false), 10000)
      return () => clearTimeout(timer)
    }
  }, [error])

  if (!showError || !error) return null

  const getErrorMessage = () => {
    if (error === 'missing_params') {
      return 'Something went wrong. Please try selecting a plan again.'
    }
    if (error === 'upgrade_failed') {
      return 'We couldn\'t process your upgrade. Please try again or contact support.'
    }
    // Show generic message for other errors (don't expose technical details)
    return 'An error occurred. Please try again or contact support if the issue persists.'
  }

  return (
    <div className="max-w-5xl mx-auto mb-8">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 relative">
        <button
          onClick={() => setShowError(false)}
          className="absolute top-4 right-4 text-red-400 hover:text-red-600"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex items-start gap-3 pr-8">
          <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-lg font-bold text-red-900">Oops! Something went wrong</h3>
            <p className="text-red-700 mt-1 font-medium">
              {getErrorMessage()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}