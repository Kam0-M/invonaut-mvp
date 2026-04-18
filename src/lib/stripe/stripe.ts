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
    monthlyPrice: 49,
    annualPrice: 490,           // 2 months free ($49 × 10)
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
    monthlyPrice: 99,
    annualPrice: 990,           // 2 months free ($99 × 10)
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
    monthlyPrice: 149,
    annualPrice: 1490,          // 2 months free ($149 × 10)
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