'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import CheckoutButton      from '@/components/checkout-button'
import DowngradeConfirmButton from '@/components/billing/downgrade-confirm-button'

type Plan = {
  id: string; name: string
  monthlyPrice: number; annualMonthlyPrice: number; annualTotalPrice: number
  features: string[]
  monthlyPriceId: string; annualPriceId: string
}

interface Props {
  plans: Plan[]; currentTier: string
  hasActiveSubscription: boolean; hasEverSubscribed: boolean
}

export default function BillingPlansSection({ plans, currentTier, hasActiveSubscription, hasEverSubscribed }: Props) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const tiers = ['starter', 'professional', 'business']

  return (
    <div id="available-plans" className="space-y-4">
      {/* Section header + toggle */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Available plans</p>
          <p className="text-sm font-black text-gray-900 mt-0.5">
            {!hasEverSubscribed ? 'Start your 14-day free trial' : 'Switch or upgrade your plan'}
          </p>
        </div>
        {/* Billing period toggle */}
        <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              billing === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >Monthly</button>
          <button
            onClick={() => setBilling('annual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              billing === 'annual' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Annual
            <span className="px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold">−17%</span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map(plan => {
          const isCurrentPlan  = plan.id === currentTier && hasActiveSubscription
          const isProfessional = plan.id === 'professional'
          const isBusiness     = plan.id === 'business'
          const isStarter      = plan.id === 'starter'
          const displayPrice   = billing === 'annual' ? plan.annualMonthlyPrice : plan.monthlyPrice
          const activePriceId  = billing === 'annual' ? plan.annualPriceId      : plan.monthlyPriceId
          const currentIdx     = tiers.indexOf(currentTier)
          const planIdx        = tiers.indexOf(plan.id)
          const isUpgrade      = planIdx > currentIdx
          const isDowngrade    = planIdx < currentIdx

          // Per-plan color identity
          const planTheme = isStarter
            ? { border: 'border-orange-200', glow: '0 0 28px rgba(255,107,53,0.12), 0 2px 12px rgba(0,0,0,0.04)', badge: 'bg-orange-500', check: 'text-orange-400', cta: 'btn-primary',   activeBg: 'bg-orange-50 border-orange-200', activeText: 'text-orange-700' }
            : isProfessional
            ? { border: 'border-blue-200',   glow: '0 0 28px rgba(0,102,255,0.12), 0 2px 12px rgba(0,0,0,0.04)',   badge: 'bg-blue-600',   check: 'text-blue-500',  cta: 'btn-primary',   activeBg: 'bg-blue-50 border-blue-200',   activeText: 'text-blue-700'   }
            : { border: 'border-teal-200',   glow: '0 0 28px rgba(0,212,170,0.12), 0 2px 12px rgba(0,0,0,0.04)',   badge: 'bg-teal-500',   check: 'text-teal-500',  cta: 'btn-secondary', activeBg: 'bg-teal-50 border-teal-200',   activeText: 'text-teal-700'   }

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border p-6 flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                isCurrentPlan ? `${planTheme.border} border-2` : planTheme.border
              }`}
              style={{ boxShadow: planTheme.glow }}
            >
              {/* Badge */}
              {isCurrentPlan && (
                <span className={`absolute top-4 right-4 text-[10px] font-black px-2 py-0.5 rounded-full text-white uppercase tracking-wide ${planTheme.badge}`}>
                  Current
                </span>
              )}
              {!isCurrentPlan && (
                <span className={`absolute top-4 right-4 text-[10px] font-black px-2 py-0.5 rounded-full text-white uppercase tracking-wide ${planTheme.badge}`}>
                  {isStarter ? 'Starter' : isProfessional ? 'Popular' : 'Business'}
                </span>
              )}

              {/* Name + price */}
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-black text-gray-900">${displayPrice}</span>
                  <span className="text-sm text-gray-400 font-medium">/mo</span>
                </div>
                {billing === 'annual' && (
                  <p className="text-xs text-teal-600 font-bold">
                    Billed ${plan.annualTotalPrice}/year
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1 mb-5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${planTheme.check}`} />
                    <span className="text-xs text-gray-700 font-medium leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrentPlan ? (
                <div className={`w-full text-center px-4 py-2.5 rounded-xl text-xs font-bold border ${planTheme.activeBg} ${planTheme.activeText}`}>
                  ✓ Your current plan
                </div>
              ) : hasActiveSubscription ? (
                isUpgrade ? (
                  <CheckoutButton
                    priceId={activePriceId} planId={plan.id}
                    buttonText={`Upgrade to ${plan.name}`}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm ${planTheme.cta}`}
                  />
                ) : (
                  <DowngradeConfirmButton
                    currentTier={currentTier} targetTier={plan.id}
                    buttonText={`Switch to ${plan.name}`}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                  />
                )
              ) : (
                <CheckoutButton
                  priceId={activePriceId} planId={plan.id}
                  buttonText={hasEverSubscribed ? 'Subscribe now' : 'Start free trial'}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm ${planTheme.cta}`}
                />
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-center text-gray-400 font-medium">
        14-day free trial on first signup · Cancel anytime · Prices in USD
      </p>
    </div>
  )
}
