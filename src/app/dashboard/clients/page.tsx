import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Plus, Users, Lock, Building2 } from 'lucide-react'
import ClientsTable from '@/components/clients/clients-table'
import ViewOnlyBanner from '@/components/view-only-banner'
import BackToTop from '@/components/ui/back-to-top'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_subscription_id, subscription_status')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription = !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')

  const { data } = await supabase
    .from('clients')
    .select('id, name, email, phone, company, payment_terms, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500)

  const clients = (data ?? []) as any[]
  const withCompany = clients.filter(c => c.company).length

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-[#0055FF] uppercase tracking-widest inv-overline mb-1">Clients</p>
          {clients.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-gray-900">{clients.length}</span>
                <span className="text-xs text-gray-400 font-medium">Total</span>
              </div>
              {withCompany > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-teal-600">{withCompany}</span>
                  <span className="text-xs text-gray-400 font-medium">With company</span>
                </div>
              )}
            </div>
          )}
        </div>
        {hasActiveSubscription ? (
          <Link href="/dashboard/clients/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-secondary rounded-xl text-sm transition-all hover:shadow-md">
            <Plus className="w-4 h-4" />Add Client
          </Link>
        ) : (
          <button disabled className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-400 font-bold text-sm cursor-not-allowed">
            <Lock className="w-4 h-4" />Add Client
          </button>
        )}
      </div>

      {!hasActiveSubscription && <ViewOnlyBanner />}

      {clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-teal-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">No clients yet</h3>
            <p className="text-sm text-gray-500 font-medium max-w-sm mx-auto mb-6">
              Every invoice, payment, and contract in Invonaut links back to a client. Add your first one to get started.
            </p>
            {hasActiveSubscription ? (
              <Link href="/dashboard/clients/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-secondary rounded-xl text-sm transition-all hover:shadow-md">
                <Plus className="w-4 h-4" />Add Your First Client
              </Link>
            ) : (
              <Link href="/pricing"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary rounded-xl text-sm transition-all">
                <Lock className="w-4 h-4" />Start Free Trial
              </Link>
            )}
          </div>
        </div>
      ) : (
        <ClientsTable clients={clients} hasActiveSubscription={hasActiveSubscription} />
      )}
      <BackToTop />
    </div>
  )
}