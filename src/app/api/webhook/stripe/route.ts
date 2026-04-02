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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const planId = session.metadata?.planId

  if (!userId || !planId) {
    console.error('Missing user_id or plan_id in session metadata', {
      metadata: session.metadata,
      customer: session.customer,
      subscription: session.subscription,
    })
    return
  }

  const supabase = createAdminClient()

  const subscriptionId = session.subscription as string

  console.log('handleCheckoutCompleted - resolved values:', {
    userId,
    planId,
    subscriptionId,
  })

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  let trialEndDate = null
  let subscriptionStatus = 'active'
  
  if (subscription.status === 'trialing' && subscription.trial_end) {
    trialEndDate = new Date(subscription.trial_end * 1000).toISOString()
    subscriptionStatus = 'trialing'
  }

  console.log('Trial info:', {
    status: subscription.status,
    trial_end: subscription.trial_end,
    trialEndDate,
  })

  const { error } = await supabase
    .from('user_profiles')
    .update({
      stripe_customer_id: session.customer as string,   // ← persist so hasEverSubscribed is reliable
      stripe_subscription_id: subscriptionId,
      subscription_tier: planId,
      subscription_status: subscriptionStatus,
      trial_end_date: trialEndDate,
      trial_plan: planId,
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user profile:', error)
  } else {
    console.log(`User ${userId} ${subscriptionStatus === 'trialing' ? 'started trial for' : 'upgraded to'} ${planId}`)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  const supabase = createAdminClient()

  const priceId = subscription.items.data[0]?.price.id
  let newPlan = 'starter'

  // Check both monthly and annual price IDs for each plan
  if (
    priceId === process.env.STRIPE_PRICE_ID_PROFESSIONAL ||
    priceId === process.env.STRIPE_PRICE_ID_PROFESSIONAL_ANNUAL
  ) {
    newPlan = 'professional'
  } else if (
    priceId === process.env.STRIPE_PRICE_ID_BUSINESS ||
    priceId === process.env.STRIPE_PRICE_ID_BUSINESS_ANNUAL
  ) {
    newPlan = 'business'
  } else if (
    priceId === process.env.STRIPE_PRICE_ID_STARTER ||
    priceId === process.env.STRIPE_PRICE_ID_STARTER_ANNUAL
  ) {
    newPlan = 'starter'
  }

  let status = 'active'
  let trialEndDate = null
  
  if (subscription.status === 'canceled') {
    status = 'canceled'
  } else if (subscription.status === 'past_due') {
    status = 'past_due'
  } else if (subscription.status === 'trialing') {
    status = 'trialing'
    if (subscription.trial_end) {
      trialEndDate = new Date(subscription.trial_end * 1000).toISOString()
    }
  }

  console.log('Subscription updated:', {
    userId,
    newPlan,
    status,
    trialEndDate,
    cancel_at_period_end: subscription.cancel_at_period_end,
  })

  const updateData: any = {
    subscription_tier: newPlan,
    subscription_status: status,
  }

  if (status === 'trialing' && trialEndDate) {
    updateData.trial_end_date = trialEndDate
  } else if (status === 'active') {
    updateData.trial_end_date = null
  }

  const { error } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('id', userId)

  if (error) {
    console.error('Error updating subscription:', error)
  } else {
    console.log(`Subscription updated for user ${userId}: ${newPlan} (${status})`)
  }
}

// Handle subscription cancellation from Stripe webhook.
// NOTE: The cancel route already updates the DB immediately when the user cancels.
// This handler is a safety net for cases where Stripe fires the deleted event
// without a matching cancel route call (e.g. canceled from Stripe dashboard).
// We deliberately do NOT reset subscription_tier here so the billing page
// correctly shows "Professional - Inactive" or "Starter - Inactive".
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  const supabase = createAdminClient()

  // Only update status and clear subscription ID — preserve the tier
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'canceled',
      stripe_subscription_id: null,
      trial_end_date: null,
      trial_plan: null,
    })
    .eq('id', userId)

  if (error) {
    console.error('Error handling subscription deleted:', error)
  } else {
    console.log(`User ${userId} subscription canceled (tier preserved)`)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string

  if (!subscriptionId) return

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const userId = subscription.metadata?.user_id

    if (!userId) return

    const supabase = createAdminClient()

    const updateData: any = {
      subscription_status: 'active',
    }

    if (subscription.status === 'active' && !subscription.trial_end) {
      updateData.trial_end_date = null
    }

    const { error } = await supabase
      .from('user_profiles')
      .update(updateData)
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

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId =
    typeof (invoice as any).subscription === 'string'
      ? (invoice as any).subscription
      : (invoice as any).subscription?.id

  if (!subscriptionId) return

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const userId = subscription.metadata?.user_id

    if (!userId) return

    const supabase = createAdminClient()

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