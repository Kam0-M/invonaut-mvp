import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InvoiceList } from '@/components/invoices/invoice-list'
import { Plus, FileText, Lock, Zap, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import ViewOnlyBanner from '@/components/view-only-banner'
import { getInvoiceDisplayStatus } from '@/lib/utils/invoice-status'
import CoreTabBar from '@/components/layout/core-tab-bar'
import BackToTop from '@/components/ui/back-to-top'
import SmartInvoiceDrafts from '@/components/intelligence/smart-invoice-drafts'
import { makeCurrencyFormatter, makeCompactFormatter } from '@/lib/utils/currency'

// fmt injected per-request below

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_subscription_id, subscription_status, subscription_tier, currency, currency_symbol')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription = !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')

  const tier  = profile?.subscription_tier ?? 'starter'
  const _fmtBase      = makeCurrencyFormatter((profile as any)?.currency || 'USD')
  const formatCompact = makeCompactFormatter(
    (profile as any)?.currency      || 'USD',
    (profile as any)?.currency_symbol,
  )
  const fmt = _fmtBase
  const isPro = tier === 'professional' || tier === 'business'

  // Fetch unbilled time entries for Smart Drafts (Pro+)
  const { data: unbilledEntries } = isPro ? await supabase
    .from('time_entries')
    .select('id, description, duration_seconds, hourly_rate, billable, client_id, clients(name)')
    .eq('user_id', user.id)
    .eq('billable', true)
    .is('invoice_id', null)
    .gt('duration_seconds', 0)
  : { data: [] }

  // Group unbilled entries by client
  const unbilledGroups = (() => {
    const groups: Record<string, any> = {}
    for (const entry of (unbilledEntries ?? [])) {
      const clientName = (Array.isArray(entry.clients) ? entry.clients[0] : entry.clients)?.name ?? 'Unknown Client'
      if (!groups[entry.client_id]) {
        groups[entry.client_id] = {
          client_id:    entry.client_id,
          client_name:  clientName,
          total_hours:  0,
          total_value:  0,
          entry_count:  0,
          entries:      [],
        }
      }
      const hrs = entry.duration_seconds / 3600
      groups[entry.client_id].total_hours  += hrs
      groups[entry.client_id].total_value  += hrs * (entry.hourly_rate ?? 0)
      groups[entry.client_id].entry_count  += 1
      groups[entry.client_id].entries.push(entry)
    }
    return Object.values(groups).filter((g: any) => g.total_value > 0).sort((a: any, b: any) => b.total_value - a.total_value)
  })()

  // Check monthly invoice count for Starter
  let monthlyInvoiceCount = 0
  let invoiceLimitReached = false
  if (hasActiveSubscription && tier === 'starter') {
    const startOfMonth = new Date()
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())
    monthlyInvoiceCount = count ?? 0
    invoiceLimitReached = monthlyInvoiceCount >= 25
  }

  const { data: allInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, issue_date, due_date, total_amount, status, last_followed_up, ai_risk_score, clients(name, company), revenue_categories(id, name, color)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500)

  const invoices = (allInvoices ?? []).map((inv: any) => ({
    ...inv,
    displayStatus: getInvoiceDisplayStatus({ status: inv.status, due_date: inv.due_date }),
    clients: Array.isArray(inv.clients) && inv.clients.length > 0 ? inv.clients[0] : inv.clients,
    revenue_categories: Array.isArray(inv.revenue_categories) && inv.revenue_categories.length > 0 ? inv.revenue_categories[0] : (inv.revenue_categories ?? null),
  }))

  const totalValue   = invoices.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)
  const paidValue    = invoices.filter((i: any) => i.displayStatus === 'paid').reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)
  const overdueCount = invoices.filter((i: any) => i.displayStatus === 'overdue').length
  const sentCount    = invoices.filter((i: any) => i.displayStatus === 'sent').length

  return (
    <div className="space-y-6">
      {/* Tab bar — matches demo */}
      <CoreTabBar />

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-bold text-[#0055FF] uppercase tracking-widest inv-overline">Invoice pipeline</p>
            {invoices.length > 0 && (
              <div className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                <Zap className="w-3 h-3" />AI scoring active
              </div>
            )}
          </div>
          {invoices.length > 0 && (
            <div className="flex items-center gap-4">
              {[
                { label: 'Total',    value: formatCompact(totalValue), color: 'text-gray-900' },
                { label: 'Paid',     value: formatCompact(paidValue),  color: 'text-emerald-600' },
                { label: 'Awaiting', value: String(sentCount),          color: 'text-blue-600' },
                { label: 'Overdue',  value: String(overdueCount),       color: 'text-red-500' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className={`text-sm font-black ${s.color}`}>{s.value}</span>
                  <span className="text-xs text-gray-400 font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          {!hasActiveSubscription ? (
            <button disabled className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-400 font-bold text-sm cursor-not-allowed">
              <Lock className="w-4 h-4" />New Invoice
            </button>
          ) : invoiceLimitReached ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                25/25 this month
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
                  {monthlyInvoiceCount}/25 this month
                </span>
              )}
              <Link href="/dashboard/invoices/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-primary text-sm transition-all hover:shadow-md">
                <Plus className="w-4 h-4" />New Invoice
              </Link>
            </div>
          )}
        </div>
      </div>

      {!hasActiveSubscription && <ViewOnlyBanner />}

      {/* ── Smart Drafts — unbilled time entries (Pro+) ───────────────────── */}
      {isPro && unbilledGroups.length > 0 && (
        <SmartInvoiceDrafts groups={unbilledGroups} />
      )}

      {/* Empty state */}
      {invoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="h-1 inv-animated-bar" />
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">No invoices yet</h3>
            <p className="text-sm text-gray-500 font-medium max-w-sm mx-auto mb-6">
              Create your first invoice and Invonaut starts watching it immediately — AI scores payment risk, automated reminders fire when it goes overdue.
            </p>
            {hasActiveSubscription ? (
              <Link href="/dashboard/invoices/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary rounded-xl text-sm transition-all hover:shadow-md">
                <Plus className="w-4 h-4" />Create Your First Invoice
              </Link>
            ) : (
              <Link href="/pricing"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary rounded-xl text-sm transition-all">
                <Lock className="w-4 h-4" />Start Free Trial
              </Link>
            )}
          </div>
        </div>
      ) : (
        <InvoiceList invoices={invoices} hasActiveSubscription={hasActiveSubscription} />
      )}
      <BackToTop />
    </div>
  )
}