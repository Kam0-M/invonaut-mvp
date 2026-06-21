// Plan configuration — single source of truth for all price IDs
// Monthly price IDs: STRIPE_PRICE_ID_STARTER / _PROFESSIONAL / _BUSINESS
// Annual price IDs:  STRIPE_PRICE_ID_STARTER_ANNUAL / _PROFESSIONAL_ANNUAL / _BUSINESS_ANNUAL
//
// NOTE: this file deliberately does NOT instantiate a shared Stripe client.
// Every route lazily creates its own via a local getStripe() function —
// the same module-level-init hazard documented for OpenAI in the handoff
// doc applies equally to Stripe. A previous version of this file did
// `export const stripe = new Stripe(...)` at module scope; it was unused
// anywhere in the codebase and crashed the build the moment anything else
// in this file got imported without STRIPE_SECRET_KEY present at build time.
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

/**
 * Derives the real plan tier from a Stripe price ID by checking it against
 * the known monthly/annual price IDs above (the single source of truth).
 * Returns null if the price ID doesn't match any known plan — callers MUST
 * treat that as invalid input and reject/flag it, never default to a tier.
 *
 * Checklist #2 fix: a client-submitted planId string must never be trusted
 * on its own — always re-derive the real plan from the price actually
 * involved in the Stripe transaction (the priceId sent to checkout, or the
 * price on the real subscription object in a webhook).
 */
export function derivePlanFromPriceId(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null
  for (const plan of Object.values(PLANS)) {
    if (priceId === plan.monthlyPriceId || priceId === plan.annualPriceId) {
      return plan.id
    }
  }
  return null
}