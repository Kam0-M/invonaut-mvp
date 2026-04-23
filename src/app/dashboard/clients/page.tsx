import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Plus, Users, Lock, FileText, DollarSign, Building2 } from 'lucide-react'
import ClientsTable from '@/components/clients/clients-table'
import ViewOnlyBanner from '@/components/view-only-banner'

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
    <div className="space-y-0">
      {/* Dark hero header */}
      <div className="relative overflow-hidden rounded-2xl mb-8"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #0D9488 0%, transparent 70%)' }} />

        <div className="relative z-10 p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <Link href="/dashboard"
                className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium transition-colors mb-4">
                <ArrowLeft className="w-4 h-4" />Dashboard
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Clients</h1>
              </div>
              <p className="text-white/50 font-medium text-sm mt-1">
                {clients.length === 0
                  ? 'Add your first client to start tracking work and payments'
                  : `${clients.length} client${clients.length !== 1 ? 's' : ''} · every invoice, payment, and contract links back here`}
              </p>
            </div>
            {hasActiveSubscription ? (
              <Link href="/dashboard/clients/new"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm hover:shadow-lg hover:scale-[1.02] transition-all w-full sm:w-auto">
                <Plus className="w-4 h-4" />Add Client
              </Link>
            ) : (
              <button disabled className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white/40 font-bold text-sm cursor-not-allowed w-full sm:w-auto">
                <Lock className="w-4 h-4" />Add Client
              </button>
            )}
          </div>

          {clients.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-8 pt-8 border-t border-white/[0.08]">
              {[
                { label: 'Total clients',    value: String(clients.length),   icon: Users      },
                { label: 'With company',     value: String(withCompany),       icon: Building2  },
                { label: 'Individual',       value: String(clients.length - withCompany), icon: FileText },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <s.icon className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  <div>
                    <p className="text-lg font-black text-teal-400 leading-none">{s.value}</p>
                    <p className="text-xs text-white/40 font-medium mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!hasActiveSubscription && <ViewOnlyBanner />}

      {clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-teal-500 to-blue-600" />
          <div className="p-12 sm:p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">No clients yet</h3>
            <p className="text-gray-500 font-medium max-w-md mx-auto mb-2">
              {hasActiveSubscription
                ? 'Add your first client — they\'re the foundation of Invonaut. Every invoice you send, every payment you receive, and every contract you sign is linked to a client profile.'
                : 'Subscribe to start managing clients. Every financial relationship lives in one place.'}
            </p>
            <p className="text-sm text-gray-400 mb-8">Client profiles track full invoice history, file storage, and payment analytics.</p>
            {hasActiveSubscription ? (
              <Link href="/dashboard/clients/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold hover:shadow-lg hover:scale-[1.02] transition-all">
                <Plus className="w-5 h-5" />Add Your First Client
              </Link>
            ) : (
              <Link href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold hover:shadow-lg transition-all">
                <Lock className="w-5 h-5" />Start 14-Day Free Trial
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <ClientsTable clients={clients} hasActiveSubscription={hasActiveSubscription} />
        </div>
      )}
    </div>
  )
}
