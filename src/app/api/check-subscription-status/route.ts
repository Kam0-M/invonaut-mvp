import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSubscriptionActive } from '@/lib/subscription-status'

// Lightweight endpoint polled by SuccessReload after Stripe checkout.
// Returns whether the webhook has landed and the subscription is active.
// Called every 3s up to 10 times (30s max) — then gives up gracefully.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ active: false })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_subscription_id, subscription_status, trial_end_date')
    .eq('id', user.id)
    .single()

  const active = isSubscriptionActive(profile)

  return NextResponse.json({ active })
}