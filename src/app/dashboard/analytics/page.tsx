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
// ORIENTATION: v (default, vertical columns) | h (horizontal bars)
//   Only applies to viewMode === 'revenue' and viewMode === 'rate' charts.
//
// SORT TIEBREAKERS (critical — ensures deterministic ranking order):
//   revenue:  primary = totalRevenue DESC
//   rate:     primary = collectionRate DESC, tiebreaker = totalRevenue DESC
//             null rates always go to bottom
//   invoices: primary = totalInvoices DESC, tiebreaker = totalRevenue DESC
//   overdue:  primary = overdueCount DESC
//             tiebreaker 1 = collectionRate ASC (lower rate = riskier)
//             tiebreaker 2 = totalRevenue DESC
//             null rates treated as 100 (not risky) → go to bottom
//
// BUG FIX: formatCompact now uses threshold 999_500 for M to prevent the
//   $1000K display bug. Values between $999,500–$999,999 would previously
//   show as "$1000K" because (999999/1000).toFixed(0) rounds to 1000.
//   Fix: anything >= $999,500 shows as "$1.0M" instead.

import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import Link               from 'next/link'
import { ArrowLeft, TrendingUp, FileText, CheckCircle2, AlertCircle, Clock, Banknote, Tag, CreditCard } from 'lucide-react'
import { ExpenseBreakdownChart }   from '@/components/dashboard/expense-breakdown-chart'
import { RevenueVsExpenseChart }   from '@/components/cash/revenue-vs-expense-chart'
import { StackedRevenueChart }     from '@/components/analytics/stacked-revenue-chart'
import { EXPENSE_CATEGORIES }      from '@/lib/ai/expense-categorization'
import { getInvoiceDisplayStatus } from '@/lib/utils/invoice-status'
import ClientIntelligencePanel     from '@/components/analytics/client-intelligence-panel'
import type { ClientStat }         from '@/components/analytics/client-intelligence-panel'

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatCurrencyFull = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

// BUG FIX: threshold at 999_500 prevents $1000K edge case.
const formatCompact = (n: number): string => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 999_500)       return `$${(n / 1_000_000).toFixed(1)}M`
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

type SortKey   = 'revenue' | 'rate' | 'invoices' | 'overdue'
type LimitVal  = 5 | 10 | 20
type ViewMode  = 'list' | 'table' | 'revenue' | 'rate'
type OrientVal = 'v' | 'h'

const SORT_OPTIONS: { key: SortKey; label: string; description: string }[] = [
  { key: 'revenue',  label: 'Revenue',      description: 'Highest total paid value' },
  { key: 'rate',     label: 'Pay Rate',      description: 'Most consistent payment' },
  { key: 'invoices', label: 'Most Active',   description: 'Most invoices issued' },
  { key: 'overdue',  label: 'Overdue Risk',  description: 'Most overdue invoices' },
]

const LIMIT_OPTIONS:  LimitVal[]  = [5, 10, 20]
const VIEW_OPTIONS:   ViewMode[]  = ['list', 'table', 'revenue', 'rate']
const ORIENT_OPTIONS: OrientVal[] = ['v', 'h']

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ sortBy?: string; limit?: string; viewMode?: string; orientation?: string }>
}) {
  const params      = await searchParams
  const sortBy      = (SORT_OPTIONS.map(s => s.key).includes(params.sortBy as SortKey)
    ? params.sortBy
    : 'revenue') as SortKey
  const limit       = LIMIT_OPTIONS.includes(Number(params.limit) as LimitVal)
    ? (Number(params.limit) as LimitVal)
    : 10
  const viewMode    = (VIEW_OPTIONS.includes(params.viewMode as ViewMode)
    ? params.viewMode
    : 'list') as ViewMode
  const orientation = (ORIENT_OPTIONS.includes(params.orientation as OrientVal)
    ? params.orientation
    : 'v') as OrientVal

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
  const [
    { data: invoicesRaw },
    { data: clientsRaw },
    { data: expensesRaw },
    { data: directPaymentsRaw },
    { data: revCategoriesRaw },
  ] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, status, issue_date, due_date, total_amount, client_id, revenue_category_id')
      .eq('user_id', user.id),
    supabase
      .from('clients')
      .select('id, name, company')
      .eq('user_id', user.id),
    supabase
      .from('expenses')
      .select('amount, category, date')
      .eq('user_id', user.id),
    supabase
      .from('direct_payments')
      .select('id, amount, payment_type, payment_method, payment_date, revenue_category_id')
      .eq('user_id', user.id),
    supabase
      .from('revenue_categories')
      .select('id, name, color')
      .eq('user_id', user.id),
  ])

  const invoices        = (invoicesRaw ?? []).map((inv: any) => ({
    ...inv,
    displayStatus: getInvoiceDisplayStatus({ status: inv.status, due_date: inv.due_date }),
  }))
  const clients         = (clientsRaw  ?? []) as { id: string; name: string; company: string | null }[]
  const expenses        = (expensesRaw ?? []) as { amount: number; category: string; date: string }[]
  const directPayments  = (directPaymentsRaw ?? []) as {
    id: string; amount: number; payment_type: string; payment_method: string;
    payment_date: string; revenue_category_id: string | null
  }[]
  const revCategories   = (revCategoriesRaw ?? []) as { id: string; name: string; color: string }[]

  // ── Build a category lookup map ───────────────────────────────────────────
  const catMap = new Map(revCategories.map(c => [c.id, c]))

  // ── Summary numbers ───────────────────────────────────────────────────────
  const paidInvoices    = invoices.filter(i => i.displayStatus === 'paid')
  const sentInvoices    = invoices.filter(i => ['sent', 'paid', 'overdue'].includes(i.displayStatus))
  const overdueInvoices = invoices.filter(i => i.displayStatus === 'overdue')
  const draftInvoices   = invoices.filter(i => i.displayStatus === 'draft')

  const invoiceRevenue   = paidInvoices.reduce((s, i) => s + Number(i.total_amount || 0), 0)
  const directRevenue    = directPayments.reduce((s, p) => s + Number(p.amount || 0), 0)
  const totalRevenue     = invoiceRevenue + directRevenue
  const totalExpenses    = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const netProfit        = totalRevenue - totalExpenses
  const isProfitable     = netProfit >= 0

  const collectionRate = sentInvoices.length > 0
    ? Math.round((paidInvoices.length / sentInvoices.length) * 100)
    : null

  const avgInvoiceSize = paidInvoices.length > 0
    ? paidInvoices.reduce((s, i) => s + Number(i.total_amount || 0), 0) / paidInvoices.length
    : 0

  const overdueValue = overdueInvoices.reduce((s, i) => s + Number(i.total_amount || 0), 0)

  // ── Revenue Intelligence data ─────────────────────────────────────────────

  // By source
  const invoiceSourcePct = totalRevenue > 0 ? Math.round((invoiceRevenue / totalRevenue) * 100) : 0
  const directSourcePct  = totalRevenue > 0 ? 100 - invoiceSourcePct : 0

  // By category — merge invoices (paid only) + direct payments
  const revByCategoryMap = new Map<string, { name: string; color: string; total: number }>()
  let uncategorizedTotal = 0

  paidInvoices.forEach(inv => {
    const amount = Number(inv.total_amount || 0)
    const catId  = inv.revenue_category_id
    if (catId && catMap.has(catId)) {
      const cat = catMap.get(catId)!
      const existing = revByCategoryMap.get(catId)
      revByCategoryMap.set(catId, {
        name:  cat.name,
        color: cat.color,
        total: (existing?.total ?? 0) + amount,
      })
    } else {
      uncategorizedTotal += amount
    }
  })

  directPayments.forEach(p => {
    const amount = Number(p.amount || 0)
    const catId  = p.revenue_category_id
    if (catId && catMap.has(catId)) {
      const cat = catMap.get(catId)!
      const existing = revByCategoryMap.get(catId)
      revByCategoryMap.set(catId, {
        name:  cat.name,
        color: cat.color,
        total: (existing?.total ?? 0) + amount,
      })
    } else {
      uncategorizedTotal += amount
    }
  })

  const revByCategory = Array.from(revByCategoryMap.values())
    .sort((a, b) => b.total - a.total)
  if (uncategorizedTotal > 0) {
    revByCategory.push({ name: 'Uncategorized', color: '#9CA3AF', total: uncategorizedTotal })
  }

  // By payment method — direct payments only (invoices are always "invoice")
  const methodTotals: Record<string, number> = { invoice: invoiceRevenue }
  directPayments.forEach(p => {
    methodTotals[p.payment_method] = (methodTotals[p.payment_method] || 0) + Number(p.amount || 0)
  })
  const METHOD_LABELS: Record<string, string> = {
    invoice: 'Invoice', cash: 'Cash', bank: 'Bank Transfer', mobile: 'Mobile Money', pos: 'POS',
  }
  const revByMethod = Object.entries(methodTotals)
    .map(([method, total]) => ({ method, label: METHOD_LABELS[method] ?? method, total }))
    .filter(m => m.total > 0)
    .sort((a, b) => b.total - a.total)

  // ── Per-client stats ──────────────────────────────────────────────────────
  type ClientStat = {
    id:             string
    name:           string
    company:        string | null
    totalRevenue:   number
    paidCount:      number
    overdueCount:   number
    totalSent:      number
    totalInvoices:  number
    collectionRate: number | null
  }

  const clientMap = new Map<string, ClientStat>()

  clients.forEach(c => {
    clientMap.set(c.id, {
      id: c.id,
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

      // ── Pay Rate: highest rate first, ties broken by revenue DESC ──────────
      // null collectionRate = no sent invoices at all → always goes to bottom
      case 'rate':
        if (a.collectionRate === null && b.collectionRate === null) return b.totalRevenue - a.totalRevenue
        if (a.collectionRate === null) return 1
        if (b.collectionRate === null) return -1
        if (b.collectionRate !== a.collectionRate) return b.collectionRate - a.collectionRate
        return b.totalRevenue - a.totalRevenue  // tiebreaker

      // ── Most Active: most invoices first, ties broken by revenue DESC ──────
      case 'invoices':
        if (b.totalInvoices !== a.totalInvoices) return b.totalInvoices - a.totalInvoices
        return b.totalRevenue - a.totalRevenue  // tiebreaker

      // ── Overdue Risk ──────────────────────────────────────────────────────
      // Primary:       overdueCount DESC (most overdue invoices = most risk)
      // Tiebreaker 1:  collectionRate ASC (lower rate = historically riskier)
      //                null rate → treated as 100% (no history of non-payment) → bottom
      // Tiebreaker 2:  totalRevenue DESC (bigger client = bigger cash impact)
      case 'overdue':
        if (b.overdueCount !== a.overdueCount) return b.overdueCount - a.overdueCount
        {
          const aRate = a.collectionRate ?? 100
          const bRate = b.collectionRate ?? 100
          if (aRate !== bRate) return aRate - bRate   // ascending: lower rate = riskier = first
          return b.totalRevenue - a.totalRevenue       // revenue tiebreaker
        }

      // ── Revenue (default): highest paid revenue first ──────────────────────
      case 'revenue':
      default:
        return b.totalRevenue - a.totalRevenue
    }
  }).slice(0, limit)

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

  // ── Revenue vs Expense 12-month (stacked: invoice + direct) ─────────────
  const now = new Date()
  const revExpData = Array.from({ length: 12 }, (_, idx) => {
    const d     = new Date(now.getFullYear(), now.getMonth() - (11 - idx), 1)
    const year  = d.getFullYear()
    const month = d.getMonth()
    const label = d.toLocaleString('en-US', { month: 'short' })

    const invRev = paidInvoices
      .filter((i: any) => {
        const dd = new Date(i.issue_date + 'T12:00:00')
        return dd.getFullYear() === year && dd.getMonth() === month
      })
      .reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)

    const dirRev = directPayments
      .filter(p => {
        const dd = new Date(p.payment_date + 'T12:00:00')
        return dd.getFullYear() === year && dd.getMonth() === month
      })
      .reduce((s, p) => s + Number(p.amount || 0), 0)

    const rev = invRev + dirRev

    const exp = expenses
      .filter(e => {
        const dd = new Date(e.date + 'T12:00:00')
        return dd.getFullYear() === year && dd.getMonth() === month
      })
      .reduce((s, e) => s + Number(e.amount || 0), 0)

    return {
      month:         label,
      invoiceRev:    invRev,    // invoice income — blue stack
      directRev:     dirRev,    // direct payment income — teal stack
      revenue:       rev,       // kept for backward compat with cash page usage
      expenses:      exp,
      profit:        rev - exp,
    }
  })

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

          {/* ── 3. Revenue Intelligence ────────────────────────────────── */}
          {totalRevenue > 0 && (
            <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Banknote className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Revenue Intelligence</h2>
                  <p className="text-sm text-gray-500 font-medium">Where your money actually comes from</p>
                </div>
              </div>

              {/* By Source */}
              <div className="mb-8">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Revenue by Source</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    { label: 'Invoice Income', value: invoiceRevenue, pct: invoiceSourcePct, color: '#3B82F6', bg: 'bg-blue-50 border-blue-100' },
                    { label: 'Direct Payments', value: directRevenue, pct: directSourcePct, color: '#0D9488', bg: 'bg-teal-50 border-teal-100' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl p-5 border-2 ${s.bg}`}>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
                      <p className="text-2xl font-black text-gray-900 tracking-tight truncate" title={formatCurrencyFull(s.value)}>
                        {formatCompact(s.value)}
                      </p>
                      <p className="text-xs font-bold mt-1" style={{ color: s.color }}>{s.pct}% of total</p>
                    </div>
                  ))}
                </div>
                {/* Source split bar */}
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                  {invoiceSourcePct > 0 && (
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${invoiceSourcePct}%` }} />
                  )}
                  {directSourcePct > 0 && (
                    <div className="h-full bg-teal-500 transition-all" style={{ width: `${directSourcePct}%` }} />
                  )}
                </div>
                <div className="flex gap-4 mt-2">
                  {[{ label: 'Invoice', color: '#3B82F6' }, { label: 'Direct', color: '#0D9488' }].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                      <span className="text-xs font-medium text-gray-500">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Category */}
              {revByCategory.length > 0 && (
                <div className="mb-8">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Revenue by Category</p>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-center">
                    {/* Donut chart */}
                    <ExpenseBreakdownChart
                      data={revByCategory.map(c => ({ name: c.name, value: c.total, color: c.color }))}
                    />
                    {/* Ranked list */}
                    <div className="space-y-3">
                      {revByCategory.map(cat => (
                        <div key={cat.name} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-sm font-bold text-gray-700 truncate">{cat.name}</span>
                              <span className="text-sm font-black text-gray-900 flex-shrink-0" title={formatCurrencyFull(cat.total)}>
                                {formatCompact(cat.total)}
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${totalRevenue > 0 ? (cat.total / totalRevenue) * 100 : 0}%`, backgroundColor: cat.color }} />
                            </div>
                          </div>
                          <span className="text-xs font-bold text-gray-400 flex-shrink-0 w-10 text-right">
                            {totalRevenue > 0 ? Math.round((cat.total / totalRevenue) * 100) : 0}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* By Payment Method */}
              {revByMethod.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Revenue by Payment Method</p>
                  <div className="space-y-3">
                    {revByMethod.map(m => (
                      <div key={m.method} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-500 w-24 flex-shrink-0 truncate">{m.label}</span>
                        <div className="flex-1">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-indigo-500 transition-all"
                              style={{ width: `${totalRevenue > 0 ? (m.total / totalRevenue) * 100 : 0}%` }} />
                          </div>
                        </div>
                        <span className="text-sm font-black text-gray-900 flex-shrink-0 w-20 text-right" title={formatCurrencyFull(m.total)}>
                          {formatCompact(m.total)}
                        </span>
                        <span className="text-xs font-bold text-gray-400 flex-shrink-0 w-10 text-right">
                          {totalRevenue > 0 ? Math.round((m.total / totalRevenue) * 100) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prompt to categorise if nothing is tagged */}
              {revByCategory.length === 1 && revByCategory[0].name === 'Uncategorized' && (
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm font-bold text-amber-800 mb-1">No categories assigned yet</p>
                  <p className="text-xs text-amber-600">
                    Add revenue categories in{' '}
                    <a href="/dashboard/settings" className="font-bold underline hover:text-amber-800">Settings</a>
                    {' '}then tag your invoices and payments to unlock this breakdown.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── 4. Client Intelligence ─────────────────────────────────────── */}
          {allClientStats.length > 0 && (
            <ClientIntelligencePanel
              allClientStats={allClientStats}
              sortedClients={sortedClients}
              sortBy={sortBy}
              limit={limit}
              viewMode={viewMode}
              orientation={orientation}
            />
          )}

          {/* ── 5. Expense Breakdown ───────────────────────────────────────── */}
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

          {/* ── 6. Revenue vs Expenses ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Revenue vs Expenses</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Monthly comparison — invoice income (blue) + direct payments (teal) vs expenses</p>
            </div>
            <StackedRevenueChart data={revExpData} />
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