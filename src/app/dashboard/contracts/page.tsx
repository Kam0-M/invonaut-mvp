import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Plus, FileCheck, Lock, CheckCircle2, Clock, FileText, AlertTriangle, Zap } from 'lucide-react'
import CoreTabBar from '@/components/layout/core-tab-bar'
import ViewOnlyBanner from '@/components/view-only-banner'
import ContractList from '@/components/contracts/contract-list'
import BackToTop from '@/components/ui/back-to-top'

const fmt = (n: number) =>
  fmt(n)

function formatCompact(n: number): string {
  if (n >= 999_500) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000)  return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

const templateLabels: Record<string, string> = {
  service_agreement: 'Service Agreement', nda: 'NDA', project_proposal: 'Project Proposal',
  retainer: 'Retainer', work_for_hire: 'Work for Hire', subcontractor: 'Subcontractor', custom: 'Custom',
}

export default async function ContractsPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_subscription_id, subscription_status, subscription_tier')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription = !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')

  const tier = profile?.subscription_tier ?? 'starter'

  // Check active contract count for Starter
  let activeContractCount = 0
  let contractLimitReached = false
  if (hasActiveSubscription && tier === 'starter') {
    const { count } = await supabase
      .from('contracts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['sent', 'active'])
    activeContractCount = count ?? 0
    contractLimitReached = activeContractCount >= 3
  }

  const { data: contractData } = await supabase
    .from('contracts')
    .select('id, title, status, template_type, total_value, created_at, end_date, clients(name, company)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500)

  const contracts = (contractData ?? []).map((c: any) => ({
    ...c,
    clients: Array.isArray(c.clients) && c.clients.length > 0 ? c.clients[0] : c.clients,
  }))

  const activeCount   = contracts.filter(c => c.status === 'active').length
  const draftCount    = contracts.filter(c => c.status === 'draft').length
  const expiringCount = contracts.filter(c => {
    if (!c.end_date) return false
    const days = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000)
    return days >= 0 && days <= 14
  }).length
  const totalValue = contracts.reduce((s, c) => s + Number(c.total_value || 0), 0)

  return (
    <div className="space-y-6">
      <CoreTabBar />

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contract lifecycle</p>
            {totalValue > 0 && (
              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                {formatCompact(totalValue)} active
              </span>
            )}
          </div>
          {contracts.length > 0 && (
            <div className="flex items-center gap-4">
              {[
                { label: 'Active',   value: String(activeCount),      color: 'text-emerald-600' },
                { label: 'Expiring', value: String(expiringCount),    color: expiringCount > 0 ? 'text-amber-600' : 'text-gray-400' },
                { label: 'Drafts',   value: String(draftCount),       color: draftCount > 0 ? 'text-gray-600' : 'text-gray-400' },
                { label: 'Total',    value: String(contracts.length), color: 'text-gray-900' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className={`text-sm font-black ${s.color}`}>{s.value}</span>
                  <span className="text-xs text-gray-400 font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {expiringCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              {expiringCount} expiring soon
            </div>
          )}
          {!hasActiveSubscription ? (
            <button disabled className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-400 font-bold text-sm cursor-not-allowed">
              <Lock className="w-4 h-4" />New Contract
            </button>
          ) : contractLimitReached ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                3/3 active
              </span>
              <Link href="/dashboard/billing"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl btn-secondary text-sm">
                <Zap className="w-4 h-4" />Upgrade
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {tier === 'starter' && (
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                  {activeContractCount}/3 active
                </span>
              )}
              <Link href="/dashboard/contracts/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-primary text-sm transition-all hover:shadow-md">
                <Plus className="w-4 h-4" />New Contract
              </Link>
            </div>
          )}
        </div>
      </div>

      {!hasActiveSubscription && <ViewOnlyBanner />}

      {contracts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="h-1 inv-animated-bar" />
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <FileCheck className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">No contracts yet</h3>
            <p className="text-sm text-gray-500 font-medium max-w-sm mx-auto mb-6">
              Create a contract from a template, send it with one link, and your client signs directly. Invonaut watches expiry dates and reminds both parties automatically.
            </p>
            {!hasActiveSubscription ? (
              <Link href="/pricing"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-sm transition-all">
                <Lock className="w-4 h-4" />Start Free Trial
              </Link>
            ) : contractLimitReached ? (
              <Link href="/dashboard/billing"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-sm transition-all">
                <Zap className="w-4 h-4" />Upgrade for Unlimited Contracts
              </Link>
            ) : (
              <Link href="/dashboard/contracts/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-sm transition-all hover:shadow-md">
                <Plus className="w-4 h-4" />Create Your First Contract
              </Link>
            )}
          </div>
        </div>
      ) : (
        <ContractList contracts={contracts} />
      )}
      <BackToTop />
    </div>
  )
}