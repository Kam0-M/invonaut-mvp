'use client'

import { useCurrency } from '@/lib/context/currency-context'

import { useState, useMemo } from 'react'
import { InvoiceFilters } from './invoice-filters'
import { FollowUpButton } from './follow-up-button'
import Link from 'next/link'
import { Edit, Lock, Zap, Clock, CheckCircle2, FileText, AlertTriangle } from 'lucide-react'

type Invoice = {
  id: string
  invoice_number: string
  issue_date: string
  due_date: string
  total_amount: number
  status: string
  displayStatus?: string
  last_followed_up?: string | null
  ai_risk_score?: number | null
  clients: { name: string; company?: string | null } | null
  revenue_categories?: { id: string; name: string; color: string } | null
}

type InvoiceListProps = {
  invoices: Invoice[]
  hasActiveSubscription: boolean
}

// Stable colour from client name — keeps the same avatar colour per client
function avatarColor(name: string) {
  const palette = [
    { bg: 'bg-blue-100',   text: 'text-blue-700'   },
    { bg: 'bg-teal-100',   text: 'text-teal-700'   },
    { bg: 'bg-orange-100', text: 'text-orange-700' },
    { bg: 'bg-amber-100',  text: 'text-amber-700'  },
    { bg: 'bg-rose-100',   text: 'text-rose-700'   },
    { bg: 'bg-sky-100',    text: 'text-sky-700'    },
    { bg: 'bg-green-100',  text: 'text-green-700'  },
    { bg: 'bg-blue-50',    text: 'text-blue-600'   },
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}


function formatDate(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function formatDateShort(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function daysFromNow(s: string) {
  const diff = new Date(s + 'T12:00:00').getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const STATUS_CONFIG: Record<string, { label: string; pill: string; dot: string }> = {
  draft:   { label: 'Draft',   pill: 'bg-gray-100 text-gray-600 border border-gray-200',         dot: 'bg-gray-400'   },
  sent:    { label: 'Sent',    pill: 'bg-blue-50 text-blue-700 border border-blue-200',           dot: 'bg-blue-500'   },
  paid:    { label: 'Paid',    pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200',  dot: 'bg-emerald-500'},
  overdue: { label: 'Overdue', pill: 'bg-red-50 text-red-700 border border-red-200',              dot: 'bg-red-500'    },
}

// AI risk pill — shown on sent/overdue invoices
function RiskPill({ score, status }: { score?: number | null; status: string }) {
  if (status !== 'sent' && status !== 'overdue') return null

  // If we have a real score use it; otherwise derive from status
  const risk = score ?? (status === 'overdue' ? 78 : null)
  if (risk === null) return null

  if (risk >= 60) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
        <Zap className="w-2.5 h-2.5" />
        {risk}% risk
      </span>
    )
  }
  if (risk >= 35) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
        <Clock className="w-2.5 h-2.5" />
        {risk}% risk
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
      <CheckCircle2 className="w-2.5 h-2.5" />
      On track
    </span>
  )
}

export function InvoiceList({
  invoices, hasActiveSubscription }: InvoiceListProps) {
  const { format: fmt } = useCurrency()
  const formatCompact = (n: number) => fmt(n, { compact: true })
  const [filters, setFilters] = useState({ status: 'all', search: '' })

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const ds = inv.displayStatus ?? inv.status
      const statusMatch =
        filters.status === 'all' ? true :
        filters.status === 'overdue' ? ds === 'overdue' :
        ds === filters.status

      const q = filters.search.toLowerCase()
      const searchMatch =
        !q ||
        inv.invoice_number.toLowerCase().includes(q) ||
        (inv.clients?.name ?? '').toLowerCase().includes(q)

      return statusMatch && searchMatch
    })
  }, [invoices, filters])

  return (
    <>
      <InvoiceFilters onFilterChange={setFilters} />

      {/* Results count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500 font-medium">
          Showing <span className="text-gray-900 font-bold">{filteredInvoices.length}</span> of {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
          {filters.status !== 'all' && <span className="text-blue-600"> · {filters.status}</span>}
          {filters.search && <span className="text-blue-600"> · "{filters.search}"</span>}
        </p>
        {filteredInvoices.length > 0 && (
          <p className="text-xs text-gray-400 font-medium">
            {formatCompact(filteredInvoices.reduce((s, i) => s + Number(i.total_amount), 0))} total
          </p>
        )}
      </div>

      {/* No results state */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-900 font-bold mb-1">No invoices found</p>
          <p className="text-sm text-gray-400 font-medium">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredInvoices.map((invoice, idx) => {
            const ds        = (invoice.displayStatus ?? invoice.status) as string
            const config    = STATUS_CONFIG[ds] ?? STATUS_CONFIG.draft
            const clientName = invoice.clients?.name ?? 'Unknown'
            const av        = avatarColor(clientName)
            const initials  = clientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
            const days      = daysFromNow(invoice.due_date)
            const isOverdue = ds === 'overdue'
            const isDraft   = ds === 'draft'
            const isPaid    = ds === 'paid'

            let dueDateLabel = ''
            let dueDateColor = 'text-gray-400'
            if (isPaid) {
              dueDateLabel = 'Paid'
              dueDateColor = 'text-emerald-600'
            } else if (isOverdue) {
              dueDateLabel = `${Math.abs(days)}d overdue`
              dueDateColor = 'text-red-500'
            } else if (days === 0) {
              dueDateLabel = 'Due today'
              dueDateColor = 'text-amber-600'
            } else if (days <= 3) {
              dueDateLabel = `Due in ${days}d`
              dueDateColor = 'text-amber-500'
            } else {
              dueDateLabel = `Due ${formatDateShort(invoice.due_date)}`
              dueDateColor = 'text-gray-400'
            }

            return (
              <div
                key={invoice.id}
                className="inv-row-in relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex items-center gap-4 px-5 py-4">

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm ${av.bg} ${av.text}`}>
                    {initials}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-gray-900 font-mono tracking-tight">{invoice.invoice_number}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${config.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        {config.label}
                      </span>
                      <RiskPill score={invoice.ai_risk_score} status={ds} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {invoice.revenue_categories && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded-md px-1.5 py-0.5 flex-shrink-0"
                          style={{ backgroundColor: invoice.revenue_categories.color + '20', color: invoice.revenue_categories.color }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: invoice.revenue_categories.color }} />
                          {invoice.revenue_categories.name}
                        </span>
                      )}
                      <span className="text-sm text-gray-600 font-medium truncate">{clientName}</span>
                      {invoice.clients?.company && (
                        <>
                          <span className="text-gray-200 text-xs">·</span>
                          <span className="text-xs text-gray-400 truncate">{invoice.clients.company}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Due date */}
                  <div className="hidden sm:flex flex-col items-end flex-shrink-0 min-w-[90px]">
                    <span className={`text-xs font-bold ${dueDateColor}`}>{dueDateLabel}</span>
                    {!isPaid && <span className="text-[10px] text-gray-300 mt-0.5">{formatDateShort(invoice.due_date)}</span>}
                  </div>

                  {/* Amount */}
                  <div className="flex-shrink-0 text-right min-w-[80px]">
                    <span className="text-base font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                      {formatCompact(invoice.total_amount)}
                    </span>
                    {invoice.total_amount >= 10000 && (
                      <p className="text-[10px] text-gray-300 mt-0.5">{fmt(invoice.total_amount)}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-2 min-w-[60px] justify-end">
                    {isDraft && (
                      hasActiveSubscription ? (
                        <Link
                          href={`/dashboard/invoices/${invoice.id}/edit`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-xs font-bold text-gray-700"
                          onClick={e => e.stopPropagation()}
                        >
                          <Edit className="w-3 h-3" />Edit
                        </Link>
                      ) : (
                        <button disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-300 text-xs font-bold cursor-not-allowed">
                          <Lock className="w-3 h-3" />Edit
                        </button>
                      )
                    )}
                    {isOverdue && (
                      <FollowUpButton
                        invoiceId={invoice.id}
                        invoiceNumber={invoice.invoice_number}
                        clientName={clientName}
                        lastFollowedUp={invoice.last_followed_up ?? null}
                        daysOverdue={Math.abs(days)}
                      />
                    )}
                    {!isDraft && !isOverdue && (
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all text-xs font-bold text-gray-400 hover:text-gray-700"
                      >
                        View →
                      </Link>
                    )}
                  </div>
                </div>

                {/* Clickable overlay — whole row goes to detail */}
                <Link href={`/dashboard/invoices/${invoice.id}`} className="absolute inset-0 rounded-2xl" aria-label={`View invoice ${invoice.invoice_number}`} />
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
