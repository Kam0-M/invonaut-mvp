'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Custom hook to check user subscription status
 * Returns loading state and subscription status
 * 
 * @returns {Object} { isLoading: boolean, hasActiveSubscription: boolean }
 */
export function useSubscriptionStatus() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/login')
          return
        }

        // Check subscription status
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('stripe_subscription_id, subscription_status')
          .eq('id', user.id)
          .single()

        // Active subscription = has subscription ID AND (status is 'active' OR 'trialing')
        const isSubscribed = !!profile?.stripe_subscription_id && 
          (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')
        
        setHasActiveSubscription(isSubscribed)
      } catch (err) {
        console.error('Error checking subscription:', err)
        // Default to no subscription on error
        setHasActiveSubscription(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkSubscription()
  }, [router])

  return { isLoading, hasActiveSubscription }
}