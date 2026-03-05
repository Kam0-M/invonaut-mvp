import { createClient } from '@/lib/supabase/server'
import PricingClientWrapper from '@/components/pricing/pricing-client-wrapper'

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let hasEverSubscribed = false
  let isLoggedIn = false
  let hasActiveSubscription = false
  let currentTier = 'starter'

  if (user) {
    isLoggedIn = true
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, stripe_subscription_id, subscription_status, subscription_tier')
      .eq('id', user.id)
      .single()

    hasEverSubscribed = !!profile?.stripe_customer_id || !!profile?.stripe_subscription_id
    hasActiveSubscription = !!profile?.stripe_subscription_id && 
      (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')
    currentTier = profile?.subscription_tier || 'starter'
  }

  const starterPriceId = process.env.STRIPE_PRICE_ID_STARTER || ''
  const professionalPriceId = process.env.STRIPE_PRICE_ID_PROFESSIONAL || ''

  return (
    <PricingClientWrapper
      isLoggedIn={isLoggedIn}
      hasEverSubscribed={hasEverSubscribed}
      hasActiveSubscription={hasActiveSubscription}
      currentTier={currentTier}
      starterPriceId={starterPriceId}
      professionalPriceId={professionalPriceId}
    />
  )
}