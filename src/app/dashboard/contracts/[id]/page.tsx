import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link             from 'next/link'
import { Calendar, DollarSign, User, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import ContractStatusBadge    from '@/components/contracts/contract-status-badge'
import ContractActions        from '@/components/contracts/contract-actions'
import ContractInvoiceLinker  from '@/components/contracts/contract-invoice-linker'
import DismissRemindersButton from '@/components/contracts/dismiss-reminders-button'
import ContractReview         from '@/components/contracts/contract-review'
import { makeCurrencyFormatter } from '@/lib/context/currency-context'

type LinkedInvoice = {
  invoice_id: string; link_type: string
  invoices: { id: string; invoice_number: string; total_amount: number; status: string } | null
}
type ClauseBlock = { title: string; content: string; category: string }

const fmtDate = (s: string) =>
  new Date(s + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
const fmtShort = (s: string) =>
  new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const TEMPLATE_LABELS: Record<string, string> = {
  service_agreement: 'Service Agreement', nda: 'NDA',
  project_proposal: 'Project Proposal',   retainer: 'Retainer',
  work_for_hire: 'Work for Hire',          subcontractor: 'Subcontractor', custom: 'Custom',
}

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles').select('subscription_tier').eq('id', user.id).single()
  const fmt = makeCurrencyFormatter((profile as any)?.currency || \'USD\')
  const subscriptionTier = profile?.subscription_tier ?? 'starter'
  const isPro = subscriptionTier === 'professional' || subscriptionTier === 'business'

  const { data: contract, error } = await supabase
    .from('contracts')
    .select(`id, title, status, template_type, content, client_id,
             total_value, start_date, end_date, expiry_date,
             reminders_dismissed, created_at, updated_at,
             clients(id, name, email, company)`)
    .eq('id', id).eq('user_id', user.id).single()

  if (error || !contract) redirect('/dashboard/contracts')

  const clientData = Array.isArray((contract as any).clients)
    ? (contract as any).clients[0] : (contract as any).clients

  const { data: linkedRaw } = await supabase
    .from('contract_invoice_links')
    .select('invoice_id, link_type, invoices(id, invoice_number, total_amount, status)')
    .eq('contract_id', id)
  const linkedInvoices: LinkedInvoice[] = (linkedRaw ?? []).map((l: any) => ({
    invoice_id: l.invoice_id, link_type: l.link_type,
    invoices: Array.isArray(l.invoices) ? l.invoices[0] ?? null : l.invoices ?? null,
  }))

  const { data: availableRaw } = await supabase
    .from('invoices').select('id, invoice_number, total_amount, status')
    .eq('user_id', user.id).eq('client_id', (contract as any).client_id ?? '')
    .order('created_at', { ascending: false }).limit(100)
  const availableInvoices = (availableRaw ?? []) as any[]

  const { data: signatures } = await supabase
    .from('contract_signatures')
    .select('signer_name, signer_email, signer_role, signed_at')
    .eq('contract_id', id).order('signed_at', { ascending: true })

  const clauses = ((contract as any).content ?? []) as ClauseBlock[]

  const now           = new Date()
  const expiryDate    = (contract as any).expiry_date ? new Date((contract as any).expiry_date + 'T12:00:00') : null
  const daysToExpiry  = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / 86_400_000) : null
  const isExpiringSoon = daysToExpiry !== null && daysToExpiry <= 14 && daysToExpiry >= 0
  const isUrgent       = daysToExpiry !== null && daysToExpiry <= 7  && daysToExpiry >= 0

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/dashboard/contracts"
            className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors mb-2 block">
            ← Contracts
          </Link>
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-2xl font-black text-gray-900">{contract.title}</h1>
            <ContractStatusBadge status={contract.status} />
          </div>
          <p className="text-sm text-gray-400 font-medium">
            {TEMPLATE_LABELS[contract.template_type] ?? contract.template_type}
            {' · '}Created {fmtShort(contract.created_at)}
          </p>
        </div>
        <ContractActions contractId={id} status={contract.status}
          clientEmail={clientData?.email ?? null}
          expiryDate={(contract as any).expiry_date ?? null} />
      </div>

      {/* Expiry warning */}
      {(isExpiringSoon || isUrgent) && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold ${
          isUrgent ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          {isUrgent ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> : <Clock className="w-4 h-4 flex-shrink-0" />}
          {daysToExpiry === 0 ? 'Expires today' : `Expires in ${daysToExpiry} day${daysToExpiry !== 1 ? 's' : ''}`}
          {expiryDate && <span className="font-medium opacity-70">— {fmtShort((contract as any).expiry_date)}</span>}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Left — clauses */}
        <div className="xl:col-span-2 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Contract Clauses · {clauses.length} section{clauses.length !== 1 ? 's' : ''}
          </p>
          {clauses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <p className="text-sm text-gray-400 font-medium">No clauses in this contract.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clauses.map((clause, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <h3 className="text-sm font-black text-gray-900">{clause.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line pl-7">{clause.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">

          {/* Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 hover:shadow-sm transition-all">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Details</p>

            {/* Client */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Client</p>
                {clientData ? (
                  <Link href={`/dashboard/clients/${clientData.id}`}
                    className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    {clientData.name}
                  </Link>
                ) : <p className="text-sm font-bold text-gray-400">—</p>}
                {clientData?.company && <p className="text-xs text-gray-400">{clientData.company}</p>}
              </div>
            </div>

            {/* Value */}
            {contract.total_value && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Value</p>
                  <p className="text-sm font-black text-gray-900">{fmt(Number(contract.total_value))}</p>
                </div>
              </div>
            )}

            {/* Period */}
            {((contract as any).start_date || (contract as any).end_date) && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Period</p>
                  <p className="text-xs text-gray-700 font-medium">
                    {(contract as any).start_date ? fmtShort((contract as any).start_date) : '—'}
                    {' → '}
                    {(contract as any).end_date ? fmtShort((contract as any).end_date) : 'Ongoing'}
                  </p>
                </div>
              </div>
            )}

            {/* Expiry */}
            {expiryDate && (
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isUrgent ? 'bg-red-50' : isExpiringSoon ? 'bg-amber-50' : 'bg-gray-50'}`}>
                  <Calendar className={`w-4 h-4 ${isUrgent ? 'text-red-500' : isExpiringSoon ? 'text-amber-500' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Expires</p>
                  <p className={`text-sm font-bold ${isUrgent ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-gray-900'}`}>
                    {fmtShort((contract as any).expiry_date)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Signatures */}
          {signatures && signatures.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 hover:shadow-sm transition-all">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Signatures · {signatures.length}
              </p>
              {signatures.map((sig: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{sig.signer_name}</p>
                    <p className="text-xs text-gray-400">{sig.signer_email}</p>
                    <p className="text-[10px] text-gray-300 font-medium mt-0.5">
                      Signed {new Date(sig.signed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Linked invoices */}
          <ContractInvoiceLinker contractId={id}
            linkedInvoices={linkedInvoices} availableInvoices={availableInvoices} />

          {/* Reminders */}
          {(contract as any).expiry_date && contract.status === 'active' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 hover:shadow-sm transition-all">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reminders</p>
              {!(contract as any).reminders_dismissed && (
                <p className="text-xs text-gray-500 leading-relaxed">
                  Invonaut emails you at 30, 15, 7, and 1 day before this contract expires.
                </p>
              )}
              <DismissRemindersButton contractId={id} isDismissed={!!(contract as any).reminders_dismissed} />
            </div>
          )}

          {/* AI Review */}
          <ContractReview contractId={id} isPro={isPro} />
        </div>
      </div>
    </div>
  )
}