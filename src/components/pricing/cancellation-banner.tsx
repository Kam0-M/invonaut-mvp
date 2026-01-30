'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function CancellationBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Only show banner if canceled param exists
    if (searchParams.get('canceled') === 'true') {
      setShowBanner(true)
    }
  }, [searchParams])

  const handleDismiss = () => {
    setShowBanner(false)
    // Remove the canceled parameter from URL
    router.replace('/pricing')
  }

  if (!showBanner) return null

  return (
    <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 mb-8 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold text-orange-900">
              Subscription Canceling
            </h3>
            <button
              onClick={handleDismiss}
              className="text-orange-600 hover:text-orange-800 font-bold text-xl"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
          <p className="text-orange-800 mb-3">
            Your subscription will downgrade to <span className="font-bold">Starter</span> at the end of your billing period.
          </p>
          <div className="bg-white/70 rounded-lg p-4 border border-orange-200">
            <p className="text-sm text-orange-900 font-semibold mb-2">
              What happens next:
            </p>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• You'll keep access to all features until your billing date</li>
              <li>• No charges after your current period ends</li>
              <li>• Your account will automatically switch to Starter plan</li>
              <li>• You can reactivate anytime from your billing page</li>
            </ul>
          </div>
          <div className="mt-4 flex gap-3">
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-700 transition-all"
            >
              Reactivate Subscription
            </Link>
            <button
              onClick={handleDismiss}
              className="inline-flex items-center gap-2 bg-white text-orange-600 border-2 border-orange-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-50 transition-all"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}