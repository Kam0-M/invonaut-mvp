import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Mail, Phone, Building2, MapPin, Calendar, FileText } from 'lucide-react'
import { InvoiceRow } from '@/components/invoices/invoice-row'

type Client = {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  address: string | null
  payment_terms: number | null
  created_at: string
}

type Invoice = {
  id: string
  invoice_number: string
  status: string
  total_amount: number
  due_date: string
  created_at: string
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (clientError || !client) {
    redirect('/dashboard/clients')
  }

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, total_amount, due_date, created_at')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  const clientInvoices = (invoices ?? []) as Invoice[]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{client.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Client since {new Date(client.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/invoices/new?clientId=${client.id}`}>
            <Button className="bg-primary text-white hover:bg-primary/90">
              <FileText className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
          <Link href="/dashboard/clients">
            <Button variant="outline">
              Back to Clients
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Client Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {client.company && (
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Company</p>
                <p className="text-sm text-slate-900">{client.company}</p>
              </div>
            </div>
          )}
          
          {client.email && (
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Email</p>
                <p className="text-sm text-slate-900">{client.email}</p>
              </div>
            </div>
          )}
          
          {client.phone && (
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Phone</p>
                <p className="text-sm text-slate-900">{client.phone}</p>
              </div>
            </div>
          )}
          
          {client.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Address</p>
                <p className="text-sm text-slate-900">{client.address}</p>
              </div>
            </div>
          )}
          
          {client.payment_terms && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Payment Terms</p>
                <p className="text-sm text-slate-900">{client.payment_terms} days</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Invoices ({clientInvoices.length})
        </h2>
        
        {clientInvoices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500 mb-4">No invoices yet for this client</p>
            <Link href={`/dashboard/invoices/new?clientId=${client.id}`}>
              <Button className="bg-primary text-white hover:bg-primary/90">
                Create First Invoice
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {clientInvoices.map(invoice => (
                  <InvoiceRow
                    key={invoice.id}
                    id={invoice.id}
                    invoiceNumber={invoice.invoice_number}
                    status={invoice.status}
                    totalAmount={invoice.total_amount}
                    dueDate={invoice.due_date}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}