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
        <div className="space-y-2">
          {contracts.map((contract, idx) => {
            const clientName = (contract.clients as any)?.name ?? 'No client'
            const value = contract.total_value ? Number(contract.total_value) : null
            const expiryDate = contract.expiry_date
              ? new Date(contract.expiry_date + 'T12:00:00') : null
            const now = new Date()
            const daysToExpiry = expiryDate
              ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              : null

            const isExpiringSoon = daysToExpiry !== null && daysToExpiry <= 14 && daysToExpiry >= 0
            const isExpired      = daysToExpiry !== null && daysToExpiry < 0

            // Status config
            const statusCfg: Record<string, { pill: string; dot: string; label: string }> = {
              draft:     { pill: 'bg-gray-100 text-gray-600 border border-gray-200',         dot: 'bg-gray-400',    label: 'Draft'     },
              sent:      { pill: 'bg-blue-50 text-blue-700 border border-blue-200',           dot: 'bg-blue-500',    label: 'Sent'      },
              active:    { pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200',  dot: 'bg-emerald-500', label: 'Active'    },
              expired:   { pill: 'bg-gray-100 text-gray-500 border border-gray-200',          dot: 'bg-gray-400',    label: 'Expired'   },
              completed: { pill: 'bg-teal-50 text-teal-700 border border-teal-200',           dot: 'bg-teal-500',    label: 'Completed' },
            }
            const cfg = statusCfg[contract.status] ?? statusCfg.draft

            // Avatar
            const letters = clientName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
            const avatarColors = [
              { bg: 'bg-purple-100', text: 'text-purple-700' },
              { bg: 'bg-blue-100',   text: 'text-blue-700'   },
              { bg: 'bg-teal-100',   text: 'text-teal-700'   },
              { bg: 'bg-amber-100',  text: 'text-amber-700'  },
            ]
            let hash = 0
            for (let i = 0; i < clientName.length; i++) hash = clientName.charCodeAt(i) + ((hash << 5) - hash)
            const av = avatarColors[Math.abs(hash) % avatarColors.length]

            return (
              <div
                key={contract.id}
                className="inv-row-in relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm ${av.bg} ${av.text}`}>
                    {letters}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-gray-900 truncate">{contract.title}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cfg.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      {/* Expiry warning pill */}
                      {isExpiringSoon && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                          <Clock className="w-2.5 h-2.5" />
                          {daysToExpiry === 0 ? 'Expires today' : `${daysToExpiry}d left`}
                        </span>
                      )}
                      {daysToExpiry !== null && daysToExpiry <= 7 && daysToExpiry >= 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Urgent
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm text-gray-600 font-medium">{clientName}</span>
                      <span className="text-gray-200 text-xs">·</span>
                      <span className="text-xs text-gray-400">{templateLabels[contract.template_type] ?? contract.template_type}</span>
                    </div>
                  </div>

                  {/* Expiry date */}
                  {expiryDate && (
                    <div className="hidden sm:flex flex-col items-end flex-shrink-0 min-w-[90px]">
                      <span className={`text-xs font-bold ${isExpiringSoon ? 'text-amber-500' : isExpired ? 'text-gray-400' : 'text-gray-500'}`}>
                        {isExpired ? 'Expired' : `Expires ${expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                      </span>
                      {!isExpired && <span className="text-[10px] text-gray-300 mt-0.5">{expiryDate.toLocaleDateString('en-US', { year: 'numeric' })}</span>}
                    </div>
                  )}

                  {/* Value */}
                  <div className="flex-shrink-0 text-right min-w-[80px]">
                    {value ? (
                      <span className="text-base font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                        {formatCompact(value)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-300 font-medium">—</span>
                    )}
                  </div>

                  {/* View arrow */}
                  <div className="flex-shrink-0">
                    <span className="text-xs font-bold text-gray-300 group-hover:text-blue-500 transition-colors">View →</span>
                  </div>
                </div>

                <Link href={`/dashboard/contracts/${contract.id}`} className="absolute inset-0 rounded-2xl" aria-label={`View contract ${contract.title}`} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
