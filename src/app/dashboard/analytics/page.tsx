// src/app/dashboard/analytics/page.tsx
//
// WHAT CHANGED FROM THE PREVIOUS VERSION:
//   - Removed the "More Analytics Coming Soon" placeholder card
//   - Added Revenue vs Expenses 12-month comparison chart (RevenueVsExpenseChart)
//   - Added a summary row: total revenue, total expenses, net profit all-time
//   - All currency values use formatCompact + title tooltip (overflow-safe)
//
// DATA FETCHED:
//   - All expenses (for breakdown chart + 12-month comparison)
//   - All paid invoices (for 12-month revenue comparison)

import { redirect }      from 'next/navigation'
import { createClient }  from '@/lib/supabase/server'
import Link              from 'next/link'
import { ArrowLeft }     from 'lucide-react'
import { ExpenseBreakdownChart }  from '@/components/dashboard/expense-breakdown-chart'
import { RevenueVsExpenseChart }  from '@/components/cash/revenue-vs-expense-chart'
import { EXPENSE_CATEGORIES }     from '@/lib/ai/expense-categorization'
import { getInvoiceDisplayStatus } from '@/lib/utils/invoice-status'

const formatCurrencyFull = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const formatCompact = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000)    return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)
}

const categoryChartColors: Record<string, string> = {
  software:     '#3B82F6',
  hardware:     '#6B7280',
  travel:       '#F59E0B',
  meals:        '#F97316',
  marketing:    '#EC4899',
  office:       '#06B6D4',
  professional: '#8B5CF6',
  utilities:    '#14B8A6',
  education:    '#6366F1',
  insurance:    '#22C55E',
  taxes:        '#EF4444',
  other:        '#9CA3AF',
}

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

  // ── Expenses ──────────────────────────────────────────────────────────────
  const { data: expensesRaw } = await supabase
    .from('expenses')
    .select('amount, category, date')
    .eq('user_id', user.id)

  const expenses    = (expensesRaw ?? []) as { amount: number; category: string; date: string }[]
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)

  // Category breakdown for donut chart
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

  // ── Invoices (paid) for revenue side ─────────────────────────────────────
  const { data: invoicesRaw } = await supabase
    .from('invoices')
    .select('status, issue_date, due_date, total_amount')
    .eq('user_id', user.id)

  const paidInvoices = (invoicesRaw ?? []).filter((inv: any) =>
    getInvoiceDisplayStatus({ status: inv.status, due_date: inv.due_date }) === 'paid'
  ) as any[]

  const totalRevenue = paidInvoices.reduce((s, inv) => s + Number(inv.total_amount || 0), 0)
  const netProfit    = totalRevenue - totalExpenses
  const isProfitable = netProfit >= 0

  // ── Revenue vs Expense: last 12 months ───────────────────────────────────
  const now = new Date()
  const revExpData = Array.from({ length: 12 }, (_, idx) => {
    const d     = new Date(now.getFullYear(), now.getMonth() - (11 - idx), 1)
    const year  = d.getFullYear()
    const month = d.getMonth()
    const label = d.toLocaleString('en-US', { month: 'short' })

    const revenue = paidInvoices
      .filter((inv: any) => {
        const dd = new Date(inv.issue_date + 'T12:00:00')
        return dd.getFullYear() === year && dd.getMonth() === month
      })
      .reduce((s: number, inv: any) => s + Number(inv.total_amount || 0), 0)

    const expAmt = expenses
      .filter(e => {
        const dd = new Date(e.date + 'T12:00:00')
        return dd.getFullYear() === year && dd.getMonth() === month
      })
      .reduce((s, e) => s + Number(e.amount || 0), 0)

    return { month: label, revenue, expenses: expAmt, profit: revenue - expAmt }
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
              Deep insights into your business performance
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

          {/* ── All-time summary row ──────────────────────────────────────── */}
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

          {/* ── Expense Breakdown ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Expense Breakdown</h2>
              <p className="text-sm text-gray-500 font-medium mt-1"
                 title={formatCurrencyFull(totalExpenses)}>
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
                              width: `${totalExpenses > 0 ? (cat.value / totalExpenses) * 100 : 0}%`,
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

          {/* ── Revenue vs Expenses 12-month ─────────────────────────────── */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Revenue vs Expenses</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Monthly comparison over the last 12 months</p>
            </div>
            <RevenueVsExpenseChart data={revExpData} />
          </div>

          {/* Deep dive prompt */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-8 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-1">Want the full picture?</h3>
              <p className="text-gray-600 font-medium text-sm">
                Cash Management shows your 90-day forecast, runway calculator, and upcoming payments in detail.
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