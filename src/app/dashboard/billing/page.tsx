import { redirect }    from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link            from 'next/link'
import {
  Check, CreditCard, AlertCircle, Zap,
  Clock, CheckCircle2,
} from 'lucide-react'
import CancelSubscriptionButton  from '@/components/billing/cancel-subscription-button'
import DowngradeConfirmButton    from '@/components/billing/downgrade-confirm-button'
import CancellationCountdownBanner from '@/components/billing/cancellation-countdown-banner'
import SuccessReload             from '@/components/billing/success-reload'
import BillingPlansSection       from '@/components/billing/billing-plans-section'

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; trial_canceled?: string; upgraded?: string; error?: string }>
}) {
  const params   = await searchParams
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier, stripe_customer_id, stripe_subscription_id, subscription_status, trial_end_date, trial_plan')
    .eq('id', user.id)
    .single()

  const currentTier          = profile?.subscription_tier    || 'starter'
  const subscriptionStatus   = profile?.subscription_status  || 'inactive'
  const hasActiveSubscription = !!profile?.stripe_subscription_id &&
    (subscriptionStatus === 'active' || subscriptionStatus === 'trialing')
  const hasEverSubscribed    = !!profile?.stripe_customer_id || !!profile?.stripe_subscription_id
  const isOnTrial            = subscriptionStatus === 'trialing'
  const trialEndDate         = profile?.trial_end_date ? new Date(profile.trial_end_date) : null
  const daysLeftInTrial      = trialEndDate
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

  const plans = [
    {
      id: 'starter', name: 'Starter',
      monthlyPrice: 29, annualMonthlyPrice: 24, annualTotalPrice: 290,
      color: 'orange',
      tagline: 'Everything you need to get started',
      features: [
        '25 invoices / month',
        'Unlimited clients',
        'Direct payment logging (cash, POS, mobile)',
        'Revenue categories',
        'Basic AI payment predictions',
        'Email invoicing + PDF attachments',
        'Automated follow-up reminders',
        'Expense tracking',
        '3 active contracts',
        'Time tracking + invoice from hours',
        'Client portal (view-only)',
      ],
      monthlyPriceId: process.env.STRIPE_PRICE_ID_STARTER        ?? '',
      annualPriceId:  process.env.STRIPE_PRICE_ID_STARTER_ANNUAL ?? '',
    },
    {
      id: 'professional', name: 'Professional',
      monthlyPrice: 59, annualMonthlyPrice: 49, annualTotalPrice: 590,
      color: 'blue',
      tagline: 'For growing businesses that need more',
      features: [
        'Unlimited invoices + direct payments',
        'Unlimited clients + contracts',
        'White-label branding (logo & colours)',
        'Branded client portal + file storage',
        'Cash flow forecast (90-day)',
        'Revenue intelligence dashboard',
        'Advanced AI predictions',
        'AI contract review',
        'AI expense categorisation',
        'Weekly time summary emails',
      ],
      monthlyPriceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL        ?? '',
      annualPriceId:  process.env.STRIPE_PRICE_ID_PROFESSIONAL_ANNUAL ?? '',
    },
    {
      id: 'business', name: 'Business',
      monthlyPrice: 109, annualMonthlyPrice: 91, annualTotalPrice: 1090,
      color: 'teal',
      tagline: 'Full autonomy for serious operations',
      features: [
        'Everything in Professional',
        'Budget tracking & alerts',
        'Per-category monthly limits',
        '80% & 100% overspend notifications',
        'Multi-party contract signing (soon)',
        'Contract version control (soon)',
        '3 team seats (soon)',
        'Priority email support (24hr)',
        'Early access to new features',
      ],
      monthlyPriceId: process.env.STRIPE_PRICE_ID_BUSINESS        ?? '',
      annualPriceId:  process.env.STRIPE_PRICE_ID_BUSINESS_ANNUAL ?? '',
    },
  ]
  const currentPlan  = plans.find(p => p.id === currentTier)
  const trialCanceled = params.trial_canceled === 'true'

  // Status badge config
  const statusBadge: Record<string, { label: string; cls: string }> = {
    active:    { label: '✓ Active',   cls: 'bg-teal-50 text-teal-700 border border-teal-200' },
    trialing:  { label: '⏱ Trial',    cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
    past_due:  { label: '⚠ Past due', cls: 'bg-red-50 text-red-700 border border-red-200'   },
    canceled:  { label: 'Inactive',   cls: 'bg-gray-100 text-gray-600'                       },
    inactive:  { label: 'Inactive',   cls: 'bg-gray-100 text-gray-600'                       },
  }
  const badge = statusBadge[subscriptionStatus] ?? statusBadge.inactive

  return (
    <div className="space-y-5">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Billing & Subscription</p>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-black text-gray-900">{currentPlan?.name ?? 'Starter'} plan</span>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
          {nextBillingDate && subscriptionStatus === 'active' && (
            <span className="text-xs text-gray-400 font-medium">
              Next billing {nextBillingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      <SuccessReload shouldReload={params.success === 'true' && !hasActiveSubscription} />

      {/* ── Toast banners ────────────────────────────────────────────────── */}
      {params.success === 'true' && !trialCanceled && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-teal-900">
              {isOnTrial ? 'Free trial started' : 'Subscription activated'}
            </p>
            <p className="text-xs text-teal-700 font-medium mt-0.5">
              {isOnTrial
                ? `You won't be charged until ${trialEndDate?.toLocaleDateString()}.`
                : 'Your payment was successful. All features are now active.'}
            </p>
          </div>
        </div>
      )}

      {params.upgraded === 'true' && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-teal-900">Plan updated</p>
            <p className="text-xs text-teal-700 font-medium mt-0.5">
              Your subscription has been upgraded. All new features are now available.
            </p>
          </div>
        </div>
      )}

      {params.error === 'upgrade_failed' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-red-900">Upgrade failed</p>
            <p className="text-xs text-red-700 font-medium mt-0.5">
              We couldn't upgrade your subscription. Please try again or contact support.
            </p>
          </div>
        </div>
      )}

      {trialCanceled && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-blue-900">Trial canceled</p>
            <p className="text-xs text-blue-700 font-medium mt-0.5">
              Your free trial has been canceled. You were not charged. Subscribe anytime to regain access.
            </p>
          </div>
        </div>
      )}

      {cancelAtPeriodEnd && cancelAtTimestamp && (
        <CancellationCountdownBanner cancelAt={cancelAtTimestamp} currentTier={currentTier} />
      )}

      {/* ── NEW USER — never subscribed ───────────────────────────────────── */}
      {!hasActiveSubscription && !hasEverSubscribed && (
        <div className="relative overflow-hidden rounded-2xl bg-gray-900 p-8 inv-fade-up">
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />
          <div className="absolute top-0 right-0 w-72 h-72 opacity-[0.07] pointer-events-none"
            style={{ background: 'radial-gradient(circle, #00D4AA 0%, transparent 70%)' }} />
          <div className="relative z-10 max-w-lg">
            <p className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-3">From Contract to Cash. Automated.</p>
            <h2 className="text-3xl font-black text-white mb-3 leading-tight">
              One platform for<br /><span className="text-teal-400">your entire workflow.</span>
            </h2>
            <p className="text-sm text-gray-400 font-medium mb-6 leading-relaxed">
              Contracts, e-signatures, invoicing, expense tracking, and cash flow — so you can focus on the work, not the admin.
            </p>
            <div className="flex items-center gap-3 flex-wrap mb-6">
              {['Contracts & E-sigs', 'AI Predictions', 'White label', 'Cash flow forecast'].map(f => (
                <span key={f} className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 px-3 py-1.5 rounded-full">
                  <Check className="w-3 h-3 text-teal-400" />{f}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <a href="#available-plans"
                className="inline-flex items-center gap-2 btn-primary px-5 py-2.5 rounded-xl text-sm">
                Start Free Trial ↓
              </a>
              <p className="text-xs text-gray-500 font-medium">14 days free · No card required</p>
            </div>
          </div>
        </div>
      )}

      {/* ── LAPSED USER ───────────────────────────────────────────────────── */}
      {!hasActiveSubscription && hasEverSubscribed && (
        <div className="bg-white rounded-2xl border border-blue-100 p-6 flex items-center gap-5 inv-glow-blue">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-900">Welcome back</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Your data is safe and waiting. Resubscribe to pick up right where you left off.
            </p>
          </div>
          <a href="#available-plans"
            className="inline-flex items-center gap-2 btn-primary px-4 py-2 rounded-xl text-sm flex-shrink-0">
            View plans ↓
          </a>
        </div>
      )}

      {/* ── CURRENT PLAN CARD ─────────────────────────────────────────────── */}
      {(hasActiveSubscription || hasEverSubscribed) && currentPlan && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current plan</p>
                <p className="text-sm font-black text-gray-900">{currentPlan.name} · ${currentPlan.monthlyPrice}/mo</p>
              </div>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
          </div>

          <div className="grid md:grid-cols-2 gap-0">
            {/* Left: features */}
            <div className="p-6 border-b md:border-b-0 md:border-r border-gray-50">
              {/* Trial banner */}
              {isOnTrial && trialEndDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 flex items-start gap-3">
                  <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-blue-900">
                      {daysLeftInTrial} day{daysLeftInTrial !== 1 ? 's' : ''} left in your free trial
                    </p>
                    <p className="text-xs text-blue-700 font-medium mt-0.5">
                      You'll be charged ${currentPlan.monthlyPrice}/mo starting{' '}
                      {trialEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
                      Cancel anytime before then.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Included features</p>
              <ul className="space-y-2">
                {currentPlan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: actions + billing */}
            <div className="p-6 space-y-5">
              {/* Billing info */}
              {hasActiveSubscription && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Billing information</p>
                  <div className="space-y-2 text-xs">
                    {nextBillingDate && subscriptionStatus === 'active' && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-50">
                        <span className="text-gray-500 font-medium">Next billing date</span>
                        <span className="font-bold text-gray-900">
                          {nextBillingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-500 font-medium">Subscription ID</span>
                      <span className="font-mono text-gray-700">{profile?.stripe_subscription_id?.slice(0, 18)}…</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-500 font-medium">Customer ID</span>
                      <span className="font-mono text-gray-700">{profile?.stripe_customer_id?.slice(0, 18)}…</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Manage subscription */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Manage subscription</p>

                {!hasActiveSubscription && (
                  <Link href="/pricing"
                    className="block w-full text-center btn-primary px-4 py-2.5 rounded-xl text-sm mb-2">
                    {hasEverSubscribed ? 'Resubscribe' : 'View plans & start trial'}
                  </Link>
                )}

                {hasActiveSubscription && !cancelAtPeriodEnd && (
                  <div className="space-y-3">
                    {/* Upgrade CTA — for non-business */}
                    {currentTier !== 'business' && (
                      <Link href="#available-plans"
                        className="flex items-center justify-between px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors group">
                        <div>
                          <p className="text-xs font-black text-blue-900">
                            Upgrade to {currentTier === 'starter' ? 'Professional' : 'Business'}
                          </p>
                          <p className="text-xs text-blue-600 font-medium mt-0.5">
                            {currentTier === 'starter'
                              ? 'Unlock white label, unlimited invoices, cash flow forecast'
                              : 'Unlock budget tracking, overspend alerts, priority support'}
                          </p>
                        </div>
                        <span className="text-blue-600 font-black text-sm group-hover:translate-x-0.5 transition-transform">→</span>
                      </Link>
                    )}

                    {/* Downgrade — for professional and business */}
                    {currentTier === 'professional' && (
                      <DowngradeConfirmButton
                        currentTier={currentTier} targetTier="starter"
                        buttonText="Downgrade to Starter"
                        className="w-full px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                      />
                    )}
                    {currentTier === 'business' && (
                      <DowngradeConfirmButton
                        currentTier={currentTier} targetTier="professional"
                        buttonText="Downgrade to Professional"
                        className="w-full px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                      />
                    )}

                    <CancelSubscriptionButton currentTier={currentTier} />
                    <p className="text-xs text-gray-400 font-medium text-center">
                      Canceling ends your subscription but keeps your data safe
                    </p>
                  </div>
                )}

                {cancelAtPeriodEnd && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-medium">
                    Subscription set to cancel. Use "Reactivate" in the banner above to undo.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Available plans ───────────────────────────────────────────────── */}
      <BillingPlansSection
        plans={plans}
        currentTier={currentTier}
        hasActiveSubscription={hasActiveSubscription}
        hasEverSubscribed={hasEverSubscribed}
      />

      {/* ── Affiliate banner ──────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #002ECC 0%, #0044EE 40%, #0055FF 70%, #003DCC 100%)',
        borderRadius: 16,
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        flexWrap: 'wrap',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 60% 80% at 110% 50%,rgba(0,196,160,0.2) 0%,transparent 60%)',pointerEvents:'none'}}/>
        <div style={{flex:1,minWidth:220,position:'relative'}}>
          <p style={{fontSize:'.68rem',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.45)',marginBottom:6}}>Affiliate Programme</p>
          <p style={{fontWeight:800,fontSize:'1rem',color:'#fff',marginBottom:4,letterSpacing:'-.01em'}}>
            Earn 30% recurring — for every referral.
          </p>
          <p style={{fontSize:'.825rem',color:'rgba(255,255,255,0.55)',lineHeight:1.6}}>
            Know a freelancer or small business? Share your link. Earn every month they stay subscribed.
          </p>
        </div>
        <Link
          href="/dashboard/affiliate"
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 24px',
            background: '#fff',
            color: '#0044EE',
            fontWeight: 800,
            fontSize: '.875rem',
            borderRadius: 10,
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            position: 'relative',
          }}
        >
          Get my referral link
          <Zap size={14}/>
        </Link>
      </div>
    </div>
  )
}
