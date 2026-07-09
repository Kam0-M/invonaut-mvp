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
  initialBilling = 'annual',
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

  // Accent colours follow the tier mapping already established elsewhere in
  // the app (orange=Starter, blue=Professional, teal=Business). The
  // highlighted card's accent is a lighter blue tint (#60A5FA) for contrast
  // against its dark background — same adjustment the homepage's
  // LandingPricingSection already makes for the same reason.
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      accent: 'var(--orange)',
      monthlyPrice: 29,
      annualMonthlyPrice: 24,
      annualTotalPrice: 290,
      description: 'Everything you need to get started',
      monthlyPriceId: starterPriceId,
      annualPriceId: starterAnnualPriceId,
      highlighted: false,
      features: [
        '25 invoices per month',
        'Unlimited clients',
        'Direct payment logging (cash, POS, mobile)',
        'Revenue categories',
        'Basic AI payment predictions',
        'Invoice email + PDF attachments',
        'Automated follow-up reminders',
        'Expense tracking',
        '3 active contracts',
        'Time tracking + invoice from hours',
        'Client portal (view-only)',
      ],
    },
    {
      id: 'professional',
      name: 'Professional',
      accent: '#60A5FA',
      monthlyPrice: 59,
      annualMonthlyPrice: 49,
      annualTotalPrice: 590,
      description: 'For growing businesses that need more',
      monthlyPriceId: professionalPriceId,
      annualPriceId: professionalAnnualPriceId,
      highlighted: true,
      features: [
        'Everything in Starter, plus:',
        'Unlimited invoices + direct payments',
        'White-label branding (logo & colours)',
        'Branded client portal + file storage',
        'Cash flow forecast (90-day)',
        'Revenue intelligence dashboard',
        'Advanced AI predictions',
        'AI contract review',
        'AI expense categorisation',
        'Unlimited contracts + e-signatures',
        'Weekly time summary emails',
      ],
    },
    {
      id: 'business',
      name: 'Business',
      accent: 'var(--teal)',
      monthlyPrice: 109,
      annualMonthlyPrice: 91,
      annualTotalPrice: 1090,
      description: 'For businesses that want the full stack',
      monthlyPriceId: businessPriceId,
      annualPriceId: businessAnnualPriceId,
      highlighted: false,
      features: [
        'Everything in Professional, plus:',
        'Budget tracking & per-category limits',
        '80% & 100% overspend alerts (auto)',
        'Priority email support (24hr response)',
        'Early access to new features',
        'Multi-party contract signing (soon)',
        'Contract version control (soon)',
        '3 team seats (soon)',
      ],
    },
  ]

  // Matches the checkmark path already used in LandingPricingSection —
  // same icon on both pricing surfaces instead of two different treatments.
  const CHECK = (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style={{ flexShrink: 0, marginTop: 3 }}>
      <path fillRule="evenodd" d="M11.78 3.97a.75.75 0 0 1 0 1.06l-5.5 5.5a.75.75 0 0 1-1.06 0l-2.5-2.5a.75.75 0 1 1 1.06-1.06L5.75 8.94l4.97-4.97a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
    </svg>
  )

  return (
    <div>
      {/* Billing toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 48 }}>
        <span style={{ fontSize: '.875rem', fontWeight: 700, color: billing === 'monthly' ? 'var(--ink)' : 'var(--faint)' }}>
          Monthly
        </span>
        <button
          onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
          style={{ position: 'relative', width: 44, height: 24, background: billing === 'annual' ? 'var(--blue)' : 'var(--rule)', borderRadius: 999, border: 'none', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}
          aria-label="Toggle billing period"
        >
          <span style={{ position: 'absolute', top: 4, width: 16, height: 16, background: '#fff', borderRadius: '50%', left: billing === 'annual' ? 24 : 4, transition: 'left .2s' }} />
        </button>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '.875rem', fontWeight: 700, color: billing === 'annual' ? 'var(--ink)' : 'var(--faint)' }}>
          Annual
          <span style={{ background: 'rgba(0,196,160,0.12)', color: 'var(--teal)', fontSize: '.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
            Save 2 months
          </span>
        </span>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map(plan => {
          const isCurrent = hasActiveSubscription && currentTier === plan.id
          const activePriceId = billing === 'annual' ? plan.annualPriceId : plan.monthlyPriceId
          const hl = plan.highlighted
          const fg = hl ? '#fff' : 'var(--ink)'
          const sub = hl ? 'rgba(255,255,255,0.5)' : 'var(--mid)'

          return (
            <div
              key={plan.id}
              className="transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: hl ? 'var(--ink)' : '#fff',
                border: `1px solid ${hl ? 'var(--ink)' : 'var(--rule)'}`,
                borderRadius: 16,
                padding: '36px 32px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: hl ? '0 24px 64px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              {hl && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'var(--blue)', color: '#fff', fontSize: '.65rem', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', padding: '5px 16px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                  Most Popular
                </div>
              )}

              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: fg, marginBottom: 4, letterSpacing: '-.01em' }}>
                  {plan.name}
                </h3>
                <p style={{ fontSize: '.825rem', color: sub, fontWeight: 500 }}>
                  {plan.description}
                </p>
              </div>

              <div style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                  <span className="f-mono" style={{ fontSize: '2.75rem', fontWeight: 700, color: fg, letterSpacing: '-.03em', lineHeight: 1 }}>
                    ${billing === 'annual' ? plan.annualMonthlyPrice : plan.monthlyPrice}
                  </span>
                  <span style={{ fontWeight: 500, marginBottom: 6, color: sub, fontSize: '.85rem' }}>
                    /month
                  </span>
                </div>
                {billing === 'annual' && (
                  <p className="f-mono" style={{ fontSize: '.72rem', fontWeight: 600, marginTop: 6, color: hl ? '#7DD3C0' : 'var(--teal)' }}>
                    Billed ${plan.annualTotalPrice}/year
                  </p>
                )}
              </div>

              <p style={{ fontSize: '.8rem', fontWeight: 600, marginTop: 8, marginBottom: 28, color: isCurrent ? (hl ? '#7DD3C0' : 'var(--blue)') : (hl ? 'rgba(255,255,255,0.55)' : 'var(--teal)') }}>
                {getTrialText(plan.id)}
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {plan.features.map((feature, i) => (
                  <li key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ color: plan.accent, flexShrink: 0 }}>{CHECK}</span>
                    <span style={{
                      fontSize: '.82rem',
                      lineHeight: 1.5,
                      color: hl ? (i === 0 ? '#fff' : 'rgba(255,255,255,0.75)') : (i === 0 ? 'var(--ink)' : 'var(--mid)'),
                      fontWeight: i === 0 ? 700 : 500,
                    }}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button
                  disabled
                  style={{ width: '100%', padding: '14px 0', borderRadius: 10, fontWeight: 700, fontSize: '.9rem', background: 'var(--rule)', color: 'var(--mid)', border: 'none', cursor: 'not-allowed', textAlign: 'center' }}
                >
                  Current Plan
                </button>
              ) : (
                <CheckoutButton
                  priceId={activePriceId}
                  planId={plan.id}
                  buttonText={getButtonText(plan.id)}
                  disabled={!activePriceId}
                  className="w-full py-3.5 px-6 text-[.9rem]"
                />
              )}
            </div>
          )
        })}
      </div>

      <p style={{ textAlign: 'center', color: 'var(--mid)', marginTop: 48, fontSize: '.85rem', fontWeight: 500 }}>
        {footerText}
      </p>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link href={isLoggedIn ? '/dashboard' : '/'} style={{ color: 'var(--blue)', fontWeight: 600, fontSize: '.85rem', textDecoration: 'none' }}>
          {isLoggedIn ? '← Back to Dashboard' : '← Back to Home'}
        </Link>
      </div>
    </div>
  )
}
