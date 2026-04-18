// src/app/dashboard/payments/page.tsx
// Server component — fetches all direct payments and passes to client list component.

import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link             from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import SubscriptionRequired from '@/components/subscription-required'
import DirectPaymentList    from '@/components/payments/direct-payment-list'

// ── Formatters ────────────────────────────────────────────────────────────────
function formatCompact(n: number): string {
  if (n >= 999_500) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000)  return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
function formatCurrencyFull(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Subscription gate
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_subscription_id, subscription_status')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription = !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')

  if (!hasActiveSubscription) return <SubscriptionRequired />

  // Fetch payments with joins
  const { data: paymentsRaw } = await supabase
    .from('direct_payments')
    .select(`
      id, amount, payment_type, payment_method,
      description, notes, payment_date, attachment_url, created_at,
      revenue_categories (id, name, color),
      clients (id, name, company)
    `)
    .eq('user_id', user.id)
    .order('payment_date', { ascending: false })

  // Normalise Supabase joins (can return array or object)
  const payments = (paymentsRaw || []).map((p: any) => ({
    ...p,
    revenue_categories: Array.isArray(p.revenue_categories) ? p.revenue_categories[0] ?? null : p.revenue_categories,
    clients:            Array.isArray(p.clients)            ? p.clients[0]            ?? null : p.clients,
  }))

  // Summary stats
  const totalIncome    = payments.reduce((s: number, p: any) => s + Number(p.amount), 0)
  const now            = new Date()
  const thisMonthIncome = payments
    .filter((p: any) => {
      const d = new Date(p.payment_date + 'T12:00:00')
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((s: number, p: any) => s + Number(p.amount), 0)
  const cashCount   = payments.filter((p: any) => p.payment_type === 'cash').length
  const prepayCount = payments.filter((p: any) => p.payment_type === 'prepay').length

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all duration-200 font-bold text-gray-700 w-fit">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">Payments</h1>
            <p className="text-base sm:text-lg text-gray-600 mt-2 font-medium">
              Record cash, POS, mobile money, and prepayments
            </p>
          </div>
        </div>
        <Link href="/dashboard/payments/new"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:scale-105 transition-all duration-200">
          <Plus className="w-5 h-5" />
          Log Payment
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Income',   value: formatCompact(totalIncome),     full: formatCurrencyFull(totalIncome),     color: 'text-green-900',  bg: 'from-green-50 to-emerald-50 border-green-100' },
          { label: 'This Month',     value: formatCompact(thisMonthIncome), full: formatCurrencyFull(thisMonthIncome), color: 'text-blue-900',   bg: 'from-blue-50 to-indigo-50 border-blue-100' },
          { label: 'Cash Payments',  value: String(cashCount),              full: '',                                  color: 'text-amber-900',  bg: 'from-amber-50 to-orange-50 border-amber-100' },
          { label: 'Prepayments',    value: String(prepayCount),            full: '',                                  color: 'text-purple-900', bg: 'from-purple-50 to-violet-50 border-purple-100' },
        ].map(card => (
          <div key={card.label} className={`rounded-2xl p-5 border-2 bg-gradient-to-br ${card.bg} shadow-sm`}>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">{card.label}</p>
            <p className={`text-2xl font-black tracking-tight truncate ${card.color}`} title={card.full || undefined}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Payment list */}
      <DirectPaymentList payments={payments} />

    </div>
  )
}
