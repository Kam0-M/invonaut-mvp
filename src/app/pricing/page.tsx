import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Check, ArrowLeft } from 'lucide-react'
import CancellationBanner from '@/components/pricing/cancellation-banner'
import DowngradeConfirmButton from '@/components/billing/downgrade-confirm-button'

export default async function PricingPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get user's current tier if logged in
  let currentTier = 'starter'
  let hasActiveSubscription = false
  
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier, stripe_subscription_id, subscription_status')
      .eq('id', user.id)
      .single()
    
    currentTier = profile?.subscription_tier || 'starter'
    // ⬇️ KEY FIX: Only true if subscription is active OR trialing
    hasActiveSubscription = !!profile?.stripe_subscription_id && 
      (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')
  }

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 30,
      description: 'Perfect for freelancers just getting started',
      features: [
        '25 invoices per month',
        'Unlimited clients',
        'Basic AI payment predictions',
        'Email invoicing with PDF',
        'Dashboard analytics',
        'Invonaut branding',
      ],
      cta: 'Start 14-Day Free Trial',
      highlighted: false,
      priceId: process.env.STRIPE_PRICE_ID_STARTER,
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 60,
      description: 'For established freelancers who want more',
      features: [
        'Unlimited invoices',
        'Unlimited clients',
        'Advanced AI predictions with confidence scoring',
        'White label branding (custom logo & colors)',
        'Priority email support',
        'Remove Invonaut branding',
      ],
      cta: 'Start 14-Day Free Trial',
      highlighted: true,
      priceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user && (
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Billing
          </Link>
        )}

        {/* Cancellation Success Banner */}
        <CancellationBanner />

        {/* Pricing Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Choose the plan that fits your needs. All plans include a 14-day free trial.
          </p>
          {/* Trial Badge */}
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-full font-bold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            14-Day Free Trial • No Credit Card Until Trial Ends
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            // ⬇️ KEY FIX: Check BOTH currentTier AND hasActiveSubscription
            const isCurrentPlan = user && plan.id === currentTier && hasActiveSubscription
            const isUpgrade = user && hasActiveSubscription && currentTier === 'starter' && plan.id === 'professional'
            const isDowngrade = user && hasActiveSubscription && currentTier === 'professional' && plan.id === 'starter'

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-8 transition-all ${
                  plan.highlighted
                    ? 'border-blue-500 bg-blue-50 shadow-2xl scale-105'
                    : isCurrentPlan
                    ? 'border-green-500 bg-green-50 shadow-lg'
                    : 'border-gray-200 bg-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                      CURRENT PLAN
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-black text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600 font-medium">/month</span>
                  </div>
                  {/* Trial Info */}
                  <p className="text-sm text-green-700 font-semibold mt-2">
                    First 14 days free
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm font-medium">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* ⬇️ FIXED BUTTON LOGIC */}
                {user ? (
                  <>
                    {isCurrentPlan ? (
                      // ⬇️ Only show "Current Plan" if BOTH tier matches AND subscription is active
                      <button
                        disabled
                        className="w-full bg-gray-300 text-gray-600 px-6 py-3 rounded-xl font-bold cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                    ) : hasActiveSubscription ? (
                      // Has active subscription - show upgrade/downgrade
                      <>
                        {isUpgrade ? (
                          <form action="/api/create-checkout-session" method="POST">
                            <input type="hidden" name="priceId" value={plan.priceId} />
                            <input type="hidden" name="planId" value={plan.id} />
                            <button
                              type="submit"
                              className={`w-full px-6 py-3 rounded-xl font-bold transition-all ${
                                plan.highlighted
                                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-xl hover:scale-105'
                                  : 'bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:shadow-xl hover:scale-105'
                              }`}
                            >
                              Upgrade to {plan.name}
                            </button>
                          </form>
                        ) : isDowngrade ? (
                          <DowngradeConfirmButton 
                            currentTier={currentTier}
                            targetTier="starter"
                            buttonText="Switch to Starter"
                            className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all"
                          />
                        ) : null}
                      </>
                    ) : (
                      // ⬇️ No active subscription - show trial button for ALL plans
                      <form action="/api/create-checkout-session" method="POST">
                        <input type="hidden" name="priceId" value={plan.priceId} />
                        <input type="hidden" name="planId" value={plan.id} />
                        <button
                          type="submit"
                          className={`w-full px-6 py-3 rounded-xl font-bold transition-all ${
                            plan.highlighted
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-xl hover:scale-105'
                              : 'bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:shadow-xl hover:scale-105'
                          }`}
                        >
                          {plan.cta}
                        </button>
                      </form>
                    )}
                  </>
                ) : (
                  // Not logged in - redirect to signup
                  <Link
                    href="/signup"
                    className={`block w-full text-center px-6 py-3 rounded-xl font-bold transition-all ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-xl hover:scale-105'
                        : 'bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:shadow-xl hover:scale-105'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            )
          })}
        </div>

        {/* FAQ / Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4 font-semibold text-lg">
            🎁 14-day free trial on all plans • Cancel anytime during trial with no charge
          </p>
          <p className="text-gray-600 mb-4">
            After your trial, you'll be charged the plan rate • Upgrade or cancel anytime
          </p>
          <p className="text-sm text-gray-500">
            Questions? Email us at{' '}
            <a href="mailto:support@invonaut.com" className="text-blue-600 hover:underline">
              support@invonaut.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}