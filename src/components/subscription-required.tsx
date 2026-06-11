'use client'

import Link from 'next/link'
import { Lock, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SubscriptionRequired() {
  const [hasEverSubscribed, setHasEverSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('stripe_customer_id, stripe_subscription_id')
          .eq('id', user.id)
          .single()
        setHasEverSubscribed(!!profile?.stripe_customer_id || !!profile?.stripe_subscription_id)
      } catch { /* non-fatal */ }
      finally { setIsLoading(false) }
    }
    check()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-7 h-7 text-blue-600" />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-black text-gray-900 mb-2" style={{ letterSpacing: '-.02em' }}>
          {hasEverSubscribed ? 'Your subscription is inactive.' : 'This feature requires a plan.'}
        </h2>
        <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">
          {hasEverSubscribed
            ? 'Resubscribe to pick up right where you left off — all your data is still here.'
            : 'Unlock direct payment logging, AI predictions, and the full financial toolkit with any plan.'}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {!isLoading && (
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl btn-primary text-sm w-full"
            >
              <Zap className="w-4 h-4" />
              {hasEverSubscribed ? 'View plans' : 'Start 14-day free trial'}
            </Link>
          )}
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to dashboard
          </Link>
        </div>

        {!hasEverSubscribed && !isLoading && (
          <p className="text-xs text-gray-400 font-medium mt-6">
            14-day free trial · No credit card required · Cancel anytime
          </p>
        )}
      </div>
    </div>
  )
}
