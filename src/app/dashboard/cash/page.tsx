// src/app/dashboard/cash/page.tsx
// Force a fresh server fetch on every visit — prevents stale chart data
// after revenue/payment changes.
export const dynamic = 'force-dynamic'

import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link             from 'next/link'
import {
  TrendingUp, DollarSign, AlertCircle, Receipt,
  Clock, TrendingDown, Lock, Zap, ArrowRight,
} from 'lucide-react'
import { getInvoiceDisplayStatus }        from '@/lib/utils/invoice-status'
import ConnectedAccountsSection           from '@/components/bank/connected-accounts-section'
import TransactionList                    from '@/components/bank/transaction-list'
import RunwayCalculator                   from '@/components/cash/runway-calculator'
import { ForecastChart }           from '@/components/cash/forecast-chart'
import { RevenueVsExpenseChart }   from '@/components/cash/revenue-vs-expense-chart'
import UpcomingPaymentsList        from '@/components/cash/upcoming-payments-list'
import TaxReserveEstimate          from '@/components/cash/tax-reserve-estimate'
import CoreTabBar                  from '@/components/layout/core-tab-bar'
import BackToTop from '@/components/ui/back-to-top'
import MarkCashFlowVisited from '@/components/cash/mark-cash-flow-visited'
import { useCurrency } from '@/lib/context/currency-context'

const fmt = (n: number): string => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 999_500)       return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000)        return `$${(n / 1_000).toFixed(0)}K`
  return fmt(n)
}
const fmtFull = (n: number) =>
  fmt(n)

export default async function CashPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_subscription_id, subscription_status, subscription_tier')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription =
    !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')

  const tier    = profile?.subscription_tier ?? 'starter'
  const isPro   = tier === 'professional' || tier === 'business'

  // ── Bank connections (all paid tiers) ────────────────────────────────────
  const { data: connectedAccounts } = await supabase
    .from('connected_accounts')
    .select('*')
    .eq('user_id', user.id)
    .eq('sync_status', 'active')
    .order('created_at', { ascending: false })

  const { data: bankTransactions, count: txCount } = await supabase
    .from('bank_transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(150)

  // Outstanding invoices for reconciliation suggestions
  const { data: outstandingForReconcile } = await supabase
    .from('invoices')
    .select('id, invoice_number, total_amount, clients(name)')
    .eq('user_id', user.id)
    .eq('status', 'sent')
    .order('due_date', { ascending: true })

  const reconcileInvoices = (outstandingForReconcile ?? []).map((inv: any) => ({
    id:            inv.id,
    invoice_number: inv.invoice_number,
    total_amount:  inv.total_amount,
    client_name:   (Array.isArray(inv.clients) ? inv.clients[0] : inv.clients)?.name ?? 'Unknown',
  }))

  // Live bank balance — sum available balance across connected accounts
  const liveBankBalance = (connectedAccounts ?? []).reduce(
    (sum, acc) => sum + (acc.available_balance ?? acc.current_balance ?? 0), 0
  )

  if (!hasActiveSubscription) {
    return (
      <div className="space-y-6">
        <CoreTabBar />
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-7 h-7 text-blue-600" />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2">Subscribe to access Cash Management</h3>
          <p className="text-sm text-gray-500 font-medium mb-6 max-w-sm mx-auto">
            See your 90-day cash forecast, runway calculator, and tax reserve estimate in one place.
          </p>
          <Link href="/pricing"
            className="inline-flex items-center gap-2 btn-primary px-5 py-2.5 rounded-xl text-sm">
            <Lock className="w-4 h-4" />View Plans
          </Link>
        </div>
      </div>
    )
  }

  if (!isPro) {
    return (
      <div className="space-y-6">
        <CoreTabBar />
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center" style={{ boxShadow: '0 0 32px rgba(0,102,255,0.08)' }}>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Professional Plan</p>
          <h3 className="text-xl font-black text-gray-900 mb-2">90-Day Cash Flow Forecast</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            See your projected balance week by week, a live runway calculator, revenue vs expenses, and upcoming payment timeline — all updated in real time.
          </p>
          <Link href="/dashboard/billing" className="btn-primary px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
            <Zap className="w-4 h-4" />Upgrade to Professional
          </Link>
        </div>
      </div>
    )
  }

  const now = new Date()

  // ── Data ─────────────────────────────────────────────────────────────────
  // ── Invoice query — no PostgREST join to avoid silent errors ────────────
  const { data: invoicesRaw, error: invoicesErr } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, issue_date, due_date, total_amount, client_id')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true })

  if (invoicesErr) console.error('[cash/page] invoices query error:', invoicesErr)

  // Fetch client names separately and build a lookup map
  const rawInvoices = invoicesRaw ?? []
  const clientIds = [...new Set(rawInvoices.map((i: any) => i.client_id).filter(Boolean))]
  const clientNameMap: Record<string, string> = {}
  if (clientIds.length > 0) {
    const { data: clientRows } = await supabase
      .from('clients')
      .select('id, name')
      .in('id', clientIds as string[])
    ;(clientRows ?? []).forEach((c: any) => { clientNameMap[c.id] = c.name })
  }

  const invoices = rawInvoices.map((inv: any) => ({
    ...inv,
    clients: clientNameMap[inv.client_id] ? { name: clientNameMap[inv.client_id] } : null,
    displayStatus: getInvoiceDisplayStatus({ status: inv.status, due_date: inv.due_date }),
  }))

  // All sent (unpaid) invoices — status='sent' is the single source of truth
  const unpaidInvoices = invoices.filter((inv: any) => inv.status === 'sent')

  const { data: directPaymentsRaw } = await supabase
    .from('direct_payments')
    .select('amount, payment_date')
    .eq('user_id', user.id)
  const directPayments = (directPaymentsRaw ?? []) as { amount: number; payment_date: string }[]

  const confirmedDirectInflows = directPayments
    .filter(p => new Date(p.payment_date + 'T12:00:00') <= now)
    .reduce((s, p) => s + Number(p.amount || 0), 0)

  const { data: expensesRaw } = await supabase
    .from('expenses')
    .select('amount, date')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
  const expenses     = (expensesRaw ?? []) as { amount: number; date: string }[]

  const { data: snapshotRaw } = await supabase
    .from('cash_snapshots')
    .select('balance')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const latestBalance: number | null = snapshotRaw?.balance ?? null

  // ── Metrics ───────────────────────────────────────────────────────────────
  const invoiceRevenue = invoices
    .filter((inv: any) => inv.displayStatus === 'paid')
    .reduce((s: number, inv: any) => s + Number(inv.total_amount || 0), 0)
  const totalRevenue   = invoiceRevenue + confirmedDirectInflows
  const totalExpenses  = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const netProfit      = totalRevenue - totalExpenses
  const isProfitable   = netProfit >= 0
  const profitMargin   = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : null

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const overdueTotal = invoices
    .filter((inv: any) => inv.status === 'sent' && new Date(inv.due_date + 'T12:00:00') < today)
    .reduce((s: number, inv: any) => s + Number(inv.total_amount || 0), 0)
  const overdueCount = invoices.filter((inv: any) =>
    inv.status === 'sent' && new Date(inv.due_date + 'T12:00:00') < today
  ).length

  const ninetyDaysAgo = new Date(now); ninetyDaysAgo.setDate(now.getDate() - 90)
  const expenses90    = expenses.filter(e => new Date(e.date + 'T12:00:00') >= ninetyDaysAgo)
  const total90       = expenses90.reduce((s, e) => s + Number(e.amount || 0), 0)
  const avgWeeklyExp  = total90 / 13
  const avgMonthlyExp = avgWeeklyExp * (52 / 12)

  const pendingPipeline = unpaidInvoices
    .reduce((s: number, inv: any) => s + Number(inv.total_amount || 0), 0)

  // ── 90-day forecast — transaction-aware when bank is connected ───────────
  const forecastData = (() => {
    const baseline = (latestBalance ?? 0) + confirmedDirectInflows
    const points   = []
    let running    = baseline

    // ── Detect recurring expenses from bank transactions ───────────────────
    // Group outflows by week to find consistent patterns (e.g. subscriptions)
    const txOutflows = (bankTransactions ?? []).filter(
      (tx: any) => tx.direction === 'outflow' && !tx.pending
    )

    // Calculate average weekly outflow from real transactions if available
    const bankWeeklyOut = (() => {
      if (txOutflows.length < 4) return null  // not enough data
      const txDates = txOutflows.map((tx: any) => new Date(tx.date + 'T12:00:00').getTime())
      const earliest = Math.min(...txDates)
      const weeksCovered = Math.max(1, Math.ceil((Date.now() - earliest) / (7 * 24 * 60 * 60 * 1000)))
      const totalOut = txOutflows.reduce((s: number, tx: any) => s + Math.abs(tx.amount), 0)
      return totalOut / weeksCovered
    })()

    // Use bank-derived weekly spend if available and >0, else fall back to manual expenses
    const effectiveWeeklyOut = bankWeeklyOut ?? avgWeeklyExp

    // ── Detect recurring inflows (e.g. retainer clients) ──────────────────
    const txInflows = (bankTransactions ?? []).filter(
      (tx: any) => tx.direction === 'inflow' && !tx.pending && tx.match_status !== 'dismissed'
    )

    // Group by approximate amount to detect recurring payments
    const recurringInflows: { weeklyAmount: number; description: string }[] = []
    const amountGroups: Record<string, any[]> = {}
    txInflows.forEach((tx: any) => {
      const bucket = Math.round(Math.abs(tx.amount) / 50) * 50  // group within $50
      const key = String(bucket)
      if (!amountGroups[key]) amountGroups[key] = []
      amountGroups[key].push(tx)
    })
    Object.values(amountGroups).forEach(group => {
      if (group.length >= 2) {
        const avg = group.reduce((s: number, tx: any) => s + Math.abs(tx.amount), 0) / group.length
        recurringInflows.push({ weeklyAmount: avg / 4, description: group[0].merchant_name ?? group[0].description })
      }
    })
    const weeklyRecurring = recurringInflows.reduce((s, r) => s + r.weeklyAmount, 0)

    for (let w = 0; w < 13; w++) {
      const weekStart = new Date(now); weekStart.setDate(now.getDate() + w * 7); weekStart.setHours(0,0,0,0)
      const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23,59,59,999)

      // Invoice inflows expected this week
      const invoiceInflows = unpaidInvoices
        .filter((inv: any) => {
          const predicted = new Date(inv.due_date + 'T12:00:00')
          return predicted >= weekStart && predicted <= weekEnd
        })
        .reduce((s: number, inv: any) => s + Number(inv.total_amount || 0), 0)

      // Total inflows this week = invoices + detected recurring patterns
      const totalInflows = invoiceInflows + weeklyRecurring

      running += totalInflows - effectiveWeeklyOut
      points.push({
        week:             weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        projectedBalance: Math.round(running * 100) / 100,
        inflows:          Math.round(totalInflows * 100) / 100,
        outflows:         Math.round(effectiveWeeklyOut * 100) / 100,
      })
    }
    return points
  })()

  const hasForecastData     = latestBalance !== null
  const forecastDipsNegative = forecastData.some(d => d.projectedBalance < 0)
  const lowestPoint         = forecastData.length
    ? Math.min(...forecastData.map(d => d.projectedBalance))
    : 0
  const lowestWeek          = forecastData.find(d => d.projectedBalance === lowestPoint)

  // ── Revenue vs expenses (12 months) ──────────────────────────────────────
  const revExpData = Array.from({ length: 12 }, (_, idx) => {
    const d     = new Date(now.getFullYear(), now.getMonth() - (11 - idx), 1)
    const y = d.getFullYear(), m = d.getMonth()
    const invoiceRev = invoices
      .filter((inv: any) => inv.displayStatus === 'paid')
      .filter((inv: any) => { const dd = new Date(inv.issue_date + 'T12:00:00'); return dd.getFullYear()===y && dd.getMonth()===m })
      .reduce((s: number, inv: any) => s + Number(inv.total_amount || 0), 0)
    const directRev = directPayments
      .filter((p: any) => {
        const dd = new Date(p.payment_date + 'T12:00:00')
        return dd.getFullYear() === y && dd.getMonth() === m
      })
      .reduce((s, p) => s + Number(p.amount || 0), 0)
    const expAmt = expenses
      .filter(e => { const dd = new Date(e.date + 'T12:00:00'); return dd.getFullYear()===y && dd.getMonth()===m })
      .reduce((s, e) => s + Number(e.amount || 0), 0)
    const revenue = invoiceRev + directRev
    return { month: d.toLocaleString('en-US', { month: 'short' }), revenue, expenses: expAmt, profit: revenue - expAmt }
  })

  // ── AI insight for cash page ───────────────────────────────────────────────
  type CashInsight = { text: string; color: string; href: string }
  const cashInsights: CashInsight[] = []

  if (forecastDipsNegative && lowestWeek) {
    cashInsights.push({
      text:  `Cash dip projected around ${lowestWeek.week} — ${overdueCount > 0 ? `${overdueCount} overdue invoice${overdueCount>1?'s':''} could prevent this` : 'review your pipeline'}`,
      color: 'bg-red-50 text-red-700 border-red-200',
      href:  '/dashboard/invoices?status=overdue',
    })
  }
  if (overdueTotal > 0) {
    cashInsights.push({
      text:  `${fmt(overdueTotal)} in overdue invoices — collecting now directly improves your runway`,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      href:  '/dashboard/invoices?status=overdue',
    })
  }
  if (pendingPipeline > 0 && !forecastDipsNegative) {
    cashInsights.push({
      text:  `${fmt(pendingPipeline)} in the pipeline — on track if clients pay on time`,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      href:  '/dashboard/invoices?status=sent',
    })
  }
  if (profitMargin !== null && profitMargin > 0 && overdueCount === 0) {
    cashInsights.push({
      text:  `${profitMargin}% profit margin — healthy. Keep expenses in check.`,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
      href:  '/dashboard/analytics',
    })
  }

  return (
    <div className="space-y-6">
      <MarkCashFlowVisited />
      <CoreTabBar />

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Cash Management</p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-gray-900">{fmt(totalRevenue)}</span>
              <span className="text-xs text-gray-400 font-medium">Revenue</span>
            </div>
            <span className="text-gray-200">·</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-black ${isProfitable ? 'text-teal-600' : 'text-red-500'}`}>{fmt(Math.abs(netProfit))}</span>
              <span className="text-xs text-gray-400 font-medium">{isProfitable ? 'Profit' : 'Loss'}</span>
            </div>
            {profitMargin !== null && (
              <>
                <span className="text-gray-200">·</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isProfitable ? 'bg-teal-50 text-teal-700' : 'bg-red-50 text-red-700'}`}>
                  {isProfitable ? '+' : ''}{profitMargin}% margin
                </span>
              </>
            )}
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {(connectedAccounts ?? []).length > 0 ? 'Bank-connected forecast' : 'AI-powered forecast'}
            </span>
          </div>
        </div>
        <Link href="/dashboard/invoices/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl btn-primary text-sm flex-shrink-0">
          + Invoice
        </Link>
      </div>

      {/* ── AI insight strip ─────────────────────────────────────────────── */}
      {cashInsights.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white flex-shrink-0">
            <Zap className="w-3.5 h-3.5" />
            <span className="text-xs font-black tracking-wide">AI</span>
          </div>
          {cashInsights.slice(0, 2).map((ins, i) => (
            <Link key={i} href={ins.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold hover:shadow-sm hover:-translate-y-0.5 transition-all ${ins.color}`}>
              {ins.text}
            </Link>
          ))}
        </div>
      )}

      {/* ── Compact metric cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

        {/* Total Revenue */}
        <Link href="/dashboard/invoices"
          className="bg-white rounded-2xl border border-blue-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group inv-glow-blue">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition-colors" />
          </div>
          <p className="text-2xl font-black text-gray-900 leading-none mb-1" title={fmtFull(totalRevenue)}>{fmt(totalRevenue)}</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Revenue</p>
        </Link>

        {/* Total Expenses */}
        <Link href="/dashboard/expenses"
          className="bg-white rounded-2xl border border-orange-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          style={{ boxShadow: '0 0 28px rgba(249,115,22,0.08), 0 2px 12px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-white" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-orange-400 transition-colors" />
          </div>
          <p className="text-2xl font-black text-gray-900 leading-none mb-1" title={fmtFull(totalExpenses)}>{fmt(totalExpenses)}</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Expenses</p>
        </Link>

        {/* Net Profit — glow changes with profitability */}
        <div className={`bg-white rounded-2xl border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
          isProfitable ? 'border-teal-100' : 'border-red-100'
        }`}
          style={{ boxShadow: isProfitable
            ? '0 0 28px rgba(0,212,170,0.12), 0 2px 12px rgba(0,0,0,0.04)'
            : '0 0 28px rgba(239,68,68,0.12), 0 2px 12px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isProfitable ? 'bg-teal-500' : 'bg-red-500'}`}>
              {isProfitable
                ? <TrendingUp   className="w-4 h-4 text-white" />
                : <TrendingDown className="w-4 h-4 text-white" />}
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isProfitable ? 'bg-teal-50 text-teal-700' : 'bg-red-50 text-red-700'}`}>
              {isProfitable ? 'Profitable' : 'Net loss'}
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900 leading-none mb-1" title={fmtFull(Math.abs(netProfit))}>{fmt(Math.abs(netProfit))}</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Net Profit</p>
          {profitMargin !== null && (
            <p className={`text-xs font-bold mt-1 ${isProfitable ? 'text-teal-600' : 'text-red-500'}`}>
              {isProfitable ? '+' : ''}{profitMargin}% margin
            </p>
          )}
        </div>

        {/* Overdue — red glow only when there are overdue items */}
        <Link href="/dashboard/invoices?status=overdue"
          className={`bg-white rounded-2xl border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group ${overdueCount > 0 ? 'border-red-100' : 'border-gray-100'}`}
          style={overdueCount > 0 ? { boxShadow: '0 0 28px rgba(239,68,68,0.12), 0 2px 12px rgba(0,0,0,0.04)' } : {}}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${overdueCount > 0 ? 'bg-red-500' : 'bg-gray-300'}`}>
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-red-400 transition-colors" />
          </div>
          <p className={`text-2xl font-black leading-none mb-1 ${overdueCount > 0 ? 'text-red-600' : 'text-gray-900'}`} title={fmtFull(overdueTotal)}>
            {overdueCount > 0 ? fmt(overdueTotal) : '$0'}
          </p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Overdue</p>
          {overdueCount > 0 && (
            <p className="text-xs font-bold text-red-500 mt-1">{overdueCount} invoice{overdueCount !== 1 ? 's' : ''}</p>
          )}
        </Link>
      </div>

      {/* ── Live Bank Position ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Bank Position</p>
            {(connectedAccounts ?? []).length > 0 && liveBankBalance > 0 && (
              <p className="text-sm font-black text-gray-900 mt-0.5">
                {`$${liveBankBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} available across ${(connectedAccounts ?? []).length} account${(connectedAccounts ?? []).length !== 1 ? 's' : ''}`}
              </p>
            )}
          </div>
        </div>
        <ConnectedAccountsSection
          accounts={connectedAccounts ?? []}
          subscriptionTier={tier}
          transactionCount={txCount ?? 0}
        />
      </div>

      {/* ── Transaction Feed ──────────────────────────────────────────────── */}
      {(bankTransactions ?? []).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
              <Receipt className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bank Transactions</p>
              <p className="text-sm font-black text-gray-900 mt-0.5">Last 90 days · {txCount ?? 0} transactions</p>
            </div>
          </div>
          <TransactionList
            transactions={bankTransactions ?? []}
            unmatchedInvoices={reconcileInvoices}
            isPro={isPro}
          />
        </div>
      )}

      {/* ── Runway Calculator ─────────────────────────────────────────────── */}
      <RunwayCalculator
        avgMonthlyExpenses={avgMonthlyExp}
        overdueTotal={overdueTotal}
        initialBalance={latestBalance}
      />

      {/* ── 90-Day Forecast ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">90-Day Cash Forecast</p>
            <p className="text-sm font-black text-gray-900 mt-0.5">
              {hasForecastData
                ? forecastDipsNegative
                  ? 'Projected shortfall detected — review pipeline'
                  : 'Cash flow looks healthy over the next 90 days'
                : 'Enter your balance below to activate the forecast'}
            </p>
          </div>
          {forecastDipsNegative && (
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 flex-shrink-0">
              Shortfall risk
            </span>
          )}
        </div>
        {avgWeeklyExp > 0 && (
          <p className="text-xs text-gray-400 font-medium mb-5">
            Based on invoice due dates and {fmt(avgWeeklyExp)}/wk avg expenses
          </p>
        )}

        {!hasForecastData ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-sm font-bold text-gray-600 mb-1">Enter your bank balance to activate the forecast</p>
            <p className="text-xs text-gray-400 font-medium">Use the runway calculator above to save your current balance.</p>
          </div>
        ) : (
          <ForecastChart data={forecastData} />
        )}
      </div>

      {/* ── Outstanding invoices + Tax reserve ───────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Outstanding Invoices</p>
              <p className="text-sm font-black text-gray-900 mt-0.5">
                {unpaidInvoices.length === 0
                  ? 'No outstanding invoices'
                  : `${unpaidInvoices.length} invoice${unpaidInvoices.length !== 1 ? 's' : ''} · ${fmt(pendingPipeline)} pipeline`}
              </p>
            </div>
            <Link href="/dashboard/invoices"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0">
              View all →
            </Link>
          </div>
          <UpcomingPaymentsList invoices={unpaidInvoices} />
        </div>
        <div className="xl:col-span-1">
          <TaxReserveEstimate netProfit={netProfit} totalRevenue={totalRevenue} />
        </div>
      </div>

      {/* ── Revenue vs Expenses 12-month chart ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue vs Expenses</p>
            <p className="text-sm font-black text-gray-900 mt-0.5">12-month comparison</p>
          </div>
          <Link href="/dashboard/analytics"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
            Full analytics →
          </Link>
        </div>
        <RevenueVsExpenseChart data={revExpData} />
      </div>
      <BackToTop />
    </div>
  )
}