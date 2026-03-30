'use client'

import { useState } from 'react'
import Link from 'next/link'

const CHECK = (color: string) => (
  <svg className={`w-4 h-4 flex-shrink-0 mt-0.5 ${color}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
)

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 40,
    annualMonthly: 33,
    annualTotal: 400,
    description: 'For freelancers getting started.',
    highlighted: false,
    features: [
      '25 invoices per month',
      'Unlimited clients',
      'Basic AI payment predictions',
      'Invoice email with PDF',
      'Automated follow-up reminders',
      'Expense logging',
      'Client portal (view-only)',
      '3 active contracts',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 80,
    annualMonthly: 67,
    annualTotal: 800,
    description: 'For established freelancers.',
    highlighted: true,
    features: [
      'Everything in Starter, plus:',
      'Unlimited invoices',
      'White label branding',
      'Advanced AI insights',
      'AI expense categorization',
      'Branded client portal',
      'Unlimited contracts + e-signatures',
      'AI contract review',
      'Cash flow dashboard',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    monthlyPrice: 120,
    annualMonthly: 100,
    annualTotal: 1200,
    description: 'For small agencies and studios.',
    highlighted: false,
    features: [
      'Everything in Professional, plus:',
      'Budget tracking & alerts',
      'Multi-party contract signing',
      'Contract version control',
      'Retainer management',
      'AI contract drafting',
      '3 team seats',
      'Dedicated account manager',
    ],
  },
]

export default function LandingPricingSection() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  return (
    <div>
      {/* Toggle */}
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
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`rounded-2xl p-8 relative flex flex-col ${
              plan.highlighted
                ? 'bg-gradient-to-b from-blue-600 to-blue-700 shadow-2xl md:scale-[1.03]'
                : 'bg-white border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-md whitespace-nowrap">
                Most popular
              </div>
            )}

            <h3 className={`text-xl font-black mb-1 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
              {plan.name}
            </h3>
            <p className={`text-sm mb-6 ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}>
              {plan.description}
            </p>

            <div className="mb-1">
              <div className="flex items-end gap-1">
                <span className={`text-5xl font-black ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  ${billing === 'annual' ? plan.annualMonthly : plan.monthlyPrice}
                </span>
                <span className={`mb-1.5 text-sm ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}>
                  /month
                </span>
              </div>
              {billing === 'annual' && (
                <p className={`text-xs font-semibold mt-0.5 ${plan.highlighted ? 'text-teal-200' : 'text-emerald-600'}`}>
                  Billed ${plan.annualTotal}/year
                </p>
              )}
            </div>

            <p className={`text-xs font-semibold mb-8 mt-1 ${plan.highlighted ? 'text-teal-200' : 'text-teal-600'}`}>
              14 days free
            </p>

            <ul className="space-y-3 mb-8 text-sm flex-1">
              {plan.features.map((f, i) => (
                <li key={f} className="flex items-start gap-3">
                  {CHECK(plan.highlighted ? (i === 0 ? 'text-teal-200' : 'text-teal-300') : 'text-teal-500')}
                  <span className={
                    plan.highlighted
                      ? i === 0 ? 'text-white font-bold' : 'text-blue-50'
                      : i === 0 ? 'text-gray-900 font-bold' : 'text-gray-600'
                  }>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href={`/pricing?billing=${billing}`}
              className={`block w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all ${
                plan.highlighted
                  ? 'bg-white text-blue-600 hover:bg-blue-50'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              Start free trial
            </Link>
          </div>
        ))}
      </div>

      <p className="text-center text-gray-400 mt-10 text-sm">
        All plans include a 14-day free trial &nbsp;·&nbsp; No credit card required &nbsp;·&nbsp; Cancel anytime
      </p>
    </div>
  )
}