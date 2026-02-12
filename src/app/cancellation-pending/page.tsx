import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import ReactivateSubscriptionButton from '@/components/billing/reactivate-subscription-button'
import CancellationCountdown from '@/components/billing/cancellation-countdown-display'

export default async function CancellationPendingPage() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier, stripe_subscription_id, target_tier')
    .eq('id', user.id)
    .single()

  const currentTier = profile?.subscription_tier || 'starter'
  const targetTier = profile?.target_tier || 'starter'

  let cancelAtTimestamp: number | null = null
  let isPendingCancellation = false
  
  if (profile?.stripe_subscription_id) {
    try {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
      isPendingCancellation = subscription.cancel_at_period_end
      
      if (subscription.cancel_at) {
        cancelAtTimestamp = subscription.cancel_at
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }

  if (!isPendingCancellation || !cancelAtTimestamp) {
    redirect('/dashboard/billing')
  }

  const cancelDate = new Date(cancelAtTimestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // EXACT features - MUST MATCH confirmation modal exactly
  const getFeaturesYouWillLose = () => {
    // Business → Professional: Lose team features (4 features - MUST MATCH modal)
    if (currentTier === 'business' && targetTier === 'professional') {
      return [
        {
          title: 'Team Collaboration Features',
          description: 'Multi-user access and team features',
        },
        {
          title: 'Multi-User Access',
          description: 'Add team members to your account',
        },
        {
          title: 'API Access',
          description: 'Programmatic access to your invoice data',
        },
        {
          title: 'Dedicated Support',
          description: 'Priority support with dedicated account manager',
        },
      ]
    }
    
    // Business → Starter: Lose EVERYTHING (8 features)
    if (currentTier === 'business' && targetTier === 'starter') {
      return [
        {
          title: 'White Label Branding',
          description: 'Custom logo and brand colors on invoices',
        },
        {
          title: 'Unlimited Invoices',
          description: 'Back to 25 invoices per month limit',
        },
        {
          title: 'Advanced AI Predictions',
          description: 'Confidence scoring and detailed risk analysis',
        },
        {
          title: 'Priority Support',
          description: 'Faster response times',
        },
        {
          title: 'Team Collaboration Features',
          description: 'Multi-user access and team features',
        },
        {
          title: 'Multi-User Access',
          description: 'Add team members to your account',
        },
        {
          title: 'API Access',
          description: 'Programmatic access to your data',
        },
        {
          title: 'Dedicated Support',
          description: 'Personal account manager',
        },
      ]
    }
    
    // Professional → Starter: Lose white label features (4 features)
    if (currentTier === 'professional' && targetTier === 'starter') {
      return [
        {
          title: 'White Label Branding',
          description: 'Custom logo and brand colors on invoices',
        },
        {
          title: 'Unlimited Invoices',
          description: 'Back to 25 invoices per month limit',
        },
        {
          title: 'Advanced AI Predictions',
          description: 'Confidence scoring and detailed risk analysis',
        },
        {
          title: 'Priority Support',
          description: 'Faster response times and dedicated help',
        },
      ]
    }

    return []
  }

  const featuresYouWillLose = getFeaturesYouWillLose()

  // Get proper target tier name
  const getTargetTierName = () => {
    if (targetTier === 'professional') return 'Professional'
    if (targetTier === 'starter') return 'Starter'
    return targetTier
  }

  const targetTierName = getTargetTierName()
  const isDowngradingToStarter = targetTier === 'starter'

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Billing
        </Link>

        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4">
            Your Subscription is Downgrading Soon
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your <span className="font-bold capitalize">{currentTier}</span> plan will switch to{' '}
            <span className="font-bold capitalize">{targetTierName}</span> on{' '}
            <span className="font-bold text-orange-600">{cancelDate}</span>
          </p>
        </div>

        {/* Countdown Card */}
        <div className="bg-white rounded-2xl border-2 border-orange-200 p-8 mb-8 shadow-xl">
          <CancellationCountdown 
            cancelAt={cancelAtTimestamp}
            currentTier={currentTier}
          />
        </div>

        {/* What You'll Lose Section - ALL features displayed */}
        {featuresYouWillLose.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-black text-gray-900 mb-4">
              What You'll Lose on {cancelDate}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {featuresYouWillLose.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">✕</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <ReactivateSubscriptionButton />
          <Link
            href="/dashboard/billing"
            className="block w-full sm:w-auto text-center bg-white border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all"
          >
            Back to Billing
          </Link>
        </div>

        <div className="mt-12 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• You'll keep all {currentTier} features until {cancelDate}</li>
                <li>• {isDowngradingToStarter 
                  ? `Your billing will switch to $30/month (${targetTierName} plan)` 
                  : `Your billing will switch to $60/month (${targetTierName} plan)`}</li>
                <li>• Your subscription will automatically switch to the {targetTierName} plan</li>
                <li>• You can reactivate your {currentTier} plan anytime before {cancelDate}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}