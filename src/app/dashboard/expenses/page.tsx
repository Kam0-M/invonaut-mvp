import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Receipt } from 'lucide-react'
import ExpenseList from '@/components/expenses/expense-list'
import ExpenseReportGenerator from '@/components/expenses/expense-report-generator'
import BudgetSettings from '@/components/expenses/budget-settings'
import { EXPENSE_CATEGORIES, getCategoryLabel } from '@/lib/ai/expense-categorization'

type PageProps = {
  searchParams: Promise<{ category?: string; start?: string; end?: string }>
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

// Compact formatter for summary cards — prevents overflow on large values
const formatCompact = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000)    return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)
}

export default async function ExpensesPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier, stripe_subscription_id, subscription_status')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription = !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')

  const tier = profile?.subscription_tier ?? 'starter'
  const isBusiness = tier === 'business'

  // Fetch budgets for Business tier sidebar
  const { data: budgetsRaw } = await supabase
    .from('expense_budgets')
    .select('id, category, monthly_limit')
    .eq('user_id', user.id)
    .order('category', { ascending: true })

  const budgets = (budgetsRaw ?? []) as { id: string; category: string; monthly_limit: number }[]

  const { category, start, end } = await searchParams

  // Build query
  let query = supabase
    .from('expenses')
    .select('id, description, amount, date, vendor, category, receipt_url, notes, clients(id, name)')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (category && category !== 'all') query = query.eq('category', category)
  if (start) query = query.gte('date', start)
  if (end)   query = query.lte('date', end)

  const { data: expensesRaw } = await query
  const expenses = (expensesRaw ?? []).map((e: any) => ({
    ...e,
    clients: Array.isArray(e.clients) ? e.clients[0] ?? null : e.clients ?? null,
  }))

  const totalAmount = expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)

  // Category breakdown for summary cards
  const categoryTotals = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    total: expenses
      .filter((e: any) => e.category === cat.value)
      .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">Expenses</h1>
          <p className="text-gray-500 mt-2 font-medium">Track and categorize your business expenses</p>
        </div>
        {hasActiveSubscription && (
          <Link
            href="/dashboard/expenses/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Expense
          </Link>
        )}
      </div>

      {!hasActiveSubscription ? (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">Subscribe to track expenses</h3>
          <p className="text-gray-500 mb-6">Keep all your business expenses organized in one place.</p>
          <Link href="/pricing" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
            View Plans
          </Link>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          {categoryTotals.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Total card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-100 min-w-0">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Total</p>
                <p
                  className="text-2xl font-black text-blue-900 truncate"
                  title={formatCurrency(totalAmount)}
                >
                  {formatCompact(totalAmount)}
                </p>
              </div>
              {categoryTotals.slice(0, 3).map(cat => (
                <div key={cat.value} className="bg-white rounded-2xl p-5 border-2 border-gray-100 min-w-0">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 truncate">{cat.label}</p>
                  <p
                    className="text-2xl font-black text-gray-900 truncate"
                    title={formatCurrency(cat.total)}
                  >
                    {formatCompact(cat.total)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <form method="GET" className="flex flex-wrap gap-3">
            <select
              name="category"
              defaultValue={category ?? 'all'}
              className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-700 bg-white focus:border-blue-500 outline-none transition-all"
            >
              <option value="all">All categories</option>
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <input
              type="date"
              name="start"
              defaultValue={start ?? ''}
              className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-700 focus:border-blue-500 outline-none transition-all"
            />
            <input
              type="date"
              name="end"
              defaultValue={end ?? ''}
              className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-700 focus:border-blue-500 outline-none transition-all"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all"
            >
              Filter
            </button>
            {(category || start || end) && (
              <Link
                href="/dashboard/expenses"
                className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
              >
                Clear
              </Link>
            )}
          </form>

          {/* Expense list */}
          <ExpenseList expenses={expenses} totalAmount={totalAmount} />

          {/* Report generator + Budget settings side by side on large screens */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <ExpenseReportGenerator />
            </div>
            <div>
              <BudgetSettings budgets={budgets} isBusiness={isBusiness} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}