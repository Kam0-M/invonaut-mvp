import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Lock, ArrowLeft } from 'lucide-react'

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

function ErrorCard({
  brandColor,
  logoUrl,
  businessName,
  title,
  body,
}: {
  brandColor?: string
  logoUrl?: string | null
  businessName?: string
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

export default async function PortalInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { slug, id } = await params
  const { token } = await searchParams
  const supabase = createAdminClient()

  // 1. Resolve portal settings
  const { data: portalRow } = await supabase
    .from('portal_settings')
    .select('user_id, is_enabled, custom_message')
    .eq('slug', slug)
    .maybeSingle()

  if (!portalRow) {
    return (
      <ErrorCard
        title="Portal not found."
        body="This portal link doesn't exist. Please check the URL or contact the business directly."
      />
    )
  }

  // 2. Fetch owner branding
  const { data: ownerProfile } = await supabase
    .from('user_profiles')
    .select('business_name, full_name, logo_url, brand_color, secondary_brand_color, address, email, subscription_tier')
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
        title="Your access link has expired."
        body={`Portal links are valid for 7 days. Ask ${businessName} to send you a new link.`}
      />
    )
  }

  const clientId = tokenRow.client_id as string

  // 4. Fetch invoice — must belong to this client AND this user
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, issue_date, due_date, subtotal, tax_amount, total_amount, notes')
    .eq('id', id)
    .eq('client_id', clientId)
    .eq('user_id', portalRow.user_id)
    .maybeSingle()

  if (!invoice) {
    return (
      <ErrorCard
        brandColor={brandColor}
        logoUrl={logoUrl}
        businessName={businessName}
        title="Invoice not found."
        body="This invoice doesn't exist or you don't have access to it."
      />
    )
  }

  // 5. Fetch invoice items
  const { data: items } = await supabase
    .from('invoice_items')
    .select('id, description, quantity, unit_price, total')
    .eq('invoice_id', id)

  const lineItems = (items ?? []) as {
    id: string
    description: string
    quantity: number
    unit_price: number
    total: number
  }[]

  // 6. Fetch client details
  const { data: clientRow } = await supabase
    .from('clients')
    .select('name, email, company, address')
    .eq('id', clientId)
    .eq('user_id', portalRow.user_id)
    .single()

  const displayStatus = getDisplayStatus(invoice.status, invoice.due_date)
  const badgeClass = statusStyles[displayStatus] || statusStyles.sent

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://invonaut.app').replace(/\/$/, '')
  const downloadUrl = `${appUrl}/api/portal/download-invoice?invoiceId=${invoice.id}&token=${token}&slug=${slug}`

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader
        brandColor={brandColor}
        logoUrl={logoUrl}
        businessName={businessName}
      />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Back link */}
        <Link
          href={`/portal/${slug}?token=${token}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All invoices
        </Link>

        {/* Invoice card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">

          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-gray-900">
                {invoice.invoice_number}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Issued {formatDate(invoice.issue_date)} · Due {formatDate(invoice.due_date)}
              </p>
            </div>
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold capitalize w-fit ${badgeClass}`}>
              {displayStatus}
            </span>
          </div>

          <div className="border-t border-gray-100" />

          {/* From / To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">From</p>
              <p className="font-bold text-gray-900 text-sm">{businessName}</p>
              {ownerProfile?.address && (
                <p className="text-gray-500 text-sm mt-1 whitespace-pre-line">
                  {ownerProfile.address}
                </p>
              )}
              {ownerProfile?.email && (
                <p className="text-gray-500 text-sm">{ownerProfile.email}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">To</p>
              <p className="font-bold text-gray-900 text-sm">{clientRow?.name ?? '—'}</p>
              {clientRow?.company && (
                <p className="text-gray-500 text-sm">{clientRow.company}</p>
              )}
              {clientRow?.address && (
                <p className="text-gray-500 text-sm mt-1 whitespace-pre-line">
                  {clientRow.address}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Line items */}
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider rounded-l-lg">
                    Description
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider rounded-r-lg">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-3 text-gray-700">{item.description}</td>
                    <td className="px-3 py-3 text-right text-gray-600">{item.quantity}</td>
                    <td className="px-3 py-3 text-right text-gray-600">
                      {formatCurrency(Number(item.unit_price))}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(Number(item.total))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-100" />

          {/* Totals */}
          <div className="flex flex-col items-end gap-2 text-sm">
            <div className="flex justify-between w-48">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900 font-medium">
                {formatCurrency(Number(invoice.subtotal))}
              </span>
            </div>
            {Number(invoice.tax_amount) > 0 && (
              <div className="flex justify-between w-48">
                <span className="text-gray-500">Tax</span>
                <span className="text-gray-900 font-medium">
                  {formatCurrency(Number(invoice.tax_amount))}
                </span>
              </div>
            )}
            <div className="flex justify-between w-48 pt-2 border-t border-gray-200">
              <span className="font-black text-gray-900">Total</span>
              <span className="font-black text-gray-900 text-lg">
                {formatCurrency(Number(invoice.total_amount))}
              </span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <>
              <div className="border-t border-gray-100" />
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Notes
                </p>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {invoice.notes}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Download button */}
        <div className="flex justify-end">
          <a
            href={downloadUrl}
            download
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
          >
            Download PDF
          </a>
        </div>

      </main>

      <footer className="text-center text-xs text-gray-400 py-8">
        Powered by Invonaut · From contract to cash. Automated.
      </footer>
    </div>
  )
}