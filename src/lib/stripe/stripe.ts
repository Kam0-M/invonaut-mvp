import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})

// Plan configuration — single source of truth for all price IDs
// Monthly price IDs: STRIPE_PRICE_ID_STARTER / _PROFESSIONAL / _BUSINESS
// Annual price IDs:  STRIPE_PRICE_ID_STARTER_ANNUAL / _PROFESSIONAL_ANNUAL / _BUSINESS_ANNUAL
export const PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 29,
    annualPrice: 290,           // 2 months free ($29 × 10)
    monthlyPriceId: process.env.STRIPE_PRICE_ID_STARTER!,
    annualPriceId:  process.env.STRIPE_PRICE_ID_STARTER_ANNUAL!,
    features: {
      invoicesPerMonth: 25,
      clients: 'unlimited',
      whiteLabelBranding: false,
      advancedAI: false,
    },
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 59,
    annualPrice: 590,           // 2 months free ($59 × 10)
    monthlyPriceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL!,
    annualPriceId:  process.env.STRIPE_PRICE_ID_PROFESSIONAL_ANNUAL!,
    features: {
      invoicesPerMonth: 'unlimited',
      clients: 'unlimited',
      whiteLabelBranding: true,
      advancedAI: true,
    },
  },
  business: {
    id: 'business',
    name: 'Business',
    monthlyPrice: 109,
    annualPrice: 1090,          // 2 months free ($109 × 10)
    monthlyPriceId: process.env.STRIPE_PRICE_ID_BUSINESS!,
    annualPriceId:  process.env.STRIPE_PRICE_ID_BUSINESS_ANNUAL!,
    features: {
      invoicesPerMonth: 'unlimited',
      clients: 'unlimited',
      whiteLabelBranding: true,
      advancedAI: true,
      teamCollaboration: true,
      budgetAlerts: true,
    },
  },
} as const

export type PlanId = keyof typeof PLANS