import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    console.log('=== CHANGE PLAN API CALLED ===')
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const planId = formData.get('planId') as string

    console.log('Change plan request:', { planId, userId: user.id })

    if (!planId) {
      console.error('Missing planId')
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Get user profile with subscription info
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('stripe_subscription_id, subscription_tier')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profile.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    // Get the new price ID based on plan
    let newPriceId: string
    if (planId === 'professional') {
      newPriceId = process.env.STRIPE_PRICE_ID_PROFESSIONAL!
    } else if (planId === 'business') {
      newPriceId = process.env.STRIPE_PRICE_ID_BUSINESS!
    } else {
      return NextResponse.json({ error: 'Invalid plan ID. Use /api/downgrade-subscription for Starter.' }, { status: 400 })
    }

    console.log('Switching from', profile.subscription_tier, 'to', planId)

    // Get current subscription
    const currentSubscription = await stripe.subscriptions.retrieve(
      profile.stripe_subscription_id
    )

    // Update subscription to new plan
    const updatedSubscription = await stripe.subscriptions.update(
      profile.stripe_subscription_id,
      {
        items: [
          {
            id: currentSubscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations', // Prorate the difference
        metadata: {
          user_id: user.id,
          plan_id: planId,
        },
      }
    )

    console.log('✅ Subscription updated successfully')

    // The webhook will update the database, but we can update immediately for faster UX
    // Using admin client would be better here, but regular client works for own data
    await supabase
      .from('user_profiles')
      .update({ subscription_tier: planId })
      .eq('id', user.id)

    // Redirect to billing page with success message
    return NextResponse.redirect(
      new URL('/dashboard/billing?success=true', request.url)
    )

  } catch (error) {
    console.error('Change plan error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to change plan' },
      { status: 500 }
    )
  }
}