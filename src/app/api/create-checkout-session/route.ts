import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const priceId = formData.get('priceId') as string
    const planId = formData.get('planId') as string

    console.log('Checkout request:', { priceId, planId })

    if (!priceId || !planId) {
      return NextResponse.json({ 
        error: 'Price ID and Plan ID are required' 
      }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, stripe_subscription_id, subscription_status, subscription_tier, currency')
      .eq('id', user.id)
      .single()

    // Stripe-supported currencies for subscription billing
    // Stripe automatically presents checkout in the user's currency when supported
    // All payments settle to the account's default currency (USD) via automatic conversion
    const STRIPE_SUPPORTED_CURRENCIES = [
      'usd','gbp','eur','cad','aud','nzd','sgd','chf',
      'inr','jpy','brl','mxn','zar',
      // Note: NGN and KES require Stripe Treasury or local acquiring — default to USD
    ]
    const userCurrency = (profile as any)?.currency?.toLowerCase() || 'usd'
    const stripeCurrency = STRIPE_SUPPORTED_CURRENCIES.includes(userCurrency) ? userCurrency : 'usd'

    const hasEverSubscribed = !!profile?.stripe_customer_id || !!profile?.stripe_subscription_id
    const hasActiveSubscription = !!profile?.stripe_subscription_id && 
      (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')

    // UPGRADE/DOWNGRADE EXISTING SUBSCRIPTION
    if (hasActiveSubscription && profile.subscription_tier !== planId) {
      console.log('🔄 Upgrading/downgrading existing subscription')
      
      const subscription = await stripe.subscriptions.update(
        profile.stripe_subscription_id!,
        {
          items: [{
            id: (await stripe.subscriptions.retrieve(profile.stripe_subscription_id!)).items.data[0].id,
            price: priceId,
          }],
          proration_behavior: 'create_prorations',
        }
      )

      console.log('✅ Subscription updated in Stripe:', subscription.id)

      await supabase
        .from('user_profiles')
        .update({ 
          subscription_tier: planId,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      console.log('✅ Database updated to:', planId)

      // ✅ Return redirect URL instead of redirecting
      return NextResponse.json({ 
        url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?upgraded=true` 
      })
    }

    // NEW SUBSCRIPTION OR REACTIVATION
    const trialDays = hasEverSubscribed ? 0 : 14
    
    console.log('Trial decision:', {
      hasEverSubscribed,
      trialDays,
      customerId: profile?.stripe_customer_id || 'new',
      reason: hasEverSubscribed ? 'Returning customer - no trial' : 'New customer - 14 day trial'
    })

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: profile?.stripe_customer_id || undefined,
      customer_email: !profile?.stripe_customer_id ? user.email : undefined,
      mode: 'subscription',
      payment_method_types: ['card'],
      currency: stripeCurrency !== 'usd' ? stripeCurrency : undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        userId: user.id,
        planId: planId,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: planId,
        },
      },
    }

    if (trialDays > 0) {
      sessionParams.subscription_data!.trial_period_days = trialDays
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    console.log('✅ Checkout session created:', session.id, 'Trial days:', trialDays)

    // ✅ Return URL instead of redirecting
    return NextResponse.json({ url: session.url })

  } catch (error: any) {
    console.error('Checkout session error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500 })
  }
}