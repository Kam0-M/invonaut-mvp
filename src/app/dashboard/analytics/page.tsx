// src/app/dashboard/analytics/page.tsx
//
// PURPOSE:
//   Analytics is the "understand your business" page. Cash Management is the
//   "manage your money" page. They're complementary:
//     - Analytics: backward-looking intelligence — who are your best clients,
//       how healthy is your invoice pipeline, where is money going
//     - Cash Management: forward-looking — forecast, runway, what to do next
//
// SECTIONS:
//   1. All-time summary row (revenue, expenses, net profit)
//   2. Client Intelligence — top clients by revenue + invoice health per client
//   3. Invoice Health — collection rate, avg invoice size, pipeline breakdown
//   4. Expense Breakdown — donut chart + category list
//   5. Revenue vs Expenses — 12-month comparison chart
//   6. "Go deeper" link to Cash Management
//
// All currency: formatCompact + title tooltip (overflow-safe).
// No new tables needed — everything computed from invoices, clients, expenses.

import { redirect }      from 'next/navigation'
import { createClient }  from '@/lib/supabase/server'
import Link              from 'next/link'
import { ArrowLeft, Users, TrendingUp, FileText, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { ExpenseBreakdownChart }   from '@/components/dashboard/expense-breakdown-chart'
import { RevenueVsExpenseChart }   from '@/components/cash/revenue-vs-expense-chart'
import { EXPENSE_CATEGORIES }      from '@/lib/ai/expense-categorization'
import { getInvoiceDisplayStatus } from '@/lib/utils/invoice-status'

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

const categoryChartColors: Record<string, string> = {
  software: '#3B82F6', hardware: '#6B7280', travel: '#F59E0B',
  meals: '#F97316', marketing: '#EC4899', office: '#06B6D4',
  professional: '#8B5CF6', utilities: '#14B8A6', education: '#6366F1',
  insurance: '#22C55E', taxes: '#EF4444', other: '#9CA3AF',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
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

  // ── Data fetching ─────────────────────────────────────────────────────────
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
  const totalRevenue  = invoices
    .filter(i => i.displayStatus === 'paid')
    .reduce((s, i) => s + Number(i.total_amount || 0), 0)

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const netProfit     = totalRevenue - totalExpenses
  const isProfitable  = netProfit >= 0

  // ── Invoice health ────────────────────────────────────────────────────────
  const sentInvoices     = invoices.filter(i => ['sent', 'paid', 'overdue'].includes(i.displayStatus))
  const paidInvoices     = invoices.filter(i => i.displayStatus === 'paid')
  const overdueInvoices  = invoices.filter(i => i.displayStatus === 'overdue')
  const draftInvoices    = invoices.filter(i => i.displayStatus === 'draft')

  const collectionRate   = sentInvoices.length > 0
    ? Math.round((paidInvoices.length / sentInvoices.length) * 100)
    : null

  const avgInvoiceSize   = paidInvoices.length > 0
    ? paidInvoices.reduce((s, i) => s + Number(i.total_amount || 0), 0) / paidInvoices.length
    : 0

  const overdueValue     = overdueInvoices.reduce((s, i) => s + Number(i.total_amount || 0), 0)

  // ── Client intelligence ───────────────────────────────────────────────────
  // Build per-client stats from invoice data
  const clientMap = new Map<string, {
    name:         string
    company:      string | null
    totalRevenue: number
    paidCount:    number
    overdueCount: number
    totalSent:    number
  }>()

  clients.forEach(c => {
    clientMap.set(c.id, {
      name: c.name, company: c.company,
      totalRevenue: 0, paidCount: 0, overdueCount: 0, totalSent: 0,
    })
  })

  invoices.forEach(inv => {
    if (!inv.client_id) return
    const entry = clientMap.get(inv.client_id)
    if (!entry) return
    if (inv.displayStatus === 'paid') {
      entry.totalRevenue += Number(inv.total_amount || 0)
      entry.paidCount++
      entry.totalSent++
    } else if (inv.displayStatus === 'sent') {
      entry.totalSent++
    } else if (inv.displayStatus === 'overdue') {
      entry.overdueCount++
      entry.totalSent++
    }
  })

  // Top 8 clients by revenue — only those with at least one paid invoice
  const topClients = Array.from(clientMap.values())
    .filter(c => c.totalRevenue > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 8)

  const maxClientRevenue = topClients[0]?.totalRevenue ?? 1

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

  // ── JSX ───────────────────────────────────────────────────────────────────
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
              {
                label: 'Total Revenue',
                value: formatCompact(totalRevenue),
                full:  formatCurrencyFull(totalRevenue),
                color: 'text-green-900',
                bg:    'from-green-50 to-emerald-50 border-green-100',
              },
              {
                label: 'Total Expenses',
                value: formatCompact(totalExpenses),
                full:  formatCurrencyFull(totalExpenses),
                color: 'text-orange-900',
                bg:    'from-orange-50 to-amber-50 border-orange-100',
              },
              {
                label: isProfitable ? 'Net Profit' : 'Net Loss',
                value: formatCompact(Math.abs(netProfit)),
                full:  formatCurrencyFull(Math.abs(netProfit)),
                color: isProfitable ? 'text-blue-900' : 'text-red-900',
                bg:    isProfitable
                  ? 'from-blue-50 to-indigo-50 border-blue-100'
                  : 'from-red-50 to-rose-50 border-red-100',
              },
            ].map(m => (
              <div key={m.label} className={`rounded-2xl p-6 border-2 bg-gradient-to-br ${m.bg} shadow-sm`}>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">{m.label}</p>
                <p
                  className={`text-3xl font-black tracking-tight truncate min-w-0 ${m.color}`}
                  title={m.full}
                >
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
              {/* Collection rate */}
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

              {/* Avg invoice size */}
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

              {/* Overdue value */}
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

              {/* Drafts */}
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

            {/* Pipeline status bar */}
            {invoices.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Invoice Pipeline</p>
                  <p className="text-xs text-gray-400 font-medium">{invoices.length} total</p>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                  {[
                    { status: 'paid',    count: paidInvoices.length,    color: '#10B981' },
                    { status: 'sent',    count: invoices.filter(i => i.displayStatus === 'sent').length, color: '#3B82F6' },
                    { status: 'overdue', count: overdueInvoices.length,  color: '#EF4444' },
                    { status: 'draft',   count: draftInvoices.length,    color: '#E5E7EB' },
                  ].filter(s => s.count > 0).map(s => (
                    <div
                      key={s.status}
                      title={`${s.status}: ${s.count}`}
                      className="h-full transition-all"
                      style={{
                        width:      `${(s.count / invoices.length) * 100}%`,
                        background: s.color,
                      }}
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
          {topClients.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Top Clients</h2>
                    <p className="text-sm text-gray-500 font-medium">Ranked by revenue generated</p>
                  </div>
                </div>
                <Link href="/dashboard/clients" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                  View all →
                </Link>
              </div>

              <div className="space-y-3">
                {topClients.map((client, idx) => {
                  const pct         = Math.round((client.totalRevenue / maxClientRevenue) * 100)
                  const hasOverdue  = client.overdueCount > 0
                  const rate        = client.totalSent > 0
                    ? Math.round((client.paidCount / client.totalSent) * 100)
                    : null

                  return (
                    <div key={client.name} className="group">
                      <div className="flex items-center gap-4 mb-1.5">
                        {/* Rank */}
                        <span className={`text-xs font-black w-5 flex-shrink-0 ${
                          idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-gray-300'
                        }`}>
                          #{idx + 1}
                        </span>

                        {/* Name + company */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-gray-900 truncate">{client.name}</span>
                            {client.company && (
                              <span className="text-xs text-gray-400 font-medium truncate">{client.company}</span>
                            )}
                            {hasOverdue && (
                              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 flex-shrink-0">
                                {client.overdueCount} overdue
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {rate !== null && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              rate >= 80 ? 'text-green-700 bg-green-100'
                              : rate >= 60 ? 'text-amber-700 bg-amber-100'
                              : 'text-red-700 bg-red-100'
                            }`}>
                              {rate}% paid
                            </span>
                          )}
                          <span
                            className="text-sm font-black text-gray-900"
                            title={formatCurrencyFull(client.totalRevenue)}
                          >
                            {formatCompact(client.totalRevenue)}
                          </span>
                        </div>
                      </div>

                      {/* Revenue bar */}
                      <div className="ml-9 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {topClients.length === 0 && (
                <p className="text-gray-400 font-medium text-sm text-center py-8">
                  No paid invoices yet. Client revenue will appear here once invoices are marked paid.
                </p>
              )}
            </div>
          )}

          {/* ── 4. Expense Breakdown ───────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Expense Breakdown</h2>
              <p
                className="text-sm text-gray-500 font-medium mt-1"
                title={formatCurrencyFull(totalExpenses)}
              >
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
                          <span
                            className="text-sm font-black text-gray-900 flex-shrink-0"
                            title={formatCurrencyFull(cat.value)}
                          >
                            {formatCompact(cat.value)}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width:      `${totalExpenses > 0 ? (cat.value / totalExpenses) * 100 : 0}%`,
                              backgroundColor: cat.color,
                            }}
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

          {/* ── 5. Revenue vs Expenses 12-month ────────────────────────────── */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Revenue vs Expenses</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Monthly comparison over the last 12 months</p>
            </div>
            <RevenueVsExpenseChart data={revExpData} />
          </div>

          {/* ── 6. Go deeper CTA ───────────────────────────────────────────── */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-8 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-1">Want the full financial picture?</h3>
              <p className="text-gray-600 font-medium text-sm">
                Cash Management shows your 90-day forecast, cash runway, and upcoming payment timeline.
              </p>
            </div>
            <Link
              href="/dashboard/cash"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold
                         hover:bg-blue-700 hover:shadow-lg transition-all flex-shrink-0"
            >
              Open Cash Management →
            </Link>
          </div>

        </>
      )}
    </div>
  )
}