import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Download, Pencil, Mail, User, Building2,
  Calendar, DollarSign, Paperclip, Clock,
} from 'lucide-react'
import { SendInvoiceButton }    from '@/components/invoices/send-invoice-button'
import { DeleteInvoiceButton }  from '@/components/invoices/delete-invoice-button'
import { FollowUpButton }       from '@/components/invoices/follow-up-button'
import { MarkAsPaidButton }     from '@/components/invoices/mark-paid-button'
import { PaymentPrediction }    from '@/components/invoices/payment-prediction'
import { getInvoiceDisplayStatus } from '@/lib/utils/invoice-status'
import { NotFound }             from '@/components/ui/not-found'
import InvoiceContractLinker    from '@/components/contracts/invoice-contract-linker'
import { resolveSignedUrl }     from '@/lib/storage/signed-url'
import { makeCurrencyFormatter } from '@/lib/utils/currency'

type PageProps = { params: Promise<{ id: string }> }

const fmtDate = (s: string) =>
  new Date(s + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

const STATUS_CFG: Record<string, { pill: string; dot: string; label: string }> = {
  draft:   { pill: 'bg-gray-100 text-gray-600 border border-gray-200',   dot: 'bg-gray-400',    label: 'Draft'   },
  sent:    { pill: 'bg-blue-50 text-blue-700 border border-blue-200',    dot: 'bg-blue-500',    label: 'Sent'    },
  paid:    { pill: 'bg-teal-50 text-teal-700 border border-teal-200',    dot: 'bg-teal-500',    label: 'Paid'    },
  overdue: { pill: 'bg-red-50 text-red-700 border border-red-200',       dot: 'bg-red-500',     label: 'Overdue' },
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  const { data: raw, error } = await supabase
    .from('invoices')
    .select(`
      id, client_id, invoice_number, status,
      issue_date, due_date, subtotal, tax_amount, total_amount,
      notes, attachment_url, last_followed_up, revenue_category_id,
      revenue_categories (id, name, color),
      clients!inner(name, email, company, address)
    `)
    .eq('id', id).eq('user_id', user.id).single()

  if (error || !raw) {
    return (
      <NotFound title="Invoice Not Found"
        description="This invoice doesn't exist or you don't have permission to view it."
        backLink="/dashboard/invoices" backText="Back to Invoices" />
    )
  }

  const { data: profile } = await supabase.from('user_profiles')
    .select('currency, currency_symbol').eq('id', user.id).single()
  const fmt = makeCurrencyFormatter((profile as any)?.currency || 'USD', (profile as any)?.currency_symbol)

  const inv = raw as any
  const invoice = {
    ...inv,
    clients: Array.isArray(inv.clients) ? inv.clients[0] : inv.clients,
    revenue_categories: Array.isArray(inv.revenue_categories)
      ? (inv.revenue_categories[0] ?? null) : (inv.revenue_categories ?? null),
  }

  const { data: itemsData } = await supabase
    .from('invoice_items').select('id, description, quantity, unit_price, total')
    .eq('invoice_id', id).order('id', { ascending: true })
  const items = (itemsData || []) as any[]

  const { data: linkedRaw } = await supabase
    .from('contract_invoice_links')
    .select('contract_id, link_type, contracts(id, title, status, template_type)')
    .eq('invoice_id', id)
  const linkedContracts = (linkedRaw ?? []).map((l: any) => ({
    contract_id: l.contract_id, link_type: l.link_type,
    contract: Array.isArray(l.contracts) ? l.contracts[0] ?? null : l.contracts ?? null,
  }))

  const { data: availableRaw } = await supabase
    .from('contracts').select('id, title, status, template_type')
    .eq('user_id', user.id).eq('client_id', invoice.client_id)
    .not('status', 'eq', 'cancelled').order('created_at', { ascending: false })
  const availableContracts = (availableRaw ?? []) as any[]

  const displayStatus = getInvoiceDisplayStatus({ status: invoice.status, due_date: invoice.due_date })
  const cfg       = STATUS_CFG[displayStatus] ?? STATUS_CFG.draft
  const isOverdue = displayStatus === 'overdue'
  const isPaid    = displayStatus === 'paid'
  const canEdit   = invoice.status === 'draft'
  const canSend   = invoice.clients?.email && invoice.status !== 'paid'
  const canPaid   = invoice.status === 'sent' || isOverdue
  const showAI    = invoice.status === 'sent' || isOverdue
  const daysOver  = isOverdue
    ? Math.floor((Date.now() - new Date(invoice.due_date + 'T12:00:00').getTime()) / 86_400_000)
    : 0
  const attachName = invoice.attachment_url
    ? decodeURIComponent(invoice.attachment_url.split('/').pop() || '').replace(/^\d{13}-/, '')
    : null
  // Checklist #22: invoice-attachments is now a private bucket — the stored
  // attachment_url no longer resolves directly, exchange it for a signed URL.
  const attachmentSignedUrl = await resolveSignedUrl(invoice.attachment_url)

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/dashboard/invoices"
            className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors mb-2 block">
            ← Invoices
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-gray-900 font-mono">{invoice.invoice_number}</h1>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${cfg.pill}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            {isOverdue && (
              <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                {daysOver}d overdue
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 font-medium mt-1">
            {invoice.clients?.name}{invoice.clients?.company ? ` · ${invoice.clients.company}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <Link href={`/dashboard/invoices/${id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition-all">
              <Pencil className="w-3.5 h-3.5" />Edit
            </Link>
          )}
          <a href={`/api/download-invoice?id=${id}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition-all">
            <Download className="w-3.5 h-3.5" />PDF
          </a>
          {canSend && (
            <SendInvoiceButton invoiceId={id} invoiceNumber={invoice.invoice_number}
              clientEmail={invoice.clients?.email || ''} clientName={invoice.clients?.name || ''} />
          )}
          {canPaid && <MarkAsPaidButton invoiceId={id} invoiceNumber={invoice.invoice_number} />}
          {isOverdue && (
            <FollowUpButton invoiceId={id} invoiceNumber={invoice.invoice_number}
              clientName={invoice.clients?.name || ''} lastFollowedUp={invoice.last_followed_up}
              daysOverdue={daysOver} />
          )}
          <DeleteInvoiceButton invoiceId={id} invoiceNumber={invoice.invoice_number} />
        </div>
      </div>

      {/* Rate-limit notice */}
      {isOverdue && invoice.last_followed_up && (() => {
        const h = Math.floor((Date.now() - new Date(invoice.last_followed_up).getTime()) / 3_600_000)
        if (h >= 48) return null
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-700">
            <Clock className="w-3.5 h-3.5" />Next reminder available in {48 - h}h
          </div>
        )
      })()}

      {showAI && (
        <PaymentPrediction invoiceId={id} clientId={invoice.client_id}
          clientName={invoice.clients?.name || 'Client'}
          invoiceAmount={invoice.total_amount}
          invoiceStatus={invoice.status} dueDate={invoice.due_date} />
      )}

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">

        {/* Bill To + Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-gray-50">
          <div className="p-6 md:border-r border-b md:border-b-0 border-gray-50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Bill To</p>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-gray-900">{invoice.clients?.name || '—'}</p>
                {invoice.clients?.company && (
                  <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3" />{invoice.clients.company}
                  </p>
                )}
                {invoice.clients?.email && (
                  <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3" />{invoice.clients.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Details</p>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Invoice #', value: invoice.invoice_number, mono: true },
                { label: 'Issue date', value: fmtDate(invoice.issue_date) },
                { label: 'Due date', value: fmtDate(invoice.due_date), red: isOverdue },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between gap-4">
                  <span className="text-gray-400 font-medium">{r.label}</span>
                  <span className={`font-bold ${r.red ? 'text-red-600' : 'text-gray-900'} ${r.mono ? 'font-mono' : ''}`}>{r.value}</span>
                </div>
              ))}
              {invoice.revenue_categories && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-400 font-medium">Category</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: invoice.revenue_categories.color + '22', color: invoice.revenue_categories.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: invoice.revenue_categories.color }} />
                    {invoice.revenue_categories.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="p-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Line Items</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Description','Qty','Unit price','Total'].map((h, i) => (
                    <th key={h} className={`pb-2 text-xs font-bold text-gray-400 uppercase tracking-wide ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 font-medium text-gray-900">{item.description}</td>
                    <td className="py-3 text-right font-bold text-gray-600">{item.quantity}</td>
                    <td className="py-3 text-right font-bold text-gray-600">{fmt(item.unit_price)}</td>
                    <td className="py-3 text-right font-black text-gray-900">{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="px-6 pb-6 border-t border-gray-50 pt-4 flex justify-end">
          <div className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Subtotal</span>
              <span className="font-bold text-gray-900">{fmt(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Tax</span>
              <span className="font-bold text-gray-900">{fmt(invoice.tax_amount)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-100 mt-2">
              <span className="font-black text-gray-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />Total
              </span>
              <span className={`text-xl font-black ${isPaid ? 'text-teal-600' : 'text-blue-600'}`}>
                {fmt(invoice.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="px-6 pb-6 border-t border-gray-50 pt-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Notes</p>
            <p className="text-sm text-gray-600 font-medium leading-relaxed whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}

        {attachmentSignedUrl && attachName && (
          <div className="px-6 pb-6 border-t border-gray-50 pt-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Attachment</p>
            <a href={attachmentSignedUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group">
              <div className="w-8 h-8 bg-blue-50 group-hover:bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                <Paperclip className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-bold text-gray-800 group-hover:text-blue-700 transition-colors truncate max-w-xs">
                {attachName}
              </span>
              <span className="text-xs font-bold text-blue-500 flex-shrink-0">Download ↗</span>
            </a>
          </div>
        )}
      </div>

      {invoice.last_followed_up && (
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">Last follow-up sent</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{fmtDate(invoice.last_followed_up)}</p>
          </div>
        </div>
      )}

      <InvoiceContractLinker invoiceId={id} clientId={invoice.client_id}
        linkedContracts={linkedContracts} availableContracts={availableContracts} />
    </div>
  )
}