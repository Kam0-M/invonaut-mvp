import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Pencil, Mail, Phone, Building2, MapPin, Calendar, FileText, Users } from 'lucide-react'
import { DeleteClientButton } from '@/components/clients/delete-client-button'
import { NotFound } from '@/components/ui/not-found'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/login')
  }

  // Fetch client
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (clientError || !client) {
    return (
      <NotFound
        title="Client Not Found"
        description="The client you're looking for doesn't exist or you don't have permission to view it."
        backLink="/dashboard/clients"
        backText="Back to Clients"
        icon={<Users className="w-12 h-12 text-red-600" />}
      />
    )
  }

  // Fetch invoices for this client
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })

  return (
    <div className="space-y-6">
      {/* Header with Fixed Button Positions */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link href="/dashboard/clients">
            <Button variant="outline" size="sm" className="mb-3">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Clients
            </Button>
          </Link>
        </div>
        
        <div className="flex-shrink-0 flex flex-wrap gap-2">
          <Link href={`/dashboard/clients/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="w-4 h-4 mr-2" />
              Edit Client
            </Button>
          </Link>
          <Link href={`/dashboard/invoices/new?clientId=${id}`}>
            <Button size="sm" className="bg-primary text-white hover:bg-primary/90">
              <FileText className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
          <DeleteClientButton 
            clientId={id} 
            clientName={client.name}
            hasInvoices={invoices ? invoices.length > 0 : false}
          />
        </div>
      </div>

      {/* Client Information Card */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 break-words">
          <span className="text-primary">{client.name}</span> - Client Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Details */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500">Company</p>
                <p className="text-base text-gray-900 break-words">{client.company || '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-base text-gray-900 break-words">{client.email || '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-base text-gray-900 break-words">{client.phone || '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-base text-gray-900 break-words whitespace-pre-line">
                  {client.address || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500">Payment Terms</p>
                <p className="text-base text-gray-900">
                  {client.payment_terms ? `${client.payment_terms} days` : '—'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500">Client Since</p>
                <p className="text-base text-gray-900">{formatDate(client.created_at)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500">Total Invoices</p>
                <p className="text-base text-gray-900">{invoices?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Invoices Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Invoices</h2>
          <Link href={`/dashboard/invoices/new?clientId=${id}`}>
            <Button size="sm" variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </Link>
        </div>

        {!invoices || invoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No invoices yet for this client</p>
            <Link href={`/dashboard/invoices/new?clientId=${id}`}>
              <Button size="sm">Create First Invoice</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Invoice #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {invoices.map((invoice: any) => {
                  const formatCurrency = (amount: number) =>
                    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
                  
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <Link href={`/dashboard/invoices/${invoice.id}`} className="hover:text-primary">
                          {invoice.invoice_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(invoice.issue_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          invoice.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/invoices/${invoice.id}`}>
                          <Button size="sm" variant="outline">View</Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}