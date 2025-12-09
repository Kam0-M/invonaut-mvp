import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { InvoiceActions } from './invoice-actions'

type InvoiceDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

type InvoiceData = {
  id: string
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issue_date: string
  due_date: string
  subtotal: number
  tax_amount: number
  total_amount: number
  notes: string | null
  client: {
    id: string
    name: string
    email: string | null
    phone: string | null
    company: string | null
    address: string | null
  }
  user_profile: {
    full_name: string | null
    email: string | null
    business_name: string | null
    address: string | null
  }
  items: Array<{
    id?: string
    description: string
    quantity: number
    unit_price: number
    total: number
  }>
}

// Format currency as USD
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Format date as "Jan 15, 2024"
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Get status badge styling
const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    case 'sent':
      return 'bg-blue-100 text-blue-800'
    case 'paid':
      return 'bg-green-100 text-green-800'
    case 'overdue':
      return 'bg-red-100 text-red-800'
    case 'cancelled':
      return 'bg-gray-100 text-gray-600'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Fetch invoice with client info
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      status,
      issue_date,
      due_date,
      subtotal,
      tax_amount,
      total_amount,
      notes,
      client_id,
      clients (
        id,
        name,
        email,
        phone,
        company,
        address
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (invoiceError || !invoice) {
    redirect('/dashboard/invoices')
  }

  // Fetch invoice items
  const { data: items, error: itemsError } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id)
    .order('created_at', { ascending: true })

  if (itemsError) {
    redirect('/dashboard/invoices')
  }

  // Fetch user profile for business info
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('full_name, email, business_name, address')
    .eq('id', user.id)
    .single()

  const invoiceData: InvoiceData = {
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    status: invoice.status,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    subtotal: Number(invoice.subtotal),
    tax_amount: Number(invoice.tax_amount),
    total_amount: Number(invoice.total_amount),
    notes: invoice.notes,
    client: (invoice.clients as any) || {
      id: '',
      name: 'Unknown Client',
      email: null,
      phone: null,
      company: null,
      address: null
    },
    user_profile: userProfile || {
      full_name: null,
      email: null,
      business_name: null,
      address: null
    },
    items: items || []
  }

  return (
    <div className="space-y-6 print:p-0">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invoices
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoice</h1>
            <p className="text-sm text-gray-600 mt-1">{invoiceData.invoice_number}</p>
          </div>
        </div>
        <InvoiceActions invoiceId={invoiceData.id} currentStatus={invoiceData.status} />
      </div>

      {/* Invoice Document */}
      <Card className="p-8 print:shadow-none print:border-0">
        {/* Invoice Header */}
        <div className="mb-8 pb-8 border-b border-gray-200">
          <div className="flex justify-between items-start">
            {/* Business Info (Left) */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {invoiceData.user_profile.business_name || invoiceData.user_profile.full_name || 'Your Business'}
              </h2>
              {invoiceData.user_profile.email && (
                <p className="text-sm text-gray-600">{invoiceData.user_profile.email}</p>
              )}
              {invoiceData.user_profile.address && (
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                  {invoiceData.user_profile.address}
                </p>
              )}
            </div>

            {/* Client Info (Right) */}
            <div className="text-right">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill To:</h3>
              <p className="text-sm font-medium text-gray-900">{invoiceData.client.name}</p>
              {invoiceData.client.company && (
                <p className="text-sm text-gray-600">{invoiceData.client.company}</p>
              )}
              {invoiceData.client.address && (
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                  {invoiceData.client.address}
                </p>
              )}
              {invoiceData.client.email && (
                <p className="text-sm text-gray-600 mt-1">{invoiceData.client.email}</p>
              )}
              {invoiceData.client.phone && (
                <p className="text-sm text-gray-600">{invoiceData.client.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Issue Date</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(invoiceData.issue_date)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Due Date</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(invoiceData.due_date)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Status</p>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(invoiceData.status)}`}>
              {invoiceData.status.charAt(0).toUpperCase() + invoiceData.status.slice(1)}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Invoice #</p>
            <p className="text-sm font-medium text-gray-900">{invoiceData.invoice_number}</p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoiceData.items.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div className="flex justify-end mb-8">
          <div className="w-full md:w-80 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium text-gray-900">{formatCurrency(invoiceData.subtotal)}</span>
            </div>
            {invoiceData.tax_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium text-gray-900">{formatCurrency(invoiceData.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-gray-300">
              <span className="text-gray-900">Total:</span>
              <span className="text-primary">{formatCurrency(invoiceData.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {invoiceData.notes && (
          <div className="pt-8 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line">{invoiceData.notes}</p>
          </div>
        )}
      </Card>
    </div>
  )
}

