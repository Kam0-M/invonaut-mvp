import { createClient }       from '@/lib/supabase/server'
import { redirect }           from 'next/navigation'
import EditInvoiceForm        from '@/components/invoices/edit-invoice-form'
import Link                   from 'next/link'
import SubscriptionRequired   from '@/components/subscription-required'
import { isSubscriptionActive } from '@/lib/subscription-status'
import { FileText }           from 'lucide-react'

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles').select('stripe_subscription_id, subscription_status, trial_end_date')
    .eq('id', user.id).single()

  const hasActiveSubscription = isSubscriptionActive(profile)
  if (!hasActiveSubscription) return <SubscriptionRequired />

  const { data: invoiceData, error } = await supabase
    .from('invoices')
    .select('*, invoice_items(*), revenue_categories(id, name, color)')
    .eq('id', id).eq('user_id', user.id).single()

  if (error || !invoiceData || invoiceData.status !== 'draft') redirect('/dashboard/invoices')

  const invoice = {
    ...invoiceData,
    revenue_categories: Array.isArray(invoiceData.revenue_categories)
      ? (invoiceData.revenue_categories[0] ?? null)
      : invoiceData.revenue_categories,
  }

  const { data: clients } = await supabase
    .from('clients').select('id, name, email, company').eq('user_id', user.id).order('name')

  const { data: categories } = await supabase
    .from('revenue_categories').select('id, name, color').eq('user_id', user.id).order('name')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <Link href={`/dashboard/invoices/${id}`}
          className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors mb-2 block">
          ← {invoice.invoice_number}
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Edit Invoice</h1>
            <p className="text-sm text-gray-400 font-medium">Updating {invoice.invoice_number}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-sm transition-all">
        <EditInvoiceForm
          invoice={invoice}
          invoiceItems={invoice.invoice_items || []}
          clients={clients || []}
          categories={categories || []}
        />
      </div>
    </div>
  )
}