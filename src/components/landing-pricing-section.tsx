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
    monthlyPrice: 49,
    annualMonthly: 41,
    annualTotal: 490,
    description: 'For freelancers getting started.',
    highlighted: false,
    features: [
      '25 invoices per month',
      'Unlimited clients',
      'Direct payment logging (cash, POS, mobile)',
      'Revenue categories',
      'Basic AI payment predictions',
      'Invoice email with PDF + attachments',
      'Automated follow-up reminders',
      'Expense logging',
      'Client portal (view-only)',
      '3 active contracts',
      'Time tracking + invoice from hours',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 99,
    annualMonthly: 83,
    annualTotal: 990,
    description: 'For established freelancers.',
    highlighted: true,
    features: [
      'Everything in Starter, plus:',
      'Unlimited invoices',
      'Unlimited direct payments',
      'Revenue intelligence dashboard',
      'White label branding',
      'Advanced AI insights',
      'AI expense categorization',
      'Branded client portal',
      'Unlimited contracts + e-signatures',
      'AI contract review',
      'Cash flow forecast (90-day)',
      'Weekly time summary emails',
      'Client file storage',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    monthlyPrice: 149,
    annualMonthly: 124,
    annualTotal: 1490,
    description: 'For small agencies and studios.',
    highlighted: false,
    features: [
      'Everything in Professional, plus:',
      'Budget tracking & alerts',
      'Multi-party contract signing',
      'Contract version control',
      '3 team seats',
      'Priority support',
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
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            billing === 'annual' ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            billing === 'annual' ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
        <span className={`text-sm font-bold ${billing === 'annual' ? 'text-gray-900' : 'text-gray-400'}`}>
          Annual
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
            2 months free
          </span>
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`relative rounded-2xl p-8 flex flex-col ${
              plan.highlighted
                ? 'bg-blue-600 text-white shadow-2xl scale-105'
                : 'bg-white border-2 border-gray-100 shadow-lg'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wide">
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className={`text-xl font-black mb-1 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                {plan.name}
              </h3>
              <p className={`text-sm ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}>
                {plan.description}
              </p>
            </div>

            <div className="mb-8">
              <div className="flex items-end gap-1">
                <span className={`text-5xl font-black tracking-tight ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  ${billing === 'monthly' ? plan.monthlyPrice : plan.annualMonthly}
                </span>
                <span className={`text-sm font-medium mb-2 ${plan.highlighted ? 'text-blue-100' : 'text-gray-400'}`}>
                  /mo
                </span>
              </div>
              {billing === 'annual' && (
                <p className={`text-xs font-bold mt-1 ${plan.highlighted ? 'text-blue-100' : 'text-green-600'}`}>
                  ${plan.annualTotal}/year — save ${plan.monthlyPrice * 2}
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  {CHECK(plan.highlighted ? 'text-blue-200' : 'text-blue-500')}
                  <span className={plan.highlighted ? 'text-blue-50' : 'text-gray-600'}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className={`w-full text-center py-3 rounded-xl font-bold text-sm transition-all ${
                plan.highlighted
                  ? 'bg-white text-blue-600 hover:bg-blue-50 shadow-lg'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
              }`}
            >
              Start free trial
            </Link>
            <p className={`text-xs text-center mt-3 ${plan.highlighted ? 'text-blue-100' : 'text-gray-400'}`}>
              14-day free trial · No credit card required
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
