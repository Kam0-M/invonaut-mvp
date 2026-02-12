import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    // Verify Stripe key exists
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not set!')
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const formData = await request.formData()
    const priceId = formData.get('priceId') as string
    const planId = formData.get('planId') as string

    console.log('Checkout request:', { priceId, planId, userId: user.id })

    if (!priceId || !planId) {
      console.error('Missing priceId or planId:', { priceId, planId })
      return NextResponse.json({ error: 'Price ID and Plan ID are required' }, { status: 400 })
    }

    // Verify price ID exists
    if (!priceId.startsWith('price_')) {
      console.error('Invalid price ID format:', priceId)
      return NextResponse.json({ error: 'Invalid price ID format' }, { status: 400 })
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      console.log('Creating new Stripe customer for user:', user.id)
      const customer = await stripe.customers.create({
        email: profile?.email || user.email!,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    console.log('Creating checkout session for customer:', customerId)

    // Create checkout session with 14-day free trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // 🎯 ADD 14-DAY FREE TRIAL FOR ALL PLANS
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          user_id: user.id,
          plan_id: planId,
        },
      },
      success_url: `${request.nextUrl.origin}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/pricing`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
      },
    })

    console.log('Checkout session created successfully with 14-day trial!')
    console.log('Session ID:', session.id)
    console.log('Session URL:', session.url)

    if (!session.url) {
      console.error('No session URL returned from Stripe!')
      return NextResponse.json({ error: 'Failed to get checkout URL' }, { status: 500 })
    }

    // Redirect to Stripe checkout
    console.log('Redirecting to:', session.url)
    return NextResponse.redirect(session.url, 303)

  } catch (error) {
    console.error('Checkout session error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}