import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Stripe from 'stripe'

function getStripe() { return new Stripe(process.env.STRIPE_SECRET_KEY!) }

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('stripe_subscription_id, subscription_status')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    // Cancel immediately in Stripe
    await getStripe().subscriptions.cancel(profile.stripe_subscription_id)

    console.log(`✅ Subscription ${profile.stripe_subscription_id} canceled immediately`)

    // Update DB immediately so locked gates activate on reload.
    // DO NOT reset subscription_tier — keep whatever tier they were on
    // so the billing page shows "Professional - Inactive" or "Starter - Inactive" correctly.
    // NOTE: billing columns are no longer writable by the authenticated role directly
    // (see Checklist #1 fix) — this write must go through the service-role client.
    // Ownership is already verified above via session-bound auth.getUser() + .eq('id', user.id).
    await createServiceClient()
      .from('user_profiles')
      .update({
        stripe_subscription_id: null,
        subscription_status: 'canceled',
      })
      .eq('id', user.id)

      console.log(`✅ Database updated - subscription removed for user ${user.id}`)

    return NextResponse.json({
      message: 'Subscription canceled successfully',
      immediate: true,
    })

  } catch (error: any) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription', details: error.message },
      { status: 500 }
    )
  }
}