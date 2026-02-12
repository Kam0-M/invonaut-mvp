import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InvoiceList } from '@/components/invoices/invoice-list'
import { ArrowLeft, Plus, FileText, Lock } from 'lucide-react'
import ViewOnlyBanner from '@/components/view-only-banner'

type Invoice = {
  id: string
  invoice_number: string
  issue_date: string
  due_date: string
  total_amount: number
  status: string
  last_followed_up?: string | null
  clients: {
    name: string
  } | null
}

export default async function InvoicesPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Fetch user profile to check subscription status
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_subscription_id, subscription_status')
    .eq('id', user.id)
    .single()

  // Check if user has active subscription (active OR trialing)
  const hasActiveSubscription = !!profile?.stripe_subscription_id && 
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')

  const { data: allInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, issue_date, due_date, total_amount, status, last_followed_up, clients(name, company)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500)

  // Transform the data to handle clients array from Supabase join
  const invoices: Invoice[] = (allInvoices ?? []).map((inv: any) => ({
    ...inv,
    clients: Array.isArray(inv.clients) && inv.clients.length > 0 
      ? inv.clients[0] 
      : inv.clients
  }))
  
  const invoiceCount = invoices.length

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all duration-200 font-bold text-gray-700 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">Invoices</h1>
            <p className="text-base sm:text-lg text-gray-600 mt-2 font-medium">
              {invoiceCount === 0
                ? 'No invoices yet'
                : invoiceCount === 1
                ? '1 invoice created'
                : `${invoiceCount} invoices created`}
            </p>
          </div>
        </div>

        {/* Create Invoice Button - Locked or Active */}
        {hasActiveSubscription ? (
          <Link 
            href="/dashboard/invoices/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:scale-105 transition-all duration-200 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Create Invoice</span>
            <span className="sm:hidden">Create</span>
          </Link>
        ) : (
          <button
            disabled
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-200 text-gray-500 font-bold cursor-not-allowed w-full sm:w-auto border-2 border-gray-300"
            title="Subscribe to create invoices"
          >
            <Lock className="w-5 h-5" />
            <span className="hidden sm:inline">Create Invoice (Locked)</span>
            <span className="sm:hidden">Create (Locked)</span>
          </button>
        )}
      </div>

      {/* View-Only Banner (if no subscription) */}
      {!hasActiveSubscription && <ViewOnlyBanner />}

      {/* Empty State or Invoice List */}
      {invoices.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 sm:p-16 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <FileText className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
            No invoices yet
          </h3>
          <p className="text-base text-gray-600 mb-8 font-medium max-w-md mx-auto">
            {hasActiveSubscription 
              ? 'Create your first invoice to start tracking payments and managing your business.'
              : 'Subscribe to start creating invoices and managing your business.'}
          </p>
          {hasActiveSubscription ? (
            <Link 
              href="/dashboard/invoices/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Create Your First Invoice
            </Link>
          ) : (
            <Link 
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              <Lock className="w-5 h-5" />
              Start 14-Day Free Trial
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <InvoiceList invoices={invoices} hasActiveSubscription={hasActiveSubscription} />
        </div>
      )}
    </div>
  )
}