import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link             from 'next/link'
import {
  Pencil, Calendar, Banknote, Building2,
  Smartphone, CreditCard, Coins, Paperclip, User, Tag,
} from 'lucide-react'
import SubscriptionRequired from '@/components/subscription-required'
import DeletePaymentButton  from '@/components/payments/delete-payment-button'
import EditPaymentForm      from '@/components/payments/edit-payment-form'

const fmtFull = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
const fmtDate = (s: string) =>
  new Date(s + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

const METHOD_CFG: Record<string, { label: string; icon: any; bg: string; color: string }> = {
  cash:   { label: 'Cash',          icon: Coins,      bg: 'bg-amber-50',  color: 'text-amber-600'  },
  bank:   { label: 'Bank Transfer', icon: Building2,  bg: 'bg-green-50',  color: 'text-green-600'  },
  mobile: { label: 'Mobile Money',  icon: Smartphone, bg: 'bg-blue-50',   color: 'text-blue-600'   },
  pos:    { label: 'POS Terminal',  icon: CreditCard, bg: 'bg-teal-50',   color: 'text-teal-600'   },
}

export default async function PaymentDetailPage({
  params, searchParams,
}: {
  params:       Promise<{ id: string }>
  searchParams: Promise<{ edit?: string }>
}) {
  const { id }   = await params
  const { edit } = await searchParams
  const isEditing = edit === '1'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles').select('stripe_subscription_id, subscription_status')
    .eq('id', user.id).single()

  const hasActiveSubscription = !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')
  if (!hasActiveSubscription) return <SubscriptionRequired />

  const { data: raw, error } = await supabase
    .from('direct_payments')
    .select(`id, amount, payment_type, payment_method, description, notes,
             payment_date, attachment_url, created_at,
             revenue_categories (id, name, color),
             clients (id, name, company)`)
    .eq('id', id).eq('user_id', user.id).single()

  if (error || !raw) redirect('/dashboard/payments')

  const payment = {
    ...raw,
    revenue_categories: Array.isArray((raw as any).revenue_categories)
      ? ((raw as any).revenue_categories[0] ?? null) : (raw as any).revenue_categories,
    clients: Array.isArray((raw as any).clients)
      ? ((raw as any).clients[0] ?? null) : (raw as any).clients,
  } as any

  const [{ data: categoriesRaw }, { data: clientsRaw }] = await Promise.all([
    supabase.from('revenue_categories').select('id, name, color').eq('user_id', user.id).order('name'),
    supabase.from('clients').select('id, name, company').eq('user_id', user.id).order('name'),
  ])

  const methodCfg  = METHOD_CFG[payment.payment_method] ?? { label: payment.payment_method, icon: Banknote, bg: 'bg-gray-50', color: 'text-gray-600' }
  const MethodIcon = methodCfg.icon
  const attachName = payment.attachment_url
    ? decodeURIComponent(payment.attachment_url.split('/').pop() || '').replace(/^\d{13}-/, '')
    : null

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/dashboard/payments"
            className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors mb-2 block">
            ← Payments
          </Link>
          <h1 className="text-2xl font-black text-gray-900">Payment Detail</h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">{fmtDate(payment.payment_date)}</p>
        </div>
        {!isEditing && (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/payments/${id}?edit=1`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition-all">
              <Pencil className="w-3.5 h-3.5" />Edit
            </Link>
            <DeletePaymentButton paymentId={id} description={payment.description} />
          </div>
        )}
      </div>

      {isEditing ? (
        <EditPaymentForm payment={payment} categories={categoriesRaw||[]} clients={clientsRaw||[]} />
      ) : (
        <div className="space-y-4">

          {/* Amount hero card */}
          <div className={`rounded-2xl border p-6 flex items-center gap-5 ${
            payment.payment_type === 'prepay' ? 'bg-blue-50 border-blue-200' : 'bg-teal-50 border-teal-200'
          }`}
            style={{ boxShadow: payment.payment_type === 'prepay'
              ? '0 0 28px rgba(0,102,255,0.10)' : '0 0 28px rgba(0,212,170,0.12)' }}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              payment.payment_type === 'prepay' ? 'bg-blue-100' : 'bg-teal-100'
            }`}>
              <Banknote className={`w-7 h-7 ${payment.payment_type==='prepay' ? 'text-blue-600' : 'text-teal-600'}`} />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">{fmtFull(Number(payment.amount))}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  payment.payment_type === 'prepay' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'
                }`}>
                  {payment.payment_type === 'prepay' ? 'Prepaid' : 'Cash payment'}
                </span>
                <span className="text-xs text-gray-500 font-medium">{payment.description}</span>
              </div>
            </div>
          </div>

          {/* Details card */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-all">
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment Details</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-50">

              <div className="p-5 space-y-4">
                {/* Method */}
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${methodCfg.bg}`}>
                    <MethodIcon className={`w-4 h-4 ${methodCfg.color}`} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Method</p>
                    <p className="text-sm font-bold text-gray-900">{methodCfg.label}</p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</p>
                    <p className="text-sm font-bold text-gray-900">{fmtDate(payment.payment_date)}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Category */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Tag className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</p>
                    {payment.revenue_categories ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold mt-0.5"
                        style={{ backgroundColor: payment.revenue_categories.color + '22', color: payment.revenue_categories.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: payment.revenue_categories.color }} />
                        {payment.revenue_categories.name}
                      </span>
                    ) : (
                      <p className="text-sm text-gray-400 font-medium">Uncategorized</p>
                    )}
                  </div>
                </div>

                {/* Client */}
                {payment.clients && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Client</p>
                      <Link href={`/dashboard/clients/${payment.clients.id}`}
                        className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                        {payment.clients.name}
                      </Link>
                      {payment.clients.company && (
                        <p className="text-xs text-gray-400 font-medium">{payment.clients.company}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {payment.notes && (
              <div className="px-5 py-4 border-t border-gray-50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Notes</p>
                <p className="text-sm text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">{payment.notes}</p>
              </div>
            )}

            {/* Attachment */}
            {payment.attachment_url && attachName && (
              <div className="px-5 py-4 border-t border-gray-50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Attachment</p>
                <a href={payment.attachment_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                  <div className="w-8 h-8 bg-blue-50 group-hover:bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-800 group-hover:text-blue-700 truncate max-w-xs">{attachName}</span>
                  <span className="text-xs font-bold text-blue-500 flex-shrink-0">Download ↗</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}