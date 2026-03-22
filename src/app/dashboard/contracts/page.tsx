import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Plus, FileText, Lock } from 'lucide-react'
import ViewOnlyBanner from '@/components/view-only-banner'
import ContractStatusBadge from '@/components/contracts/contract-status-badge'

type Contract = {
  id: string
  title: string
  status: string
  template_type: string
  total_value: number | null
  created_at: string
  clients: { name: string; company: string | null } | null
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

const templateLabels: Record<string, string> = {
  service_agreement: 'Service Agreement',
  nda: 'NDA',
  project_proposal: 'Project Proposal',
  retainer: 'Retainer',
  work_for_hire: 'Work for Hire',
  subcontractor: 'Subcontractor',
  custom: 'Custom',
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

  const hasActiveSubscription =
    !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')

  const { data: contractData } = await supabase
    .from('contracts')
    .select('id, title, status, template_type, total_value, created_at, clients(name, company)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500)

  const contracts: Contract[] = (contractData ?? []).map((c: any) => ({
    ...c,
    clients: Array.isArray(c.clients) && c.clients.length > 0 ? c.clients[0] : c.clients,
  }))

  const contractCount = contracts.length

  return (
    <div className="space-y-8">
      {/* Header */}
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
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">Contracts</h1>
            <p className="text-base sm:text-lg text-gray-600 mt-2 font-medium">
              {contractCount === 0
                ? 'No contracts yet'
                : contractCount === 1
                ? '1 contract'
                : `${contractCount} contracts`}
            </p>
          </div>
        </div>

        {hasActiveSubscription ? (
          <Link
            href="/dashboard/contracts/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:scale-105 transition-all duration-200 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Contract</span>
            <span className="sm:hidden">New</span>
          </Link>
        ) : (
          <button
            disabled
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-200 text-gray-500 font-bold cursor-not-allowed w-full sm:w-auto border-2 border-gray-300"
          >
            <Lock className="w-5 h-5" />
            <span className="hidden sm:inline">New Contract (Locked)</span>
            <span className="sm:hidden">Locked</span>
          </button>
        )}
      </div>

      {!hasActiveSubscription && <ViewOnlyBanner />}

      {/* Empty state */}
      {contracts.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 sm:p-16 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <FileText className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">No contracts yet</h3>
          <p className="text-base text-gray-600 mb-8 font-medium max-w-md mx-auto">
            {hasActiveSubscription
              ? 'Create your first contract from a professional template. Clients sign directly from their portal — no DocuSign needed.'
              : 'Subscribe to start creating contracts with legally binding e-signatures.'}
          </p>
          {hasActiveSubscription ? (
            <Link
              href="/dashboard/contracts/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Create Your First Contract
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
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {contracts.map(contract => (
                  <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 text-sm truncate max-w-[200px]">
                        {contract.title}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {contract.clients?.name ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {templateLabels[contract.template_type] ?? contract.template_type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      {contract.total_value ? formatCurrency(Number(contract.total_value)) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <ContractStatusBadge status={contract.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(contract.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/contracts/${contract.id}`}
                        className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                      >
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