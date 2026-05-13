'use client'
// src/components/landing-pricing-section.tsx
// Pricing cards with spinning track borders on CTA buttons
// and a cycling gradient on the "Most Popular" badge.

import { useState } from 'react'
import Link from 'next/link'

// The @property + border-rotate keyframe is already injected by landing-page-client.tsx.
// We inject only the button-specific styles here for standalone use (e.g. /pricing page).
const PRICING_STYLES = `
@property --border-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@keyframes border-rotate { to { --border-angle: 360deg; } }
@keyframes grad-cycle {
  0%   { background-position: 0%   50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0%   50%; }
}
.btn-track-default {
  background:
    linear-gradient(rgb(37,99,235), rgb(37,99,235)) padding-box,
    conic-gradient(
      from var(--border-angle),
      rgba(255,255,255,0.9) 0deg,
      rgba(13,212,170,0.9)  80deg,
      rgba(255,255,255,0.9) 130deg,
      rgba(255,255,255,0.1) 170deg,
      rgba(255,255,255,0.1) 350deg,
      rgba(255,255,255,0.9) 360deg
    ) border-box;
  border: 2px solid transparent;
  border-radius: 12px;
  animation: border-rotate 6s linear infinite;
  color: white;
  display: block;
  width: 100%;
  text-align: center;
  padding: 0.75rem;
  font-weight: 700;
  font-size: 0.875rem;
  transition: opacity 0.15s;
}
.btn-track-default:hover { opacity: 0.9; }
.btn-track-highlighted {
  background:
    linear-gradient(white, white) padding-box,
    conic-gradient(
      from var(--border-angle),
      #2563EB  0deg,
      #0D9488  80deg,
      #2563EB  130deg,
      rgba(37,99,235,0.12) 170deg,
      rgba(37,99,235,0.12) 350deg,
      #2563EB  360deg
    ) border-box;
  border: 2px solid transparent;
  border-radius: 12px;
  animation: border-rotate 6s linear infinite;
  color: #2563EB;
  display: block;
  width: 100%;
  text-align: center;
  padding: 0.75rem;
  font-weight: 700;
  font-size: 0.875rem;
  transition: opacity 0.15s;
  box-shadow: 0 4px 14px rgba(0,0,0,0.12);
}
.btn-track-highlighted:hover { opacity: 0.9; }
.most-popular-animated {
  background: linear-gradient(270deg, #F59E0B, #F97316, #EF4444, #F59E0B);
  background-size: 300% 300%;
  animation: grad-cycle 3s ease infinite;
  color: white;
  font-size: 0.65rem;
  font-weight: 900;
  padding: 0.375rem 1rem;
  border-radius: 9999px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  display: inline-block;
}
`

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
      { text: 'Everything in Professional, plus:', soon: false },
      { text: 'Budget tracking & alerts',          soon: false },
      { text: 'Multi-party contract signing',      soon: true  },
      { text: 'Contract version control',          soon: true  },
      { text: '3 team seats',                      soon: true  },
      { text: 'Priority support',                  soon: false },
    ],
  },
]

export default function LandingPricingSection() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  // All 3 plans visible — Business shows Coming Soon badges on unbuilt features
  const visiblePlans = PLANS

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: PRICING_STYLES }} />

      {/* Toggle */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <span className={`text-sm font-bold ${billing === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>
          Monthly
        </span>
        <button
          suppressHydrationWarning
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
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
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
                ? 'bg-blue-600 text-white shadow-xl'
                : 'bg-white border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="most-popular-animated">Most Popular</span>
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
                <p className={`text-xs font-bold mt-1 ${plan.highlighted ? 'text-blue-100' : 'text-blue-600'}`}>
                  ${plan.annualTotal}/year — save ${plan.monthlyPrice * 2}
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature: any, i: number) => {
                const text = typeof feature === 'string' ? feature : feature.text
                const soon = typeof feature === 'object' && feature.soon
                return (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    {CHECK(plan.highlighted ? 'text-blue-200' : 'text-blue-500')}
                    <span className={`flex items-center gap-2 flex-wrap ${plan.highlighted ? 'text-blue-50' : 'text-gray-600'}`}>
                      {text}
                      {soon && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 leading-none flex-shrink-0">
                          Soon
                        </span>
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>

            {/* Spinning track border CTA button */}
            <Link
              href="/signup"
              className={plan.highlighted ? 'btn-track-highlighted' : 'btn-track-default'}
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