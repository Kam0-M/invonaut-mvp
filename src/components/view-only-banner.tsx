'use client'

import Link from 'next/link'
import { Lock, Sparkles, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ViewOnlyBanner() {
  const [hasEverSubscribed, setHasEverSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSubscriptionHistory = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('stripe_customer_id, stripe_subscription_id')
          .eq('id', user.id)
          .single()

        // ⬅️ FIXED: Check BOTH customer_id AND subscription_id
        // If they ever had a subscription, they have a customer_id
        setHasEverSubscribed(!!profile?.stripe_customer_id || !!profile?.stripe_subscription_id)
      } catch (error) {
        console.error('Error checking subscription history:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSubscriptionHistory()
  }, [])

  const buttonText = isLoading 
    ? 'Loading...' 
    : hasEverSubscribed 
      ? 'Subscribe Now' 
      : 'Start Free Trial'

  return (
    <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300 rounded-2xl p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-200 flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 mb-1">
              View-Only Mode
            </h3>
            <p className="text-sm text-gray-700 font-medium">
              Subscribe to unlock full features. Create invoices, manage clients, and get paid faster.
            </p>
          </div>
        </div>
        <Link 
          href="/pricing"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-105 transition-all duration-200 whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4" />
          {buttonText}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}