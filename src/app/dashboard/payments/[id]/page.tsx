// src/app/dashboard/payments/[id]/page.tsx

import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link             from 'next/link'
import {
  ArrowLeft, Pencil, Calendar, Banknote,
  Building2, Smartphone, CreditCard, Coins,
  Paperclip, User, Tag,
} from 'lucide-react'
import SubscriptionRequired    from '@/components/subscription-required'
import DeletePaymentButton     from '@/components/payments/delete-payment-button'
import EditPaymentForm         from '@/components/payments/edit-payment-form'

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

const METHOD_CONFIG: Record<string, { label: string; icon: typeof Banknote }> = {
  cash:   { label: 'Cash',          icon: Coins      },
  bank:   { label: 'Bank Transfer', icon: Building2  },
  mobile: { label: 'Mobile Money',  icon: Smartphone },
  pos:    { label: 'POS Terminal',  icon: CreditCard },
}

export default async function PaymentDetailPage({
  params,
  searchParams,
}: {
  params:       Promise<{ id: string }>
  searchParams: Promise<{ edit?: string }>
}) {
  const { id }         = await params
  const { edit }       = await searchParams
  const isEditing      = edit === '1'

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

  const { data: raw, error } = await supabase
    .from('direct_payments')
    .select(`
      id, amount, payment_type, payment_method,
      description, notes, payment_date, attachment_url, created_at,
      revenue_categories (id, name, color),
      clients (id, name, company)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !raw) redirect('/dashboard/payments')

  const payment = {
    ...raw,
    revenue_categories: Array.isArray(raw.revenue_categories)
      ? (raw.revenue_categories[0] ?? null) : raw.revenue_categories,
    clients: Array.isArray(raw.clients)
      ? (raw.clients[0] ?? null) : raw.clients,
  } as any

  // For edit mode — fetch categories and clients
  const [{ data: categoriesRaw }, { data: clientsRaw }] = await Promise.all([
    supabase.from('revenue_categories').select('id, name, color').eq('user_id', user.id).order('name'),
    supabase.from('clients').select('id, name, company').eq('user_id', user.id).order('name'),
  ])

  const MethodIcon  = METHOD_CONFIG[payment.payment_method]?.icon ?? Banknote
  const methodLabel = METHOD_CONFIG[payment.payment_method]?.label ?? payment.payment_method
  const attachmentName = payment.attachment_url
    ? decodeURIComponent(payment.attachment_url.split('/').pop() || '').replace(/^\d{13}-/, '')
    : null

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link href="/dashboard/payments"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all font-bold text-gray-700 w-fit">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Payments</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">Payment</h1>
            <p className="text-base text-gray-600 mt-1 font-medium">{formatDate(payment.payment_date)}</p>
          </div>
        </div>
        {!isEditing && (
          <div className="flex gap-3">
            <Link href={`/dashboard/payments/${id}?edit=1`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all">
              <Pencil className="w-4 h-4" />Edit
            </Link>
            <DeletePaymentButton paymentId={id} description={payment.description} />
          </div>
        )}
      </div>

      {isEditing ? (
        /* ── Edit mode ─────────────────────────────────────────────────────── */
        <EditPaymentForm
          payment={payment}
          categories={categoriesRaw || []}
          clients={clientsRaw || []}
        />
      ) : (
        /* ── View mode ─────────────────────────────────────────────────────── */
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-10 shadow-lg space-y-8">

          {/* Amount hero */}
          <div className="flex items-center gap-6 pb-8 border-b-2 border-gray-100">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-black text-green-700">$</span>
            </div>
            <div>
              <p className="text-4xl font-black text-gray-900 tracking-tight">
                {formatCurrency(Number(payment.amount))}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  payment.payment_type === 'prepay'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {payment.payment_type === 'prepay' ? 'Prepaid' : 'Cash'}
                </span>
                {payment.payment_type === 'prepay' && (
                  <span className="text-xs text-purple-600 font-medium">— service pending</span>
                )}
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <MethodIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Payment Method</p>
                <p className="text-sm font-bold text-gray-900">{methodLabel}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Tag className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Revenue Category</p>
                {payment.revenue_categories ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: payment.revenue_categories.color + '22',
                      color: payment.revenue_categories.color,
                    }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: payment.revenue_categories.color }} />
                    {payment.revenue_categories.name}
                  </span>
                ) : (
                  <p className="text-sm text-gray-400">Uncategorized</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Payment Date</p>
                <p className="text-sm font-bold text-gray-900">{formatDate(payment.payment_date)}</p>
              </div>
            </div>

            {payment.clients && (
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Client</p>
                  <Link href={`/dashboard/clients/${payment.clients.id}`}
                    className="text-sm font-bold text-blue-600 hover:underline">
                    {payment.clients.name}
                  </Link>
                  {payment.clients.company && (
                    <p className="text-xs text-gray-400 mt-0.5">{payment.clients.company}</p>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Description */}
          <div className="border-t-2 border-gray-100 pt-6">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Description</p>
            <p className="text-base font-medium text-gray-900">{payment.description}</p>
          </div>

          {/* Notes */}
          {payment.notes && (
            <div className="border-t-2 border-gray-100 pt-6">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Notes</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{payment.notes}</p>
            </div>
          )}

          {/* Attachment */}
          {payment.attachment_url && attachmentName && (
            <div className="border-t-2 border-gray-100 pt-6">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Attachment</p>
              <a href={payment.attachment_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                  <Paperclip className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-bold text-gray-800 group-hover:text-blue-700 truncate max-w-xs">
                  {attachmentName}
                </span>
                <span className="text-xs font-bold text-blue-500 flex-shrink-0">Download ↗</span>
              </a>
            </div>
          )}

        </div>
      )}
    </div>
  )
}