import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { StatusChart }  from '@/components/dashboard/status-chart'
import {
  Users, FileText, TrendingUp, TrendingDown, DollarSign,
  Clock, AlertCircle, Lock, FileSignature, Plus, Zap, ArrowRight,
} from 'lucide-react'
import { getInvoiceDisplayStatus }   from '@/lib/utils/invoice-status'
import { getWelcomeMessage }         from '@/lib/utils/get-welcome-message'
import MetricCardValue               from '@/components/dashboard/metric-card-value'
import ViewOnlyBanner                from '@/components/view-only-banner'
import DashboardAutoRefresh          from '@/components/dashboard/dashboard-auto-refresh'
import OnboardingChecklist           from '@/components/dashboard/onboarding-checklist'
import DashboardAiStrip              from '@/components/dashboard/dashboard-ai-strip'

type Invoice = {
  id: string; invoice_number: string; status: string; displayStatus: string
  issue_date: string; due_date: string; total_amount: number; created_at?: string
  clients: { name: string | null; company?: string | null } | null
}
type Client = { id: string; name: string; email: string | null; company: string | null; created_at: string }

const fmt = (n: number) => {
  if (n >= 999_500) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000)  return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
const fmtFull = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id, stripe_subscription_id, subscription_status, business_name, full_name')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription = !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')
  const hasEverSubscribed = !!profile?.stripe_customer_id || !!profile?.stripe_subscription_id

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: invoiceData } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, issue_date, due_date, total_amount, created_at, clients!inner(name, company)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const invoices: Invoice[] = (invoiceData ?? []).map((inv: any) => ({
    ...inv,
    clients: Array.isArray(inv.clients) ? inv.clients[0] : inv.clients,
    displayStatus: getInvoiceDisplayStatus({ status: inv.status, due_date: inv.due_date }),
  }))

  const { data: clientData } = await supabase
    .from('clients').select('id, name, email, company, created_at')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(8)
  const clients = (clientData ?? []) as Client[]

  const { data: directPaymentsRaw } = await supabase
    .from('direct_payments')
    .select('id, amount, description, payment_date, created_at, revenue_categories(name)')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
  const directPayments = (directPaymentsRaw ?? []) as any[]

  const { data: expensesRaw } = await supabase
    .from('expenses').select('id, description, amount, date, category, vendor')
    .eq('user_id', user.id).order('date', { ascending: false }).limit(50)
  const allExpenses = (expensesRaw ?? []) as any[]

  const { data: activeContractsRaw } = await supabase
    .from('contracts').select('id, total_value, expiry_date, reminders_dismissed')
    .eq('user_id', user.id).eq('status', 'active')
  const activeContracts = (activeContractsRaw ?? []) as any[]

  const { data: recentSignaturesRaw } = await supabase
    .from('contract_signatures')
    .select('id, signer_name, signed_at, contracts!inner(title, user_id)')
    .order('signed_at', { ascending: false }).limit(5)

  const { data: followUpInvoicesRaw } = await supabase
    .from('invoices')
    .select('id, invoice_number, last_followed_up, ai_risk_score, clients!inner(name)')
    .eq('user_id', user.id).not('last_followed_up', 'is', null)
    .order('last_followed_up', { ascending: false }).limit(3)

  const { data: timeEntriesRaw } = await supabase
    .from('time_entries').select('duration_seconds, hourly_rate, billable, invoice_id')
    .eq('user_id', user.id).eq('billable', true).is('invoice_id', null)
  const unbilledEntries = (timeEntriesRaw ?? []) as any[]

  const { data: portalSettingsRaw } = await supabase
    .from('portal_settings').select('user_id').eq('user_id', user.id).single()
  const { data: directPaymentCheckRaw } = await supabase
    .from('direct_payments').select('id').eq('user_id', user.id).limit(1)

  // ── Metrics ───────────────────────────────────────────────────────────────
  const now = new Date()

  const invoiceRevenue = invoices.filter(i => i.displayStatus === 'paid')
    .reduce((s, i) => s + Number(i.total_amount || 0), 0)
  const directRevenue = directPayments.reduce((s, p) => s + Number(p.amount || 0), 0)
  const totalRevenue  = invoiceRevenue + directRevenue

  const pendingPayments = invoices.filter(i => i.displayStatus === 'sent')
    .reduce((s, i) => s + Number(i.total_amount || 0), 0)

  const paidThisMonth =
    invoices.filter(i => {
      if (i.displayStatus !== 'paid') return false
      const d = new Date(i.issue_date + 'T12:00:00')
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).reduce((s, i) => s + Number(i.total_amount || 0), 0)
    + directPayments.filter(p => {
      const d = new Date(p.payment_date + 'T12:00:00')
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).reduce((s, p) => s + Number(p.amount || 0), 0)

  const overdueCount  = invoices.filter(i => i.displayStatus === 'overdue').length
  const totalExpenses = allExpenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const netProfit     = totalRevenue - totalExpenses
  const isProfitable  = netProfit >= 0
  const profitMargin  = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : null

  const now30 = new Date(); now30.setDate(now30.getDate() + 30)
  const activeContractsCount = activeContracts.length
  const totalContractValue   = activeContracts.reduce((s, c) => s + Number(c.total_value || 0), 0)
  const expiringSoonCount    = activeContracts.filter((c: any) => {
    if (!c.expiry_date || c.reminders_dismissed) return false
    const e = new Date(c.expiry_date)
    return e <= now30 && e >= now
  }).length

  const unbilledSeconds = unbilledEntries.reduce((s, e) => s + (e.duration_seconds ?? 0), 0)
  const unbilledHours   = Math.round((unbilledSeconds / 3600) * 100) / 100
  const unbilledValue   = unbilledEntries.reduce((s, e) => {
    if (!e.hourly_rate || !e.duration_seconds) return s
    return s + Math.round((e.duration_seconds / 3600) * e.hourly_rate * 100) / 100
  }, 0)

  // ── Chart data ────────────────────────────────────────────────────────────
  const revenueChartData = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1)
    const y = d.getFullYear(), m = d.getMonth()
    return {
      month: d.toLocaleString('en-US', { month: 'short' }),
      revenue: invoices.filter(i => i.displayStatus === 'paid').filter(i => {
        const d2 = new Date(i.issue_date + 'T12:00:00')
        return d2.getFullYear() === y && d2.getMonth() === m
      }).reduce((s, i) => s + Number(i.total_amount || 0), 0),
      isCurrentMonth: y === now.getFullYear() && m === now.getMonth(),
    }
  })

  const statusChartData = (['draft','sent','paid','overdue'] as const).map(status => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: invoices.filter(i => i.displayStatus === status).length,
    color: { draft:'#9CA3AF', sent:'#2563EB', paid:'#0D9488', overdue:'#EF4444' }[status],
  }))

  // ── Activity feed ─────────────────────────────────────────────────────────
  type ActivityItem = { id: string; icon: string; title: string; detail: string; timestamp: string; type: string }
  const activity: ActivityItem[] = []

  invoices.filter(i => ['sent','paid','overdue'].includes(i.displayStatus)).slice(0, 5).forEach(inv => {
    const client = Array.isArray(inv.clients) ? (inv.clients as any)[0] : inv.clients
    activity.push({ id: `inv-${inv.id}`, type: 'invoice', icon: '📄',
      title: 'Invoice sent', detail: `${inv.invoice_number} · ${fmt(inv.total_amount)} · ${client?.name ?? 'Client'}`,
      timestamp: inv.created_at ?? inv.issue_date })
  })
  directPayments.slice(0, 5).forEach((p: any) => {
    const cat = Array.isArray(p.revenue_categories) ? p.revenue_categories[0] : p.revenue_categories
    activity.push({ id: `pay-${p.id}`, type: 'payment', icon: '💵',
      title: 'Payment logged', detail: `${fmt(Number(p.amount))} · ${p.description}${cat?.name ? ` · ${cat.name}` : ''}`,
      timestamp: p.created_at })
  })
  ;(recentSignaturesRaw ?? []).forEach((sig: any) => {
    const contract = Array.isArray(sig.contracts) ? sig.contracts[0] : sig.contracts
    if (!contract || contract.user_id !== user.id) return
    activity.push({ id: `sig-${sig.id}`, type: 'contract', icon: '✅',
      title: 'Contract signed', detail: `${contract.title} · ${sig.signer_name}`, timestamp: sig.signed_at })
  })
  ;(followUpInvoicesRaw ?? []).forEach((inv: any) => {
    if (!inv.last_followed_up) return
    const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients
    activity.push({ id: `fu-${inv.id}`, type: 'followup', icon: '🤖',
      title: 'Follow-up sent automatically',
      detail: `${inv.invoice_number} · ${client?.name ?? 'Client'}${inv.ai_risk_score ? ` · Risk ${inv.ai_risk_score}%` : ''}`,
      timestamp: inv.last_followed_up })
  })
  const recentActivity = activity
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8)

  // ── Onboarding ────────────────────────────────────────────────────────────
  const hasClients     = clients.length > 0
  const hasSentInvoice = invoices.some(i => ['sent','paid','overdue'].includes(i.status))
  const hasTimeEntries = unbilledSeconds > 0
  const hasPortal      = !!portalSettingsRaw
  const hasPayment     = (directPaymentCheckRaw ?? []).length > 0

  // ── Greeting ──────────────────────────────────────────────────────────────
  const hour        = now.getHours()
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName    = profile?.full_name?.split(' ')[0]
                    || profile?.business_name
                    || user.email?.split('@')[0]
                    || 'there'
  const motivational = getWelcomeMessage()

  // ── Status pill helper ────────────────────────────────────────────────────
  const statusPill: Record<string, string> = {
    draft:   'bg-gray-100 text-gray-600',
    sent:    'bg-blue-50 text-blue-700',
    paid:    'bg-teal-50 text-teal-700',
    overdue: 'bg-red-50 text-red-700',
  }

  return (
    <div className="space-y-6">
      <DashboardAutoRefresh />

      {/* Onboarding checklist */}
      {hasActiveSubscription && (
        <OnboardingChecklist
          hasClients={hasClients} hasSentInvoice={hasSentInvoice}
          hasTimeEntry={hasTimeEntries} hasPayment={hasPayment} hasPortal={hasPortal}
        />
      )}

      {/* ── Greeting bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          {/* Time greeting + motivational message */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">
            {timeGreeting}, {firstName}
          </p>
          <h1 className="text-xl font-black text-gray-900">{motivational}</h1>
        </div>

        {hasActiveSubscription ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/dashboard/invoices/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all hover:shadow-md">
              <Plus className="w-3.5 h-3.5" />Invoice
            </Link>
            <Link href="/dashboard/payments/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-all hover:shadow-md">
              <Plus className="w-3.5 h-3.5" />Payment
            </Link>
          </div>
        ) : (
          <Link href="/pricing"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all flex-shrink-0">
            <Lock className="w-3.5 h-3.5" />Start Free Trial
          </Link>
        )}
      </div>

      {!hasActiveSubscription && <ViewOnlyBanner />}

      {/* AI insight strip */}
      {hasActiveSubscription && (
        <DashboardAiStrip
          overdueCount={overdueCount} pendingPayments={pendingPayments}
          expiringSoonCount={expiringSoonCount} unbilledValue={unbilledValue}
          totalRevenue={totalRevenue} paidThisMonth={paidThisMonth}
        />
      )}

      {/* ── Primary metric cards ─────────────────────────────────────────── */}
      {/* Blue/teal primary palette. Red only for alerts. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

        {/* Total Revenue */}
        <Link href="/dashboard/invoices"
          className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition-colors" />
          </div>
          <p className="text-2xl font-black text-gray-900 leading-none mb-1" title={fmtFull(totalRevenue)}>{fmt(totalRevenue)}</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Revenue</p>
        </Link>

        {/* Pending */}
        <Link href="/dashboard/invoices?status=sent"
          className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition-colors" />
          </div>
          <p className="text-2xl font-black text-gray-900 leading-none mb-1" title={fmtFull(pendingPayments)}>{fmt(pendingPayments)}</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Awaiting Payment</p>
        </Link>

        {/* Paid this month */}
        <Link href="/dashboard/invoices?status=paid"
          className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-teal-400 transition-colors" />
          </div>
          <p className="text-2xl font-black text-gray-900 leading-none mb-1" title={fmtFull(paidThisMonth)}>{fmt(paidThisMonth)}</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Paid This Month</p>
        </Link>

        {/* Overdue — only this card uses red */}
        <Link href="/dashboard/invoices?status=overdue"
          className={`bg-white rounded-2xl border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group ${overdueCount > 0 ? 'border-red-100' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${overdueCount > 0 ? 'bg-red-500' : 'bg-gray-300'}`}>
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-red-400 transition-colors" />
          </div>
          <p className={`text-2xl font-black leading-none mb-1 ${overdueCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{overdueCount}</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Overdue</p>
          {overdueCount > 0 && <p className="text-xs font-bold text-red-400 mt-1">Needs attention</p>}
        </Link>

      </div>

      {/* ── Secondary cards: net profit + contracts + unbilled ───────────── */}
      {hasActiveSubscription && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          {/* Net profit — 2 cols wide */}
          <div className={`col-span-2 bg-white rounded-2xl border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${isProfitable ? 'border-teal-100' : 'border-red-100'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isProfitable ? 'bg-teal-600' : 'bg-red-500'}`}>
                {isProfitable ? <TrendingUp className="w-4 h-4 text-white" /> : <TrendingDown className="w-4 h-4 text-white" />}
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isProfitable ? 'bg-teal-50 text-teal-700' : 'bg-red-50 text-red-700'}`}>
                {isProfitable ? 'Profitable' : 'Net loss'}
              </span>
            </div>
            <p className="text-2xl font-black text-gray-900 leading-none mb-1">{fmt(Math.abs(netProfit))}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Net Profit</p>
            {totalRevenue > 0 && (
              <>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${isProfitable ? 'bg-teal-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min((totalExpenses / totalRevenue) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                  <span>Rev <span className="text-gray-700 font-bold">{fmt(totalRevenue)}</span></span>
                  <span>Exp <span className="text-gray-700 font-bold">{fmt(totalExpenses)}</span></span>
                  {profitMargin !== null && (
                    <span className="ml-auto">
                      Margin <span className={`font-bold ${isProfitable ? 'text-teal-600' : 'text-red-500'}`}>{isProfitable ? '+' : ''}{profitMargin}%</span>
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Unbilled time */}
          <Link href="/dashboard/time"
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition-colors" />
            </div>
            <p className="text-2xl font-black text-gray-900 leading-none mb-1">{unbilledHours}h</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Unbilled Hours</p>
            {unbilledValue > 0 && <p className="text-xs font-bold text-blue-500 mt-1">{fmt(unbilledValue)} ready to invoice</p>}
          </Link>

          {/* Active contracts */}
          <Link href="/dashboard/contracts"
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
                <FileSignature className="w-4 h-4 text-white" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-teal-400 transition-colors" />
            </div>
            <p className="text-2xl font-black text-gray-900 leading-none mb-1">{activeContractsCount}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Contracts</p>
            {totalContractValue > 0 && <p className="text-xs font-bold text-teal-600 mt-1">{fmt(totalContractValue)} value</p>}
            {expiringSoonCount > 0 && <p className="text-xs font-bold text-amber-500 mt-1">{expiringSoonCount} expiring soon</p>}
          </Link>

        </div>
      )}

      {/* ── Charts ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue Trend</p>
              <p className="text-sm font-black text-gray-900">Last 6 months</p>
            </div>
            <Link href="/dashboard/analytics" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">Analytics →</Link>
          </div>
          {invoices.some(i => i.displayStatus === 'paid') ? (
            <RevenueChart data={revenueChartData} />
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <TrendingUp className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm font-bold text-gray-400 mb-1">No revenue yet</p>
              <p className="text-xs text-gray-300 font-medium">Send your first invoice to start tracking</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice Status</p>
              <p className="text-sm font-black text-gray-900">Current breakdown</p>
            </div>
            <Link href="/dashboard/invoices" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">View all →</Link>
          </div>
          {invoices.length > 0 ? (
            <StatusChart data={statusChartData} />
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm font-bold text-gray-400 mb-1">No invoices yet</p>
              <p className="text-xs text-gray-300 font-medium">Create your first invoice to see the breakdown</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Activity feed + Recent invoices ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

        {/* Activity feed */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Activity</p>
            <span className="flex items-center gap-1.5 text-xs font-bold text-teal-600">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inv-pulse-dot" />Live
            </span>
          </div>
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-5">
              <Zap className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm font-bold text-gray-400 mb-1">No activity yet</p>
              <p className="text-xs text-gray-300 font-medium">Sent invoices, logged payments, and signed contracts appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentActivity.map(item => {
                const diff = Math.floor((Date.now() - new Date(item.timestamp).getTime()) / 1000)
                const timeLabel =
                  diff < 60      ? 'just now'
                  : diff < 3600  ? `${Math.floor(diff / 60)}m ago`
                  : diff < 86400 ? `${Math.floor(diff / 3600)}h ago`
                  : diff < 604800? `${Math.floor(diff / 86400)}d ago`
                  : new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

                const iconBg: Record<string, string> = {
                  invoice:  'bg-blue-50',
                  payment:  'bg-teal-50',
                  contract: 'bg-teal-50',
                  followup: 'bg-amber-50',
                }
                return (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${iconBg[item.type] ?? 'bg-gray-50'}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-400 truncate">{item.detail}</p>
                    </div>
                    <span className="text-[10px] text-gray-300 font-medium flex-shrink-0">{timeLabel}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent invoices */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Invoices</p>
            <Link href="/dashboard/invoices" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">View all →</Link>
          </div>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-5">
              <FileText className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm font-bold text-gray-400 mb-1">No invoices yet</p>
              {hasActiveSubscription && (
                <Link href="/dashboard/invoices/new" className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                  Create your first →
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {invoices.slice(0, 8).map(inv => (
                <Link key={inv.id} href={`/dashboard/invoices/${inv.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-black text-gray-900 font-mono">{inv.invoice_number}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase ${statusPill[inv.displayStatus] ?? statusPill.draft}`}>
                        {inv.displayStatus}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium truncate">{inv.clients?.name ?? '—'}</p>
                  </div>
                  <span className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors flex-shrink-0">
                    {fmt(inv.total_amount)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Clients grid ─────────────────────────────────────────────────── */}
      {clients.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Clients</p>
            <Link href="/dashboard/clients" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-gray-50">
            {clients.slice(0, 8).map(client => {
              const palette = ['bg-blue-100 text-blue-700','bg-teal-100 text-teal-700','bg-indigo-100 text-indigo-700','bg-cyan-100 text-cyan-700']
              let hash = 0
              for (let i = 0; i < client.name.length; i++) hash = client.name.charCodeAt(i) + ((hash << 5) - hash)
              const av = palette[Math.abs(hash) % palette.length]
              const initials = client.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
              return (
                <Link key={client.id} href={`/dashboard/clients/${client.id}`}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-xs ${av}`}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate">{client.name}</p>
                    {client.company && <p className="text-xs text-gray-400 truncate">{client.company}</p>}
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
