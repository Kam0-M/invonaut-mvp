import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Plus, FileCheck, Lock, CheckCircle2, Clock, FileText, AlertTriangle } from 'lucide-react'
import ViewOnlyBanner from '@/components/view-only-banner'
import ContractStatusBadge from '@/components/contracts/contract-status-badge'

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

function formatCompact(n: number): string {
  if (n >= 999_500) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000)  return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
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
    .select('stripe_subscription_id, subscription_status')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription = !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')

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
  const expiringCount = contracts.filter(c => {
    if (!c.end_date) return false
    const days = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000)
    return days >= 0 && days <= 14
  }).length
  const totalValue = contracts.reduce((s, c) => s + Number(c.total_value || 0), 0)

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
          style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }} />

        <div className="relative z-10 p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Contracts</h1>
              </div>
              <p className="text-white/50 font-medium text-sm mt-1">
                {contracts.length === 0
                  ? 'Create contracts from templates and get them signed without leaving Invonaut'
                  : `${contracts.length} contract${contracts.length !== 1 ? 's' : ''} · ${formatCompact(totalValue)} total value`}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              {hasActiveSubscription ? (
                <Link href="/dashboard/contracts/new"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm hover:shadow-lg hover:scale-[1.02] transition-all w-full sm:w-auto">
                  <Plus className="w-4 h-4" />New Contract
                </Link>
              ) : (
                <button disabled className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white/40 font-bold text-sm cursor-not-allowed w-full sm:w-auto">
                  <Lock className="w-4 h-4" />New Contract
                </button>
              )}
              {expiringCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs text-amber-400 font-bold">{expiringCount} expiring within 14 days</span>
                </div>
              )}
            </div>
          </div>

          {contracts.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-8 pt-8 border-t border-white/[0.08]">
              {[
                { label: 'Active',    value: String(activeCount),   icon: CheckCircle2, color: 'text-green-400' },
                { label: 'Expiring',  value: String(expiringCount), icon: AlertTriangle, color: 'text-amber-400' },
                { label: 'Total',     value: String(contracts.length), icon: FileCheck,  color: 'text-blue-400' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <s.icon className={`w-4 h-4 ${s.color} flex-shrink-0`} />
                  <div>
                    <p className={`text-lg font-black ${s.color} leading-none`}>{s.value}</p>
                    <p className="text-xs text-white/40 font-medium mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!hasActiveSubscription && <ViewOnlyBanner />}

      {contracts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-600 to-teal-500" />
          <div className="p-12 sm:p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-6">
              <FileCheck className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">No contracts yet</h3>
            <p className="text-gray-500 font-medium max-w-md mx-auto mb-2">
              {hasActiveSubscription
                ? 'Create a contract from a professional template, send it with a single link, and your client signs directly — no DocuSign needed. Invonaut watches for expiry dates and reminds both parties automatically.'
                : 'Subscribe to create contracts with legally-binding e-signatures built in.'}
            </p>
            <p className="text-sm text-gray-400 mb-8">Automatic reminders at 30, 15, 7, and 1 day before expiry.</p>
            {hasActiveSubscription ? (
              <Link href="/dashboard/contracts/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold hover:shadow-lg hover:scale-[1.02] transition-all">
                <Plus className="w-5 h-5" />Create Your First Contract
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
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider hidden sm:table-cell">Value</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider hidden lg:table-cell">Created</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contracts.map(contract => (
                  <tr key={contract.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 text-sm truncate max-w-[200px]">{contract.title}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{(contract.clients as any)?.name ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{templateLabels[contract.template_type] ?? contract.template_type}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700 hidden sm:table-cell">{contract.total_value ? formatCurrency(Number(contract.total_value)) : '—'}</td>
                    <td className="px-6 py-4"><ContractStatusBadge status={contract.status} /></td>
                    <td className="px-6 py-4 text-sm text-gray-400 hidden lg:table-cell">{formatDate(contract.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/contracts/${contract.id}`}
                        className="text-blue-600 hover:text-blue-700 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
