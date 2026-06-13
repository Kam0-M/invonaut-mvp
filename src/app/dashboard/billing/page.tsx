import { redirect }    from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link            from 'next/link'
import { Check, CreditCard, Zap, Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import CancelSubscriptionButton     from '@/components/billing/cancel-subscription-button'
import DowngradeConfirmButton       from '@/components/billing/downgrade-confirm-button'
import CancellationCountdownBanner  from '@/components/billing/cancellation-countdown-banner'
import SuccessReload                from '@/components/billing/success-reload'
import BillingPlansSection          from '@/components/billing/billing-plans-section'

export const dynamic = 'force-dynamic'

const PLANS = [
  {
    id: 'starter', name: 'Starter', monthlyPrice: 29, annualMonthlyPrice: 24, annualTotalPrice: 290,
    color: 'orange', tagline: 'Everything you need to get started',
    features: ['25 invoices / month','Unlimited clients','Direct payment logging','Revenue categories',
      'Basic AI payment predictions','Email invoicing + PDF attachments','Automated follow-up reminders',
      'Expense tracking','3 active contracts','Time tracking + invoice from hours','Client portal (view-only)'],
    monthlyPriceId: process.env.STRIPE_PRICE_ID_STARTER        ?? '',
    annualPriceId:  process.env.STRIPE_PRICE_ID_STARTER_ANNUAL ?? '',
  },
  {
    id: 'professional', name: 'Professional', monthlyPrice: 59, annualMonthlyPrice: 49, annualTotalPrice: 590,
    color: 'blue', tagline: 'For growing businesses that need more',
    features: ['Unlimited invoices + direct payments','Unlimited clients + contracts',
      'White-label branding (logo & colours)','Branded client portal + file storage',
      'Cash flow forecast (90-day)','Revenue intelligence dashboard','Advanced AI predictions',
      'AI contract review','AI expense categorisation','Weekly time summary emails'],
    monthlyPriceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL        ?? '',
    annualPriceId:  process.env.STRIPE_PRICE_ID_PROFESSIONAL_ANNUAL ?? '',
  },
  {
    id: 'business', name: 'Business', monthlyPrice: 109, annualMonthlyPrice: 91, annualTotalPrice: 1090,
    color: 'teal', tagline: 'Full autonomy for serious operations',
    features: ['Everything in Professional','Budget tracking & alerts','Per-category monthly limits',
      '80% & 100% overspend notifications','AI daily financial briefings',
      'Priority email support (24hr)','Early access to new features'],
    monthlyPriceId: process.env.STRIPE_PRICE_ID_BUSINESS        ?? '',
    annualPriceId:  process.env.STRIPE_PRICE_ID_BUSINESS_ANNUAL ?? '',
  },
]

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ success?: string; trial_canceled?: string; upgraded?: string; error?: string }> }) {
  const params   = await searchParams
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier, stripe_customer_id, stripe_subscription_id, subscription_status, trial_end_date, trial_plan')
    .eq('id', user.id)
    .single()

  const currentTier           = profile?.subscription_tier   || 'starter'
  const subscriptionStatus    = profile?.subscription_status || 'inactive'
  const hasActiveSubscription = !!profile?.stripe_subscription_id &&
    (subscriptionStatus === 'active' || subscriptionStatus === 'trialing')
  const hasEverSubscribed     = !!profile?.stripe_customer_id || !!profile?.stripe_subscription_id
  const isOnTrial             = subscriptionStatus === 'trialing'
  const trialEndDate          = profile?.trial_end_date ? new Date(profile.trial_end_date) : null
  const daysLeftInTrial       = trialEndDate
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / 86_400_000)) : 0

  let cancelAtPeriodEnd  = false
  let cancelAtTimestamp: number | null = null
  let nextBillingDate: Date | null     = null

  if (profile?.stripe_subscription_id) {
    try {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const sub    = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
      cancelAtPeriodEnd = sub.cancel_at_period_end
      if (sub.cancel_at_period_end && sub.cancel_at) cancelAtTimestamp = sub.cancel_at
      if (sub.status === 'active') {
        const pe = (sub as any).current_period_end
        if (pe != null) nextBillingDate = new Date(pe * 1000)
      }
    } catch { /* stripe not reachable in dev */ }
  }

  const currentPlan  = PLANS.find(p => p.id === currentTier)
  const trialCanceled = params.trial_canceled === 'true'

  const TIER_COLOR: Record<string, string> = {
    starter: 'var(--inv-orange)', professional: 'var(--inv-blue)', business: 'var(--inv-teal)',
  }
  const planColor = TIER_COLOR[currentTier] || 'var(--inv-blue)'

  return (
    <div className="space-y-5">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold text-[#0055FF] uppercase tracking-widest mb-1">Billing & Subscription</p>
        <h1 className="text-2xl font-black text-gray-900" style={{ letterSpacing: '-.02em' }}>Your plan</h1>
      </div>

      <SuccessReload shouldReload={params.success === 'true' && !hasActiveSubscription} />

      {/* ── Toasts ────────────────────────────────────────────────────────── */}
      {params.success === 'true' && !trialCanceled && (
        <div className="bg-[#00C4A0]/10 border border-[#00C4A0]/30 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-[#00C4A0] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-gray-900">{isOnTrial ? 'Free trial started' : 'Subscription activated'}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {isOnTrial ? `You won't be charged until ${trialEndDate?.toLocaleDateString()}.` : 'Payment successful. All features are now active.'}
            </p>
          </div>
        </div>
      )}
      {params.upgraded === 'true' && (
        <div className="bg-[#00C4A0]/10 border border-[#00C4A0]/30 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-[#00C4A0] flex-shrink-0 mt-0.5" />
          <p className="text-sm font-black text-gray-900">Plan updated — all new features are now active.</p>
        </div>
      )}
      {params.error === 'upgrade_failed' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-gray-900">Upgrade failed</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Please try again or contact us at kamo@invonaut.app.</p>
          </div>
        </div>
      )}
      {trialCanceled && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-gray-900">Trial canceled</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">You were not charged. Subscribe anytime to regain access.</p>
          </div>
        </div>
      )}
      {cancelAtPeriodEnd && cancelAtTimestamp && (
        <CancellationCountdownBanner cancelAt={cancelAtTimestamp} currentTier={currentTier} />
      )}

      {/* ── NEW USER — dark hero ───────────────────────────────────────────── */}
      {!hasActiveSubscription && !hasEverSubscribed && (
        <div className="relative overflow-hidden rounded-2xl bg-[#070C1A] p-8 md:p-10">
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 55% 70% at 110% 20%, rgba(0,196,160,0.18) 0%, transparent 60%), radial-gradient(ellipse 40% 60% at -5% 80%, rgba(0,85,255,0.14) 0%, transparent 60%)',
          }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#00C4A0] mb-4">From Contract to Cash. Automated.</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight" style={{ fontFamily: "'Fraunces', serif", letterSpacing: '-.03em' }}>
              One platform.<br /><span className="text-[#00C4A0]">Every dollar captured.</span>
            </h2>
            <p className="text-sm text-gray-400 font-medium mb-8 max-w-md leading-relaxed">
              Invoices, contracts, time tracking, direct payments, and 90-day cash forecasting — all automated, all in one place.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {['AI predictions', 'White label', 'Cash flow forecast', 'Client portal', 'Auto follow-ups'].map(f => (
                <span key={f} className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 px-3 py-1.5 rounded-full">
                  <Check className="w-3 h-3 text-[#00C4A0]" />{f}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <a href="#available-plans" className="inline-flex items-center gap-2 btn-primary px-6 py-3 rounded-xl text-sm font-bold">
                Start 14-day free trial <ArrowRight className="w-4 h-4" />
              </a>
              <p className="text-xs text-gray-500 font-medium">No credit card required</p>
            </div>
          </div>
        </div>
      )}

      {/* ── LAPSED USER ───────────────────────────────────────────────────── */}
      {!hasActiveSubscription && hasEverSubscribed && (
        <div className="bg-white rounded-2xl border border-[#0055FF]/20 p-6 flex items-center gap-5 flex-wrap" style={{ boxShadow: '0 0 32px rgba(0,85,255,0.06)' }}>
          <div className="w-10 h-10 rounded-xl bg-[#0055FF] flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-900">Welcome back</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Your data is safe and waiting. Resubscribe to pick up right where you left off.</p>
          </div>
          <a href="#available-plans" className="inline-flex items-center gap-2 btn-primary px-5 py-2.5 rounded-xl text-sm flex-shrink-0">
            View plans
          </a>
        </div>
      )}

      {/* ── CURRENT PLAN ──────────────────────────────────────────────────── */}
      {(hasActiveSubscription || hasEverSubscribed) && currentPlan && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

          {/* Plan identity strip */}
          <div className="px-6 pt-6 pb-5 border-b border-gray-50">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                {/* Color swatch */}
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: planColor }}>
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black text-gray-900" style={{ letterSpacing: '-.02em' }}>
                      {currentPlan.name}
                    </h2>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      subscriptionStatus === 'active'   ? 'bg-[#00C4A0]/10 text-[#00a889] border border-[#00C4A0]/30' :
                      subscriptionStatus === 'trialing' ? 'bg-blue-50 text-blue-700 border border-blue-200'            :
                      subscriptionStatus === 'past_due' ? 'bg-red-50 text-red-600 border border-red-200'              :
                      'bg-gray-100 text-gray-500'}`}>
                      {subscriptionStatus === 'active'   && 'Active'}
                      {subscriptionStatus === 'trialing' && 'Trial'}
                      {subscriptionStatus === 'past_due' && 'Past due'}
                      {(subscriptionStatus === 'canceled' || subscriptionStatus === 'inactive') && 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">${currentPlan.monthlyPrice}/mo · {currentPlan.tagline}</p>
                </div>
              </div>
              {/* Billing date */}
              {nextBillingDate && subscriptionStatus === 'active' && (
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-medium">Next billing</p>
                  <p className="text-sm font-black text-gray-900 mt-0.5">
                    {nextBillingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>

            {/* Trial warning */}
            {isOnTrial && trialEndDate && (
              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-3">
                <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-blue-800">
                  <span className="font-black">{daysLeftInTrial} day{daysLeftInTrial !== 1 ? 's' : ''} left in your trial.</span>{' '}
                  You'll be charged ${currentPlan.monthlyPrice}/mo starting{' '}
                  {trialEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}. Cancel anytime before then.
                </p>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-50">

            {/* Features column */}
            <div className="p-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">What's included</p>
              <ul className="space-y-2.5">
                {currentPlan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: planColor }}>
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions column */}
            <div className="p-6 space-y-6">

              {/* Billing info */}
              {hasActiveSubscription && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Billing</p>
                  <div className="space-y-0">
                    {nextBillingDate && subscriptionStatus === 'active' && (
                      <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                        <span className="text-xs text-gray-500 font-medium">Next charge</span>
                        <span className="text-xs font-bold text-gray-900">
                          ${currentPlan.monthlyPrice} on {nextBillingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                      <span className="text-xs text-gray-500 font-medium">Subscription</span>
                      <span className="text-xs font-mono text-gray-600">{profile?.stripe_subscription_id?.slice(0, 20)}…</span>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-xs text-gray-500 font-medium">Customer</span>
                      <span className="text-xs font-mono text-gray-600">{profile?.stripe_customer_id?.slice(0, 20)}…</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Manage</p>
                <div className="space-y-2">

                  {!hasActiveSubscription && (
                    <Link href="/pricing"
                      className="flex items-center justify-between px-4 py-3 rounded-xl btn-primary text-sm">
                      <span>{hasEverSubscribed ? 'Resubscribe' : 'View plans & start trial'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}

                  {hasActiveSubscription && !cancelAtPeriodEnd && (
                    <>
                      {currentTier !== 'business' && (
                        <a href="#available-plans"
                          className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#F8FAFF] border border-[#0055FF]/15 hover:border-[#0055FF]/30 hover:bg-[#EFF4FF] transition-colors group">
                          <div>
                            <p className="text-xs font-black text-[#0055FF]">
                              Upgrade to {currentTier === 'starter' ? 'Professional' : 'Business'}
                            </p>
                            <p className="text-xs text-[#0055FF]/60 font-medium mt-0.5">
                              {currentTier === 'starter'
                                ? 'Unlock white-label, unlimited invoices, cash flow forecast'
                                : 'Unlock budget alerts, daily AI briefings, priority support'}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#0055FF]/50 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                        </a>
                      )}

                      {currentTier === 'professional' && (
                        <DowngradeConfirmButton currentTier={currentTier} targetTier="starter"
                          buttonText="Switch to Starter"
                          className="w-full px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors text-center" />
                      )}
                      {currentTier === 'business' && (
                        <DowngradeConfirmButton currentTier={currentTier} targetTier="professional"
                          buttonText="Switch to Professional"
                          className="w-full px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors text-center" />
                      )}

                      <div className="pt-1">
                        <CancelSubscriptionButton currentTier={currentTier} />
                      </div>
                      <p className="text-xs text-gray-400 font-medium text-center">
                        Canceling ends your plan at the current billing period — your data stays safe.
                      </p>
                    </>
                  )}

                  {cancelAtPeriodEnd && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 font-medium">
                      Scheduled to switch at period end. Use "Reactivate" in the banner above to undo.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Available plans ───────────────────────────────────────────────── */}
      <BillingPlansSection
        plans={PLANS}
        currentTier={currentTier}
        hasActiveSubscription={hasActiveSubscription}
        hasEverSubscribed={hasEverSubscribed}
      />

      {/* ── Affiliate banner ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl p-7 md:p-8" style={{
        background: 'linear-gradient(135deg, #002ECC 0%, #0044EE 50%, #0055FF 100%)',
      }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 80% at 110% 50%, rgba(0,196,160,0.22) 0%, transparent 60%)',
        }} />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        <div className="relative flex items-center gap-6 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Affiliate Programme</p>
            <p className="font-black text-white text-lg leading-tight mb-1" style={{ letterSpacing: '-.02em' }}>
              Earn 30% recurring — for every referral.
            </p>
            <p className="text-sm text-white/50 font-medium">
              Know a business that needs this? Share your link. Earn every month they stay subscribed.
            </p>
          </div>
          <Link href="/dashboard/affiliate" className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0044EE] font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
            Get my referral link <Zap className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  )
}
