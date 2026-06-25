import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

function getStripe() { return new Stripe(process.env.STRIPE_SECRET_KEY!) }

// Admin client — needed because target_tier is a billing column (writes via the
// authenticated/session client go through the same RLS surface tightened for the
// other billing columns in the Checklist #1 fix). Matches the pattern already used
// in downgrade-subscription/route.ts and the Stripe webhook handler.
function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function POST() {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('stripe_subscription_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 400 }
      )
    }

    // Get current subscription state
    const currentSubscription = await getStripe().subscriptions.retrieve(
      profile.stripe_subscription_id
    )

    console.log('=== REACTIVATE API ===')
    console.log('Subscription ID:', profile.stripe_subscription_id)
    console.log('Before update - cancel_at_period_end:', currentSubscription.cancel_at_period_end)
    console.log('Before update - cancel_at:', currentSubscription.cancel_at)
    console.log('Before update - status:', currentSubscription.status)

    // Reactivate subscription (remove cancel_at_period_end)
    const subscription = await getStripe().subscriptions.update(
      profile.stripe_subscription_id,
      {
        cancel_at_period_end: false,
      }
    )

    // Verify the update worked
    const updated = await getStripe().subscriptions.retrieve(profile.stripe_subscription_id)
    console.log('After update - cancel_at_period_end:', updated.cancel_at_period_end)
    console.log('After update - cancel_at:', updated.cancel_at)
    console.log('After update - status:', updated.status)
    console.log(`✅ Subscription ${subscription.id} reactivated`)

    // Checklist #33 companion fix: a reactivation cancels whatever downgrade was
    // pending too — clear target_tier so it can't resurface and misfire on some
    // unrelated, genuine cancellation much later (handleSubscriptionDeleted now
    // reads this column to decide whether a cancellation is actually a downgrade).
    const { error: clearTargetTierError } = await createAdminClient()
      .from('user_profiles')
      .update({ target_tier: null })
      .eq('id', user.id)

    if (clearTargetTierError) {
      console.error('Failed to clear target_tier on reactivation:', clearTargetTierError)
    }

    return NextResponse.json({
      message: 'Subscription reactivated successfully',
      subscription,
    })

  } catch (error: any) {
    console.error('Reactivate subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to reactivate subscription', details: error.message },
      { status: 500 }
    )
  }
}