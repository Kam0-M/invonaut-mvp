import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Create admin Supabase client for webhooks (bypasses RLS)
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

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('No Stripe signature found')
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message)
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    )
  }

  // Handle the event
  console.log('=== STRIPE WEBHOOK RECEIVED ===')
  console.log('Event type:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 500 }
    )
  }
}

// Handle successful checkout
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  const planId = session.metadata?.plan_id

  if (!userId || !planId) {
    console.error('Missing user_id or plan_id in session metadata', {
      metadata: session.metadata,
      customer: session.customer,
      subscription: session.subscription,
    })
    return
  }

  const supabase = createAdminClient()

  // Get subscription details
  const subscriptionId = session.subscription as string

  console.log('handleCheckoutCompleted - resolved values:', {
    userId,
    planId,
    subscriptionId,
  })

  // Update user profile with subscription info
  const { error } = await supabase
    .from('user_profiles')
    .update({
      stripe_subscription_id: subscriptionId,
      subscription_tier: planId,
      subscription_status: 'active',
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user profile:', error)
  } else {
    console.log(`User ${userId} upgraded to ${planId}`)
  }
}

// Handle subscription updates (plan changes, renewals)
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  const supabase = createAdminClient()

  // Determine new plan based on price ID
  const priceId = subscription.items.data[0]?.price.id
  let newPlan = 'starter'

  if (priceId === process.env.STRIPE_PRICE_ID_PROFESSIONAL) {
    newPlan = 'professional'
  } else if (priceId === process.env.STRIPE_PRICE_ID_BUSINESS) {
    newPlan = 'business'
  }

  // Determine subscription status
  let status = 'active'
  if (subscription.status === 'canceled') {
    status = 'canceled'
  } else if (subscription.status === 'past_due') {
    status = 'past_due'
  } else if (subscription.status === 'trialing') {
    status = 'trialing'
  }

  // Update user profile
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_tier: newPlan,
      subscription_status: status,
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating subscription:', error)
  } else {
    console.log(`Subscription updated for user ${userId}: ${newPlan} (${status})`)
  }
}

// Handle subscription cancellation
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  const supabase = createAdminClient()

  // Downgrade to starter plan
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_tier: 'starter',
      subscription_status: 'canceled',
      stripe_subscription_id: null,
    })
    .eq('id', userId)

  if (error) {
    console.error('Error canceling subscription:', error)
  } else {
    console.log(`User ${userId} downgraded to starter (subscription canceled)`)
  }
}

// Handle successful payment
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Get subscription ID - could be string or object
  const subscriptionId = (invoice as any).subscription as string

  if (!subscriptionId) return

  try {
    // Fetch subscription to get user metadata
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const userId = subscription.metadata?.user_id

    if (!userId) return

    const supabase = createAdminClient()

    // Ensure subscription is active
    const { error } = await supabase
      .from('user_profiles')
      .update({
        subscription_status: 'active',
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating payment status:', error)
    } else {
      console.log(`Payment succeeded for user ${userId}`)
    }
  } catch (error) {
    console.error('Error in handleInvoicePaymentSucceeded:', error)
  }
}

// Handle failed payment
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Get subscription ID - could be string or object
  const subscriptionId =
    typeof (invoice as any).subscription === 'string'
      ? (invoice as any).subscription
      : (invoice as any).subscription?.id;

  if (!subscriptionId) return;

  try {
    // Fetch subscription to get user metadata
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const userId = subscription.metadata?.user_id

    if (!userId) return

    const supabase = createAdminClient()

    // Mark subscription as past_due
    const { error } = await supabase
      .from('user_profiles')
      .update({
        subscription_status: 'past_due',
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating payment failure:', error)
    } else {
      console.log(`Payment failed for user ${userId} - marked as past_due`)
    }
  } catch (error) {
    console.error('Error in handleInvoicePaymentFailed:', error)
  }
}