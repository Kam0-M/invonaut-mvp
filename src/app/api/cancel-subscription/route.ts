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
      .select('stripe_subscription_id, subscription_status, subscription_tier')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    const isOnTrial = profile.subscription_status === 'trialing'

    if (isOnTrial) {
      // IMMEDIATE CANCELLATION for trials
      await stripe.subscriptions.cancel(profile.stripe_subscription_id)
      
      console.log(`✅ Trial subscription ${profile.stripe_subscription_id} canceled immediately (no charge)`)

      return NextResponse.json({
        message: 'Trial canceled immediately',
        immediate: true,
        redirect: '/dashboard/billing?trial_canceled=true'
      })
    } else {
      // CANCEL AT PERIOD END for paid subscriptions
      const subscription = await stripe.subscriptions.update(
        profile.stripe_subscription_id,
        {
          cancel_at_period_end: true,
        }
      )

      console.log(`✅ Subscription ${subscription.id} will be canceled at period end`)

      return NextResponse.json({
        message: 'Subscription will be canceled at the end of the billing period',
        immediate: false,
        redirect: '/cancellation-pending'
      })
    }

  } catch (error: any) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription', details: error.message },
      { status: 500 }
    )
  }
}