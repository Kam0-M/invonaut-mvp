// src/app/dashboard/payments/page.tsx
import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link             from 'next/link'
import { Plus, Banknote, TrendingUp, CreditCard, Smartphone, Building2 } from 'lucide-react'
import SubscriptionRequired from '@/components/subscription-required'
import DirectPaymentList    from '@/components/payments/direct-payment-list'

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
  const totalIncome = payments.reduce((s: number, p: any) => s + Number(p.amount), 0)
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
    <div className="space-y-0">
      {/* Dark hero header */}
      <div className="relative overflow-hidden rounded-2xl mb-8"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #0D9488 0%, transparent 70%)' }} />

        <div className="relative z-10 p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center flex-shrink-0">
                  <Banknote className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Payments</h1>
              </div>
              <p className="text-white/50 font-medium text-sm mt-1">
                {payments.length === 0
                  ? 'Log cash, POS, mobile money, and prepayments — income outside invoices'
                  : `${payments.length} payment${payments.length !== 1 ? 's' : ''} · ${formatCompact(totalIncome)} total`}
              </p>
            </div>
            <Link href="/dashboard/payments/new"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm hover:shadow-lg hover:scale-[1.02] transition-all w-full sm:w-auto">
              <Plus className="w-4 h-4" />Log Payment
            </Link>
          </div>

          {payments.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8 pt-8 border-t border-white/[0.08]">
              {[
                { label: 'Total income',    value: formatCompact(totalIncome),     icon: TrendingUp,  color: 'text-teal-400'   },
                { label: 'This month',      value: formatCompact(thisMonthIncome), icon: Banknote,    color: 'text-blue-400'   },
                { label: 'Cash payments',   value: String(cashCount),              icon: Banknote,    color: 'text-amber-400'  },
                { label: 'Bank transfers',  value: String(bankCount),              icon: Building2,   color: 'text-green-400'  },
                { label: 'Mobile / POS',    value: String(mobileCount + posCount), icon: Smartphone,  color: 'text-purple-400' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <s.icon className={`w-4 h-4 ${s.color} flex-shrink-0`} />
                  <div className="min-w-0">
                    <p className={`text-lg font-black ${s.color} leading-none`}>{s.value}</p>
                    <p className="text-xs text-white/40 font-medium mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {payments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-teal-500 to-blue-600" />
          <div className="p-12 sm:p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-6">
              <Banknote className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">No payments logged yet</h3>
            <p className="text-gray-500 font-medium max-w-md mx-auto mb-2">
              Most finance tools only see invoiced income. Invonaut captures everything — cash at a job site, a POS terminal, mobile money, prepayments. If money came in, it belongs here.
            </p>
            <p className="text-sm text-gray-400 mb-8">Tag payments with revenue categories to unlock revenue intelligence in Analytics.</p>
            <Link href="/dashboard/payments/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold hover:shadow-lg hover:scale-[1.02] transition-all">
              <Plus className="w-5 h-5" />Log Your First Payment
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <DirectPaymentList payments={payments} />
        </div>
      )}
    </div>
  )
}
