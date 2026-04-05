// src/app/dashboard/cash/page.tsx
//
// WHAT THIS PAGE DOES:
//   The financial command center. Synthesises data from every other module:
//   invoices + expenses + time entries + cash snapshots → actionable financial picture.
//
// SECTIONS:
//   1. Summary metric cards (revenue, expenses, net profit, overdue)
//   2. RunwayCalculator (client component — interactive balance input)
//   3. 90-day ForecastChart (projected week-by-week balance)
//   4. UpcomingPaymentsList (all unpaid invoices sorted by urgency)
//   5. RevenueVsExpenseChart (12-month comparison)
//   6. TaxReserveEstimate
//
// 90-DAY FORECAST ALGORITHM:
//   - Baseline = latest cash_snapshot balance (or 0 if none)
//   - Inflows per week = invoices due in that week (using due_date, not AI prediction,
//     because we want determinate data, not probabilistic. AI predictions are used
//     separately in the upcoming payments list tooltip.)
//   - Outflows per week = avgWeeklyExpenses (last 90 days of expenses ÷ 13 weeks)
//   - We do NOT use AI predictions here to avoid confusion — the forecast is
//     based on what's contractually owed, not what might be paid.
//
// OVERFLOW PROTECTION:
//   All currency values use formatCompact() + title tooltip — same pattern
//   established in dashboard/page.tsx (formatCurrencyCompact).

import { redirect }        from 'next/navigation'
import { createClient }    from '@/lib/supabase/server'
import Link                from 'next/link'
import {
  ArrowLeft, TrendingUp, DollarSign, AlertCircle,
  Receipt, Clock, TrendingDown,
} from 'lucide-react'
import { getInvoiceDisplayStatus } from '@/lib/utils/invoice-status'
import RunwayCalculator            from '@/components/cash/runway-calculator'
import { ForecastChart }           from '@/components/cash/forecast-chart'
import { RevenueVsExpenseChart }   from '@/components/cash/revenue-vs-expense-chart'
import UpcomingPaymentsList        from '@/components/cash/upcoming-payments-list'
import TaxReserveEstimate          from '@/components/cash/tax-reserve-estimate'
import MetricCardValue             from '@/components/dashboard/metric-card-value'

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatCurrencyFull = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const formatCompact = (n: number): string => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000)        return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  // ── No subscription gate ─────────────────────────────────────────────────
  if (!hasActiveSubscription) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">Cash Management</h1>
          <p className="text-gray-500 mt-2 font-medium">Your financial command center</p>
        </div>
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">Subscribe to access Cash Management</h3>
          <p className="text-gray-500 mb-6">See your 90-day cash forecast, runway, and tax estimate in one place.</p>
          <Link href="/pricing" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
            View Plans
          </Link>
        </div>
      </div>
    )
  }

  const now = new Date()

  // ── Invoices (all, for metrics + forecast + upcoming list) ───────────────
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

  // Unpaid sent invoices for upcoming list
  const unpaidInvoices = invoices.filter(inv =>
    inv.displayStatus === 'sent' || inv.displayStatus === 'overdue'
  )

  // ── Revenue and overdue totals ────────────────────────────────────────────
  const totalRevenue = invoices
    .filter(inv => inv.displayStatus === 'paid')
    .reduce((s, inv) => s + Number(inv.total_amount || 0), 0)

  const overdueTotal = invoices
    .filter(inv => inv.displayStatus === 'overdue')
    .reduce((s, inv) => s + Number(inv.total_amount || 0), 0)

  const overdueCount = invoices.filter(inv => inv.displayStatus === 'overdue').length

  // ── Expenses ─────────────────────────────────────────────────────────────
  const { data: expensesRaw } = await supabase
    .from('expenses')
    .select('amount, date')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  const expenses    = (expensesRaw ?? []) as { amount: number; date: string }[]
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)

  // Avg weekly expenses (last 90 days ÷ 13 weeks)
  const ninetyDaysAgo = new Date(now)
  ninetyDaysAgo.setDate(now.getDate() - 90)
  const expenses90   = expenses.filter(e => new Date(e.date + 'T12:00:00') >= ninetyDaysAgo)
  const total90      = expenses90.reduce((s, e) => s + Number(e.amount || 0), 0)
  const avgWeeklyExp = total90 / 13
  const avgMonthlyExp = avgWeeklyExp * (52 / 12)

  // ── Latest cash snapshot ─────────────────────────────────────────────────
  const { data: snapshotRaw } = await supabase
    .from('cash_snapshots')
    .select('balance')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const latestBalance: number | null = snapshotRaw?.balance ?? null

  // ── Revenue vs Expense: last 12 months ───────────────────────────────────
  const revExpData = Array.from({ length: 12 }, (_, idx) => {
    const d     = new Date(now.getFullYear(), now.getMonth() - (11 - idx), 1)
    const year  = d.getFullYear()
    const month = d.getMonth()
    const label = d.toLocaleString('en-US', { month: 'short' })

    const revenue = invoices
      .filter(inv => inv.displayStatus === 'paid')
      .filter(inv => {
        const dd = new Date(inv.issue_date + 'T12:00:00')
        return dd.getFullYear() === year && dd.getMonth() === month
      })
      .reduce((s, inv) => s + Number(inv.total_amount || 0), 0)

    const expAmt = expenses
      .filter(e => {
        const dd = new Date(e.date + 'T12:00:00')
        return dd.getFullYear() === year && dd.getMonth() === month
      })
      .reduce((s, e) => s + Number(e.amount || 0), 0)

    return { month: label, revenue, expenses: expAmt, profit: revenue - expAmt }
  })

  // ── 90-day forecast (13 weekly data points) ───────────────────────────────
  // Baseline: latest snapshot balance, or 0 if no snapshot exists.
  // Each week: balance += invoices due that week − avgWeeklyExpenses.
  // We show the week label and projected balance at start-of-week.
  const forecastData = (() => {
    const baseline = latestBalance ?? 0
    const points   = []
    let running    = baseline

    for (let w = 0; w < 13; w++) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() + w * 7)
      weekStart.setHours(0, 0, 0, 0)

      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      // Invoices due this week
      const inflows = unpaidInvoices
        .filter(inv => {
          const due = new Date(inv.due_date + 'T12:00:00')
          return due >= weekStart && due <= weekEnd
        })
        .reduce((s, inv) => s + Number(inv.total_amount || 0), 0)

      running += inflows - avgWeeklyExp
      const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      points.push({
        week:             label,
        projectedBalance: Math.round(running * 100) / 100,
        inflows:          Math.round(inflows * 100) / 100,
        outflows:         Math.round(avgWeeklyExp * 100) / 100,
      })
    }
    return points
  })()

  const hasForecastData = latestBalance !== null

  // ── Net profit ────────────────────────────────────────────────────────────
  const netProfit   = totalRevenue - totalExpenses
  const isProfitable = netProfit >= 0

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200
                       bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg
                       transition-all font-bold text-gray-700 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">Cash Management</h1>
            <p className="text-base sm:text-lg text-gray-600 mt-2 font-medium">
              Your financial command center
            </p>
          </div>
        </div>
      </div>

      {/* ── Summary metric cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">

        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
          <div className="flex items-center justify-between mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <span className="text-xs font-bold text-green-700 uppercase tracking-wider bg-green-200 px-3 py-1.5 rounded-full">Revenue</span>
          </div>
          <p className="text-sm font-bold text-green-700 mb-2 uppercase tracking-wide">Total Revenue</p>
          <MetricCardValue compact={formatCompact(totalRevenue)} full={formatCurrencyFull(totalRevenue)} colorClass="text-green-900" />
        </div>

        {/* Total Expenses */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 border-2 border-orange-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
          <div className="flex items-center justify-between mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Receipt className="w-8 h-8 text-white" />
            </div>
            <span className="text-xs font-bold text-orange-700 uppercase tracking-wider bg-orange-200 px-3 py-1.5 rounded-full">Expenses</span>
          </div>
          <p className="text-sm font-bold text-orange-700 mb-2 uppercase tracking-wide">Total Expenses</p>
          <MetricCardValue compact={formatCompact(totalExpenses)} full={formatCurrencyFull(totalExpenses)} colorClass="text-orange-900" />
        </div>

        {/* Net Profit */}
        <div className={`rounded-2xl p-8 border-2 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 ${
          isProfitable
            ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'
            : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-100'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              isProfitable ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-red-500 to-rose-600'
            }`}>
              {isProfitable ? <TrendingUp className="w-8 h-8 text-white" /> : <TrendingDown className="w-8 h-8 text-white" />}
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${
              isProfitable ? 'text-blue-700 bg-blue-200' : 'text-red-700 bg-red-200'
            }`}>
              {isProfitable ? 'Profit' : 'Loss'}
            </span>
          </div>
          <p className={`text-sm font-bold mb-2 uppercase tracking-wide ${isProfitable ? 'text-blue-700' : 'text-red-700'}`}>
            Net Profit
          </p>
          <MetricCardValue
            compact={formatCompact(Math.abs(netProfit))}
            full={formatCurrencyFull(Math.abs(netProfit))}
            colorClass={isProfitable ? 'text-blue-900' : 'text-red-900'}
          />
        </div>

        {/* Overdue */}
        <div className={`rounded-2xl p-8 border-2 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 ${
          overdueCount > 0
            ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-100'
            : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-100'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              overdueCount > 0
                ? 'bg-gradient-to-br from-red-500 to-orange-600'
                : 'bg-gradient-to-br from-gray-400 to-slate-500'
            }`}>
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${
              overdueCount > 0 ? 'text-red-700 bg-red-200' : 'text-gray-600 bg-gray-200'
            }`}>
              {overdueCount > 0 ? 'Action needed' : 'All clear'}
            </span>
          </div>
          <p className={`text-sm font-bold mb-2 uppercase tracking-wide ${overdueCount > 0 ? 'text-red-700' : 'text-gray-500'}`}>
            Overdue Amount
          </p>
          {overdueCount > 0 ? (
            <MetricCardValue compact={formatCompact(overdueTotal)} full={formatCurrencyFull(overdueTotal)} colorClass="text-red-900" />
          ) : (
            <p className="text-3xl font-black text-gray-400">$0</p>
          )}
          {overdueCount > 0 && (
            <p className="text-xs text-red-600 font-bold mt-2">
              {overdueCount} invoice{overdueCount !== 1 ? 's' : ''} overdue
            </p>
          )}
        </div>

      </div>

      {/* ── Runway Calculator ────────────────────────────────────────────── */}
      <RunwayCalculator
        avgMonthlyExpenses={avgMonthlyExp}
        overdueTotal={overdueTotal}
        initialBalance={latestBalance}
      />

      {/* ── 90-Day Forecast ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">90-Day Cash Forecast</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Projected week-by-week balance based on invoice due dates and average expenses
            {avgWeeklyExp > 0 && ` (${formatCompact(avgWeeklyExp)}/wk avg outflows)`}
          </p>
        </div>

        {!hasForecastData ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Clock className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-bold mb-1">Enter your bank balance above to see the forecast.</p>
            <p className="text-gray-400 text-sm font-medium">
              The runway calculator at the top saves your balance and powers this chart.
            </p>
          </div>
        ) : (
          <ForecastChart data={forecastData} />
        )}
      </div>

      {/* ── Upcoming Payments + Tax Reserve side by side ─────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upcoming Payments — wider column */}
        <div className="xl:col-span-2 bg-white rounded-2xl border-2 border-gray-100 shadow-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Outstanding Invoices</h2>
              <p className="text-sm text-gray-500 font-medium mt-0.5">
                {unpaidInvoices.length} invoice{unpaidInvoices.length !== 1 ? 's' : ''} awaiting payment
                {overdueTotal > 0 && ` · ${formatCompact(overdueTotal)} overdue`}
              </p>
            </div>
            <Link href="/dashboard/invoices" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0">
              View all →
            </Link>
          </div>
          <UpcomingPaymentsList invoices={unpaidInvoices} />
        </div>

        {/* Tax Reserve — narrower column */}
        <div className="xl:col-span-1">
          <TaxReserveEstimate netProfit={netProfit} totalRevenue={totalRevenue} />
        </div>
      </div>

      {/* ── Revenue vs Expense 12-month chart ───────────────────────────── */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Revenue vs Expenses</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">12-month comparison</p>
        </div>
        <RevenueVsExpenseChart data={revExpData} />
      </div>

    </div>
  )
}