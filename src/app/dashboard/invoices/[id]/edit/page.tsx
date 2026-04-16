import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditInvoiceForm from '@/components/invoices/edit-invoice-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import SubscriptionRequired from '@/components/subscription-required'

export default async function EditInvoicePage({
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

  // Check subscription status BEFORE loading invoice
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_subscription_id, subscription_status')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription = !!profile?.stripe_subscription_id && 
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')

  // GATE: Show subscription required if no active subscription
  if (!hasActiveSubscription) {
    return <SubscriptionRequired />
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(
      `
      *,
      clients (id, name, email, company),
      invoice_items (*)
    `
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (invoiceError || !invoice) {
    redirect('/dashboard/invoices')
  }

  if (invoice.status !== 'draft') {
    redirect(`/dashboard/invoices/${id}`)
  }

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, company')
    .eq('user_id', user.id)
    .order('name')

  const { data: categories } = await supabase
    .from('revenue_categories')
    .select('id, name, color')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link 
            href={`/dashboard/invoices/${id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all duration-200 font-bold text-gray-700 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Invoice</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">Edit Invoice</h1>
            <p className="text-base sm:text-lg text-gray-600 mt-2 font-medium">
              Update invoice {invoice.invoice_number}
            </p>
          </div>
        </div>
      </div>

      {/* Premium Form Card */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-10 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
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