import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Plus, Users, Lock } from 'lucide-react'
import ClientsTable from '@/components/clients/clients-table'
import ViewOnlyBanner from '@/components/view-only-banner'

type Client = {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  address: string | null
  payment_terms: number | null
  created_at?: string
}

export default async function ClientsPage() {
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

  const { data } = await supabase
    .from('clients')
    .select('id, name, email, phone, company, payment_terms, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500)
  
  const clients = (data ?? []) as Client[]
  const clientCount = clients.length

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
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">Clients</h1>
            <p className="text-base sm:text-lg text-gray-600 mt-2 font-medium">
              {clientCount === 0
                ? 'No clients yet'
                : clientCount === 1
                ? '1 client in your network'
                : `${clientCount} clients in your network`}
            </p>
          </div>
        </div>

        {/* Add Client Button - Locked or Active */}
        {hasActiveSubscription ? (
          <Link 
            href="/dashboard/clients/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:scale-105 transition-all duration-200 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add New Client</span>
            <span className="sm:hidden">Add Client</span>
          </Link>
        ) : (
          <button
            disabled
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-200 text-gray-500 font-bold cursor-not-allowed w-full sm:w-auto border-2 border-gray-300"
            title="Subscribe to add clients"
          >
            <Lock className="w-5 h-5" />
            <span className="hidden sm:inline">Add New Client (Locked)</span>
            <span className="sm:hidden">Add Client (Locked)</span>
          </button>
        )}
      </div>

      {/* View-Only Banner (if no subscription) */}
      {!hasActiveSubscription && <ViewOnlyBanner />}

      {/* Empty State or Clients Table */}
      {clients.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 sm:p-16 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <Users className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
            No clients yet
          </h3>
          <p className="text-base text-gray-600 mb-8 font-medium max-w-md mx-auto">
            {hasActiveSubscription 
              ? 'Add your first client to start managing invoices and tracking payments with Invonaut.'
              : 'Subscribe to start adding clients and managing your business.'}
          </p>
          {hasActiveSubscription ? (
            <Link 
              href="/dashboard/clients/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Add Your First Client
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
          <ClientsTable clients={clients} hasActiveSubscription={hasActiveSubscription} />
        </div>
      )}
    </div>
  )
}