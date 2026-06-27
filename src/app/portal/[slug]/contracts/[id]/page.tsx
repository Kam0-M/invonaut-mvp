import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Lock, Clock } from 'lucide-react'
import ContractSigningForm from '@/components/contracts/contract-signing-form'
import { isSubscriptionActive } from '@/lib/subscription-status'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

type ClauseBlock = { title: string; content: string; category: string }

function PortalHeader({
  brandColor, logoUrl, businessName,
}: { brandColor: string; logoUrl: string | null; businessName: string }) {
  return (
    <header
      className="w-full py-4 px-6 flex items-center justify-between"
      style={{ backgroundColor: brandColor }}
    >
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <img src={logoUrl} alt={businessName} className="w-8 h-8 rounded object-contain bg-white/10" />
        ) : (
          <span className="text-white font-black text-sm truncate max-w-[200px]">{businessName}</span>
        )}
      </div>
      <span className="text-white/60 text-xs">Powered by Invonaut</span>
    </header>
  )
}

function ErrorCard({
  brandColor, logoUrl, businessName, title, body,
}: { brandColor?: string; logoUrl?: string | null; businessName?: string; title: string; body: string }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {brandColor && businessName !== undefined && (
        <PortalHeader brandColor={brandColor} logoUrl={logoUrl ?? null} businessName={businessName} />
      )}
      <div className="flex items-center justify-center py-24 px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
          <div className="flex justify-center mb-4 text-gray-400">
            <Lock className="w-10 h-10" />
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  )
}

function AlreadySigned({
  brandColor, logoUrl, businessName, contractTitle,
}: { brandColor: string; logoUrl: string | null; businessName: string; contractTitle: string }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader brandColor={brandColor} logoUrl={logoUrl} businessName={businessName} />
      <div className="flex items-center justify-center py-24 px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Contract signed.</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            <span className="font-semibold text-gray-700">"{contractTitle}"</span>{' '}
            has been signed. A copy will be sent by email.
          </p>
        </div>
      </div>
      <footer className="text-center text-xs text-gray-400 py-8">
        Powered by Invonaut · From contract to cash. Automated.
      </footer>
    </div>
  )
}

export default async function PortalContractPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { slug, id: contractId } = await params
  const { token } = await searchParams
  const supabase = createAdminClient()

  // 1. Resolve portal
  const { data: portalRow } = await supabase
    .from('portal_settings')
    .select('user_id, is_enabled')
    .eq('slug', slug)
    .maybeSingle()

  if (!portalRow) {
    return <ErrorCard title="Portal not found." body="This link is invalid. Contact the business directly." />
  }

  // 2. Owner branding
  const { data: ownerProfile } = await supabase
    .from('user_profiles')
    .select('business_name, full_name, logo_url, brand_color, subscription_tier, stripe_subscription_id, subscription_status, trial_end_date')
    .eq('id', portalRow.user_id)
    .single()

  // White label branding only applies to Professional and Business tier
  // owners who currently have an active subscription (Checklist #32).
  const isWhiteLabel =
    isSubscriptionActive(ownerProfile) &&
    (ownerProfile?.subscription_tier === 'professional' ||
      ownerProfile?.subscription_tier === 'business')

  const brandColor = isWhiteLabel ? (ownerProfile?.brand_color || '#0066FF') : '#0066FF'
  const logoUrl = isWhiteLabel ? (ownerProfile?.logo_url || null) : null
  const businessName = ownerProfile?.business_name || ownerProfile?.full_name || 'Invonaut'

  if (!portalRow.is_enabled) {
    return (
      <ErrorCard
        brandColor={brandColor} logoUrl={logoUrl} businessName={businessName}
        title={`${businessName} has temporarily paused their portal.`}
        body="Please contact them directly."
      />
    )
  }

  // 3. Validate token
  if (!token) {
    return (
      <ErrorCard
        brandColor={brandColor} logoUrl={logoUrl} businessName={businessName}
        title="Signing link has expired."
        body={`Ask ${businessName} to send you a new signing link.`}
      />
    )
  }

  const { data: tokenRow } = await supabase
    .from('client_portal_tokens')
    .select('client_id, expires_at')
    .eq('token', token)
    .eq('user_id', portalRow.user_id)
    .maybeSingle()

  const tokenValid =
    tokenRow && tokenRow.client_id && new Date(tokenRow.expires_at) > new Date()

  if (!tokenValid) {
    return (
      <ErrorCard
        brandColor={brandColor} logoUrl={logoUrl} businessName={businessName}
        title="Signing link has expired."
        body={`Signing links are valid for 30 days. Ask ${businessName} to resend the contract.`}
      />
    )
  }

  const clientId = tokenRow.client_id as string

  // 4. Fetch contract
  const { data: contract } = await supabase
    .from('contracts')
    .select('id, title, status, content')
    .eq('id', contractId)
    .eq('user_id', portalRow.user_id)
    .eq('client_id', clientId)
    .maybeSingle()

  if (!contract) {
    return (
      <ErrorCard
        brandColor={brandColor} logoUrl={logoUrl} businessName={businessName}
        title="Contract not found."
        body="This contract doesn't exist or you don't have access to it."
      />
    )
  }

  // Already signed
  if (contract.status === 'active') {
    return (
      <AlreadySigned
        brandColor={brandColor} logoUrl={logoUrl}
        businessName={businessName} contractTitle={contract.title}
      />
    )
  }

  if (!['sent', 'awaiting_signature'].includes(contract.status)) {
    return (
      <ErrorCard
        brandColor={brandColor} logoUrl={logoUrl} businessName={businessName}
        title="Contract not available for signing."
        body="This contract may have been cancelled or is not ready for signature."
      />
    )
  }

  // 5. Fetch client name for pre-filling
  const { data: clientRow } = await supabase
    .from('clients')
    .select('name')
    .eq('id', clientId)
    .single()

  const clauses = (contract.content ?? []) as ClauseBlock[]

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader brandColor={brandColor} logoUrl={logoUrl} businessName={businessName} />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Contract header */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Contract for Review & Signature
              </p>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">{contract.title}</h1>
            </div>
            <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 w-fit">
              <Clock className="w-3 h-3" />
              Awaiting your signature
            </span>
          </div>
        </div>

        {/* Clauses */}
        <div className="space-y-3">
          <h2 className="font-black text-gray-900">Contract terms</h2>
          {clauses.map((clause, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-black text-gray-900 mb-3 text-base">{clause.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{clause.content}</p>
            </div>
          ))}
        </div>

        {/* Interactive signing form — client component */}
        <ContractSigningForm
          contractId={contractId}
          token={token}
          slug={slug}
          defaultSignerName={clientRow?.name || ''}
        />

      </main>

      <footer className="text-center text-xs text-gray-400 py-8">
        Powered by Invonaut · From contract to cash. Automated.
      </footer>
    </div>
  )
}