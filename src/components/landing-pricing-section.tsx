'use client'
// src/components/landing-pricing-section.tsx
// Rebuilt v2 — editorial clean design, no spinning borders, no gradient animations
// Matches landing page v4 aesthetic

import { useState } from 'react'
import Link from 'next/link'

const plans = [
  {
    id:           'starter',
    name:         'Starter',
    monthlyPrice: 29,
    annualMonthly: 24,
    annualTotal:  290,
    accent:       '#F59E0B',
    description:  'For freelancers getting started.',
    features: [
      '25 invoices per month',
      'Unlimited clients',
      'Direct payment logging (cash, POS, mobile)',
      'Revenue categories',
      'Basic AI payment predictions',
      'Invoice PDFs with file attachments',
      'Automated follow-up reminders',
      'Expense logging',
      'Client portal (view-only)',
      '3 active contracts',
      'Time tracking + invoice from hours',
    ],
  },
  {
    id:           'professional',
    name:         'Professional',
    monthlyPrice: 59,
    annualMonthly: 49,
    annualTotal:  590,
    accent:       '#0055FF',
    description:  'For established freelancers.',
    highlighted:  true,
    features: [
      'Everything in Starter, plus:',
      'Unlimited invoices',
      'Unlimited direct payments',
      'Revenue intelligence dashboard',
      'White-label branding',
      'Advanced AI insights',
      'AI expense categorisation',
      'Branded client portal',
      'Unlimited contracts + e-signatures',
      'AI contract review',
      'Cash flow forecast (90-day)',
      'Weekly time summary emails',
      'Client file storage',
    ],
  },
  {
    id:           'business',
    name:         'Business',
    monthlyPrice: 109,
    annualMonthly: 91,
    annualTotal:  1090,
    accent:       '#00B894',
    description:  'For small agencies and studios.',
    features: [
      { text: 'Everything in Professional, plus:', soon: false },
      { text: 'Budget tracking with 80% & 100% alerts', soon: false },
      { text: 'Per-category monthly budget limits',     soon: false },
      { text: 'Automatic overspend notifications',      soon: false },
      { text: 'Multi-party contract signing',           soon: true  },
      { text: 'Contract version control',               soon: true  },
      { text: '3 team seats',                           soon: true  },
      { text: 'Priority email support (24hr response)', soon: false },
      { text: 'Early access to new features',           soon: false },
    ],
  },
]

export default function LandingPricingSection() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual')

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Toggle ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 52 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: billing === 'monthly' ? '#0A0A0A' : '#9CA3AF' }}>
          Monthly
        </span>
        <button
          suppressHydrationWarning
          onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
          style={{
            position: 'relative', width: 44, height: 24,
            background: billing === 'annual' ? '#0055FF' : '#D1D5DB',
            borderRadius: 999, border: 'none', cursor: 'pointer',
            transition: 'background 0.2s', flexShrink: 0,
          }}
        >
          <span style={{
            position: 'absolute', top: 4, width: 16, height: 16,
            background: '#fff', borderRadius: '50%',
            left: billing === 'annual' ? 24 : 4,
            transition: 'left 0.2s',
          }} />
        </button>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: billing === 'annual' ? '#0A0A0A' : '#9CA3AF', display: 'flex', alignItems: 'center', gap: 10 }}>
          Annual
          <span style={{
            background: '#EFF6FF', color: '#0055FF',
            fontSize: '0.7rem', fontWeight: 700,
            padding: '3px 10px', borderRadius: 999,
          }}>
            2 months free
          </span>
        </span>
      </div>

      {/* ── Cards ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 960, margin: '0 auto' }}
        className="pricing-cards">
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 768px) { .pricing-cards { grid-template-columns: 1fr !important; } }
        `}} />

        {plans.map(plan => {
          const hl  = !!(plan as any).highlighted
          const bg  = hl ? '#0A0A0A' : '#fff'
          const fg  = hl ? '#fff'    : '#0A0A0A'
          const sub = hl ? 'rgba(255,255,255,0.45)' : '#6B7280'
          const bdr = hl ? '#0A0A0A' : '#E5E7EB'
          const price = billing === 'monthly' ? plan.monthlyPrice : plan.annualMonthly

          return (
            <div
              key={plan.id}
              style={{
                background: bg, border: `1px solid ${bdr}`,
                borderRadius: 16, padding: '36px 32px',
                display: 'flex', flexDirection: 'column',
                position: 'relative',
                boxShadow: hl ? '0 24px 64px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              {/* Most popular badge */}
              {hl && (
                <div style={{
                  position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  background: '#0055FF', color: '#fff',
                  fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em',
                  textTransform: 'uppercase', padding: '5px 16px', borderRadius: 999,
                  whiteSpace: 'nowrap',
                }}>
                  Most popular
                </div>
              )}

              {/* Plan header */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontWeight: 800, fontSize: '1rem', color: fg, marginBottom: 4, letterSpacing: '-0.01em' }}>
                  {plan.name}
                </p>
                <p style={{ fontSize: '0.825rem', color: sub }}>
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontSize: '3.2rem', fontWeight: 900, color: fg, letterSpacing: '-0.04em', lineHeight: 1 }}>
                    ${price}
                  </span>
                  <span style={{ fontSize: '0.825rem', color: sub, marginBottom: 6 }}>/mo</span>
                </div>
                {billing === 'annual' && (
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: hl ? 'rgba(255,255,255,0.5)' : '#0055FF', marginTop: 6 }}>
                    ${plan.annualTotal}/year · saves ${plan.monthlyPrice * 2}
                  </p>
                )}
              </div>

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map((f: any, i: number) => {
                  const text = typeof f === 'string' ? f : f.text
                  const soon = typeof f === 'object' && f.soon
                  const isHeader = text.startsWith('Everything')
                  return (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      {!isHeader && (
                        <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0, marginTop: 3, color: hl ? '#60A5FA' : (plan as any).accent || '#0055FF' }} fill="currentColor">
                          <path fillRule="evenodd" d="M11.78 3.97a.75.75 0 0 1 0 1.06l-5.5 5.5a.75.75 0 0 1-1.06 0l-2.5-2.5a.75.75 0 1 1 1.06-1.06L5.75 8.94l4.97-4.97a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span style={{
                        fontSize: '0.825rem',
                        color: isHeader ? sub : (hl ? 'rgba(255,255,255,0.75)' : '#374151'),
                        fontWeight: isHeader ? 600 : 400,
                        lineHeight: 1.5,
                        paddingLeft: isHeader ? 24 : 0,
                        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                      }}>
                        {text}
                        {soon && (
                          <span style={{
                            fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase',
                            letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 4,
                            background: hl ? 'rgba(255,255,255,0.12)' : '#FEF3C7',
                            color: hl ? 'rgba(255,255,255,0.6)' : '#B45309',
                          }}>Soon</span>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>

              {/* CTA */}
              <Link href="/signup" style={{
                display: 'block', width: '100%', textAlign: 'center',
                padding: '13px 0', borderRadius: 10,
                fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none',
                background: hl ? '#fff'       : 'var(--ink, #0A0A0A)',
                color:      hl ? '#0A0A0A'    : '#fff',
                transition: 'opacity 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Start free trial
              </Link>
              <p style={{ fontSize: '0.72rem', textAlign: 'center', marginTop: 10, color: sub }}>
                14-day free trial · No credit card required
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
