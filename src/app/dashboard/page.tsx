import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FileText, Users, TrendingUp, Lock } from 'lucide-react'
import { getInvoiceDisplayStatus } from '@/lib/utils/invoice-status'
import { getContextualMessage } from '@/lib/utils/get-welcome-message'
import ViewOnlyBanner              from '@/components/view-only-banner'
import DashboardAutoRefresh        from '@/components/dashboard/dashboard-auto-refresh'
import OnboardingChecklist         from '@/components/dashboard/onboarding-checklist'
import AICommandCenter             from '@/components/dashboard/ai-command-center'
import RevenueStorySection         from '@/components/dashboard/revenue-story-section'
import RiskAttentionPanel          from '@/components/dashboard/risk-attention-panel'
import OpportunityPanel            from '@/components/dashboard/opportunity-panel'
import ActivityFeedLive, { ActivityItem } from '@/components/dashboard/activity-feed-live'

const fmt = (n: number) => {
  if (n >= 999_500) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000)  return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id, stripe_subscription_id, subscription_status, business_name, full_name')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription = !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')

  // ── Data fetching ─────────────────────────────────────────────────────────
  const { data: invoiceData } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, issue_date, due_date, total_amount, created_at, last_followed_up, ai_risk_score, clients!inner(name, company)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const invoices = (invoiceData ?? []).map((inv: any) => ({
    ...inv,
    clients: Array.isArray(inv.clients) ? inv.clients[0] : inv.clients,
    displayStatus: getInvoiceDisplayStatus({ status: inv.status, due_date: inv.due_date }),
  }))

  const { data: clientData } = await supabase
    .from('clients').select('id, name, email, company, created_at')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(8)
  const clients = (clientData ?? []) as any[]

  const { data: directPaymentsRaw } = await supabase
    .from('direct_payments')
    .select('id, amount, description, payment_date, created_at, revenue_categories(name)')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
  const directPayments = (directPaymentsRaw ?? []) as any[]

  const { data: expensesRaw } = await supabase
    .from('expenses').select('id, amount').eq('user_id', user.id).limit(200)
  const allExpenses = (expensesRaw ?? []) as any[]

  const { data: activeContractsRaw } = await supabase
    .from('contracts').select('id, title, total_value, expiry_date, reminders_dismissed, client_id')
    .eq('user_id', user.id).eq('status', 'active')
  const activeContracts = (activeContractsRaw ?? []) as any[]

  const { data: recentSigsRaw } = await supabase
    .from('contract_signatures')
    .select('id, signer_name, signed_at, contracts!inner(title, user_id)')
    .order('signed_at', { ascending: false }).limit(5)

  const { data: followUpRaw } = await supabase
    .from('invoices')
    .select('id, invoice_number, last_followed_up, ai_risk_score, clients!inner(name)')
    .eq('user_id', user.id).not('last_followed_up', 'is', null)
    .order('last_followed_up', { ascending: false }).limit(3)

  const { data: timeEntriesRaw } = await supabase
    .from('time_entries').select('duration_seconds, hourly_rate, billable, invoice_id')
    .eq('user_id', user.id).eq('billable', true).is('invoice_id', null)
  const unbilledEntries = (timeEntriesRaw ?? []) as any[]

  const { data: portalRaw }   = await supabase.from('portal_settings').select('user_id').eq('user_id', user.id).single()
  const { data: payCheckRaw } = await supabase.from('direct_payments').select('id').eq('user_id', user.id).limit(1)

  // ── Metrics ───────────────────────────────────────────────────────────────
  const now = new Date()
  const now30 = new Date(); now30.setDate(now30.getDate() + 30)

  const invoiceRevenue = invoices.filter((i: any) => i.displayStatus === 'paid')
    .reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)
  const directRevenue  = directPayments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
  const totalRevenue   = invoiceRevenue + directRevenue
  const totalExpenses  = allExpenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0)
  const netProfit      = totalRevenue - totalExpenses
  const profitMargin   = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : null

  const pendingPayments = invoices.filter((i: any) => i.displayStatus === 'sent')
    .reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)

  const paidThisMonth =
    invoices.filter((i: any) => {
      if (i.displayStatus !== 'paid') return false
      const d = new Date(i.issue_date + 'T12:00:00')
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)
    + directPayments.filter((p: any) => {
      const d = new Date(p.payment_date + 'T12:00:00')
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).reduce((s: number, p: any) => s + Number(p.amount || 0), 0)

  const overdueCount = invoices.filter((i: any) => i.displayStatus === 'overdue').length
  const overdueValue = invoices.filter((i: any) => i.displayStatus === 'overdue')
    .reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)

  const expiringSoon = activeContracts.filter((c: any) => {
    if (!c.expiry_date || c.reminders_dismissed) return false
    const e = new Date(c.expiry_date)
    return e <= now30 && e >= now
  }).length

  const followUpsSent = (followUpRaw ?? []).length

  const unbilledSeconds = unbilledEntries.reduce((s: number, e: any) => s + (e.duration_seconds ?? 0), 0)
  const unbilledHours   = Math.round((unbilledSeconds / 3600) * 100) / 100
  const unbilledValue   = unbilledEntries.reduce((s: number, e: any) => {
    if (!e.hourly_rate || !e.duration_seconds) return s
    return s + Math.round((e.duration_seconds / 3600) * e.hourly_rate * 100) / 100
  }, 0)

  const totalContractValue = activeContracts.reduce((s: number, c: any) => s + Number(c.total_value || 0), 0)

  // ── Revenue chart data ────────────────────────────────────────────────────
  const revenueChartData = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1)
    const y = d.getFullYear(), m = d.getMonth()
    const revenue = invoices
      .filter((i: any) => i.displayStatus === 'paid')
      .filter((i: any) => {
        const d2 = new Date(i.issue_date + 'T12:00:00')
        return d2.getFullYear() === y && d2.getMonth() === m
      })
      .reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)
    return { month: d.toLocaleString('en-US', { month: 'short' }), revenue, isCurrentMonth: y === now.getFullYear() && m === now.getMonth() }
  })
  const currentMonthRevenue  = revenueChartData[5]?.revenue ?? 0
  const previousMonthRevenue = revenueChartData[4]?.revenue ?? 0

  // ── Activity feed ─────────────────────────────────────────────────────────
  const activity: ActivityItem[] = []

  invoices.filter((i: any) => ['sent','paid','overdue'].includes(i.displayStatus)).slice(0, 5).forEach((inv: any) => {
    activity.push({ id: `inv-${inv.id}`, type: 'invoice',
      title: 'Invoice sent', detail: `${inv.invoice_number} · ${fmt(inv.total_amount)} · ${inv.clients?.name ?? 'Client'}`,
      timestamp: inv.created_at ?? inv.issue_date })
  })
  directPayments.slice(0, 5).forEach((p: any) => {
    const cat = Array.isArray(p.revenue_categories) ? p.revenue_categories[0] : p.revenue_categories
    activity.push({ id: `pay-${p.id}`, type: 'payment',
      title: 'Payment logged', detail: `${fmt(Number(p.amount))} · ${p.description}${cat?.name ? ` · ${cat.name}` : ''}`,
      timestamp: p.created_at })
  })
  ;(recentSigsRaw ?? []).forEach((sig: any) => {
    const contract = Array.isArray(sig.contracts) ? sig.contracts[0] : sig.contracts
    if (!contract || contract.user_id !== user.id) return
    activity.push({ id: `sig-${sig.id}`, type: 'contract',
      title: 'Contract signed', detail: `${contract.title} · ${sig.signer_name}`, timestamp: sig.signed_at })
  })
  ;(followUpRaw ?? []).forEach((inv: any) => {
    if (!inv.last_followed_up) return
    const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients
    activity.push({ id: `fu-${inv.id}`, type: 'followup',
      title: 'Follow-up sent automatically',
      detail: `${inv.invoice_number} · ${client?.name ?? 'Client'}${inv.ai_risk_score ? ` · Risk ${inv.ai_risk_score}%` : ''}`,
      timestamp: inv.last_followed_up })
  })
  const recentActivity = activity
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8)

  // ── Onboarding ────────────────────────────────────────────────────────────
  const hasClients     = clients.length > 0
  const hasSentInvoice = invoices.some((i: any) => ['sent','paid','overdue'].includes(i.status))
  const hasTimeEntries = unbilledSeconds > 0
  const hasPortal      = !!portalRaw
  const hasPayment     = (payCheckRaw ?? []).length > 0

  // ── Greeting ──────────────────────────────────────────────────────────────
  const hour          = now.getHours()
  const timeGreeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName     = profile?.full_name?.split(' ')[0] || profile?.business_name || user.email?.split('@')[0] || 'there'
  const isNewUser     = invoices.length === 0 && directPayments.length === 0
  const motivational  = getContextualMessage({
    overdueCount,
    pendingPayments,
    paidThisMonth,
    totalRevenue,
    unbilledValue,
    expiringSoon,
    hasClients:   clients.length > 0,
    isNewUser,
  })

  const statusPill: Record<string, string> = {
    draft:   'bg-gray-100 text-gray-600',
    sent:    'bg-blue-50 text-blue-700',
    paid:    'bg-teal-50 text-teal-700',
    overdue: 'bg-red-50 text-red-700',
  }

  return (
    <div className="space-y-6">
      <DashboardAutoRefresh />

      {/* Onboarding */}
      {hasActiveSubscription && (
        <OnboardingChecklist
          hasClients={hasClients} hasSentInvoice={hasSentInvoice}
          hasTimeEntry={hasTimeEntries} hasPayment={hasPayment} hasPortal={hasPortal}
        />
      )}

      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 inv-fade-up inv-fade-up-1">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">
            {timeGreeting}, {firstName}
          </p>
          <h1 className="text-xl font-black text-gray-900">{motivational}</h1>
        </div>
        {!hasActiveSubscription && (
          <Link href="/pricing"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl btn-primary text-sm transition-all flex-shrink-0">
            <Lock className="w-3.5 h-3.5" />Start Free Trial
          </Link>
        )}
      </div>

      {!hasActiveSubscription && <ViewOnlyBanner />}

      {/* ── AI Command Center ─────────────────────────────────────────────── */}
      {hasActiveSubscription && (
        <AICommandCenter
          totalRevenue={totalRevenue}
          pendingPayments={pendingPayments}
          paidThisMonth={paidThisMonth}
          overdueCount={overdueCount}
          profitMargin={profitMargin}
          expiringSoon={expiringSoon}
          unbilledValue={unbilledValue}
          hasActiveSubscription={hasActiveSubscription}
        />
      )}

      {/* ── Revenue Story ─────────────────────────────────────────────────── */}
      <RevenueStorySection
        key={`rev-${currentMonthRevenue}-${previousMonthRevenue}`}
        data={revenueChartData}
        currentMonth={currentMonthRevenue}
        previousMonth={previousMonthRevenue}
      />

      {/* ── Risk + Opportunity panels ─────────────────────────────────────── */}
      {hasActiveSubscription && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <RiskAttentionPanel
            overdueCount={overdueCount}
            expiringSoon={expiringSoon}
            followUpsSent={followUpsSent}
            overdueValue={overdueValue}
          />
          <OpportunityPanel
            unbilledHours={unbilledHours}
            unbilledValue={unbilledValue}
            activeContracts={activeContracts.length}
            contractValue={totalContractValue}
          />
        </div>
      )}

      {/* ── Activity feed + Recent invoices ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ActivityFeedLive items={recentActivity} viewAll="/dashboard/invoices" />

        {/* Recent invoices */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden inv-fade-up inv-fade-up-5">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Invoices</p>
            <Link href="/dashboard/invoices" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">View all →</Link>
          </div>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-5">
              <FileText className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm font-bold text-gray-400 mb-1">No invoices yet</p>
              {hasActiveSubscription && (
                <Link href="/dashboard/invoices/new" className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700">
                  Create your first →
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {invoices.slice(0, 8).map((inv: any) => (
                <Link key={inv.id} href={`/dashboard/invoices/${inv.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-black text-gray-900 font-mono">{inv.invoice_number}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase ${statusPill[inv.displayStatus] ?? statusPill.draft}`}>
                        {inv.displayStatus}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium truncate">{inv.clients?.name ?? '—'}</p>
                  </div>
                  <span className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors flex-shrink-0">
                    {fmt(inv.total_amount)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Clients grid ─────────────────────────────────────────────────── */}
      {clients.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden inv-fade-up inv-fade-up-5">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Clients</p>
            <Link href="/dashboard/clients" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-gray-50">
            {clients.slice(0, 8).map((client: any) => {
              const palette = ['bg-blue-100 text-blue-700','bg-teal-100 text-teal-700','bg-indigo-100 text-indigo-700','bg-cyan-100 text-cyan-700']
              let hash = 0
              for (let i = 0; i < client.name.length; i++) hash = client.name.charCodeAt(i) + ((hash << 5) - hash)
              const av       = palette[Math.abs(hash) % palette.length]
              const initials = client.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
              return (
                <Link key={client.id} href={`/dashboard/clients/${client.id}`}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-xs ${av}`}>{initials}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate">{client.name}</p>
                    {client.company && <p className="text-xs text-gray-400 truncate">{client.company}</p>}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
