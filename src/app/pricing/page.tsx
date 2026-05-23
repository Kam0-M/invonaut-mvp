import { createClient } from '@/lib/supabase/server'
import PricingClientWrapper from '@/components/pricing/pricing-client-wrapper'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>
}) {
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

  const { billing: billingParam } = await searchParams
  const initialBilling = billingParam === 'annual' ? 'annual' : 'monthly'

  const starterPriceId             = process.env.STRIPE_PRICE_ID_STARTER || ''
  const professionalPriceId        = process.env.STRIPE_PRICE_ID_PROFESSIONAL || ''
  const businessPriceId            = process.env.STRIPE_PRICE_ID_BUSINESS || ''
  const starterAnnualPriceId       = process.env.STRIPE_PRICE_ID_STARTER_ANNUAL || ''
  const professionalAnnualPriceId  = process.env.STRIPE_PRICE_ID_PROFESSIONAL_ANNUAL || ''
  const businessAnnualPriceId      = process.env.STRIPE_PRICE_ID_BUSINESS_ANNUAL || ''

  return (
    <div className="min-h-screen bg-white antialiased">

      {/* Minimal nav matching landing page */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-2.5">
              <img src="/invonaut-logo.png" alt="Invonaut" className="w-7 h-7 rounded-full" />
              <span className="text-lg font-black tracking-tight text-gray-900">Invonaut</span>
            </Link>
            <Link
              href={isLoggedIn ? '/dashboard' : '/'}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {isLoggedIn ? 'Back to Dashboard' : 'Back'}
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="relative overflow-hidden pt-16 pb-10 px-4 text-center"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(219,234,254,0.7) 0%, transparent 70%)' }}>
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: 'radial-gradient(circle, #2563EB 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div className="relative z-10">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Pricing</p>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Simple, transparent pricing.
          </h1>
          <p className="text-gray-500 font-medium max-w-lg mx-auto">
            Start with a 14-day free trial on any plan. No credit card required. Cancel anytime.
          </p>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <PricingClientWrapper
          isLoggedIn={isLoggedIn}
          hasEverSubscribed={hasEverSubscribed}
          hasActiveSubscription={hasActiveSubscription}
          currentTier={currentTier}
          starterPriceId={starterPriceId}
          professionalPriceId={professionalPriceId}
          businessPriceId={businessPriceId}
          starterAnnualPriceId={starterAnnualPriceId}
          professionalAnnualPriceId={professionalAnnualPriceId}
          businessAnnualPriceId={businessAnnualPriceId}
          initialBilling={initialBilling}
        />

        {/* FAQ / trust strip */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { label: '14-day free trial',    body: 'Full access on any plan. No credit card needed to start.' },
            { label: 'Cancel anytime',       body: 'No contracts. No cancellation fees. Cancel in two clicks.' },
            { label: 'Switch plans freely',  body: 'Upgrade or downgrade at any time. Changes take effect immediately.' },
          ].map(item => (
            <div key={item.label} className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-sm font-black text-gray-900 mb-1">{item.label}</p>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Affiliate strip */}
      <div className="border-t border-gray-100 py-8 px-4">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="text-sm font-black text-gray-900">Know freelancers or small business owners?</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Refer them to Invonaut and earn 30% recurring commission — every month they stay subscribed.</p>
          </div>
          <Link href="/affiliate" className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-black rounded-xl transition-all hover:-translate-y-0.5 text-sm whitespace-nowrap">
            Earn with affiliate →
          </Link>
        </div>
      </div>

      {/* Footer strip */}
      <div className="border-t border-gray-100 py-6 px-4 text-center">
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} Invonaut · From Contract to Cash. Automated.</p>
      </div>

    </div>
  )
}