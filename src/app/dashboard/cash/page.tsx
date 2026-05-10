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
import { getInvoiceDisplayStatus } from '@/lib/utils/invoice-status'
import RunwayCalculator            from '@/components/cash/runway-calculator'
import { ForecastChart }           from '@/components/cash/forecast-chart'
import { RevenueVsExpenseChart }   from '@/components/cash/revenue-vs-expense-chart'
import UpcomingPaymentsList        from '@/components/cash/upcoming-payments-list'
import TaxReserveEstimate          from '@/components/cash/tax-reserve-estimate'
import CoreTabBar                  from '@/components/layout/core-tab-bar'
import PageAutoRefresh             from '@/components/ui/page-auto-refresh'

const fmt = (n: number): string => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 999_500)       return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000)        return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)
}
const fmtFull = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export default async function CashPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_subscription_id, subscription_status')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription =
    !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')

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

  const now = new Date()

  // ── Data ─────────────────────────────────────────────────────────────────
  const { data: invoicesRaw } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, issue_date, due_date, total_amount, clients(name)')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true })

  const invoices = (invoicesRaw ?? []).map((inv: any) => ({
    ...inv,
    clients: Array.isArray(inv.clients) ? (inv.clients[0] ?? null) : (inv.clients ?? null),
    displayStatus: getInvoiceDisplayStatus({ status: inv.status, due_date: inv.due_date }),
  }))

  const unpaidInvoices = invoices.filter((inv: any) =>
    inv.displayStatus === 'sent' || inv.displayStatus === 'overdue'
  )

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

  const overdueTotal = invoices
    .filter((inv: any) => inv.displayStatus === 'overdue')
    .reduce((s: number, inv: any) => s + Number(inv.total_amount || 0), 0)
  const overdueCount = invoices.filter((inv: any) => inv.displayStatus === 'overdue').length

  const ninetyDaysAgo = new Date(now); ninetyDaysAgo.setDate(now.getDate() - 90)
  const expenses90    = expenses.filter(e => new Date(e.date + 'T12:00:00') >= ninetyDaysAgo)
  const total90       = expenses90.reduce((s, e) => s + Number(e.amount || 0), 0)
  const avgWeeklyExp  = total90 / 13
  const avgMonthlyExp = avgWeeklyExp * (52 / 12)

  const pendingPipeline = unpaidInvoices
    .reduce((s: number, inv: any) => s + Number(inv.total_amount || 0), 0)

  // ── 90-day forecast ───────────────────────────────────────────────────────
  const forecastData = (() => {
    const baseline = (latestBalance ?? 0) + confirmedDirectInflows
    const points   = []
    let running    = baseline
    for (let w = 0; w < 13; w++) {
      const weekStart = new Date(now); weekStart.setDate(now.getDate() + w * 7); weekStart.setHours(0,0,0,0)
      const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23,59,59,999)
      const inflows   = unpaidInvoices
        .filter((inv: any) => { const d = new Date(inv.due_date + 'T12:00:00'); return d >= weekStart && d <= weekEnd })
        .reduce((s: number, inv: any) => s + Number(inv.total_amount || 0), 0)
      running += inflows - avgWeeklyExp
      points.push({
        week:             weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        projectedBalance: Math.round(running * 100) / 100,
        inflows:          Math.round(inflows * 100) / 100,
        outflows:         Math.round(avgWeeklyExp * 100) / 100,
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
      <PageAutoRefresh interval={30_000} />
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
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">AI-powered forecast</span>
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
    </div>
  )
}