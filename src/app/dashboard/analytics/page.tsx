// src/app/dashboard/analytics/page.tsx
//
// Interactive analytics page — server component driven by URL search params.
// Sorting and limit selection happen server-side via ?sortBy= and ?limit=
// so no client state is needed and the page stays fast.
//
// SORT OPTIONS:
//   revenue  (default) — total paid invoice amount
//   rate               — payment consistency (% of sent invoices paid)
//   invoices           — total invoice count (most active relationship)
//   overdue            — overdue invoice count (flags problem clients)
//
// LIMIT: 5, 10, 20
//
// BUG FIX: formatCompact now uses threshold 999_500 for M to prevent the
//   $1000K display bug. Values between $999,500–$999,999 would previously
//   show as "$1000K" because (999999/1000).toFixed(0) rounds to 1000.
//   Fix: anything >= $999,500 shows as "$1.0M" instead.

import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import Link               from 'next/link'
import { ArrowLeft, Users, TrendingUp, FileText, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { ExpenseBreakdownChart }   from '@/components/dashboard/expense-breakdown-chart'
import { RevenueVsExpenseChart }   from '@/components/cash/revenue-vs-expense-chart'
import { EXPENSE_CATEGORIES }      from '@/lib/ai/expense-categorization'
import { getInvoiceDisplayStatus } from '@/lib/utils/invoice-status'

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatCurrencyFull = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

// BUG FIX: threshold at 999_500 prevents $1000K edge case.
// (999,999 / 1,000).toFixed(0) = "1000" → would show "$1000K" — wrong.
// Anything >= $999,500 now shows as "$1.0M" instead.
const formatCompact = (n: number): string => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 999_500)       return `$${(n / 1_000_000).toFixed(1)}M`   // ← was 1_000_000
  if (n >= 10_000)        return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)
}

const categoryChartColors: Record<string, string> = {
  software: '#3B82F6', hardware: '#6B7280', travel: '#F59E0B',
  meals: '#F97316', marketing: '#EC4899', office: '#06B6D4',
  professional: '#8B5CF6', utilities: '#14B8A6', education: '#6366F1',
  insurance: '#22C55E', taxes: '#EF4444', other: '#9CA3AF',
}

// ─── Sort config ──────────────────────────────────────────────────────────────

type SortKey = 'revenue' | 'rate' | 'invoices' | 'overdue'
type LimitVal = 5 | 10 | 20

const SORT_OPTIONS: { key: SortKey; label: string; description: string }[] = [
  { key: 'revenue',  label: 'Revenue',      description: 'Highest total paid value' },
  { key: 'rate',     label: 'Pay Rate',      description: 'Most consistent payment' },
  { key: 'invoices', label: 'Most Active',   description: 'Most invoices issued' },
  { key: 'overdue',  label: 'Overdue Risk',  description: 'Most overdue invoices' },
]

const LIMIT_OPTIONS: LimitVal[] = [5, 10, 20]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ sortBy?: string; limit?: string }>
}) {
  const params = await searchParams
  const sortBy = (SORT_OPTIONS.map(s => s.key).includes(params.sortBy as SortKey)
    ? params.sortBy
    : 'revenue') as SortKey
  const limit  = LIMIT_OPTIONS.includes(Number(params.limit) as LimitVal)
    ? (Number(params.limit) as LimitVal)
    : 10

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_subscription_id, subscription_status')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription = !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')

  // ── Data fetching (parallel) ──────────────────────────────────────────────
  const [{ data: invoicesRaw }, { data: clientsRaw }, { data: expensesRaw }] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, status, issue_date, due_date, total_amount, client_id')
      .eq('user_id', user.id),
    supabase
      .from('clients')
      .select('id, name, company')
      .eq('user_id', user.id),
    supabase
      .from('expenses')
      .select('amount, category, date')
      .eq('user_id', user.id),
  ])

  const invoices = (invoicesRaw ?? []).map((inv: any) => ({
    ...inv,
    displayStatus: getInvoiceDisplayStatus({ status: inv.status, due_date: inv.due_date }),
  }))
  const clients  = (clientsRaw  ?? []) as { id: string; name: string; company: string | null }[]
  const expenses = (expensesRaw ?? []) as { amount: number; category: string; date: string }[]

  // ── Summary numbers ───────────────────────────────────────────────────────
  const paidInvoices    = invoices.filter(i => i.displayStatus === 'paid')
  const sentInvoices    = invoices.filter(i => ['sent', 'paid', 'overdue'].includes(i.displayStatus))
  const overdueInvoices = invoices.filter(i => i.displayStatus === 'overdue')
  const draftInvoices   = invoices.filter(i => i.displayStatus === 'draft')

  const totalRevenue  = paidInvoices.reduce((s, i) => s + Number(i.total_amount || 0), 0)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const netProfit     = totalRevenue - totalExpenses
  const isProfitable  = netProfit >= 0

  const collectionRate = sentInvoices.length > 0
    ? Math.round((paidInvoices.length / sentInvoices.length) * 100)
    : null

  const avgInvoiceSize = paidInvoices.length > 0
    ? paidInvoices.reduce((s, i) => s + Number(i.total_amount || 0), 0) / paidInvoices.length
    : 0

  const overdueValue = overdueInvoices.reduce((s, i) => s + Number(i.total_amount || 0), 0)

  // ── Per-client stats ──────────────────────────────────────────────────────
  type ClientStat = {
    name:          string
    company:       string | null
    totalRevenue:  number
    paidCount:     number
    overdueCount:  number
    totalSent:     number
    totalInvoices: number
    collectionRate: number | null
  }

  const clientMap = new Map<string, ClientStat>()

  clients.forEach(c => {
    clientMap.set(c.id, {
      name: c.name, company: c.company,
      totalRevenue: 0, paidCount: 0, overdueCount: 0,
      totalSent: 0, totalInvoices: 0, collectionRate: null,
    })
  })

  invoices.forEach(inv => {
    if (!inv.client_id) return
    const e = clientMap.get(inv.client_id)
    if (!e) return
    e.totalInvoices++
    if (inv.displayStatus === 'paid') {
      e.totalRevenue += Number(inv.total_amount || 0)
      e.paidCount++
      e.totalSent++
    } else if (inv.displayStatus === 'sent') {
      e.totalSent++
    } else if (inv.displayStatus === 'overdue') {
      e.overdueCount++
      e.totalSent++
    }
  })

  // Compute collectionRate per client
  clientMap.forEach(c => {
    c.collectionRate = c.totalSent > 0
      ? Math.round((c.paidCount / c.totalSent) * 100)
      : null
  })

  // Filter to clients with any data, then sort by selected key
  const allClientStats = Array.from(clientMap.values()).filter(c => c.totalInvoices > 0)

  const sortedClients = [...allClientStats].sort((a, b) => {
    switch (sortBy) {
      case 'rate':
        // Clients with no sent invoices go to bottom
        if (a.collectionRate === null && b.collectionRate === null) return b.totalRevenue - a.totalRevenue
        if (a.collectionRate === null) return 1
        if (b.collectionRate === null) return -1
        return b.collectionRate - a.collectionRate
      case 'invoices':
        return b.totalInvoices - a.totalInvoices
      case 'overdue':
        // Sort by overdue count desc, then overdue value desc as tiebreaker
        if (b.overdueCount !== a.overdueCount) return b.overdueCount - a.overdueCount
        return b.totalRevenue - a.totalRevenue
      case 'revenue':
      default:
        return b.totalRevenue - a.totalRevenue
    }
  }).slice(0, limit)

  // Max for bar chart scaling
  const maxValue = (() => {
    switch (sortBy) {
      case 'rate':     return 100
      case 'invoices': return Math.max(...sortedClients.map(c => c.totalInvoices), 1)
      case 'overdue':  return Math.max(...sortedClients.map(c => c.overdueCount), 1)
      default:         return Math.max(...sortedClients.map(c => c.totalRevenue), 1)
    }
  })()

  // ── Expense breakdown ─────────────────────────────────────────────────────
  const categoryBreakdown = EXPENSE_CATEGORIES
    .map(cat => ({
      name:  cat.label,
      value: expenses
        .filter(e => e.category === cat.value)
        .reduce((s, e) => s + Number(e.amount || 0), 0),
      color: categoryChartColors[cat.value] ?? '#9CA3AF',
    }))
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value)

  // ── Revenue vs Expense 12-month ───────────────────────────────────────────
  const now = new Date()
  const revExpData = Array.from({ length: 12 }, (_, idx) => {
    const d     = new Date(now.getFullYear(), now.getMonth() - (11 - idx), 1)
    const year  = d.getFullYear()
    const month = d.getMonth()
    const label = d.toLocaleString('en-US', { month: 'short' })

    const rev = paidInvoices
      .filter((i: any) => {
        const dd = new Date(i.issue_date + 'T12:00:00')
        return dd.getFullYear() === year && dd.getMonth() === month
      })
      .reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)

    const exp = expenses
      .filter(e => {
        const dd = new Date(e.date + 'T12:00:00')
        return dd.getFullYear() === year && dd.getMonth() === month
      })
      .reduce((s, e) => s + Number(e.amount || 0), 0)

    return { month: label, revenue: rev, expenses: exp, profit: rev - exp }
  })

  // ── Helper: build URL preserving other params ─────────────────────────────
  const buildUrl = (overrides: Record<string, string | number>) => {
    const p = new URLSearchParams()
    p.set('sortBy', overrides.sortBy as string ?? sortBy)
    p.set('limit',  String(overrides.limit ?? limit))
    return `/dashboard/analytics?${p.toString()}`
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200
                       bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg
                       transition-all duration-200 font-bold text-gray-700 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">Analytics</h1>
            <p className="text-base sm:text-lg text-gray-600 mt-2 font-medium">
              Understand your business performance
            </p>
          </div>
        </div>
      </div>

      {/* Not subscribed */}
      {!hasActiveSubscription ? (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-12 text-center">
          <h3 className="text-xl font-black text-gray-900 mb-2">Subscribe to view analytics</h3>
          <p className="text-gray-500 mb-6">Get full visibility into your revenue and expenses.</p>
          <Link href="/pricing" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
            View Plans
          </Link>
        </div>
      ) : (
        <>

          {/* ── 1. Summary row ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Total Revenue', value: formatCompact(totalRevenue), full: formatCurrencyFull(totalRevenue), color: 'text-green-900', bg: 'from-green-50 to-emerald-50 border-green-100' },
              { label: 'Total Expenses', value: formatCompact(totalExpenses), full: formatCurrencyFull(totalExpenses), color: 'text-orange-900', bg: 'from-orange-50 to-amber-50 border-orange-100' },
              { label: isProfitable ? 'Net Profit' : 'Net Loss', value: formatCompact(Math.abs(netProfit)), full: formatCurrencyFull(Math.abs(netProfit)), color: isProfitable ? 'text-blue-900' : 'text-red-900', bg: isProfitable ? 'from-blue-50 to-indigo-50 border-blue-100' : 'from-red-50 to-rose-50 border-red-100' },
            ].map(m => (
              <div key={m.label} className={`rounded-2xl p-6 border-2 bg-gradient-to-br ${m.bg} shadow-sm`}>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">{m.label}</p>
                <p className={`text-3xl font-black tracking-tight truncate min-w-0 ${m.color}`} title={m.full}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          {/* ── 2. Invoice Health ──────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Invoice Health</h2>
                <p className="text-sm text-gray-500 font-medium">How well your invoices are performing</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Collection Rate</p>
                </div>
                <p className={`text-3xl font-black tracking-tight ${
                  collectionRate === null ? 'text-gray-300'
                  : collectionRate >= 80 ? 'text-green-700'
                  : collectionRate >= 60 ? 'text-amber-700'
                  : 'text-red-700'
                }`}>
                  {collectionRate !== null ? `${collectionRate}%` : '—'}
                </p>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  {paidInvoices.length} of {sentInvoices.length} invoices paid
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Avg Invoice</p>
                </div>
                <p
                  className="text-3xl font-black tracking-tight text-blue-900 truncate min-w-0"
                  title={formatCurrencyFull(avgInvoiceSize)}
                >
                  {avgInvoiceSize > 0 ? formatCompact(avgInvoiceSize) : '—'}
                </p>
                <p className="text-xs text-gray-400 font-medium mt-1">per paid invoice</p>
              </div>

              <div className={`rounded-xl p-5 ${overdueValue > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className={`w-4 h-4 ${overdueValue > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Overdue</p>
                </div>
                <p
                  className={`text-3xl font-black tracking-tight truncate min-w-0 ${overdueValue > 0 ? 'text-red-800' : 'text-gray-300'}`}
                  title={formatCurrencyFull(overdueValue)}
                >
                  {overdueValue > 0 ? formatCompact(overdueValue) : '—'}
                </p>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  {overdueInvoices.length > 0
                    ? `${overdueInvoices.length} invoice${overdueInvoices.length !== 1 ? 's' : ''} overdue`
                    : 'No overdue invoices'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Drafts</p>
                </div>
                <p className="text-3xl font-black tracking-tight text-gray-500">
                  {draftInvoices.length}
                </p>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  {draftInvoices.length > 0 ? 'unsent invoices' : 'no drafts pending'}
                </p>
              </div>
            </div>

            {/* Pipeline bar */}
            {invoices.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Invoice Pipeline</p>
                  <p className="text-xs text-gray-400 font-medium">{invoices.length} total</p>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                  {[
                    { s: 'paid',    count: paidInvoices.length,    color: '#10B981' },
                    { s: 'sent',    count: invoices.filter(i => i.displayStatus === 'sent').length, color: '#3B82F6' },
                    { s: 'overdue', count: overdueInvoices.length,  color: '#EF4444' },
                    { s: 'draft',   count: draftInvoices.length,    color: '#E5E7EB' },
                  ].filter(s => s.count > 0).map(s => (
                    <div
                      key={s.s}
                      title={`${s.s}: ${s.count}`}
                      className="h-full"
                      style={{ width: `${(s.count / invoices.length) * 100}%`, background: s.color }}
                    />
                  ))}
                </div>
                <div className="flex gap-4 mt-2 flex-wrap">
                  {[
                    { label: 'Paid',    color: '#10B981', count: paidInvoices.length },
                    { label: 'Sent',    color: '#3B82F6', count: invoices.filter(i => i.displayStatus === 'sent').length },
                    { label: 'Overdue', color: '#EF4444', count: overdueInvoices.length },
                    { label: 'Draft',   color: '#9CA3AF', count: draftInvoices.length },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-xs font-medium text-gray-500">{s.label} ({s.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── 3. Client Intelligence ─────────────────────────────────────── */}
          {allClientStats.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-8">
              {/* Section header + controls */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Client Intelligence</h2>
                    <p className="text-sm text-gray-500 font-medium">
                      Showing top {Math.min(limit, allClientStats.length)} of {allClientStats.length} clients
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/clients" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0">
                  View all clients →
                </Link>
              </div>

              {/* Sort + Limit controls */}
              <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">

                {/* Sort by */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Rank by</p>
                  <div className="flex flex-wrap gap-2">
                    {SORT_OPTIONS.map(opt => (
                      <Link
                        key={opt.key}
                        href={buildUrl({ sortBy: opt.key, limit })}
                        title={opt.description}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          sortBy === opt.key
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                        {opt.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Limit */}
                <div className="flex-shrink-0">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Show</p>
                  <div className="flex gap-2">
                    {LIMIT_OPTIONS.map(l => (
                      <Link
                        key={l}
                        href={buildUrl({ sortBy, limit: l })}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          limit === l
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                        Top {l}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Client list */}
              <div className="space-y-4">
                {sortedClients.map((client, idx) => {
                  // Bar width based on sort key
                  const barPct = (() => {
                    switch (sortBy) {
                      case 'rate':     return client.collectionRate ?? 0
                      case 'invoices': return maxValue > 0 ? Math.round((client.totalInvoices / maxValue) * 100) : 0
                      case 'overdue':  return maxValue > 0 ? Math.round((client.overdueCount  / maxValue) * 100) : 0
                      default:         return maxValue > 0 ? Math.round((client.totalRevenue  / maxValue) * 100) : 0
                    }
                  })()

                  // Primary metric label
                  const primaryMetric = (() => {
                    switch (sortBy) {
                      case 'rate':
                        return client.collectionRate !== null
                          ? `${client.collectionRate}% paid`
                          : '—'
                      case 'invoices':
                        return `${client.totalInvoices} invoice${client.totalInvoices !== 1 ? 's' : ''}`
                      case 'overdue':
                        return client.overdueCount > 0
                          ? `${client.overdueCount} overdue`
                          : 'None overdue'
                      default:
                        return client.totalRevenue > 0
                          ? formatCompact(client.totalRevenue)
                          : 'No revenue'
                    }
                  })()

                  const primaryMetricFull = (() => {
                    switch (sortBy) {
                      case 'rate':     return client.collectionRate !== null ? `${client.collectionRate}% payment rate` : 'No paid invoices'
                      case 'invoices': return `${client.totalInvoices} total invoices`
                      case 'overdue':  return `${client.overdueCount} overdue invoices`
                      default:         return formatCurrencyFull(client.totalRevenue)
                    }
                  })()

                  // Secondary info (always shown regardless of sort)
                  const rateForBadge = client.collectionRate
                  const hasOverdue   = client.overdueCount > 0
                  const showRateBadge = sortBy !== 'rate' && rateForBadge !== null

                  const barColor = (() => {
                    switch (sortBy) {
                      case 'rate':    return rateForBadge !== null && rateForBadge >= 80 ? '#10B981' : rateForBadge !== null && rateForBadge >= 60 ? '#F59E0B' : '#EF4444'
                      case 'overdue': return '#EF4444'
                      default:        return undefined  // use gradient
                    }
                  })()

                  return (
                    <div key={client.name}>
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        {/* Rank */}
                        <span className={`text-xs font-black w-5 flex-shrink-0 ${
                          idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-gray-300'
                        }`}>
                          #{idx + 1}
                        </span>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-gray-900 truncate">{client.name}</span>
                            {client.company && (
                              <span className="text-xs text-gray-400 font-medium truncate">{client.company}</span>
                            )}
                            {hasOverdue && sortBy !== 'overdue' && (
                              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 flex-shrink-0">
                                {client.overdueCount} overdue
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {showRateBadge && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                              rateForBadge! >= 80 ? 'text-green-700 bg-green-100'
                              : rateForBadge! >= 60 ? 'text-amber-700 bg-amber-100'
                              : 'text-red-700 bg-red-100'
                            }`}>
                              {rateForBadge}% paid
                            </span>
                          )}
                          {/* Always show revenue unless we're already ranking by revenue */}
                          {sortBy !== 'revenue' && client.totalRevenue > 0 && (
                            <span
                              className="text-xs text-gray-400 font-bold"
                              title={formatCurrencyFull(client.totalRevenue)}
                            >
                              {formatCompact(client.totalRevenue)}
                            </span>
                          )}
                          <span
                            className={`text-sm font-black ${
                              sortBy === 'overdue' && client.overdueCount > 0
                                ? 'text-red-700'
                                : sortBy === 'rate' && rateForBadge !== null
                                ? rateForBadge >= 80 ? 'text-green-700' : rateForBadge >= 60 ? 'text-amber-700' : 'text-red-700'
                                : 'text-gray-900'
                            }`}
                            title={primaryMetricFull}
                          >
                            {primaryMetric}
                          </span>
                        </div>
                      </div>

                      {/* Bar */}
                      <div className="ml-8 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${barPct}%`,
                            background: barColor ?? 'linear-gradient(to right, #14B8A6, #3B82F6)',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── 4. Expense Breakdown ───────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Expense Breakdown</h2>
              <p className="text-sm text-gray-500 font-medium mt-1" title={formatCurrencyFull(totalExpenses)}>
                Total: {formatCompact(totalExpenses)} across {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
              </p>
            </div>

            {categoryBreakdown.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-gray-400 font-medium mb-2">No expenses recorded yet.</p>
                <Link href="/dashboard/expenses/new" className="text-blue-600 font-bold text-sm hover:underline">
                  Add your first expense →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-center">
                <ExpenseBreakdownChart data={categoryBreakdown} />
                <div className="space-y-3">
                  {categoryBreakdown.map(cat => (
                    <div key={cat.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-gray-700 truncate">{cat.name}</span>
                          <span className="text-sm font-black text-gray-900 flex-shrink-0" title={formatCurrencyFull(cat.value)}>
                            {formatCompact(cat.value)}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${totalExpenses > 0 ? (cat.value / totalExpenses) * 100 : 0}%`, backgroundColor: cat.color }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-400 flex-shrink-0 w-10 text-right">
                        {totalExpenses > 0 ? Math.round((cat.value / totalExpenses) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── 5. Revenue vs Expenses ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Revenue vs Expenses</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Monthly comparison over the last 12 months</p>
            </div>
            <RevenueVsExpenseChart data={revExpData} />
          </div>

          {/* ── 6. Cash Management link ────────────────────────────────────── */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-8 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-1">Want the full financial picture?</h3>
              <p className="text-gray-600 font-medium text-sm">
                Cash Management shows your 90-day forecast, cash runway, and upcoming payment timeline.
              </p>
            </div>
            <Link
              href="/dashboard/cash"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg transition-all flex-shrink-0"
            >
              Open Cash Management →
            </Link>
          </div>

        </>
      )}
    </div>
  )
}