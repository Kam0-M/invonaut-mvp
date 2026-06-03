'use client'

import { useCurrency } from '@/lib/context/currency-context'
// src/components/payments/direct-payment-list.tsx
// Filter controls + payment rows. Receives pre-fetched data from server page.

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Banknote, Smartphone, Building2, CreditCard, Coins, Calendar, Tag, ChevronRight, Inbox } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type DirectPayment = {
  id:               string
  amount:           number
  payment_type:     'cash' | 'prepay'
  payment_method:   'cash' | 'bank' | 'mobile' | 'pos'
  description:      string
  notes:            string | null
  payment_date:     string
  attachment_url:   string | null
  created_at:       string
  revenue_categories: { id: string; name: string; color: string } | null
  clients:            { id: string; name: string; company: string | null } | null
}

interface Props {
  payments: DirectPayment[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PAYMENT_METHOD_CONFIG: Record<string, { label: string; icon: typeof Banknote }> = {
  cash:   { label: 'Cash',         icon: Coins        },
  bank:   { label: 'Bank',         icon: Building2    },
  mobile: { label: 'Mobile Money', icon: Smartphone   },
  pos:    { label: 'POS',          icon: CreditCard   },
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function fmt(n: number) {
  return fmt(n)
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DirectPaymentList({
  const { format: fmt } = useCurrency() payments }: Props) {
  const [filterType,   setFilterType]   = useState<string>('all')
  const [filterMethod, setFilterMethod] = useState<string>('all')
  const [filterCat,    setFilterCat]    = useState<string>('all')
  const [search,       setSearch]       = useState('')

  // Build category options from data
  const categoryOptions = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; color: string }>()
    payments.forEach(p => {
      if (p.revenue_categories && !seen.has(p.revenue_categories.id)) {
        seen.set(p.revenue_categories.id, p.revenue_categories)
      }
    })
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [payments])

  const filtered = useMemo(() => {
    return payments.filter(p => {
      if (filterType   !== 'all' && p.payment_type   !== filterType)   return false
      if (filterMethod !== 'all' && p.payment_method !== filterMethod) return false
      if (filterCat    !== 'all' && p.revenue_categories?.id !== filterCat) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchDesc   = p.description.toLowerCase().includes(q)
        const matchClient = p.clients?.name.toLowerCase().includes(q) ?? false
        const matchCat    = p.revenue_categories?.name.toLowerCase().includes(q) ?? false
        if (!matchDesc && !matchClient && !matchCat) return false
      }
      return true
    })
  }, [payments, filterType, filterMethod, filterCat, search])

  const pillBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
      active
        ? 'bg-blue-600 text-white border-blue-600'
        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
    }`

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg">

      {/* Controls */}
      <div className="p-6 border-b border-gray-100 space-y-4">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by description, client, or category…"
          className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
        />

        <div className="flex flex-wrap gap-4">
          {/* Payment type filter */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Type</p>
            <div className="flex gap-2 flex-wrap">
              {['all', 'cash', 'prepay'].map(t => (
                <button key={t} onClick={() => setFilterType(t)} className={pillBtn(filterType === t)}>
                  {t === 'all' ? 'All' : t === 'cash' ? 'Cash' : 'Prepay'}
                </button>
              ))}
            </div>
          </div>

          {/* Payment method filter */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Method</p>
            <div className="flex gap-2 flex-wrap">
              {['all', 'cash', 'bank', 'mobile', 'pos'].map(m => (
                <button key={m} onClick={() => setFilterMethod(m)} className={pillBtn(filterMethod === m)}>
                  {m === 'all' ? 'All' : PAYMENT_METHOD_CONFIG[m]?.label ?? m}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          {categoryOptions.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Category</p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setFilterCat('all')} className={pillBtn(filterCat === 'all')}>All</button>
                {categoryOptions.map(c => (
                  <button key={c.id} onClick={() => setFilterCat(c.id)} className={pillBtn(filterCat === c.id)}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {filtered.length !== payments.length && (
          <p className="text-xs text-gray-400 font-medium">
            Showing {filtered.length} of {payments.length} payments
          </p>
        )}
      </div>

      {/* Empty state */}
      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Banknote className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-base font-bold text-gray-500 mb-1">No payments logged yet</p>
          <p className="text-sm text-gray-400 mb-6">Record cash, POS, mobile money, and prepayments here</p>
          <Link href="/dashboard/payments/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all">
            Log your first payment
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-400">No payments match your filters</p>
        </div>
      ) : (
        <div className="p-4 space-y-2">
          {filtered.map((payment, idx) => {
            const MethodIcon  = PAYMENT_METHOD_CONFIG[payment.payment_method]?.icon ?? Banknote
            const methodLabel = PAYMENT_METHOD_CONFIG[payment.payment_method]?.label ?? payment.payment_method

            const methodColors: Record<string, string> = {
              cash:   'bg-amber-50 text-amber-600',
              bank:   'bg-green-50 text-green-600',
              mobile: 'bg-teal-50 text-teal-600',
              pos:    'bg-blue-50 text-blue-600',
            }
            const iconColor = methodColors[payment.payment_method] ?? 'bg-gray-100 text-gray-500'

            return (
              <div
                key={payment.id}
                className="inv-row-in relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Method icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                    <MethodIcon className="w-5 h-5" />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900 truncate">{payment.description}</p>
                      {/* Method badge */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${iconColor} border-current border-opacity-20`}>
                        {methodLabel}
                      </span>
                      {payment.payment_type === 'prepay' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          Prepaid
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {payment.revenue_categories && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                          <span className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: payment.revenue_categories.color }} />
                          {payment.revenue_categories.name}
                        </span>
                      )}
                      {payment.clients && (
                        <span className="text-xs text-gray-400 font-medium">{payment.clients.name}</span>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="hidden sm:block flex-shrink-0 text-right min-w-[80px]">
                    <span className="text-xs text-gray-400 font-medium">{formatDate(payment.payment_date)}</span>
                  </div>

                  {/* Amount */}
                  <div className="flex-shrink-0 text-right min-w-[80px]">
                    <span className="text-base font-black text-gray-900 group-hover:text-teal-600 transition-colors">
                      {fmt(Number(payment.amount))}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0">→</span>
                </div>

                <Link href={`/dashboard/payments/${payment.id}`} className="absolute inset-0 rounded-2xl" aria-label={`View payment: ${payment.description}`} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
