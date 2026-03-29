'use client'

import Link from 'next/link'
import CheckoutButton from '@/components/checkout-button'

type PricingClientWrapperProps = {
  isLoggedIn: boolean
  hasEverSubscribed: boolean
  hasActiveSubscription: boolean
  currentTier: string
  starterPriceId: string
  professionalPriceId: string
  businessPriceId: string
}

export default function PricingClientWrapper({
  isLoggedIn,
  hasEverSubscribed,
  hasActiveSubscription,
  currentTier,
  starterPriceId,
  professionalPriceId,
  businessPriceId,
}: PricingClientWrapperProps) {

  const getButtonText = (planId: string) => {
    if (hasActiveSubscription && currentTier === planId) return 'Current Plan'
    if (hasActiveSubscription) {
      const tiers = ['starter', 'professional', 'business']
      const currentIdx = tiers.indexOf(currentTier)
      const planIdx = tiers.indexOf(planId)
      if (planIdx > currentIdx) return `Upgrade to ${planId.charAt(0).toUpperCase() + planId.slice(1)}`
      return `Downgrade to ${planId.charAt(0).toUpperCase() + planId.slice(1)}`
    }
    if (!isLoggedIn) return 'Start Free Trial'
    return hasEverSubscribed ? 'Subscribe Now' : 'Start Free Trial'
  }

  const trialText = !isLoggedIn || !hasEverSubscribed ? 'First 14 days free' : 'Subscribe today'
  const footerText = !isLoggedIn || !hasEverSubscribed
    ? 'All plans include 14-day free trial · No credit card required · Cancel anytime'
    : 'Flexible billing · Cancel anytime · Instant access'

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 40,
      description: 'Perfect for new freelancers',
      priceId: starterPriceId,
      highlighted: false,
      features: [
        '25 invoices per month',
        'Unlimited clients',
        'Basic AI payment predictions',
        'Email invoicing with PDF',
        'Dashboard analytics',
        'Expense tracking',
        'Invonaut branding on invoices',
      ],
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 80,
      description: 'For established freelancers',
      priceId: professionalPriceId,
      highlighted: true,
      features: [
        'Everything in Starter, plus:',
        'Unlimited invoices',
        'White label branding (logo & colors)',
        'Advanced AI insights',
        'AI contract review',
        'AI expense categorization',
        'Branded client portal',
        'Unlimited contracts + e-signatures',
        'Priority email support',
      ],
    },
    {
      id: 'business',
      name: 'Business',
      price: 120,
      description: 'For small agencies and studios',
      priceId: businessPriceId,
      highlighted: false,
      features: [
        'Everything in Professional, plus:',
        'Budget tracking & alerts by category',
        'Multi-party contract signing',
        'Contract version control',
        'Retainer management',
        'AI contract drafting',
        '3 team seats',
        'Dedicated account manager',
        'Custom onboarding session',
      ],
    },
  ]

  const CHECK = (
    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">
            {isLoggedIn && hasEverSubscribed
              ? 'Select a plan to reactivate your subscription'
              : 'Start with a 14-day free trial. No credit card required.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map(plan => {
            const isCurrent = hasActiveSubscription && currentTier === plan.id
            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-8 border-2 flex flex-col transition-all relative ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500 shadow-2xl md:scale-105'
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg shadow-md'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-lg uppercase tracking-wide">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className={`text-2xl font-black mb-1 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm font-medium ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>
                </div>
                <div className="mb-2">
                  <span className={`text-5xl font-black ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    ${plan.price}
                  </span>
                  <span className={`font-medium ${plan.highlighted ? 'text-blue-100' : 'text-gray-600'}`}>/month</span>
                </div>
                <p className={`text-sm font-semibold mb-8 ${plan.highlighted ? 'text-teal-200' : 'text-green-700'}`}>
                  {trialText}
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className={plan.highlighted ? 'text-teal-300' : 'text-teal-600'}>{CHECK}</span>
                      <span className={`text-sm ${
                        plan.highlighted
                          ? i === 0 ? 'text-white font-bold' : 'text-white font-medium'
                          : i === 0 ? 'text-gray-900 font-bold' : 'text-gray-700 font-medium'
                      }`}>{feature}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <button disabled className="block w-full bg-gray-300 text-gray-600 text-center py-4 rounded-xl font-bold text-base cursor-not-allowed">
                    Current Plan
                  </button>
                ) : (
                  <CheckoutButton
                    priceId={plan.priceId}
                    planId={plan.id}
                    buttonText={getButtonText(plan.id)}
                    disabled={!plan.priceId}
                    className={`block w-full text-center py-4 rounded-xl font-bold text-base transition-all hover:shadow-xl ${
                      plan.highlighted ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        <p className="text-center text-gray-600 mt-12 text-sm font-medium">{footerText}</p>
        {isLoggedIn && (
          <div className="text-center mt-6">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
              ← Back to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}