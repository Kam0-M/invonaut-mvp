import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import Link             from 'next/link'
import { AlertCircle, ArrowLeft, Zap } from 'lucide-react'
import ReactivateSubscriptionButton from '@/components/billing/reactivate-subscription-button'
import CancellationCountdown        from '@/components/billing/cancellation-countdown-display'

export default async function CancellationPendingPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier, stripe_subscription_id, target_tier')
    .eq('id', user.id)
    .single()

  const currentTier = profile?.subscription_tier || 'starter'
  const targetTier  = profile?.target_tier        || 'starter'

  let cancelAtTimestamp: number | null = null
  let isPendingCancellation = false

  if (profile?.stripe_subscription_id) {
    try {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
      isPendingCancellation = subscription.cancel_at_period_end
      if (subscription.cancel_at) cancelAtTimestamp = subscription.cancel_at
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }

  if (!isPendingCancellation || !cancelAtTimestamp) redirect('/dashboard/billing')

  const cancelDate = new Date(cancelAtTimestamp! * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  // Only list features that actually exist in the current product
  const getFeaturesLost = () => {
    if (currentTier === 'business' && targetTier === 'professional') {
      return [
        { title: 'Budget tracking & overspend alerts', desc: 'Category-level monthly limits with 80% and 100% notifications' },
        { title: 'AI daily briefings',                 desc: "Every morning: who owes you, what's at risk, and what to act on" },
        { title: 'Priority support (24hr)',            desc: 'Faster response time on all support requests' },
      ]
    }
    if (currentTier === 'business' && targetTier === 'starter') {
      return [
        { title: 'Unlimited invoices',         desc: 'Back to 25 invoices per month' },
        { title: 'White-label branding',       desc: 'Your logo and colors on every invoice and in the client portal' },
        { title: 'AI payment predictions',     desc: 'Advanced risk scoring and confidence analysis' },
        { title: 'Cash flow forecast',         desc: '90-day runway projections built from live data' },
        { title: 'Bank connections (Plaid)',   desc: 'Direct bank transaction sync and reconciliation' },
        { title: 'Budget tracking & alerts',   desc: 'Per-category spend limits and overspend notifications' },
        { title: 'AI daily briefings',         desc: 'Daily financial intelligence delivered every morning' },
        { title: 'Financial reports hub',      desc: 'P&L, Balance Sheet, Asset Register, Period Comparison' },
      ]
    }
    // Professional → Starter
    return [
      { title: 'Unlimited invoices',       desc: 'Back to 25 invoices per month' },
      { title: 'White-label branding',     desc: 'Your logo and colors on every invoice and in the client portal' },
      { title: 'AI payment predictions',   desc: 'Advanced risk scoring and confidence analysis' },
      { title: 'Cash flow forecast',       desc: '90-day runway projections built from live data' },
      { title: 'Bank connections (Plaid)', desc: 'Direct bank transaction sync and reconciliation' },
      { title: 'Financial reports hub',    desc: 'P&L, Balance Sheet, Asset Register, Period Comparison' },
    ]
  }

  const featuresLost = getFeaturesLost()

  const PLAN_PRICES: Record<string, number> = { starter: 29, professional: 59, business: 109 }
  const targetPrice = PLAN_PRICES[targetTier] ?? 29

  const targetName   = targetTier === 'professional' ? 'Professional' : targetTier === 'business' ? 'Business' : 'Starter'
  const currentName  = currentTier === 'professional' ? 'Professional' : currentTier === 'business' ? 'Business' : 'Starter'

  return (
    <div className="min-h-screen bg-[var(--inv-surf)] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back nav */}
        <Link href="/dashboard/billing"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />Back to Billing
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">Scheduled downgrade</p>
              <h1 className="text-2xl font-black text-gray-900" style={{ letterSpacing: '-.02em' }}>
                Switching to {targetName} on {cancelDate}
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-1">
                You'll keep your {currentName} features until then. Change your mind anytime before that date.
              </p>
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Time remaining on {currentName}</p>
          </div>
          <div className="p-6">
            <CancellationCountdown cancelAt={cancelAtTimestamp!} currentTier={currentTier} />
          </div>
        </div>

        {/* Features being lost */}
        {featuresLost.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">What you'll lose on {cancelDate}</p>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {featuresLost.map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{f.title}</p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What changes */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-sm text-gray-600 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">What happens on {cancelDate}</p>
          <p className="flex gap-2"><span className="text-gray-400">→</span> Your plan switches from {currentName} to {targetName}</p>
          <p className="flex gap-2"><span className="text-gray-400">→</span> Monthly billing changes to <span className="font-bold text-gray-900">${targetPrice}/mo</span></p>
          <p className="flex gap-2"><span className="text-gray-400">→</span> Your data stays intact — nothing is deleted</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <ReactivateSubscriptionButton />
          </div>
          <Link href="/dashboard/billing"
            className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            Keep the change
          </Link>
        </div>

      </div>
    </div>
  )
}
