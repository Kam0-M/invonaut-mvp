'use client'

import { useState } from 'react'
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
  starterAnnualPriceId: string
  professionalAnnualPriceId: string
  businessAnnualPriceId: string
  initialBilling?: 'monthly' | 'annual'
}

export default function PricingClientWrapper({
  isLoggedIn,
  hasEverSubscribed,
  hasActiveSubscription,
  currentTier,
  starterPriceId,
  professionalPriceId,
  businessPriceId,
  starterAnnualPriceId,
  professionalAnnualPriceId,
  businessAnnualPriceId,
  initialBilling = 'monthly',
}: PricingClientWrapperProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>(initialBilling)

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

  const getTrialText = (planId: string) => {
    if (hasActiveSubscription && currentTier === planId) return '✓ Your current plan'
    if (!isLoggedIn || !hasEverSubscribed) return 'First 14 days free'
    return 'Subscribe today'
  }
  const footerText = !isLoggedIn || !hasEverSubscribed
    ? 'All plans include 14-day free trial · No credit card required · Cancel anytime'
    : 'Flexible billing · Cancel anytime · Instant access'

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      monthlyPrice: 49,
      annualMonthlyPrice: 41,
      annualTotalPrice: 490,
      description: 'Perfect for new freelancers',
      monthlyPriceId: starterPriceId,
      annualPriceId: starterAnnualPriceId,
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
      monthlyPrice: 99,
      annualMonthlyPrice: 83,
      annualTotalPrice: 990,
      description: 'For established freelancers',
      monthlyPriceId: professionalPriceId,
      annualPriceId: professionalAnnualPriceId,
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
      name: 'Business', // hidden pre-launch
      monthlyPrice: 149,
      annualMonthlyPrice: 124,
      annualTotalPrice: 1490,
      description: 'For small agencies and studios',
      monthlyPriceId: businessPriceId,
      annualPriceId: businessAnnualPriceId,
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

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">
            {isLoggedIn && hasEverSubscribed
              ? 'Select a plan to reactivate your subscription'
              : 'Start with a 14-day free trial. No credit card required.'}
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm font-bold ${billing === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
              billing === 'annual' ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            aria-label="Toggle billing period"
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              billing === 'annual' ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${billing === 'annual' ? 'text-gray-900' : 'text-gray-400'}`}>
              Annual
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
              Save 2 months
            </span>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map(plan => {
            const isCurrent = hasActiveSubscription && currentTier === plan.id
            const activePriceId = billing === 'annual' ? plan.annualPriceId : plan.monthlyPriceId

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

                {/* Price display */}
                <div className="mb-1">
                  <div className="flex items-end gap-1">
                    <span className={`text-5xl font-black ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                      ${billing === 'annual' ? plan.annualMonthlyPrice : plan.monthlyPrice}
                    </span>
                    <span className={`font-medium mb-1.5 ${plan.highlighted ? 'text-blue-100' : 'text-gray-600'}`}>
                      /month
                    </span>
                  </div>
                  {billing === 'annual' && (
                    <p className={`text-xs font-semibold mt-0.5 ${plan.highlighted ? 'text-teal-200' : 'text-emerald-600'}`}>
                      Billed ${plan.annualTotalPrice}/year
                    </p>
                  )}
                </div>

                <p className={`text-sm font-semibold mb-8 ${
                  hasActiveSubscription && currentTier === plan.id
                    ? plan.highlighted ? 'text-teal-200' : 'text-blue-600'
                    : plan.highlighted ? 'text-teal-200' : 'text-green-700'
                }`}>
                  {getTrialText(plan.id)}
                </p>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className={plan.highlighted ? 'text-teal-300' : 'text-teal-600'}>{CHECK}</span>
                      <span className={`text-sm ${
                        plan.highlighted
                          ? i === 0 ? 'text-white font-bold' : 'text-white font-medium'
                          : i === 0 ? 'text-gray-900 font-bold' : 'text-gray-700 font-medium'
                      }`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button
                    disabled
                    className="block w-full bg-gray-300 text-gray-600 text-center py-4 rounded-xl font-bold text-base cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : (
                  <CheckoutButton
                    priceId={activePriceId}
                    planId={plan.id}
                    buttonText={getButtonText(plan.id)}
                    disabled={!activePriceId}
                    className={`block w-full text-center py-4 rounded-xl font-bold text-base transition-all hover:shadow-xl ${
                      plan.highlighted
                        ? 'bg-white text-blue-600 hover:bg-blue-50'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        <p className="text-center text-gray-600 mt-12 text-sm font-medium">{footerText}</p>

        <div className="text-center mt-6">
          <Link
            href={isLoggedIn ? '/dashboard' : '/'}
            className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
          >
            {isLoggedIn ? '← Back to Dashboard' : '← Back to Home'}
          </Link>
        </div>
      </div>
    </div>
  )
}