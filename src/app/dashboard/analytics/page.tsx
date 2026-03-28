import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ExpenseBreakdownChart } from '@/components/dashboard/expense-breakdown-chart'
import { EXPENSE_CATEGORIES, getCategoryLabel } from '@/lib/ai/expense-categorization'

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

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

  // Fetch expenses for breakdown
  const { data: expensesRaw } = await supabase
    .from('expenses')
    .select('amount, category')
    .eq('user_id', user.id)

  const expenses = expensesRaw ?? []
  const totalExpenses = expenses.reduce((sum, e: any) => sum + Number(e.amount || 0), 0)

  // Build category breakdown data for chart
  const categoryBreakdown = EXPENSE_CATEGORIES
    .map(cat => ({
      name: cat.label,
      value: expenses
        .filter((e: any) => e.category === cat.value)
        .reduce((sum, e: any) => sum + Number(e.amount || 0), 0),
      color: categoryChartColors[cat.value] ?? '#9CA3AF',
    }))
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all duration-200 font-bold text-gray-700 w-fit"
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
          {/* Expense Breakdown */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Expense Breakdown</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Total: {formatCurrency(totalExpenses)} across {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
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
                {/* Chart */}
                <ExpenseBreakdownChart data={categoryBreakdown} />

                {/* Legend / breakdown list */}
                <div className="space-y-3">
                  {categoryBreakdown.map(cat => (
                    <div key={cat.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-gray-700 truncate">{cat.name}</span>
                          <span className="text-sm font-black text-gray-900 flex-shrink-0">{formatCurrency(cat.value)}</span>
                        </div>
                        {/* Progress bar */}
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

          {/* Coming Soon — remaining analytics */}
          <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 rounded-2xl border-2 border-blue-300 p-10 text-center shadow-lg">
            <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">More Analytics Coming Soon</h2>
            <p className="text-gray-600 font-medium max-w-xl mx-auto">
              Revenue forecasting, client payment patterns, and cash flow projections are coming in the Cash Management phase.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// Chart colors per category
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