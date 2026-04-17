// src/app/dashboard/clients/[id]/page.tsx
//
// Client detail page with three tabs driven by ?tab= URL param:
//   overview  (default) — contact info + invoice stats
//   invoices            — full invoice history
//   files               — client files tab (upload / download / delete)

import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link             from 'next/link'
import {
  ArrowLeft, Pencil, Mail, Phone, Building2,
  MapPin, Calendar, FileText, Banknote,
} from 'lucide-react'
import ClientFilesTab, { type ClientFile } from '@/components/clients/client-files-tab'

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatCompact(n: number): string {
  if (n >= 999_500) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000)  return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)
}

function formatCurrencyFull(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'invoices' | 'files' | 'payments'
const VALID_TABS: Tab[] = ['overview', 'invoices', 'files', 'payments']

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params:       Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id }          = await params
  const { tab: tabRaw } = await searchParams
  const activeTab: Tab  = VALID_TABS.includes(tabRaw as Tab) ? (tabRaw as Tab) : 'overview'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !client) redirect('/dashboard/clients')

  // Invoices — always fetched (needed for stats on Overview)
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, total_amount, status, due_date, created_at')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  const invoiceCount = invoices?.length || 0
  const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0

  // Client files — always fetched (lightweight, needed for tab badge count)
  const { data: filesRaw } = await supabase
    .from('client_files')
    .select('id, file_name, file_url, file_size, file_type, uploaded_at')
    .eq('client_id', id)
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false })

  const initialFiles = (filesRaw || []) as ClientFile[]

  // Direct payments for this client
  const { data: directPaymentsRaw } = await supabase
    .from('direct_payments')
    .select(`
      id, amount, payment_type, payment_method,
      description, payment_date,
      revenue_categories (id, name, color)
    `)
    .eq('client_id', id)
    .eq('user_id', user.id)
    .order('payment_date', { ascending: false })

  const directPayments = (directPaymentsRaw || []).map((p: any) => ({
    ...p,
    revenue_categories: Array.isArray(p.revenue_categories)
      ? (p.revenue_categories[0] ?? null)
      : p.revenue_categories,
  }))

  const tabHref = (t: Tab) => `/dashboard/clients/${id}?tab=${t}`

  const tabClass = (t: Tab) =>
    `px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
      activeTab === t
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link
            href="/dashboard/clients"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all duration-200 font-bold text-gray-700 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Clients</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight break-words">
              {client.name}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mt-2 font-medium">
              Client details and invoice history
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/clients/${id}/edit`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:scale-105 transition-all duration-200"
        >
          <Pencil className="w-4 h-4" />
          Edit Client
        </Link>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit">
        <Link href={tabHref('overview')} className={tabClass('overview')}>
          Overview
        </Link>
        <Link href={tabHref('invoices')} className={tabClass('invoices')}>
          Invoices{invoiceCount > 0 && <span className="ml-1.5 text-xs opacity-75">({invoiceCount})</span>}
        </Link>
        <Link href={tabHref('payments')} className={tabClass('payments')}>
          Payments{directPayments.length > 0 && <span className="ml-1.5 text-xs opacity-75">({directPayments.length})</span>}
        </Link>
        <Link href={tabHref('files')} className={tabClass('files')}>
          Files{initialFiles.length > 0 && <span className="ml-1.5 text-xs opacity-75">({initialFiles.length})</span>}
        </Link>
      </div>

      {/* ── TAB: Overview ───────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-10 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-1">Email</p>
                  <p className="text-base font-medium text-gray-900 break-all">{client.email || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-1">Phone</p>
                  <p className="text-base font-medium text-gray-900">{client.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-1">Company</p>
                  <p className="text-base font-medium text-gray-900">{client.company || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-1">Payment Terms</p>
                  <p className="text-base font-medium text-gray-900">{client.payment_terms || 30} days</p>
                </div>
              </div>

              <div className="md:col-span-2 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-teal-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-1">Address</p>
                  <p className="text-base font-medium text-gray-900 whitespace-pre-wrap">{client.address || 'Not provided'}</p>
                </div>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-gray-500">Total Invoices</p>
                  <p className="text-4xl font-black text-gray-900 tracking-tight">{invoiceCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 min-w-0">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl font-black text-green-600">$</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase tracking-wide text-gray-500">Total Revenue</p>
                  <p className="text-4xl font-black text-gray-900 tracking-tight truncate" title={formatCurrencyFull(totalRevenue)}>
                    {formatCompact(totalRevenue)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── TAB: Invoices ────────────────────────────────────────────────────── */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-10 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Invoice History</h2>
            <Link
              href={`/dashboard/invoices/new?client=${id}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:scale-105 transition-all duration-200 w-full sm:w-auto"
            >
              <FileText className="w-4 h-4" />
              Create Invoice
            </Link>
          </div>

          {invoices && invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 text-sm font-black uppercase tracking-wide text-gray-700">Invoice #</th>
                    <th className="text-left py-4 px-4 text-sm font-black uppercase tracking-wide text-gray-700">Amount</th>
                    <th className="text-left py-4 px-4 text-sm font-black uppercase tracking-wide text-gray-700">Status</th>
                    <th className="text-left py-4 px-4 text-sm font-black uppercase tracking-wide text-gray-700">Due Date</th>
                    <th className="text-right py-4 px-4 text-sm font-black uppercase tracking-wide text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 font-bold text-gray-900">{invoice.invoice_number}</td>
                      <td className="py-4 px-4 font-bold text-gray-900">${invoice.total_amount.toFixed(2)}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                          invoice.status === 'paid'    ? 'bg-green-100 text-green-800' :
                          invoice.status === 'sent'    ? 'bg-blue-100 text-blue-800'  :
                          invoice.status === 'overdue' ? 'bg-red-100 text-red-800'    :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-600">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link href={`/dashboard/invoices/${invoice.id}`} className="text-blue-600 hover:text-blue-800 font-bold hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
              </div>
              <p className="text-base font-medium text-gray-600 mb-6">No invoices yet for this client</p>
              <Link
                href={`/dashboard/invoices/new?client=${id}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:scale-105 transition-all duration-200"
              >
                <FileText className="w-4 h-4" />
                Create First Invoice
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Payments ────────────────────────────────────────────────────── */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-10 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Banknote className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Direct Payments</h2>
                <p className="text-sm text-gray-500 font-medium">
                  Cash, POS, mobile money, and prepayments from this client
                </p>
              </div>
            </div>
            <Link
              href={`/dashboard/payments/new`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-sm hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transition-all flex-shrink-0"
            >
              <Banknote className="w-4 h-4" />
              Log Payment
            </Link>
          </div>

          {directPayments.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Banknote className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-base font-medium text-gray-500 mb-2">No direct payments from this client yet</p>
              <p className="text-sm text-gray-400">Log cash, POS, or mobile money payments received outside of invoices</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 text-sm font-black uppercase tracking-wide text-gray-700">Description</th>
                    <th className="text-left py-4 px-4 text-sm font-black uppercase tracking-wide text-gray-700">Category</th>
                    <th className="text-left py-4 px-4 text-sm font-black uppercase tracking-wide text-gray-700">Type</th>
                    <th className="text-left py-4 px-4 text-sm font-black uppercase tracking-wide text-gray-700">Method</th>
                    <th className="text-left py-4 px-4 text-sm font-black uppercase tracking-wide text-gray-700">Date</th>
                    <th className="text-right py-4 px-4 text-sm font-black uppercase tracking-wide text-gray-700">Amount</th>
                    <th className="text-right py-4 px-4 text-sm font-black uppercase tracking-wide text-gray-700">View</th>
                  </tr>
                </thead>
                <tbody>
                  {directPayments.map((p: any) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 font-bold text-gray-900 max-w-[200px] truncate">{p.description}</td>
                      <td className="py-4 px-4">
                        {p.revenue_categories ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: p.revenue_categories.color + '22',
                              color: p.revenue_categories.color,
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: p.revenue_categories.color }} />
                            {p.revenue_categories.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          p.payment_type === 'prepay'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {p.payment_type === 'prepay' ? 'Prepaid' : 'Cash'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 font-medium capitalize">{p.payment_method}</td>
                      <td className="py-4 px-4 text-sm text-gray-600 font-medium">
                        {new Date(p.payment_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-4 text-right font-black text-gray-900">
                        ${Number(p.amount).toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link href={`/dashboard/payments/${p.id}`} className="text-blue-600 hover:text-blue-800 font-bold hover:underline text-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Total */}
          {directPayments.length > 0 && (
            <div className="mt-6 pt-4 border-t-2 border-gray-100 flex justify-end">
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Total Direct Payments</p>
                <p className="text-2xl font-black text-gray-900">
                  ${directPayments.reduce((s: number, p: any) => s + Number(p.amount), 0).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Files ───────────────────────────────────────────────────────── */}
      {activeTab === 'files' && (
        <ClientFilesTab clientId={id} initialFiles={initialFiles} />
      )}

    </div>
  )
}
