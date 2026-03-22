import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Clock, Lock } from 'lucide-react'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

function getDisplayStatus(status: string, dueDate: string): string {
  if (status === 'paid' || status === 'cancelled') return status
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  if (due < today) return 'overdue'
  return status
}

const statusStyles: Record<string, string> = {
  draft:   'bg-gray-100 text-gray-700',
  sent:    'bg-blue-100 text-blue-700',
  paid:    'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
}

// ── Branded portal header ─────────────────────────────────────────────────────
function PortalHeader({
  brandColor,
  logoUrl,
  businessName,
}: {
  brandColor: string
  logoUrl: string | null
  businessName: string
}) {
  return (
    <header
      className="w-full py-4 px-6 flex items-center justify-between"
      style={{ backgroundColor: brandColor }}
    >
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={businessName}
            className="w-8 h-8 rounded object-contain bg-white/10"
          />
        ) : (
          <span className="text-white font-black text-sm truncate max-w-[200px]">
            {businessName}
          </span>
        )}
      </div>
      <span className="text-white/60 text-xs">Powered by Invonaut</span>
    </header>
  )
}

// ── Error cards ───────────────────────────────────────────────────────────────
function ErrorCard({
  brandColor,
  logoUrl,
  businessName,
  icon,
  title,
  body,
}: {
  brandColor?: string
  logoUrl?: string | null
  businessName?: string
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {brandColor && businessName !== undefined && (
        <PortalHeader
          brandColor={brandColor}
          logoUrl={logoUrl ?? null}
          businessName={businessName}
        />
      )}
      <div className="flex items-center justify-center py-24 px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
          <div className="flex justify-center mb-4 text-gray-400">{icon}</div>
          <h1 className="text-xl font-black text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function PortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { slug } = await params
  const { token } = await searchParams
  const supabase = createAdminClient()

  // 1. Resolve portal settings from slug
  const { data: portalRow } = await supabase
    .from('portal_settings')
    .select('user_id, is_enabled, custom_message')
    .eq('slug', slug)
    .maybeSingle()

  if (!portalRow) {
    return (
      <ErrorCard
        icon={<Lock className="w-10 h-10" />}
        title="Portal not found."
        body="This portal link doesn't exist. Please check the URL or contact the business directly."
      />
    )
  }

  // 2. Fetch owner branding
  const { data: ownerProfile } = await supabase
    .from('user_profiles')
    .select('business_name, full_name, logo_url, brand_color, secondary_brand_color, subscription_tier')
    .eq('id', portalRow.user_id)
    .single()

  // White label branding only applies to Professional and Business tier owners
  const isWhiteLabel =
    ownerProfile?.subscription_tier === 'professional' ||
    ownerProfile?.subscription_tier === 'business'

  const brandColor = isWhiteLabel ? (ownerProfile?.brand_color || '#0066FF') : '#0066FF'
  const logoUrl = isWhiteLabel ? (ownerProfile?.logo_url || null) : null
  const businessName =
    ownerProfile?.business_name || ownerProfile?.full_name || 'Invonaut'

  if (!portalRow.is_enabled) {
    return (
      <ErrorCard
        brandColor={brandColor}
        logoUrl={logoUrl}
        businessName={businessName}
        icon={<Clock className="w-10 h-10" />}
        title={`${businessName} has temporarily paused their client portal.`}
        body="Please contact them directly for your invoices."
      />
    )
  }

  // 3. Validate token
  if (!token) {
    return (
      <ErrorCard
        brandColor={brandColor}
        logoUrl={logoUrl}
        businessName={businessName}
        icon={<Lock className="w-10 h-10" />}
        title="Your access link has expired."
        body={`Portal links are valid for 7 days. Ask ${businessName} to send you a new link.`}
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
    tokenRow &&
    tokenRow.client_id &&
    new Date(tokenRow.expires_at) > new Date()

  if (!tokenValid) {
    return (
      <ErrorCard
        brandColor={brandColor}
        logoUrl={logoUrl}
        businessName={businessName}
        icon={<Lock className="w-10 h-10" />}
        title="Your access link has expired."
        body={`Portal links are valid for 7 days. Ask ${businessName} to send you a new link.`}
      />
    )
  }

  const clientId = tokenRow.client_id as string

  // 4. Fetch client name
  const { data: clientRow } = await supabase
    .from('clients')
    .select('name')
    .eq('id', clientId)
    .eq('user_id', portalRow.user_id)
    .single()

  // 5. Fetch invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, issue_date, due_date, total_amount')
    .eq('user_id', portalRow.user_id)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  const invoiceList = (invoices ?? []) as {
    id: string
    invoice_number: string
    status: string
    issue_date: string
    due_date: string
    total_amount: number
  }[]

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader
        brandColor={brandColor}
        logoUrl={logoUrl}
        businessName={businessName}
      />

      {/* Welcome banner */}
      {portalRow.custom_message ? (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <p className="text-gray-700 max-w-4xl mx-auto text-sm leading-relaxed">
            {portalRow.custom_message}
          </p>
        </div>
      ) : null}

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">
            Welcome, {clientRow?.name ?? 'there'}
          </h1>
          <p className="text-gray-500 text-sm">
            Here are all your invoices.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-black text-gray-900 mb-4">Your Invoices</h2>

          {invoiceList.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <p className="text-gray-500 text-sm">
                No invoices yet. Your invoices will appear here once sent.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
              {invoiceList.map((inv) => {
                const displayStatus = getDisplayStatus(inv.status, inv.due_date)
                const badgeClass = statusStyles[displayStatus] || statusStyles.sent
                return (
                  <div
                    key={inv.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                      <span className="font-mono font-bold text-gray-900 text-sm">
                        {inv.invoice_number}
                      </span>
                      <span className="text-gray-400 text-xs hidden sm:inline">·</span>
                      <span className="text-gray-500 text-xs">
                        Issued {formatDate(inv.issue_date)}
                      </span>
                      <span className="text-gray-400 text-xs hidden sm:inline">·</span>
                      <span className="text-gray-500 text-xs">
                        Due {formatDate(inv.due_date)}
                      </span>
                      <span className="text-gray-400 text-xs hidden sm:inline">·</span>
                      <span className="font-bold text-gray-900 text-sm">
                        {formatCurrency(Number(inv.total_amount))}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${badgeClass}`}
                      >
                        {displayStatus}
                      </span>
                      <Link
                        href={`/portal/${slug}/invoices/${inv.id}?token=${token}`}
                        className="border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                      >
                        View Invoice
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-8">
        Powered by Invonaut · From contract to cash. Automated.
      </footer>
    </div>
  )
}