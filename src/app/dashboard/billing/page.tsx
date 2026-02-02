import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Check, CreditCard, AlertCircle } from 'lucide-react'
import CancelSubscriptionButton from '@/components/billing/cancel-subscription-button'
import DowngradeConfirmButton from '@/components/billing/downgrade-confirm-button'
import CancellationCountdownBanner from '@/components/billing/cancellation-countdown-banner'

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  // Get user profile with subscription info
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier, stripe_customer_id, stripe_subscription_id, subscription_status')
    .eq('id', user.id)
    .single()

  const currentTier = profile?.subscription_tier || 'starter'
  const subscriptionStatus = profile?.subscription_status || 'active'
  const hasActiveSubscription = profile?.stripe_subscription_id && subscriptionStatus === 'active'
  
  // Show cancel for paid tiers even if webhook hasn't fully processed yet
  const showCancelButton = hasActiveSubscription || (currentTier === 'professional' || currentTier === 'business')

  // Check if subscription is set to cancel at period end
  let cancelAtPeriodEnd = false
  let cancelAtTimestamp: number | null = null
  
  if (profile?.stripe_subscription_id) {
    try {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
      cancelAtPeriodEnd = subscription.cancel_at_period_end
      
      console.log('=== BILLING PAGE DEBUG ===')
      console.log('Subscription ID:', profile.stripe_subscription_id)
      console.log('cancel_at_period_end:', subscription.cancel_at_period_end)
      console.log('cancel_at:', subscription.cancel_at)
      console.log('status:', subscription.status)
      console.log('hasActiveSubscription:', hasActiveSubscription)
      
      // Get cancel_at timestamp ONLY if subscription is actually canceling
      // When reactivated, cancel_at_period_end becomes false, so we shouldn't use stale cancel_at
      if (subscription.cancel_at_period_end && subscription.cancel_at) {
        cancelAtTimestamp = subscription.cancel_at
      } else {
        cancelAtTimestamp = null
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      features: [
        '25 invoices per month',
        'Unlimited clients',
        'Basic AI payment predictions',
        'Email invoicing with PDF',
        'Dashboard analytics',
        'Invonaut branding',
      ],
      priceId: process.env.STRIPE_PRICE_ID_STARTER,
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 59,
      features: [
        'Unlimited invoices',
        'Unlimited clients',
        'Advanced AI predictions',
        'White label branding',
        'Custom logo & colors',
        'Priority support',
      ],
      priceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL,
    },
    {
      id: 'business',
      name: 'Business',
      price: 79,
      features: [
        'Everything in Professional',
        'Team collaboration (coming soon)',
        'Multi-user access (coming soon)',
        'API access (coming soon)',
        'Dedicated support (coming soon)',
      ],
      priceId: process.env.STRIPE_PRICE_ID_BUSINESS,
    },
  ]

  const currentPlan = plans.find(p => p.id === currentTier)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Billing & Subscription
          </h1>
          <p className="text-gray-600 mt-2 font-medium">
            Manage your subscription and billing information
          </p>
        </div>
      </div>

      {/* Success Message (if redirected from checkout) */}
      {params.success === 'true' && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-green-900">
                Subscription Activated!
              </h3>
              <p className="text-green-700 mt-1">
                Your payment was successful. Your subscription is now active.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Pending Warning - Prominent Banner with Countdown */}
      {/* Only show banner if subscription is actually set to cancel */}
      {cancelAtPeriodEnd && cancelAtTimestamp && (
        <CancellationCountdownBanner 
          cancelAt={cancelAtTimestamp}
          currentTier={currentTier}
        />
      )}

      {/* Current Plan Card */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Current Plan</h2>
            <p className="text-gray-600">Your active subscription details</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-blue-900 uppercase tracking-wide">
              {currentPlan?.name}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Details */}
          <div>
            <div className="mb-6">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-black text-gray-900">
                  ${currentPlan?.price}
                </span>
                <span className="text-gray-600 font-medium">/month</span>
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
                subscriptionStatus === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : subscriptionStatus === 'past_due'
                  ? 'bg-red-100 text-red-800'
                  : subscriptionStatus === 'canceled'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {subscriptionStatus === 'active' && '✓ Active'}
                {subscriptionStatus === 'past_due' && '⚠ Past Due'}
                {subscriptionStatus === 'canceled' && '✕ Canceled'}
                {subscriptionStatus === 'trialing' && '⏱ Trial'}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                Features Included
              </h3>
              <ul className="space-y-2">
                {currentPlan?.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
                Manage Subscription
              </h3>
              
              {/* Show Upgrade button only if not on Business tier */}
              {currentTier !== 'business' && !cancelAtPeriodEnd && (
                <Link
                  href="/pricing"
                  className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center px-6 py-3 rounded-xl font-bold mb-3 hover:shadow-xl transition-all hover:scale-105"
                >
                  Upgrade Plan
                </Link>
              )}

              {/* Show Cancel button if subscription is active and not pending cancellation */}
              {(() => {
                const shouldShowCancel = hasActiveSubscription && !cancelAtPeriodEnd
                console.log('=== MANAGE SUBSCRIPTION SECTION ===')
                console.log('hasActiveSubscription:', hasActiveSubscription)
                console.log('cancelAtPeriodEnd:', cancelAtPeriodEnd)
                console.log('Should show Cancel button:', shouldShowCancel)
                console.log('currentTier:', currentTier)
                console.log('subscriptionStatus:', subscriptionStatus)
                return null
              })()}
              {hasActiveSubscription && !cancelAtPeriodEnd && (
                <CancelSubscriptionButton currentTier={currentTier} />
              )}

              {/* Show helpful message if pending cancellation - button is in countdown banner */}
              {cancelAtPeriodEnd && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                  <p className="text-sm text-orange-900 font-medium text-center">
                    Your subscription is set to cancel. Use the "Reactivate" button above to undo.
                  </p>
                </div>
              )}

              {!hasActiveSubscription && currentTier === 'starter' && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-900 font-medium">
                        You're on the free Starter plan. Upgrade to unlock white label branding and advanced features!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                Billing Information
              </h3>
              {hasActiveSubscription ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subscription ID:</span>
                    <span className="text-gray-900 font-mono text-xs">
                      {profile?.stripe_subscription_id?.slice(0, 20)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer ID:</span>
                    <span className="text-gray-900 font-mono text-xs">
                      {profile?.stripe_customer_id?.slice(0, 20)}...
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  No active subscription
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Available Plans - NOW SHOWS FOR ALL TIERS INCLUDING BUSINESS */}
      <div>
        <h2 className="text-2xl font-black text-gray-900 mb-6">
          Available Plans
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentTier
            const isUpgrade = 
              (currentTier === 'starter' && plan.id !== 'starter') ||
              (currentTier === 'professional' && plan.id === 'business')
            const isDowngrade = 
              (currentTier === 'professional' && plan.id === 'starter') ||
              (currentTier === 'business' && (plan.id === 'starter' || plan.id === 'professional'))

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border-2 p-6 transition-all ${
                  isCurrentPlan
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
                }`}
              >
                {isCurrentPlan && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                      Current Plan
                    </span>
                  </div>
                )}

                <h3 className="text-xl font-black text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-black text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600 font-medium">/mo</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                {!isCurrentPlan && isUpgrade && (
                  <form action="/api/create-checkout-session" method="POST">
                    <input type="hidden" name="priceId" value={plan.priceId} />
                    <input type="hidden" name="planId" value={plan.id} />
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm hover:shadow-xl transition-all"
                    >
                      Upgrade to {plan.name}
                    </button>
                  </form>
                )}

                {/* DOWNGRADE TO STARTER BUTTON - Shows confirmation modal */}
                {!isCurrentPlan && isDowngrade && plan.id === 'starter' && (
                  <DowngradeConfirmButton 
                    currentTier={currentTier}
                    targetTier="starter"
                  />
                )}

                {/* DOWNGRADE TO PROFESSIONAL BUTTON - Shows confirmation modal */}
                {!isCurrentPlan && isDowngrade && plan.id === 'professional' && (
                  <DowngradeConfirmButton 
                    currentTier={currentTier}
                    targetTier="professional"
                    buttonText="Switch to Professional"
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-2 rounded-xl font-bold text-sm hover:shadow-xl transition-all"
                  />
                )}

                {/* CURRENT PLAN BUTTON - Disabled */}
                {isCurrentPlan && (
                  <button
                    disabled
                    className="w-full bg-gray-200 text-gray-500 px-4 py-2 rounded-xl font-bold text-sm cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}