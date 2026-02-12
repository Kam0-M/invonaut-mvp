import Stripe from 'stripe'

// Initialize Stripe with secret key (server-side only)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})

// Plan configuration
export const PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 30,
    priceId: process.env.STRIPE_PRICE_ID_STARTER!,
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
    price: 60,
    priceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL!,
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
    price: 79,
    priceId: process.env.STRIPE_PRICE_ID_BUSINESS!,
    features: {
      invoicesPerMonth: 'unlimited',
      clients: 'unlimited',
      whiteLabelBranding: true,
      advancedAI: true,
      teamCollaboration: true,
      apiAccess: true,
    },
  },
} as const

export type PlanId = keyof typeof PLANS