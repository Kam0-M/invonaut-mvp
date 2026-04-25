import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link             from 'next/link'
import { Plus, Banknote, TrendingUp, Smartphone, Building2 } from 'lucide-react'
import SubscriptionRequired from '@/components/subscription-required'
import DirectPaymentList    from '@/components/payments/direct-payment-list'
import CoreTabBar           from '@/components/layout/core-tab-bar'

function formatCompact(n: number): string {
  if (n >= 999_500) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000)  return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_subscription_id, subscription_status')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription = !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')

  if (!hasActiveSubscription) return <SubscriptionRequired />

  const { data: paymentsRaw } = await supabase
    .from('direct_payments')
    .select(`id, amount, payment_type, payment_method,
      description, notes, payment_date, attachment_url, created_at,
      revenue_categories (id, name, color),
      clients (id, name, company)`)
    .eq('user_id', user.id)
    .order('payment_date', { ascending: false })

  const payments = (paymentsRaw || []).map((p: any) => ({
    ...p,
    revenue_categories: Array.isArray(p.revenue_categories) ? p.revenue_categories[0] ?? null : p.revenue_categories,
    clients:            Array.isArray(p.clients)            ? p.clients[0]            ?? null : p.clients,
  }))

  const now = new Date()
  const totalIncome     = payments.reduce((s: number, p: any) => s + Number(p.amount), 0)
  const thisMonthIncome = payments
    .filter((p: any) => {
      const d = new Date(p.payment_date + 'T12:00:00')
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((s: number, p: any) => s + Number(p.amount), 0)
  const cashCount   = payments.filter((p: any) => p.payment_method === 'cash').length
  const mobileCount = payments.filter((p: any) => p.payment_method === 'mobile').length
  const posCount    = payments.filter((p: any) => p.payment_method === 'pos').length
  const bankCount   = payments.filter((p: any) => p.payment_method === 'bank').length

  return (
    <div className="space-y-6">
      <CoreTabBar />

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">All income sources</p>
          {payments.length > 0 && (
            <div className="flex items-center gap-4">
              {[
                { label: 'Total',      value: formatCompact(totalIncome),     color: 'text-teal-600'   },
                { label: 'This month', value: formatCompact(thisMonthIncome), color: 'text-blue-600'   },
                { label: 'Cash',       value: String(cashCount),              color: 'text-amber-600'  },
                { label: 'Bank',       value: String(bankCount),              color: 'text-green-600'  },
                { label: 'Mobile/POS', value: String(mobileCount + posCount), color: 'text-purple-600' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className={`text-sm font-black ${s.color}`}>{s.value}</span>
                  <span className="text-xs text-gray-400 font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <Link href="/dashboard/payments/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-all hover:shadow-md">
          <Plus className="w-4 h-4" />Log Payment
        </Link>
      </div>

      {/* Empty state */}
      {payments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="h-1 inv-animated-bar" />
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
              <Banknote className="w-7 h-7 text-teal-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">No payments logged yet</h3>
            <p className="text-sm text-gray-500 font-medium max-w-sm mx-auto mb-6">
              Log cash, POS, bank transfers, and prepayments — income that doesn't need an invoice. Tag with a category to unlock analytics.
            </p>
            <Link href="/dashboard/payments/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-all hover:shadow-md">
              <Plus className="w-4 h-4" />Log Your First Payment
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <DirectPaymentList payments={payments} />
        </div>
      )}
    </div>
  )
}
