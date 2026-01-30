import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

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
    const currentSubscription = await stripe.subscriptions.retrieve(
      profile.stripe_subscription_id
    )

    console.log('=== REACTIVATE API ===')
    console.log('Subscription ID:', profile.stripe_subscription_id)
    console.log('Before update - cancel_at_period_end:', currentSubscription.cancel_at_period_end)
    console.log('Before update - cancel_at:', currentSubscription.cancel_at)
    console.log('Before update - status:', currentSubscription.status)

    // Reactivate subscription (remove cancel_at_period_end)
    const subscription = await stripe.subscriptions.update(
      profile.stripe_subscription_id,
      {
        cancel_at_period_end: false,
      }
    )

    // Verify the update worked
    const updated = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
    console.log('After update - cancel_at_period_end:', updated.cancel_at_period_end)
    console.log('After update - cancel_at:', updated.cancel_at)
    console.log('After update - status:', updated.status)
    console.log(`✅ Subscription ${subscription.id} reactivated`)

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