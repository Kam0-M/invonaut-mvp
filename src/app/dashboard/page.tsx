// Force a fresh server fetch on every visit — prevents Next.js router cache
// from serving stale chart/revenue data after payments or invoice updates.
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isSubscriptionActive } from '@/lib/subscription-status'
import { FileText, Users, TrendingUp, Lock } from 'lucide-react'
import { getInvoiceDisplayStatus } from '@/lib/utils/invoice-status'
import { getContextualMessage } from '@/lib/utils/get-welcome-message'
import ViewOnlyBanner              from '@/components/view-only-banner'
import DashboardAutoRefresh        from '@/components/dashboard/dashboard-auto-refresh'
import OnboardingChecklist         from '@/components/dashboard/onboarding-checklist'
import AICommandCenter             from '@/components/dashboard/ai-command-center'
import RevenueStorySection         from '@/components/dashboard/revenue-story-section'
import RiskAttentionPanel          from '@/components/dashboard/risk-attention-panel'
import OpportunityPanel            from '@/components/dashboard/opportunity-panel'
import ActivityFeedLive, { ActivityItem } from '@/components/dashboard/activity-feed-live'
import IntelligenceFeed            from '@/components/intelligence/intelligence-feed'
import WelcomeModal               from '@/components/dashboard/welcome-modal'
import { makeCurrencyFormatter, makeCompactFormatter }  from '@/lib/utils/currency'


export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id, stripe_subscription_id, subscription_status, subscription_tier, trial_end_date, business_name, full_name, logo_url, currency, currency_symbol')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription = isSubscriptionActive(profile)

  const tier = profile?.subscription_tier ?? 'starter'
  const fmt = makeCurrencyFormatter((profile as any)?.currency || 'USD', (profile as any)?.currency_symbol)
  const fmtCompact = makeCompactFormatter((profile as any)?.currency || 'USD', (profile as any)?.currency_symbol)
  const isPro = tier === 'professional' || tier === 'business'

  // Intelligence insights (Pro+, active subscription only — render below is
  // already gated this way; gate the query itself too so a canceled former
  // Pro/Business user doesn't trigger a needless DB read every page load)
  const { data: insights } = hasActiveSubscription && isPro ? await supabase
    .from('financial_insights')
    .select('id,type,urgency,title,body,action_label,action_url,status,created_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(10)
  : { data: [] }

  const lastInsight = (insights ?? [])[0]?.created_at ?? null
  let dashInvoiceCount = 0
  let dashInvoiceLimitReached = false
  if (hasActiveSubscription && tier === 'starter') {
    const startOfMonth = new Date()
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())
    dashInvoiceCount = count ?? 0
    dashInvoiceLimitReached = dashInvoiceCount >= 25
  }

  // ── Data fetching ─────────────────────────────────────────────────────────
  const { data: invoiceData } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, issue_date, due_date, total_amount, created_at, last_followed_up, ai_risk_score, clients!inner(name, company)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const invoices = (invoiceData ?? []).map((inv: any) => ({
    ...inv,
    clients: Array.isArray(inv.clients) ? inv.clients[0] : inv.clients,
    displayStatus: getInvoiceDisplayStatus({ status: inv.status, due_date: inv.due_date }),
  }))

  const { data: clientData } = await supabase
    .from('clients').select('id, name, email, company, created_at')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(8)
  const clients = (clientData ?? []) as any[]

  const { data: directPaymentsRaw } = await supabase
    .from('direct_payments')
    .select('id, amount, description, payment_date, created_at, revenue_categories(name)')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
  const directPayments = (directPaymentsRaw ?? []) as any[]

  const { data: expensesRaw } = await supabase
    .from('expenses').select('id, amount').eq('user_id', user.id).limit(200)
  const allExpenses = (expensesRaw ?? []) as any[]

  const { data: activeContractsRaw } = await supabase
    .from('contracts').select('id, title, total_value, expiry_date, reminders_dismissed, client_id')
    .eq('user_id', user.id).eq('status', 'active')
  const activeContracts = (activeContractsRaw ?? []) as any[]

  const { data: recentSigsRaw } = await supabase
    .from('contract_signatures')
    .select('id, signer_name, signed_at, contracts!inner(title, user_id)')
    .order('signed_at', { ascending: false }).limit(5)

  const { data: followUpRaw } = await supabase
    .from('invoices')
    .select('id, invoice_number, last_followed_up, ai_risk_score, clients!inner(name)')
    .eq('user_id', user.id).not('last_followed_up', 'is', null)
    .order('last_followed_up', { ascending: false }).limit(3)

  const { data: timeEntriesRaw } = await supabase
    .from('time_entries').select('duration_seconds, hourly_rate, billable, invoice_id')
    .eq('user_id', user.id).eq('billable', true).is('invoice_id', null)
  const unbilledEntries = (timeEntriesRaw ?? []) as any[]

  const { data: portalRaw }   = await supabase.from('portal_settings').select('user_id').eq('user_id', user.id).single()
  const { data: payCheckRaw } = await supabase.from('direct_payments').select('id').eq('user_id', user.id).limit(1)

  // ── Metrics ───────────────────────────────────────────────────────────────
  const now = new Date()
  const now30 = new Date(); now30.setDate(now30.getDate() + 30)

  const invoiceRevenue = invoices.filter((i: any) => i.displayStatus === 'paid')
    .reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)
  const directRevenue  = directPayments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
  const totalRevenue   = invoiceRevenue + directRevenue
  const totalExpenses  = allExpenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0)
  const netProfit      = totalRevenue - totalExpenses
  const profitMargin   = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : null

  const pendingPayments = invoices.filter((i: any) => i.displayStatus === 'sent')
    .reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)

  const paidThisMonth =
    invoices.filter((i: any) => {
      if (i.displayStatus !== 'paid') return false
      const d = new Date(i.issue_date + 'T12:00:00')
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)
    + directPayments.filter((p: any) => {
      const d = new Date(p.payment_date + 'T12:00:00')
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).reduce((s: number, p: any) => s + Number(p.amount || 0), 0)

  const overdueCount = invoices.filter((i: any) => i.displayStatus === 'overdue').length
  const overdueValue = invoices.filter((i: any) => i.displayStatus === 'overdue')
    .reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)

  const expiringSoon = activeContracts.filter((c: any) => {
    if (!c.expiry_date || c.reminders_dismissed) return false
    const e = new Date(c.expiry_date)
    return e <= now30 && e >= now
  }).length

  const followUpsSent = (followUpRaw ?? []).length

  const unbilledSeconds = unbilledEntries.reduce((s: number, e: any) => s + (e.duration_seconds ?? 0), 0)
  const unbilledHours   = Math.round((unbilledSeconds / 3600) * 100) / 100
  const unbilledValue   = unbilledEntries.reduce((s: number, e: any) => {
    if (!e.hourly_rate || !e.duration_seconds) return s
    return s + Math.round((e.duration_seconds / 3600) * e.hourly_rate * 100) / 100
  }, 0)

  const totalContractValue = activeContracts.reduce((s: number, c: any) => s + Number(c.total_value || 0), 0)

  // ── Business Health Score (preview — full version on Analytics) ───────────
  const sentInvoiceCount = invoices.filter((i: any) => ['sent','paid','overdue'].includes(i.displayStatus)).length
  const paidInvoiceCount = invoices.filter((i: any) => i.displayStatus === 'paid').length
  const collectionRate   = sentInvoiceCount > 0 ? Math.round((paidInvoiceCount / sentInvoiceCount) * 100) : null
  const overdueRatio     = invoices.length > 0 ? overdueCount / invoices.length : 0
  const hasData          = invoices.length > 0 || directPayments.length > 0

  const revenueChartData = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1)
    const y = d.getFullYear(), m = d.getMonth()
    const invoiceRev = invoices
      .filter((i: any) => i.displayStatus === 'paid')
      .filter((i: any) => {
        const d2 = new Date(i.issue_date + 'T12:00:00')
        return d2.getFullYear() === y && d2.getMonth() === m
      })
      .reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)
    const directRev = directPayments
      .filter((p: any) => {
        const d2 = new Date(p.payment_date + 'T12:00:00')
        return d2.getFullYear() === y && d2.getMonth() === m
      })
      .reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
    return {
      month: d.toLocaleString('en-US', { month: 'short' }),
      revenue: invoiceRev + directRev,
      isCurrentMonth: y === now.getFullYear() && m === now.getMonth(),
    }
  })
  const currentMonthRevenue  = revenueChartData[5]?.revenue ?? 0
  const previousMonthRevenue = revenueChartData[4]?.revenue ?? 0

  // BHS revenue growth — computed after chart data
  const bhsRevenueGrowth = previousMonthRevenue > 0
    ? Math.round(((paidThisMonth - previousMonthRevenue) / previousMonthRevenue) * 100)
    : null

  // Compact BHS score (same algorithm as Analytics page)
  const dashBHS = (() => {
    if (!hasData) return { score: 0, grade: 'F', color: 'text-gray-400', label: 'No data yet', glow: 'none', border: 'border-gray-200', scoreColor: '#94A3B8' }
    let s = 0
    s += Math.round(((collectionRate ?? 50) / 100) * 35)
    s += Math.round((Math.max(0, Math.min(100, profitMargin ?? 0)) / 100) * 30)
    s += Math.max(0, 20 - Math.round(overdueRatio * 20))
    const rg = bhsRevenueGrowth ?? 0
    if (rg > 20) s += 15; else if (rg > 0) s += 8; else if (rg === 0) s += 4
    s = Math.min(100, Math.max(0, s))
    if (s >= 85) return { score: s, grade: 'A', color: 'text-teal-600',   label: 'Excellent', glow: '0 0 28px rgba(0,196,160,0.15)', border: 'border-teal-100',   scoreColor: '#00C4A0' }
    if (s >= 70) return { score: s, grade: 'B', color: 'text-blue-600',   label: 'Good',      glow: '0 0 28px rgba(0,85,255,0.12)',  border: 'border-blue-100',   scoreColor: '#0055FF' }
    if (s >= 55) return { score: s, grade: 'C', color: 'text-amber-600',  label: 'Fair',      glow: '0 0 28px rgba(217,119,6,0.12)', border: 'border-amber-100',  scoreColor: '#D97706' }
    if (s >= 35) return { score: s, grade: 'D', color: 'text-orange-600', label: 'At risk',   glow: '0 0 28px rgba(255,107,53,0.12)',border: 'border-orange-100', scoreColor: '#FF6B35' }
    return       { score: s, grade: 'F', color: 'text-red-600',   label: 'Critical',  glow: '0 0 28px rgba(239,68,68,0.14)',  border: 'border-red-100',    scoreColor: '#EF4444' }
  })()

  // ── Activity feed ─────────────────────────────────────────────────────────
  const activity: ActivityItem[] = []

  invoices.filter((i: any) => ['sent','paid','overdue'].includes(i.displayStatus)).slice(0, 5).forEach((inv: any) => {
    activity.push({ id: `inv-${inv.id}`, type: 'invoice',
      title: 'Invoice sent', detail: `${inv.invoice_number} · ${fmt(inv.total_amount)} · ${inv.clients?.name ?? 'Client'}`,
      timestamp: inv.created_at ?? inv.issue_date })
  })
  directPayments.slice(0, 5).forEach((p: any) => {
    const cat = Array.isArray(p.revenue_categories) ? p.revenue_categories[0] : p.revenue_categories
    activity.push({ id: `pay-${p.id}`, type: 'payment',
      title: 'Payment logged', detail: `${fmt(Number(p.amount))} · ${p.description}${cat?.name ? ` · ${cat.name}` : ''}`,
      timestamp: p.created_at })
  })
  ;(recentSigsRaw ?? []).forEach((sig: any) => {
    const contract = Array.isArray(sig.contracts) ? sig.contracts[0] : sig.contracts
    if (!contract || contract.user_id !== user.id) return
    activity.push({ id: `sig-${sig.id}`, type: 'contract',
      title: 'Contract signed', detail: `${contract.title} · ${sig.signer_name}`, timestamp: sig.signed_at })
  })
  ;(followUpRaw ?? []).forEach((inv: any) => {
    if (!inv.last_followed_up) return
    const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients
    activity.push({ id: `fu-${inv.id}`, type: 'followup',
      title: 'Follow-up sent automatically',
      detail: `${inv.invoice_number} · ${client?.name ?? 'Client'}${inv.ai_risk_score ? ` · Risk ${inv.ai_risk_score}%` : ''}`,
      timestamp: inv.last_followed_up })
  })
  const recentActivity = activity
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8)

  // ── Onboarding ────────────────────────────────────────────────────────────
  const hasClients     = clients.length > 0
  const hasSentInvoice = invoices.some((i: any) => ['sent','paid','overdue'].includes(i.status))
  const hasTimeEntries = unbilledSeconds > 0
  const hasPortal      = !!portalRaw
  const hasPayment     = (payCheckRaw ?? []).length > 0

  // ── Greeting ──────────────────────────────────────────────────────────────
  const hour          = now.getHours()
  const timeGreeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName     = profile?.full_name?.split(' ')[0] || profile?.business_name || user.email?.split('@')[0] || 'there'
  const isNewUser     = invoices.length === 0 && directPayments.length === 0
  const motivational  = getContextualMessage({
    overdueCount,
    pendingPayments,
    paidThisMonth,
    totalRevenue,
    unbilledValue,
    expiringSoon,
    hasClients:   clients.length > 0,
    isNewUser,
  })

  return (
    <div className="space-y-6">
      <DashboardAutoRefresh />

      {/* Welcome modal — shown once to new users with no clients and no invoices */}
      {!hasClients && invoices.length === 0 && (
        <WelcomeModal businessName={(profile as any)?.business_name || (profile as any)?.full_name || null} />
      )}

      {/* Onboarding */}
      {hasActiveSubscription && (
        <OnboardingChecklist
          hasClients={hasClients} hasSentInvoice={hasSentInvoice}
          hasTimeEntry={hasTimeEntries} hasPayment={hasPayment} hasPortal={hasPortal}
          tier={tier} hasLogo={!!(profile as any)?.logo_url}
        />
      )}

      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div className="inv-fade-up inv-fade-up-1">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[.12em] mb-2">
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <h1 className="f-display text-[2rem] font-extrabold text-gray-900 leading-tight mb-1" style={{letterSpacing:'-.025em',fontWeight:800}}>
              {timeGreeting}, {firstName}.
            </h1>
            <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-lg">{motivational}</p>
          </div>
          {hasActiveSubscription ? (
            <div className="flex gap-3 flex-wrap items-start">
              {[
                { label: 'This month',  value: fmtCompact(paidThisMonth),    accent: 'border-blue-100 text-blue-700 bg-blue-50/60'  },
                { label: 'Outstanding', value: fmtCompact(pendingPayments),  accent: overdueCount > 0 ? 'border-red-100 text-red-700 bg-red-50/60' : 'border-orange-100 text-orange-700 bg-orange-50/60' },
                { label: 'Net profit',  value: profitMargin !== null ? `${profitMargin}%` : '—', accent: netProfit >= 0 ? 'border-teal-100 text-teal-700 bg-teal-50/60' : 'border-red-100 text-red-700 bg-red-50/60' },
              ].map(s => (
                <div key={s.label} className={`border rounded-xl px-4 py-2.5 min-w-[96px] max-w-[140px] ${s.accent}`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5 truncate">{s.label}</p>
                  <p className="text-base font-black font-mono truncate">{s.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <Link href="/pricing"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl btn-primary text-sm transition-all flex-shrink-0">
              <Lock className="w-3.5 h-3.5" />Start Free Trial
            </Link>
          )}
        </div>
      </div>

      {!hasActiveSubscription && <ViewOnlyBanner />}

      {/* ── Business Health Score — preview card (Pro+) ───────────────────── */}
      {hasActiveSubscription && isPro && (
        <div
          className={`relative overflow-hidden bg-white rounded-2xl border ${dashBHS.border} inv-fade-up inv-fade-up-2`}
          style={{ boxShadow: dashBHS.glow }}
        >
          <div className="inv-signal-strip" />
          <div className="px-5 py-4 flex items-center gap-5 flex-wrap">
            {/* Score */}
            <div className="flex items-baseline gap-2 flex-shrink-0">
              <span className={`inv-num-display text-5xl leading-none font-bold ${dashBHS.color}`}>
                {dashBHS.score}
              </span>
              <span className="text-base text-gray-300 font-black leading-none">/100</span>
              <span className={`text-base font-black ${dashBHS.color} leading-none ml-0.5`}>
                {dashBHS.grade}
              </span>
            </div>

            {/* Label + sub-metrics */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">BUSINESS HEALTH</p>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  dashBHS.grade === 'A' ? 'bg-teal-50 text-teal-700' :
                  dashBHS.grade === 'B' ? 'bg-blue-50 text-blue-700' :
                  dashBHS.grade === 'C' ? 'bg-amber-50 text-amber-700' :
                  dashBHS.grade === 'D' ? 'bg-orange-50 text-orange-700' :
                  'bg-red-50 text-red-700'
                }`}>{dashBHS.label}</span>
              </div>
              {/* Score bar */}
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-xs">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${dashBHS.score}%`, background: dashBHS.scoreColor }}
                />
              </div>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {collectionRate !== null && (
                  <span className="text-[10px] font-bold text-gray-400 inv-mono">
                    {collectionRate}% collected
                  </span>
                )}
                {profitMargin !== null && (
                  <span className="text-[10px] font-bold text-gray-400 inv-mono">
                    {profitMargin}% margin
                  </span>
                )}
                {overdueCount > 0 && (
                  <span className="text-[10px] font-bold text-red-400 inv-mono">
                    {overdueCount} overdue
                  </span>
                )}
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/dashboard/analytics"
              className="text-xs font-black text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0 flex items-center gap-1"
            >
              Full analysis →
            </Link>
          </div>
        </div>
      )}
      {hasActiveSubscription && (
        <AICommandCenter
          totalRevenue={totalRevenue}
          pendingPayments={pendingPayments}
          paidThisMonth={paidThisMonth}
          overdueCount={overdueCount}
          profitMargin={profitMargin}
          expiringSoon={expiringSoon}
          unbilledValue={unbilledValue}
          hasActiveSubscription={hasActiveSubscription}
        />
      )}

      {/* ── Revenue Story ─────────────────────────────────────────────────── */}
      <RevenueStorySection
        key={`rev-${currentMonthRevenue}-${previousMonthRevenue}`}
        data={revenueChartData}
        currentMonth={currentMonthRevenue}
        previousMonth={previousMonthRevenue}
      />

      {/* ── Intelligence Feed (Pro+) ──────────────────────────────────────── */}
      {hasActiveSubscription && (
        <IntelligenceFeed
          insights={insights ?? []}
          isPro={isPro}
          lastRefreshed={lastInsight}
        />
      )}

      {/* ── Risk + Opportunity panels ─────────────────────────────────────── */}
      {hasActiveSubscription && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <RiskAttentionPanel
            overdueCount={overdueCount}
            expiringSoon={expiringSoon}
            followUpsSent={followUpsSent}
            overdueValue={overdueValue}
          />
          <OpportunityPanel
            unbilledHours={unbilledHours}
            unbilledValue={unbilledValue}
            activeContracts={activeContracts.length}
            contractValue={totalContractValue}
          />
        </div>
      )}

      {/* ── Activity feed + Recent invoices ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ActivityFeedLive items={recentActivity} viewAll="/dashboard/invoices" />

        {/* Recent invoices */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden inv-fade-up inv-fade-up-5 flex flex-col">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Invoices</p>
          </div>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-5 flex-1">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-sm font-bold text-gray-400 mb-1">No invoices yet</p>
              {hasActiveSubscription && (
                dashInvoiceLimitReached ? (
                  <span className="mt-2 text-xs font-bold text-orange-500">
                    25/25 this month · <Link href="/dashboard/billing" className="underline">Upgrade</Link>
                  </span>
                ) : (
                  <Link href="/dashboard/invoices/new" className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700">
                    Create your first →
                  </Link>
                )
              )}
            </div>
          ) : (
            <>
              <div className="flex-1">
                {invoices.slice(0, 12).map((inv: any) => {
                  const STATUS_CONFIG: Record<string, { dot: string; pill: string; label: string }> = {
                    paid:    { dot: 'bg-teal-500',   pill: 'bg-teal-50 text-teal-700',   label: 'Paid'    },
                    sent:    { dot: 'bg-blue-500',   pill: 'bg-blue-50 text-blue-700',   label: 'Sent'    },
                    overdue: { dot: 'bg-red-500',    pill: 'bg-red-50 text-red-700',     label: 'Overdue' },
                    draft:   { dot: 'bg-gray-300',   pill: 'bg-gray-50 text-gray-500',   label: 'Draft'   },
                  }
                  const sc = STATUS_CONFIG[inv.displayStatus] ?? STATUS_CONFIG.draft
                  const showDue = (inv.displayStatus === 'sent' || inv.displayStatus === 'overdue') && inv.due_date
                  return (
                    <Link key={inv.id} href={`/dashboard/invoices/${inv.id}`}
                      className="flex items-center gap-3.5 px-5 py-3 hover:bg-gray-50/80 transition-colors group border-b border-gray-50 last:border-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-black text-gray-900 font-mono tracking-tight">{inv.invoice_number}</span>
                          <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide ${sc.pill}`}>
                            {sc.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 font-medium truncate">
                          {inv.clients?.name ?? '—'}
                          {showDue && (
                            <span className={`ml-2 ${inv.displayStatus === 'overdue' ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                              · Due {new Date(inv.due_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className={`text-sm font-black font-mono flex-shrink-0 transition-colors ${
                        inv.displayStatus === 'overdue' ? 'text-red-600' :
                        inv.displayStatus === 'paid'    ? 'text-teal-600 group-hover:text-teal-700' :
                        'text-gray-900 group-hover:text-blue-600'
                      }`}>
                        {fmt(inv.total_amount)}
                      </span>
                    </Link>
                  )
                })}
              </div>
              <Link href="/dashboard/invoices"
                className="flex items-center justify-center gap-1.5 px-5 py-3.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50/40 transition-colors border-t border-gray-50">
                View all invoices →
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Clients grid ─────────────────────────────────────────────────── */}
      {clients.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden inv-fade-up inv-fade-up-5">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Clients</p>
            </div>
            <Link href="/dashboard/clients" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {clients.slice(0, 8).map((client: any, idx: number) => {
              const ACCENTS = [
                { bg: 'bg-blue-600',  text: 'text-white' },
                { bg: 'bg-teal-500',  text: 'text-white' },
                { bg: 'bg-gray-800',  text: 'text-white' },
                { bg: 'bg-orange-500',text: 'text-white' },
              ]
              let hash = 0
              for (let i = 0; i < client.name.length; i++) hash = client.name.charCodeAt(i) + ((hash << 5) - hash)
              const accent   = ACCENTS[Math.abs(hash) % ACCENTS.length]
              const initials = client.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
              const borderR  = (idx + 1) % 4 !== 0 ? 'border-r' : ''
              const borderB  = idx < clients.slice(0, 8).length - 4 ? 'border-b' : ''
              return (
                <Link key={client.id} href={`/dashboard/clients/${client.id}`}
                  className={`flex items-center gap-3 px-5 py-4 hover:bg-gray-50/80 transition-colors group border-gray-50 ${borderR} ${borderB}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[11px] font-black ${accent.bg} ${accent.text}`}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate leading-tight">{client.name}</p>
                    {client.company
                      ? <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">{client.company}</p>
                      : <p className="text-[11px] text-gray-300 font-medium mt-0.5">{client.email?.split('@')[0]}</p>
                    }
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}