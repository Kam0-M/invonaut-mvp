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
    <div className="space-y-0">

      {/* Dark hero header */}
      <div className="relative overflow-hidden rounded-2xl mb-8"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #F97316 0%, transparent 70%)' }} />

        <div className="relative z-10 p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Expenses</h1>
              </div>
              <p className="text-white/50 font-medium text-sm mt-1">
                {expenses.length === 0
                  ? 'Log expenses with AI-suggested categories and upload receipts'
                  : `${expenses.length} expense${expenses.length !== 1 ? 's' : ''} · ${formatCompact(totalAmount)} total`}
              </p>
            </div>
            {hasActiveSubscription && (
              <Link href="/dashboard/expenses/new"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm hover:shadow-lg hover:scale-[1.02] transition-all w-full sm:w-auto">
                <Plus className="w-4 h-4" />Add Expense
              </Link>
            )}
          </div>

          {/* Summary cards in header when data exists */}
          {hasActiveSubscription && categoryTotals.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-8 border-t border-white/[0.08]">
              <div>
                <p className="text-lg font-black text-orange-400 leading-none" title={formatCurrency(totalAmount)}>{formatCompact(totalAmount)}</p>
                <p className="text-xs text-white/40 font-medium mt-0.5">Total expenses</p>
              </div>
              {categoryTotals.slice(0, 3).map(cat => (
                <div key={cat.value}>
                  <p className="text-lg font-black text-white/80 leading-none" title={formatCurrency(cat.total)}>{formatCompact(cat.total)}</p>
                  <p className="text-xs text-white/40 font-medium mt-0.5 truncate">{cat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!hasActiveSubscription ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-400" />
          <div className="p-12 sm:p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-6">
              <Receipt className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">Subscribe to track expenses</h3>
            <p className="text-gray-500 font-medium max-w-md mx-auto mb-8">
              Log expenses with AI-suggested categories, upload receipts, and set monthly budget limits. Get automatic alerts at 80% and 100% of each limit.
            </p>
            <Link href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold hover:shadow-lg transition-all">
              View Plans
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filters */}
          <form method="GET" className="flex flex-wrap gap-3">
            <select name="category" defaultValue={category ?? 'all'}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 bg-white focus:border-blue-500 outline-none transition-all shadow-sm">
              <option value="all">All categories</option>
              {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <input type="date" name="start" defaultValue={start ?? ''}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-blue-500 outline-none transition-all shadow-sm" />
            <input type="date" name="end" defaultValue={end ?? ''}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-blue-500 outline-none transition-all shadow-sm" />
            <button type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-sm">
              Filter
            </button>
            {(category || start || end) && (
              <Link href="/dashboard/expenses"
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
                Clear
              </Link>
            )}
          </form>

          {/* Expense list */}
          <ExpenseList expenses={expenses} totalAmount={totalAmount} />

          {/* Report generator + Budget settings */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2"><ExpenseReportGenerator /></div>
            <div><BudgetSettings budgets={budgets} isBusiness={isBusiness} /></div>
          </div>
        </div>
      )}
    </div>
  )
}