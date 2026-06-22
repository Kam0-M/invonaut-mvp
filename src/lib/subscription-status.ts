/**
 * Single source of truth for "does this user currently have an active
 * paid-tier subscription" — previously this exact 2-line expression was
 * copy-pasted across ~20 files (server pages, client pages, and the
 * checkout-session route), and every copy had the same gap: it trusted the
 * stored `subscription_status` string alone, with no check against
 * `trial_end_date`.
 *
 * That gap meant a trial that should have converted or expired — but whose
 * Stripe webhook never fired (confirmed: a real metadata-key bug meant
 * `customer.subscription.updated`/`.deleted` events silently no-op'd for
 * every user) — left the account indefinitely on full paid-tier access.
 * Confirmed live: 8 real accounts sat on `trialing` with `trial_end_date`
 * 3-4 months in the past, still getting full Professional/Business access.
 *
 * Pass whatever subset of these three fields you have selected from
 * `user_profiles` — all three are needed for a correct answer, so make sure
 * your `.select()` includes `trial_end_date` alongside the other two.
 */
export type SubscriptionGateProfile = {
  stripe_subscription_id?: string | null
  subscription_status?: string | null
  trial_end_date?: string | null
}

export function isSubscriptionActive(profile: SubscriptionGateProfile | null | undefined): boolean {
  if (!profile?.stripe_subscription_id) return false

  if (profile.subscription_status === 'active') return true

  if (profile.subscription_status === 'trialing') {
    // No recorded end date — treat as a fresh/ongoing trial rather than
    // failing closed (this matches a brand-new trial signup before
    // trial_end_date has ever been written).
    if (!profile.trial_end_date) return true
    return new Date(profile.trial_end_date).getTime() > Date.now()
  }

  return false
}
