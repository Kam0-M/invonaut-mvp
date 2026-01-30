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
  
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()
    
    currentTier = profile?.subscription_tier || 'starter'
  }

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      description: 'Perfect for freelancers just getting started',
      features: [
        '25 invoices per month',
        'Unlimited clients',
        'Basic AI payment predictions',
        'Email invoicing with PDF',
        'Dashboard analytics',
        'Flowance branding',
      ],
      cta: 'Get Started',
      highlighted: false,
      priceId: process.env.STRIPE_PRICE_ID_STARTER,
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 59,
      description: 'For established freelancers who want more',
      features: [
        'Unlimited invoices',
        'Unlimited clients',
        'Advanced AI predictions with confidence scoring',
        'White label branding (custom logo & colors)',
        'Priority email support',
        'Remove Flowance branding',
      ],
      cta: 'Upgrade Now',
      highlighted: true,
      priceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL,
    },
    {
      id: 'business',
      name: 'Business',
      price: 79,
      description: 'For teams and growing agencies',
      features: [
        'Everything in Professional',
        'Multi-user access (coming soon)',
        'Team collaboration (coming soon)',
        'API access (coming soon)',
        'Dedicated support (coming soon)',
        'Custom integrations (coming soon)',
      ],
      cta: 'Upgrade Now',
      highlighted: false,
      priceId: process.env.STRIPE_PRICE_ID_BUSINESS,
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

        {/* Cancellation Success Banner - Client Component */}
        <CancellationBanner />

        {/* Pricing Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = user && plan.id === currentTier
            const isUpgrade = user && (
              (currentTier === 'starter' && plan.id !== 'starter') ||
              (currentTier === 'professional' && plan.id === 'business')
            )
            const isDowngrade = user && (
              (currentTier === 'professional' && plan.id === 'starter') ||
              (currentTier === 'business' && (plan.id === 'starter' || plan.id === 'professional'))
            )

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

                {user ? (
                  <>
                    {isCurrentPlan ? (
                      <button
                        disabled
                        className="w-full bg-gray-300 text-gray-600 px-6 py-3 rounded-xl font-bold cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                    ) : isUpgrade ? (
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
                      plan.id === 'starter' ? (
                        <DowngradeConfirmButton 
                          currentTier={currentTier}
                          buttonText="Switch to Starter"
                          className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all"
                        />
                      ) : (
                        <form action="/api/change-plan" method="POST">
                          <input type="hidden" name="planId" value={plan.id} />
                          <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all"
                          >
                            Switch to {plan.name}
                          </button>
                        </form>
                      )
                    ) : null}
                  </>
                ) : (
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
          <p className="text-gray-600 mb-4">
            All plans include 14-day money-back guarantee • Cancel anytime
          </p>
          <p className="text-sm text-gray-500">
            Questions? Email us at{' '}
            <a href="mailto:support@flowance.com" className="text-blue-600 hover:underline">
              support@flowance.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}