'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ReactivateSubscriptionButton() {
  const [isReactivating, setIsReactivating] = useState(false)

  const handleReactivate = async () => {
    try {
      setIsReactivating(true)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const response = await fetch('/api/reactivate-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reactivate subscription')
      }

      // Force hard refresh to clear all cached data
      window.location.href = '/dashboard/billing'
    } catch (error) {
      console.error('Reactivate error:', error)
      alert(error instanceof Error ? error.message : 'Failed to reactivate subscription')
    } finally {
      setIsReactivating(false)
    }
  }

  return (
    <button
      onClick={handleReactivate}
      disabled={isReactivating}
      className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isReactivating ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Reactivating...
        </span>
      ) : (
        'Reactivate Subscription'
      )}
    </button>
  )
}