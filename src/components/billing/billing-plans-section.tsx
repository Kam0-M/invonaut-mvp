'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import CheckoutButton from '@/components/checkout-button'
import DowngradeConfirmButton from '@/components/billing/downgrade-confirm-button'

type Plan = {
  id: string
  name: string
  monthlyPrice: number
  annualMonthlyPrice: number
  annualTotalPrice: number
  features: string[]
  monthlyPriceId: string
  annualPriceId: string
}

interface BillingPlansSectionProps {
  plans: Plan[]
  currentTier: string
  hasActiveSubscription: boolean
  hasEverSubscribed: boolean
}

export default function BillingPlansSection({
  plans,
  currentTier,
  hasActiveSubscription,
  hasEverSubscribed,
}: BillingPlansSectionProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  return (
    <div id="available-plans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-black text-gray-900">
          {!hasEverSubscribed ? 'Choose Your Plan' : 'Available Plans'}
        </h2>

        {/* Billing toggle */}
        <div className="flex items-center gap-3">
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
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
              Save 2 months
            </span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const isCurrentPlan = plan.id === currentTier && hasActiveSubscription
          const activePriceId = billing === 'annual' ? plan.annualPriceId : plan.monthlyPriceId
          const displayPrice = billing === 'annual' ? plan.annualMonthlyPrice : plan.monthlyPrice

          return (
            <div
              key={plan.id}
              className={`rounded-2xl border-2 p-6 transition-all flex flex-col ${
                isCurrentPlan
                  ? 'border-blue-500 bg-blue-50'
                  : plan.id === 'professional'
                  ? 'border-blue-300 bg-white hover:border-blue-400 hover:shadow-xl'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
              }`}
            >
              {isCurrentPlan && (
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                    Current Plan
                  </span>
                </div>
              )}
              {!isCurrentPlan && plan.id === 'professional' && (
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                    Most Popular
                  </span>
                </div>
              )}

              <h3 className="text-xl font-black text-gray-900 mb-2">{plan.name}</h3>

              <div className="mb-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-gray-900">${displayPrice}</span>
                  <span className="text-gray-600 font-medium">/mo</span>
                </div>
                {billing === 'annual' && (
                  <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                    Billed ${plan.annualTotalPrice}/year
                  </p>
                )}
              </div>

              <ul className="space-y-2 my-5 flex-1">
                {plan.features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <button
                  disabled
                  className="w-full bg-gray-300 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : hasActiveSubscription ? (
                <>
                  {(() => {
                    const tiers = ['starter', 'professional', 'business']
                    const currentIdx = tiers.indexOf(currentTier)
                    const planIdx = tiers.indexOf(plan.id)
                    if (planIdx > currentIdx) {
                      return (
                        <CheckoutButton
                          priceId={activePriceId}
                          planId={plan.id}
                          buttonText={`Upgrade to ${plan.name}`}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm hover:shadow-xl transition-all hover:scale-105"
                        />
                      )
                    } else {
                      return (
                        <DowngradeConfirmButton
                          currentTier={currentTier}
                          targetTier={plan.id}
                          buttonText={`Switch to ${plan.name}`}
                          className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-2 rounded-xl font-bold text-sm hover:shadow-xl transition-all hover:scale-105"
                        />
                      )
                    }
                  })()}
                </>
              ) : (
                <CheckoutButton
                  priceId={activePriceId}
                  planId={plan.id}
                  buttonText={hasEverSubscribed ? 'Subscribe Now' : 'Start 14-Day Free Trial'}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm hover:shadow-xl transition-all hover:scale-105"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}