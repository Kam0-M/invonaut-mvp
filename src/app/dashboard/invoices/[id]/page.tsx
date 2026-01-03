import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Download, Pencil } from 'lucide-react'
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

  // Fetch invoice with client details
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

  // Fetch invoice items
  const { data: itemsData } = await supabase
    .from('invoice_items')
    .select('id, description, quantity, unit_price, total')
    .eq('invoice_id', id)
    .order('id', { ascending: true })

  const items = (itemsData || []) as InvoiceItem[]

  // Calculate display status
  const displayStatus = getInvoiceDisplayStatus({
    status: normalizedInvoice.status,
    due_date: normalizedInvoice.due_date
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const canEdit = normalizedInvoice.status === 'draft'
  const canSendEmail = normalizedInvoice.clients?.email && normalizedInvoice.status !== 'paid'
  const canMarkAsPaid = normalizedInvoice.status === 'sent' || displayStatus === 'overdue'
  const isOverdue = displayStatus === 'overdue'
  const daysOverdue = isOverdue 
    ? Math.floor((new Date().getTime() - new Date(normalizedInvoice.due_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // ✅ AI Prediction should show for "sent" and "overdue" invoices
  const showAIPrediction = normalizedInvoice.status === 'sent' || displayStatus === 'overdue'

  return (
    <div className="space-y-6">
      {/* Header with Fixed Button Positions */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link href="/dashboard/invoices">
            <Button variant="outline" size="sm" className="mb-3">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 break-words">{normalizedInvoice.invoice_number}</h1>
          <p className="text-sm text-gray-500 break-words">
            Invoice for {normalizedInvoice.clients?.name || 'Unknown Client'}
          </p>
        </div>

        <div className="flex-shrink-0 flex flex-wrap gap-2 justify-end">
          {canEdit && (
            <Link href={`/dashboard/invoices/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
          
          <a 
            href={`/api/download-invoice?id=${id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
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
      <div className="flex items-center gap-3">
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(displayStatus)}`}>
          {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
        </span>
        {isOverdue && (
          <span className="text-sm text-red-600 font-medium">
            {daysOverdue} days overdue
          </span>
        )}
      </div>

      {/* ✅ AI PAYMENT PREDICTION - Shows for Sent/Overdue invoices */}
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

      {/* Invoice Details - Full Width */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Client Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
            <p className="text-base font-semibold text-gray-900 break-words">{normalizedInvoice.clients?.name || 'N/A'}</p>
            {normalizedInvoice.clients?.company && (
              <p className="text-sm text-gray-600 break-words">{normalizedInvoice.clients.company}</p>
            )}
            {normalizedInvoice.clients?.email && (
              <p className="text-sm text-gray-600 break-words">{normalizedInvoice.clients.email}</p>
            )}
            {normalizedInvoice.clients?.address && (
              <p className="text-sm text-gray-600 whitespace-pre-line break-words">{normalizedInvoice.clients.address}</p>
            )}
          </div>

          {/* Invoice Info */}
          <div className="text-right">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Invoice Details</h3>
            <div className="space-y-1">
              <div className="flex justify-end gap-2">
                <span className="text-sm text-gray-600">Invoice #:</span>
                <span className="text-sm font-semibold text-gray-900">{normalizedInvoice.invoice_number}</span>
              </div>
              <div className="flex justify-end gap-2">
                <span className="text-sm text-gray-600">Issue Date:</span>
                <span className="text-sm font-semibold text-gray-900">{formatDate(normalizedInvoice.issue_date)}</span>
              </div>
              <div className="flex justify-end gap-2">
                <span className="text-sm text-gray-600">Due Date:</span>
                <span className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDate(normalizedInvoice.due_date)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 break-words">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 mt-6 pt-6">
          <div className="flex flex-col items-end space-y-2">
            <div className="flex justify-between w-64">
              <span className="text-sm text-gray-600">Subtotal:</span>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(normalizedInvoice.subtotal)}</span>
            </div>
            <div className="flex justify-between w-64">
              <span className="text-sm text-gray-600">Tax:</span>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(normalizedInvoice.tax_amount)}</span>
            </div>
            <div className="flex justify-between w-64 pt-2 border-t border-gray-200">
              <span className="text-lg font-bold text-gray-900">Total:</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(normalizedInvoice.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {normalizedInvoice.notes && (
          <div className="border-t border-gray-200 mt-6 pt-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notes</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line break-words">{normalizedInvoice.notes}</p>
          </div>
        )}
      </Card>

      {/* Follow-Up History */}
      {normalizedInvoice.last_followed_up && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Follow-Up History</h3>
          <p className="text-sm text-gray-600">
            Last reminder sent on {formatDate(normalizedInvoice.last_followed_up)}
          </p>
        </Card>
      )}
    </div>
  )
}