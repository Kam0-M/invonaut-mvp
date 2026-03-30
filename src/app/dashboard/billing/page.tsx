import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Check, CreditCard, AlertCircle, Zap, TrendingUp, Shield } from 'lucide-react'
import CancelSubscriptionButton from '@/components/billing/cancel-subscription-button'
import DowngradeConfirmButton from '@/components/billing/downgrade-confirm-button'
import CancellationCountdownBanner from '@/components/billing/cancellation-countdown-banner'
import CheckoutButton from '@/components/checkout-button'
import SuccessReload from '@/components/billing/success-reload'

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    success?: string; 
    trial_canceled?: string;
    upgraded?: string;
    error?: string;
  }>
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
    .select('subscription_tier, stripe_customer_id, stripe_subscription_id, subscription_status, trial_end_date, trial_plan')
    .eq('id', user.id)
    .single()

  const currentTier = profile?.subscription_tier || 'starter'
  const subscriptionStatus = profile?.subscription_status || 'inactive'
  const hasActiveSubscription = !!profile?.stripe_subscription_id && 
    (subscriptionStatus === 'active' || subscriptionStatus === 'trialing')
  
  const hasEverSubscribed = !!profile?.stripe_customer_id || !!profile?.stripe_subscription_id
  
  // Trial variables
  const isOnTrial = profile?.subscription_status === 'trialing'
  const trialEndDate = profile?.trial_end_date ? new Date(profile.trial_end_date) : null
  const daysLeftInTrial = trialEndDate 
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  // Check if subscription is set to cancel at period end AND get next billing date
  let cancelAtPeriodEnd = false
  let cancelAtTimestamp: number | null = null
  let nextBillingDate: Date | null = null
  
  if (profile?.stripe_subscription_id) {
    try {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
      
      cancelAtPeriodEnd = subscription.cancel_at_period_end
      
      if (subscription.cancel_at_period_end && subscription.cancel_at) {
        cancelAtTimestamp = subscription.cancel_at
      }
  
      // Get next billing date - with explicit null check
      if (subscription.status === 'active') {
        const periodEnd = (subscription as any).current_period_end
        if (periodEnd !== null && periodEnd !== undefined) {
          nextBillingDate = new Date(periodEnd * 1000)
        }
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 40,
      features: [
        '25 invoices per month',
        'Unlimited clients',
        'Basic AI payment predictions',
        'Email invoicing with PDF',
        'Dashboard analytics',
        'Expense tracking',
        'Invonaut branding',
      ],
      priceId: process.env.STRIPE_PRICE_ID_STARTER,
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 80,
      features: [
        'Unlimited invoices',
        'Unlimited clients',
        'Advanced AI predictions',
        'White label branding',
        'Custom logo & colors',
        'AI contract review',
        'AI expense categorization',
        'Priority support',
      ],
      priceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL,
    },
    {
      id: 'business',
      name: 'Business',
      price: 120,
      features: [
        'Everything in Professional',
        'Budget tracking & alerts',
        'Multi-party contract signing',
        'Contract version control',
        'Retainer management',
        '3 team seats',
        'Dedicated account manager',
      ],
      priceId: process.env.STRIPE_PRICE_ID_BUSINESS,
    },
  ]

  // Annual price IDs for billing info display
  const annualPriceIds = [
    process.env.STRIPE_PRICE_ID_STARTER_ANNUAL,
    process.env.STRIPE_PRICE_ID_PROFESSIONAL_ANNUAL,
    process.env.STRIPE_PRICE_ID_BUSINESS_ANNUAL,
  ]

  const currentPlan = plans.find(p => p.id === currentTier)
  const trialCanceled = params.trial_canceled === 'true'

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

      {/* Success Message */}
      {params.success === 'true' && !trialCanceled && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-green-900">
                {isOnTrial ? 'Free Trial Started!' : 'Subscription Activated!'}
              </h3>
              <p className="text-green-700 mt-1">
                {isOnTrial 
                  ? `Your 14-day free trial has started. You won't be charged until ${trialEndDate?.toLocaleDateString()}.`
                  : 'Your payment was successful. Your subscription is now active.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

<SuccessReload shouldReload={params.success === 'true' && !hasActiveSubscription} />

      {/* Upgrade Success Message */}
      {params.upgraded === 'true' && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-green-900 mb-1">🎉 Plan Updated!</h3>
              <p className="text-green-700 font-medium">
                Your subscription has been upgraded successfully. All new features are now available!
              </p>
              <p className="text-green-600 text-sm mt-2">
                You've been charged the prorated difference. Your next billing date remains the same.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Error Message */}
      {params.error === 'upgrade_failed' && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-bold text-red-900">Upgrade Failed</h3>
              <p className="text-red-700 mt-1">
                We couldn't upgrade your subscription. Please try again or contact support if the issue persists.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trial Canceled Message */}
      {trialCanceled && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-bold text-blue-900">Trial Canceled</h3>
              <p className="text-blue-700 mt-1">
                Your free trial has been canceled. You were not charged. Subscribe anytime to regain access.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Pending Banner */}
      {cancelAtPeriodEnd && cancelAtTimestamp && (
        <CancellationCountdownBanner 
          cancelAt={cancelAtTimestamp}
          currentTier={currentTier}
        />
      )}

      {/* NEW USER (Never Subscribed) - Welcome Card */}
      {!hasActiveSubscription && !hasEverSubscribed && (
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-700 to-blue-600" />
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'1\' height=\'1\' fill=\'rgba(255,255,255,0.5)\'/%3E%3C/svg%3E")', backgroundSize: '60px 60px'}} />
          <div className="relative z-10 p-10">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white text-sm font-medium mb-6">
                  From Contract to Cash. Automated.
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                  One platform for<br />
                  <span className="text-teal-300">your entire workflow.</span>
                </h2>
                <p className="text-lg text-blue-100 mb-8 leading-relaxed">
                  Invonaut handles contracts, e-signatures, invoicing, expense tracking, and cash flow — so you can focus on the work, not the admin.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <a
                    href="#available-plans"
                    className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:shadow-2xl transition-all hover:scale-105 text-center"
                  >
                    Start Free Trial ↓
                  </a>
                  <Link
                    href="/pricing"
                    className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all text-center"
                  >
                    Compare Plans
                  </Link>
                </div>
                <p className="text-blue-200 text-sm font-medium">
                  14-day free trial · No credit card required · Cancel anytime
                </p>
              </div>
              <div className="hidden lg:grid grid-cols-2 gap-4">
                {[
                  { icon: '📄', title: 'Contracts & E-Sigs', desc: 'Send, sign, and track contracts in one place' },
                  { icon: '💸', title: 'Invoicing', desc: 'Create and send professional invoices instantly' },
                  { icon: '📊', title: 'Expense Tracking', desc: 'Categorize expenses and generate tax-ready reports' },
                  { icon: '🤖', title: 'AI Powered', desc: 'Payment predictions, contract review, auto-categorization' },
                  { icon: '🎨', title: 'White Label', desc: 'Your logo, your colors on every document' },
                  { icon: '🏦', title: 'Cash Flow', desc: 'See your financial position at a glance' },
                ].map(item => (
                  <div key={item.title} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <h4 className="font-black text-white text-sm mb-1">{item.title}</h4>
                    <p className="text-blue-200 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LAPSED USER (Had subscription, now inactive) */}
      {!hasActiveSubscription && hasEverSubscribed && (
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-blue-100 p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-gray-900 mb-1">Welcome back</h2>
              <p className="text-gray-600 font-medium">Your data is safe and waiting. Resubscribe below to pick up right where you left off.</p>
            </div>
            <a
              href="#available-plans"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all hover:scale-105 flex-shrink-0"
            >
              View Plans ↓
            </a>
          </div>
        </div>
      )}

      {/* EXISTING USER (Has/Had Subscription) - Current Plan Card */}
      {(hasActiveSubscription || hasEverSubscribed) && (
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
                
                {/* Status Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
                  subscriptionStatus === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : subscriptionStatus === 'past_due'
                    ? 'bg-red-100 text-red-800'
                    : subscriptionStatus === 'trialing'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {subscriptionStatus === 'active' && '✓ Active'}
                  {subscriptionStatus === 'past_due' && '⚠ Past Due'}
                  {subscriptionStatus === 'trialing' && '⏱ Trial'}
                  {(subscriptionStatus === 'canceled' || !hasActiveSubscription) && '💤 Inactive'}
                </div>

                {/* Trial Status Info */}
                {isOnTrial && trialEndDate && (
                  <div className="bg-blue-100 border-2 border-blue-200 rounded-xl p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-blue-900 mb-1">🎁 Free Trial Active</h4>
                        <p className="text-sm text-blue-700 font-semibold">
                          {daysLeftInTrial} {daysLeftInTrial === 1 ? 'day' : 'days'} remaining in your free trial
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                          You'll be charged <span className="font-bold">${currentPlan?.price}/month</span> starting {trialEndDate.toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                        <p className="text-xs text-blue-500 mt-1 italic">
                          Cancel anytime before then with no charge
                        </p>
                      </div>
                    </div>
                  </div>
                )}
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
              {/* Manage Subscription Section */}
              <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
                  Manage Subscription
                </h3>
                
                {/* STARTER USERS */}
                {currentTier === 'starter' && (
                  <>
                    {hasActiveSubscription && !cancelAtPeriodEnd ? (
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4 mb-3">
                          <h4 className="text-sm font-bold text-blue-900 mb-2">✨ Unlock More Features</h4>
                          <p className="text-sm text-blue-700 mb-3">
                            Upgrade to Professional for unlimited invoices, white-label branding, and advanced AI predictions.
                          </p>
                          <Link
                            href="/pricing"
                            className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all hover:scale-105"
                          >
                            Upgrade to Professional
                          </Link>
                        </div>
                        
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="bg-gray-50 px-2 text-gray-500">or</span>
                          </div>
                        </div>
                        
                        <CancelSubscriptionButton currentTier={currentTier} />
                        
                        <p className="text-xs text-gray-600 text-center mt-2">
                          Canceling ends your subscription but keeps your data safe. You can reactivate anytime.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-bold text-blue-900 mb-1">No Active Subscription</h4>
                            <p className="text-sm text-blue-700 mb-3">
                              {hasEverSubscribed 
                                ? 'Reactivate your subscription to unlock all features.'
                                : 'Start a 14-day free trial of Starter or Professional to unlock all features.'}
                            </p>
                            <Link
                              href="/pricing"
                              className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:shadow-xl transition-all"
                            >
                              {hasEverSubscribed ? 'Subscribe Now' : 'View Plans & Start Trial'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* PROFESSIONAL USERS */}
                {currentTier === 'professional' && (
                  <>
                    {hasActiveSubscription && !cancelAtPeriodEnd ? (
                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 border-2 border-purple-200 rounded-xl p-4 mb-3">
                          <h4 className="text-sm font-bold text-purple-900 mb-2">🚀 Unlock Business Features</h4>
                          <p className="text-sm text-purple-700 mb-3">
                            Upgrade to Business for budget alerts, multi-party signing, version control, and 3 team seats.
                          </p>
                          <Link
                            href="/pricing"
                            className="block w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white text-center px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all hover:scale-105"
                          >
                            Upgrade to Business
                          </Link>
                        </div>

                        <div className="relative py-2">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="bg-gray-50 px-3 text-gray-500 font-medium">or manage plan</span>
                          </div>
                        </div>

                        <div>
                          <DowngradeConfirmButton 
                            currentTier={currentTier}
                            targetTier="starter"
                            buttonText="Downgrade to Starter"
                            className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all hover:scale-105"
                          />
                          <p className="text-xs text-gray-600 mt-1.5">
                            Keep your invoices & clients, save money with Starter features
                          </p>
                        </div>
                        
                        <div className="relative py-2">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="bg-gray-50 px-3 text-gray-500 font-medium">or cancel completely</span>
                          </div>
                        </div>
                        
                        <div>
                          <CancelSubscriptionButton currentTier={currentTier} />
                          <p className="text-xs text-gray-600 mt-1.5">
                            End subscription (your data stays safe, locked until you resubscribe)
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-bold text-blue-900 mb-1">No Active Subscription</h4>
                            <p className="text-sm text-blue-700 mb-3">
                              {hasEverSubscribed 
                                ? 'Reactivate your subscription to regain access to all your features.'
                                : 'Start a 14-day free trial to unlock all features.'}
                            </p>
                            <Link
                              href="/pricing"
                              className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:shadow-xl transition-all"
                            >
                              {hasEverSubscribed ? 'Subscribe Now' : 'View Plans & Start Trial'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* BUSINESS USERS */}
                {currentTier === 'business' && (
                  <>
                    {hasActiveSubscription && !cancelAtPeriodEnd ? (
                      <div className="space-y-3">
                        <div>
                          <DowngradeConfirmButton 
                            currentTier={currentTier}
                            targetTier="professional"
                            buttonText="Downgrade to Professional"
                            className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all hover:scale-105"
                          />
                          <p className="text-xs text-gray-600 mt-1.5">
                            Switch to Professional ($60/mo) — keep all your data
                          </p>
                        </div>
                        
                        <div className="relative py-2">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="bg-gray-50 px-3 text-gray-500 font-medium">or cancel completely</span>
                          </div>
                        </div>
                        
                        <div>
                          <CancelSubscriptionButton currentTier={currentTier} />
                          <p className="text-xs text-gray-600 mt-1.5">
                            End subscription (your data stays safe, locked until you resubscribe)
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-bold text-blue-900 mb-1">No Active Subscription</h4>
                            <p className="text-sm text-blue-700 mb-3">
                              {hasEverSubscribed 
                                ? 'Reactivate your Business subscription to regain access.'
                                : 'Start a 14-day free trial to unlock all Business features.'}
                            </p>
                            <Link
                              href="/pricing"
                              className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:shadow-xl transition-all"
                            >
                              {hasEverSubscribed ? 'Subscribe Now' : 'View Plans & Start Trial'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {cancelAtPeriodEnd && (
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                    <p className="text-sm text-orange-900 font-medium text-center">
                      Your subscription is set to downgrade. Use the "Reactivate" button in the banner above to undo.
                    </p>
                  </div>
                )}
              </div>

              {/* Billing Information - WITH NEXT BILLING DATE */}
              <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                  Billing Information
                </h3>
                {hasActiveSubscription ? (
                  <div className="space-y-3 text-sm">
                    {/* Next Billing Date */}
                    {nextBillingDate && subscriptionStatus === 'active' && (
                      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-600 font-medium">Next Billing Date:</span>
                          <span className="text-gray-900 font-bold">
                            {nextBillingDate.toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          ${currentPlan?.price}/month will be charged on this date
                        </p>
                      </div>
                    )}
                    
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
      )}

      {/* Available Plans */}
      <div id="available-plans">
        <h2 className="text-2xl font-black text-gray-900 mb-6">
          {!hasEverSubscribed ? 'Choose Your Plan' : 'Available Plans'}
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentTier && hasActiveSubscription
            return (
              <div
                key={plan.id}
                className={`rounded-2xl border-2 p-6 transition-all ${
                  isCurrentPlan
                    ? 'border-blue-500 bg-blue-50'
                    : plan.id === 'professional'
                    ? 'border-blue-300 bg-white hover:border-blue-400 hover:shadow-xl'
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

                {!isCurrentPlan && plan.id === 'professional' && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                      MOST POPULAR
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

                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : hasActiveSubscription ? (
                  <>
                    {(() => {
                      const tiers = ['starter', 'professional', 'business']
                      const currentIdx = tiers.indexOf(currentTier)
                      const planIdx = tiers.indexOf(plan.id)
                      if (planIdx > currentIdx) {
                        return (
                          <CheckoutButton
                            priceId={plan.priceId!}
                            planId={plan.id}
                            buttonText={`Upgrade to ${plan.name}`}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm hover:shadow-xl transition-all hover:scale-105"
                          />
                        )
                      } else {
                        return (
                          <DowngradeConfirmButton
                            currentTier={currentTier}
                            targetTier={plan.id}
                            buttonText={`Switch to ${plan.name}`}
                            className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-2 rounded-xl font-bold text-sm hover:shadow-xl transition-all hover:scale-105"
                          />
                        )
                      }
                    })()} 
                  </>
) : (
  <CheckoutButton
    priceId={plan.priceId!}
    planId={plan.id}
    buttonText={hasEverSubscribed ? 'Subscribe Now' : 'Start 14-Day Free Trial'}
    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm hover:shadow-xl transition-all hover:scale-105"
  />
)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}