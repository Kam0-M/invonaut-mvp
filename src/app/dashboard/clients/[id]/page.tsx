import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Pencil, Mail, Phone, Building2, MapPin, Calendar, FileText } from 'lucide-react'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !client) {
    redirect('/dashboard/clients')
  }

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, total_amount, status, due_date, created_at')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  const invoiceCount = invoices?.length || 0
  const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0

  return (
    <div className="space-y-8">
      {/* Premium Header */}
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
        <div className="flex flex-col sm:flex-row gap-3">
          <Link 
            href={`/dashboard/clients/${id}/edit`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:scale-105 transition-all duration-200"
          >
            <Pencil className="w-4 h-4" />
            Edit Client
          </Link>
        </div>
      </div>

      {/* Client Info Card */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-10 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
        <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Email */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-1">Email</p>
              <p className="text-base font-medium text-gray-900 break-all">
                {client.email || 'Not provided'}
              </p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-1">Phone</p>
              <p className="text-base font-medium text-gray-900">
                {client.phone || 'Not provided'}
              </p>
            </div>
          </div>

          {/* Company */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-1">Company</p>
              <p className="text-base font-medium text-gray-900">
                {client.company || 'Not provided'}
              </p>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-1">Payment Terms</p>
              <p className="text-base font-medium text-gray-900">
                {client.payment_terms || 30} days
              </p>
            </div>
          </div>

          {/* Address - Full Width */}
          <div className="md:col-span-2 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-1">Address</p>
              <p className="text-base font-medium text-gray-900 whitespace-pre-wrap">
                {client.address || 'Not provided'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Stats */}
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

        <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
              <span className="text-3xl font-black text-green-600">$</span>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-gray-500">Total Revenue</p>
              <p className="text-4xl font-black text-gray-900 tracking-tight">
                ${totalRevenue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices List */}
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
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium text-gray-600">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link 
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
                      >
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
    </div>
  )
}