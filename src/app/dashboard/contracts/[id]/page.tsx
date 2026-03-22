import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Calendar, DollarSign, User } from 'lucide-react'
import ContractStatusBadge from '@/components/contracts/contract-status-badge'
import ContractActions from '@/components/contracts/contract-actions'
import ContractInvoiceLinker from '@/components/contracts/contract-invoice-linker'

type LinkedInvoice = {
  invoice_id: string
  link_type: string
  invoices: { id: string; invoice_number: string; total_amount: number; status: string } | null
}

type ClauseBlock = {
  title: string
  content: string
  category: string
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

const templateLabels: Record<string, string> = {
  service_agreement: 'Service Agreement', nda: 'NDA',
  project_proposal: 'Project Proposal', retainer: 'Retainer',
  work_for_hire: 'Work for Hire', subcontractor: 'Subcontractor', custom: 'Custom',
}

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: contract, error } = await supabase
    .from('contracts')
    .select(`
      id, title, status, template_type, content, client_id,
      total_value, start_date, end_date, created_at, updated_at,
      clients(id, name, email, company)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !contract) redirect('/dashboard/contracts')

  const clientData = Array.isArray(contract.clients) ? contract.clients[0] : contract.clients

  // Linked invoices
  const { data: linkedInvoicesRaw } = await supabase
    .from('contract_invoice_links')
    .select('invoice_id, link_type, invoices(id, invoice_number, total_amount, status)')
    .eq('contract_id', id)

  const linkedInvoices: LinkedInvoice[] = (linkedInvoicesRaw ?? []).map((l: any) => ({
    invoice_id: l.invoice_id,
    link_type: l.link_type,
    invoices: Array.isArray(l.invoices) ? l.invoices[0] ?? null : l.invoices ?? null,
  }))

  // All user invoices for the link picker (filtered to this client)
  const linkedInvoiceIds = new Set(linkedInvoices.map(l => l.invoice_id))
  const { data: availableInvoicesRaw } = await supabase
    .from('invoices')
    .select('id, invoice_number, total_amount, status')
    .eq('user_id', user.id)
    .eq('client_id', (contract as any).client_id ?? '')
    .order('created_at', { ascending: false })
    .limit(100)

  const availableInvoices = (availableInvoicesRaw ?? []) as {
    id: string; invoice_number: string; total_amount: number; status: string
  }[]

  // Signatures
  const { data: signatures } = await supabase
    .from('contract_signatures')
    .select('signer_name, signer_email, signer_role, signed_at')
    .eq('contract_id', id)
    .order('signed_at', { ascending: true })

  const clauses = (contract.content ?? []) as ClauseBlock[]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link
            href="/dashboard/contracts"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all duration-200 font-bold text-gray-700 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Contracts</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                {contract.title}
              </h1>
              <ContractStatusBadge status={contract.status} />
            </div>
            <p className="text-gray-500 text-sm">
              {templateLabels[contract.template_type] ?? contract.template_type}
              {' · '}Created {formatDate(contract.created_at)}
            </p>
          </div>
        </div>

        {/* Action buttons — client component */}
        <ContractActions
          contractId={id}
          status={contract.status}
          clientEmail={clientData?.email ?? null}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left — clauses */}
        <div className="xl:col-span-2 space-y-4">
          <h2 className="font-black text-gray-900">Contract clauses</h2>
          {clauses.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 text-center text-gray-400 text-sm">
              No clauses in this contract.
            </div>
          ) : (
            <div className="space-y-3">
              {clauses.map((clause, i) => (
                <div key={i} className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-6">
                  <h3 className="font-black text-gray-900 mb-3 text-base">{clause.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {clause.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — metadata sidebar */}
        <div className="space-y-5">

          {/* Contract details */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider">Details</h3>

            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Client</p>
                <Link
                  href={`/dashboard/clients/${clientData?.id}`}
                  className="font-bold text-gray-900 text-sm hover:text-blue-600 transition-colors"
                >
                  {clientData?.name ?? '—'}
                </Link>
                {clientData?.company && (
                  <p className="text-gray-500 text-xs">{clientData.company}</p>
                )}
              </div>
            </div>

            {contract.total_value && (
              <div className="flex items-start gap-3">
                <DollarSign className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Value</p>
                  <p className="font-bold text-gray-900 text-sm">
                    {formatCurrency(Number(contract.total_value))}
                  </p>
                </div>
              </div>
            )}

            {(contract.start_date || contract.end_date) && (
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Period</p>
                  <p className="text-sm text-gray-700">
                    {contract.start_date ? formatDate(contract.start_date) : '—'}
                    {' → '}
                    {contract.end_date ? formatDate(contract.end_date) : 'Ongoing'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Signatures */}
          {signatures && signatures.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-6 space-y-4">
              <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider">Signatures</h3>
              {signatures.map((sig, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs font-black">✓</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{sig.signer_name}</p>
                    <p className="text-gray-500 text-xs">{sig.signer_email}</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Signed {new Date(sig.signed_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Linked invoices — interactive */}
          <ContractInvoiceLinker
            contractId={id}
            linkedInvoices={linkedInvoices}
            availableInvoices={availableInvoices}
          />
        </div>
      </div>
    </div>
  )
}