import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Download, Pencil, Mail, User, Building2, Calendar, DollarSign } from 'lucide-react'
import { SendInvoiceButton } from '@/components/invoices/send-invoice-button'
import { DeleteInvoiceButton } from '@/components/invoices/delete-invoice-button'
import { FollowUpButton } from '@/components/invoices/follow-up-button'
import { MarkAsPaidButton } from '@/components/invoices/mark-paid-button'
import { PaymentPrediction } from '@/components/invoices/payment-prediction'
import { getInvoiceDisplayStatus } from '@/lib/utils/invoice-status'
import { NotFound } from '@/components/ui/not-found'

type PageProps = {
  params: Promise<{ id: string }>
}

type Invoice = {
  id: string
  client_id: string
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  issue_date: string
  due_date: string
  subtotal: number
  tax_amount: number
  total_amount: number
  notes: string | null
  last_followed_up: string | null
  clients: {
    name: string
    email: string | null
    company: string | null
    address: string | null
  } | null
}

type InvoiceItem = {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: invoiceData, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      id,
      client_id,
      invoice_number,
      status,
      issue_date,
      due_date,
      subtotal,
      tax_amount,
      total_amount,
      notes,
      last_followed_up,
      clients!inner(name, email, company, address)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (invoiceError || !invoiceData) {
    return (
      <NotFound
        title="Invoice Not Found"
        description="The invoice you're looking for doesn't exist or you don't have permission to view it."
        backLink="/dashboard/invoices"
        backText="Back to Invoices"
      />
    )
  }

  const invoice = invoiceData as any
  const normalizedInvoice: Invoice = {
    ...invoice,
    clients: Array.isArray(invoice.clients) && invoice.clients.length > 0 
      ? invoice.clients[0] 
      : invoice.clients
  }

  const { data: itemsData } = await supabase
    .from('invoice_items')
    .select('id, description, quantity, unit_price, total')
    .eq('invoice_id', id)
    .order('id', { ascending: true })

  const items = (itemsData || []) as InvoiceItem[]

  const displayStatus = getInvoiceDisplayStatus({
    status: normalizedInvoice.status,
    due_date: normalizedInvoice.due_date
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-2 border-gray-300'
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-2 border-blue-300'
      case 'paid':
        return 'bg-green-100 text-green-800 border-2 border-green-300'
      case 'overdue':
        return 'bg-red-100 text-red-800 border-2 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-2 border-gray-300'
    }
  }

  const canEdit = normalizedInvoice.status === 'draft'
  const canSendEmail = normalizedInvoice.clients?.email && normalizedInvoice.status !== 'paid'
  const canMarkAsPaid = normalizedInvoice.status === 'sent' || displayStatus === 'overdue'
  const isOverdue = displayStatus === 'overdue'
  const daysOverdue = isOverdue 
    ? Math.floor((new Date().getTime() - new Date(normalizedInvoice.due_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const showAIPrediction = normalizedInvoice.status === 'sent' || displayStatus === 'overdue'

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div className="flex-1 min-w-0">
          <Link 
            href="/dashboard/invoices"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all duration-200 font-bold text-gray-700 w-fit mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight break-words">
            {normalizedInvoice.invoice_number}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mt-2 font-medium break-words">
            Invoice for {normalizedInvoice.clients?.name || 'Unknown Client'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 justify-start sm:justify-end">
          {canEdit && (
            <Link 
              href={`/dashboard/invoices/${id}/edit`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg transition-all duration-200 font-bold text-gray-700 text-sm whitespace-nowrap"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Link>
          )}
          
          <a 
            href={`/api/download-invoice?id=${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg transition-all duration-200 font-bold text-gray-700 text-sm whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            PDF
          </a>

          {canSendEmail && (
            <SendInvoiceButton 
              invoiceId={id}
              invoiceNumber={normalizedInvoice.invoice_number}
              clientEmail={normalizedInvoice.clients?.email || ''}
              clientName={normalizedInvoice.clients?.name || ''}
            />
          )}

          {canMarkAsPaid && (
            <MarkAsPaidButton
              invoiceId={id}
              invoiceNumber={normalizedInvoice.invoice_number}
            />
          )}

          {isOverdue && (
            <FollowUpButton
              invoiceId={id}
              invoiceNumber={normalizedInvoice.invoice_number}
              clientName={normalizedInvoice.clients?.name || ''}
              lastFollowedUp={normalizedInvoice.last_followed_up}
              daysOverdue={daysOverdue}
            />
          )}

          <DeleteInvoiceButton invoiceId={id} invoiceNumber={normalizedInvoice.invoice_number} />
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`inline-flex rounded-xl px-4 py-2 text-sm font-black uppercase tracking-wide ${getStatusColor(displayStatus)}`}>
          {displayStatus}
        </span>
        {isOverdue && (
          <span className="inline-flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 px-4 py-2 rounded-xl border-2 border-red-200">
            {daysOverdue} days overdue
          </span>
        )}
        {isOverdue && normalizedInvoice.last_followed_up && (() => {
          const hoursSinceFollowUp = Math.floor((new Date().getTime() - new Date(normalizedInvoice.last_followed_up).getTime()) / (1000 * 60 * 60))
          const canSendReminder = hoursSinceFollowUp >= 48
          if (!canSendReminder) {
            const hoursRemaining = 48 - hoursSinceFollowUp
            return (
              <span className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-xl border-2 border-orange-200">
                ⏰ Next reminder in {hoursRemaining}h
              </span>
            )
          }
          return null
        })()}
      </div>

      {/* AI Payment Prediction */}
      {showAIPrediction && (
        <PaymentPrediction
          invoiceId={id}
          clientId={normalizedInvoice.client_id}
          clientName={normalizedInvoice.clients?.name || 'Client'}
          invoiceAmount={normalizedInvoice.total_amount}
          invoiceStatus={normalizedInvoice.status}
          dueDate={normalizedInvoice.due_date}
        />
      )}

      {/* Invoice Details Card */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-10 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
          {/* Client Info */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-wide text-gray-500 mb-4">Bill To</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-base font-black text-gray-900 break-words">{normalizedInvoice.clients?.name || 'N/A'}</p>
                  {normalizedInvoice.clients?.company && (
                    <p className="text-sm text-gray-600 break-words flex items-center gap-2 mt-1">
                      <Building2 className="w-3 h-3" />
                      {normalizedInvoice.clients.company}
                    </p>
                  )}
                </div>
              </div>
              {normalizedInvoice.clients?.email && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600 break-words pt-2">{normalizedInvoice.clients.email}</p>
                </div>
              )}
              {normalizedInvoice.clients?.address && (
                <p className="text-sm text-gray-600 whitespace-pre-line break-words pl-13">{normalizedInvoice.clients.address}</p>
              )}
            </div>
          </div>

          {/* Invoice Info */}
          <div className="text-left md:text-right">
            <h3 className="text-sm font-black uppercase tracking-wide text-gray-500 mb-4">Invoice Details</h3>
            <div className="space-y-3">
              <div className="flex md:justify-end gap-3 items-center">
                <span className="text-sm font-bold text-gray-600">Invoice #:</span>
                <span className="text-sm font-black text-gray-900">{normalizedInvoice.invoice_number}</span>
              </div>
              <div className="flex md:justify-end gap-3 items-center">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-bold text-gray-600">Issue Date:</span>
                <span className="text-sm font-black text-gray-900">{formatDate(normalizedInvoice.issue_date)}</span>
              </div>
              <div className="flex md:justify-end gap-3 items-center">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-bold text-gray-600">Due Date:</span>
                <span className={`text-sm font-black ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDate(normalizedInvoice.due_date)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border-t-2 border-gray-200 pt-8">
          <h3 className="text-sm font-black uppercase tracking-wide text-gray-500 mb-6">Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-4 py-4 text-left text-xs font-black uppercase tracking-wider text-gray-700">
                    Description
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-black uppercase tracking-wider text-gray-700">
                    Quantity
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-black uppercase tracking-wider text-gray-700">
                    Unit Price
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-black uppercase tracking-wider text-gray-700">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 break-words">{item.description}</td>
                    <td className="px-4 py-4 text-sm font-bold text-gray-600 text-right">{item.quantity}</td>
                    <td className="px-4 py-4 text-sm font-bold text-gray-600 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="px-4 py-4 text-sm font-black text-gray-900 text-right">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="border-t-2 border-gray-200 mt-8 pt-8">
          <div className="flex flex-col items-end space-y-3">
            <div className="flex justify-between w-full md:w-80 gap-4">
              <span className="text-sm font-bold text-gray-600">Subtotal:</span>
              <span className="text-sm font-black text-gray-900">{formatCurrency(normalizedInvoice.subtotal)}</span>
            </div>
            <div className="flex justify-between w-full md:w-80 gap-4">
              <span className="text-sm font-bold text-gray-600">Tax:</span>
              <span className="text-sm font-black text-gray-900">{formatCurrency(normalizedInvoice.tax_amount)}</span>
            </div>
            <div className="flex justify-between w-full md:w-80 gap-4 pt-4 border-t-2 border-gray-200">
              <span className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Total:
              </span>
              <span className="text-xl font-black text-blue-600 tracking-tight">{formatCurrency(normalizedInvoice.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {normalizedInvoice.notes && (
          <div className="border-t-2 border-gray-200 mt-8 pt-8">
            <h3 className="text-sm font-black uppercase tracking-wide text-gray-500 mb-3">Notes</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line break-words font-medium">{normalizedInvoice.notes}</p>
          </div>
        )}
      </div>

      {/* Follow-Up History */}
      {normalizedInvoice.last_followed_up && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <h3 className="text-lg font-black text-gray-900 mb-3 tracking-tight">Follow-Up History</h3>
          <p className="text-sm text-gray-600 font-medium">
            Last reminder sent on {formatDate(normalizedInvoice.last_followed_up)}
          </p>
        </div>
      )}
    </div>
  )
}