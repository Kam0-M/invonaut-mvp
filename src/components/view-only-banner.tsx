'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ViewOnlyBanner() {
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
    <div className="bg-white border border-orange-200 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
          <Lock className="w-4 h-4 text-orange-500" />
        </div>
        <div>
          <p className="text-sm font-black text-gray-900">View-only mode</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Subscribe to create invoices, manage clients, and get paid faster.
          </p>
        </div>
      </div>
      {!isLoading && (
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-primary text-sm flex-shrink-0"
        >
          {hasEverSubscribed ? 'Resubscribe' : 'Start free trial'}
        </Link>
      )}
    </div>
  )
}
