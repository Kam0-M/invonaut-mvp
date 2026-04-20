import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { StatusChart } from '@/components/dashboard/status-chart'
import { Users, FileText, TrendingUp, TrendingDown, DollarSign, Clock, AlertCircle, Sparkles, Lock, FileSignature, Banknote, CalendarClock, Receipt, Tag } from 'lucide-react'
import { getInvoiceDisplayStatus } from '@/lib/utils/invoice-status'
import { getWelcomeMessage } from '@/lib/utils/get-welcome-message'
import MetricCardValue from '@/components/dashboard/metric-card-value'
import ViewOnlyBanner from '@/components/view-only-banner'
import DashboardAutoRefresh from '@/components/dashboard/dashboard-auto-refresh'

type InvoiceRaw = {
  id: string
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issue_date: string
  due_date: string
  total_amount: number
  subtotal?: number
  tax_amount?: number
  created_at?: string
  clients: {
    name: string | null
    company?: string | null
  } | null
}

type Invoice = InvoiceRaw & {
  displayStatus: string
}

type Client = {
  id: string
  name: string
  email: string | null
  company: string | null
  phone: string | null
  payment_terms: number | null
  created_at: string
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

// Full precision — used for tooltip
const formatCurrencyFull = (amount: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

// For metric cards — abbreviates large numbers so they never overflow the card
const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000)     return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 10_000)        return `$${(amount / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id, stripe_subscription_id, subscription_status')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription = !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')

  const hasEverSubscribed = !!profile?.stripe_customer_id || !!profile?.stripe_subscription_id

  // Fetch invoices
  const { data: invoiceData } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, issue_date, due_date, total_amount, created_at, clients!inner(name, company)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const rawInvoices = (invoiceData ?? []) as any[]

  const invoices: Invoice[] = rawInvoices.map(inv => {
    const normalizedInv = {
      ...inv,
      clients: Array.isArray(inv.clients) && inv.clients.length > 0 ? inv.clients[0] : inv.clients
    }
    const displayStatus = getInvoiceDisplayStatus({
      status: normalizedInv.status,
      due_date: normalizedInv.due_date
    })
    return { ...normalizedInv, displayStatus }
  })

  // Fetch clients
  const { data: clientData } = await supabase
    .from('clients')
    .select('id, name, email, company, phone, payment_terms, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const clients = (clientData ?? []) as Client[]

  // Fetch direct payments for unified revenue totals
  const { data: directPaymentsRaw } = await supabase
    .from('direct_payments')
    .select('amount, payment_date')
    .eq('user_id', user.id)

  const directPayments = (directPaymentsRaw ?? []) as { amount: number; payment_date: string }[]

  const now = new Date()

  // Metrics
  const invoiceRevenue = invoices
    .filter(inv => inv.displayStatus === 'paid')
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)

  const directRevenue = directPayments
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)

  const totalRevenue = invoiceRevenue + directRevenue

  const pendingPayments = invoices
    .filter(inv => inv.displayStatus === 'sent')
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)

  const paidThisMonthInvoices = invoices
    .filter(inv => inv.displayStatus === 'paid')
    .filter(inv => {
      const d = new Date(inv.issue_date + 'T12:00:00')
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)

  const paidThisMonthDirect = directPayments
    .filter(p => {
      const d = new Date(p.payment_date + 'T12:00:00')
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)

  const paidThisMonth = paidThisMonthInvoices + paidThisMonthDirect

  const overdueCount = invoices.filter(inv => inv.displayStatus === 'overdue').length

  // Revenue chart data — use local dates to avoid UTC midnight timezone bugs
  const revenueChartData = (() => {
    const monthLabels = Array.from({ length: 6 }, (_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1)
      return {
        year: d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleString('en-US', { month: 'short' }),
        isCurrentMonth: d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(),
      }
    })

    const paidInvoices = invoices.filter(inv => inv.displayStatus === 'paid')

    return monthLabels.map(({ year, month, label, isCurrentMonth }) => {
      const revenue = paidInvoices
        .filter(inv => {
          const d = new Date(inv.issue_date + 'T12:00:00')
          return d.getFullYear() === year && d.getMonth() === month
        })
        .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)
      return { month: label, revenue, isCurrentMonth }
    })
  })()

  // Status chart data
  const statusCounts = ['draft', 'sent', 'paid', 'overdue'] as const
  const statusColors: Record<(typeof statusCounts)[number], string> = {
    draft: '#9CA3AF',
    sent: '#3B82F6',
    paid: '#10B981',
    overdue: '#EF4444'
  }
  const statusChartData = statusCounts.map(status => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: invoices.filter(inv => inv.displayStatus === status).length,
    color: statusColors[status]
  }))

  // Contract metrics
  const now30 = new Date()
  now30.setDate(now30.getDate() + 30)

  const { data: activeContractsRaw } = await supabase
    .from('contracts')
    .select('id, total_value, expiry_date, reminders_dismissed')
    .eq('user_id', user.id)
    .eq('status', 'active')

  const activeContracts = activeContractsRaw ?? []
  const activeContractsCount = activeContracts.length
  const totalContractValue = activeContracts.reduce(
    (sum, c: any) => sum + Number(c.total_value || 0), 0
  )
  const expiringSoonCount = activeContracts.filter((c: any) => {
    if (!c.expiry_date || c.reminders_dismissed) return false
    const expiry = new Date(c.expiry_date)
    return expiry <= now30 && expiry >= new Date()
  }).length

  // Expenses — fetch richer data for dashboard section + net profit card
  const { data: expensesRaw } = await supabase
    .from('expenses')
    .select('id, description, amount, date, category, vendor')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  const allExpenses = (expensesRaw ?? []) as any[]

  const totalExpenses = allExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

  const expensesThisMonth = allExpenses
    .filter(e => {
      const d = new Date(e.date + 'T12:00:00')
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((sum, e) => sum + Number(e.amount || 0), 0)

  // Top spending category
  const categoryTotalsMap: Record<string, number> = {}
  allExpenses.forEach(e => {
    categoryTotalsMap[e.category] = (categoryTotalsMap[e.category] || 0) + Number(e.amount || 0)
  })
  const topCategory = Object.entries(categoryTotalsMap)
    .sort((a, b) => b[1] - a[1])[0] ?? null

  const recentExpenses = allExpenses.slice(0, 4)

  // ── Activity feed data ────────────────────────────────────────────────────
  // Gather recent events across invoices sent, direct payments, contract
  // signatures, and follow-ups, then merge + sort by timestamp.

  const { data: recentDirectPaymentsRaw } = await supabase
    .from('direct_payments')
    .select('id, amount, description, payment_date, created_at, revenue_categories(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentSignaturesRaw } = await supabase
    .from('contract_signatures')
    .select('id, signer_name, signed_at, contracts!inner(title, user_id)')
    .order('signed_at', { ascending: false })
    .limit(5)

  const { data: followUpInvoicesRaw } = await supabase
    .from('invoices')
    .select('id, invoice_number, last_followed_up, ai_risk_score, clients!inner(name)')
    .eq('user_id', user.id)
    .not('last_followed_up', 'is', null)
    .order('last_followed_up', { ascending: false })
    .limit(3)

  // Build unified activity list
  type ActivityItem = {
    id:        string
    type:      'invoice_sent' | 'payment_logged' | 'contract_signed' | 'follow_up'
    icon:      string
    title:     string
    detail:    string
    timestamp: string
  }

  const activityItems: ActivityItem[] = []

  // Sent invoices (most recent 5)
  invoices
    .filter(inv => inv.displayStatus === 'sent' || inv.displayStatus === 'paid' || inv.displayStatus === 'overdue')
    .slice(0, 5)
    .forEach(inv => {
      const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients
      activityItems.push({
        id:        `inv-${inv.id}`,
        type:      'invoice_sent',
        icon:      '📄',
        title:     'Invoice sent',
        detail:    `${inv.invoice_number} · $${Number(inv.total_amount).toFixed(0)} · ${client?.name ?? 'Client'}`,
        timestamp: inv.created_at,
      })
    })

  // Direct payments
  ;(recentDirectPaymentsRaw ?? []).forEach((p: any) => {
    const cat = Array.isArray(p.revenue_categories) ? p.revenue_categories[0] : p.revenue_categories
    activityItems.push({
      id:        `pay-${p.id}`,
      type:      'payment_logged',
      icon:      '💵',
      title:     'Payment logged',
      detail:    `$${Number(p.amount).toFixed(0)} · ${p.description}${cat?.name ? ` · ${cat.name}` : ''}`,
      timestamp: p.created_at,
    })
  })

  // Contract signatures (only for this user's contracts)
  ;(recentSignaturesRaw ?? []).forEach((sig: any) => {
    const contract = Array.isArray(sig.contracts) ? sig.contracts[0] : sig.contracts
    if (!contract || contract.user_id !== user.id) return
    activityItems.push({
      id:        `sig-${sig.id}`,
      type:      'contract_signed',
      icon:      '✅',
      title:     'Contract signed',
      detail:    `${contract.title} · ${sig.signer_name}`,
      timestamp: sig.signed_at,
    })
  })

  // Automated follow-ups
  ;(followUpInvoicesRaw ?? []).forEach((inv: any) => {
    if (!inv.last_followed_up) return
    const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients
    activityItems.push({
      id:        `fu-${inv.id}`,
      type:      'follow_up',
      icon:      '🤖',
      title:     'Follow-up sent automatically',
      detail:    `${inv.invoice_number} · ${client?.name ?? 'Client'}${inv.ai_risk_score ? ` · Risk ${inv.ai_risk_score}%` : ''}`,
      timestamp: inv.last_followed_up,
    })
  })

  // Sort by most recent, take top 8
  const recentActivity = activityItems
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8)

  const netProfit = totalRevenue - totalExpenses
  const isProfitable = netProfit >= 0
  const profitabilityPct = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : null

  const recentInvoices = invoices.slice(0, 10)
  const hasInvoices = invoices.length > 0
  const hasClients = clients.length > 0

  // Unbilled time — total hours and dollar value not yet invoiced
  const { data: timeEntriesRaw } = await supabase
    .from('time_entries')
    .select('duration_seconds, hourly_rate, billable, invoice_id')
    .eq('user_id', user.id)
    .eq('billable', true)
    .is('invoice_id', null)

  const unbilledEntries  = (timeEntriesRaw ?? []) as any[]
  const unbilledSeconds  = unbilledEntries.reduce((s, e) => s + (e.duration_seconds ?? 0), 0)
  const unbilledHours    = Math.round((unbilledSeconds / 3600) * 100) / 100
  const unbilledValue    = unbilledEntries.reduce((s, e) => {
    if (!e.hourly_rate || !e.duration_seconds) return s
    return s + Math.round((e.duration_seconds / 3600) * e.hourly_rate * 100) / 100
  }, 0)
  const hasTimeEntries   = unbilledSeconds > 0

  const welcomeMessage = getWelcomeMessage()

  return (
    <div className="space-y-8 max-w-7xl">

      {/* Silent 30-second auto-refresh keeps activity feed live */}
      <DashboardAutoRefresh />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-10 shadow-2xl">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'1\' height=\'1\' fill=\'rgba(255,255,255,0.5)\'/%3E%3C/svg%3E")', backgroundSize: '60px 60px' }} />
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-6 h-6 text-teal-300" />
              <span className="text-teal-300 font-bold text-sm uppercase tracking-wider">Dashboard</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight">{welcomeMessage}</h1>
            <p className="text-blue-100 text-lg font-medium">Track your invoices, revenue, and client activity in real-time.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {hasActiveSubscription ? (
              <Link href="/dashboard/invoices/new" className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-center hover:shadow-2xl transition-all hover:scale-105">
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5" />
                  Create Invoice
                </div>
              </Link>
            ) : (
              <button disabled className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/20 text-white/50 font-bold cursor-not-allowed border-2 border-white/20" title="Subscribe to create invoices">
                <Lock className="w-5 h-5" />
                Create Invoice (Locked)
              </button>
            )}
            {hasActiveSubscription ? (
              <Link href="/dashboard/clients/new" className="inline-block bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all text-center">
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-5 h-5" />
                  Add Client
                </div>
              </Link>
            ) : (
              <button disabled className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white/50 border-2 border-white/20 font-bold cursor-not-allowed" title="Subscribe to add clients">
                <Lock className="w-5 h-5" />
                Add Client (Locked)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* View-only banner */}
      {!hasActiveSubscription && <ViewOnlyBanner />}

      {/* Invoice Metric Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">

        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
          <div className="flex items-center justify-between mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <span className="text-xs font-bold text-green-700 uppercase tracking-wider bg-green-200 px-3 py-1.5 rounded-full">Total</span>
          </div>
          <p className="text-sm font-bold text-green-700 mb-2 uppercase tracking-wide">Total Revenue</p>
          <MetricCardValue compact={formatCurrencyCompact(totalRevenue)} full={formatCurrencyFull(totalRevenue)} colorClass="text-green-900" />
        </div>

        {/* Pending Payments */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-2xl p-8 border-2 border-blue-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
          <div className="flex items-center justify-between mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-200 px-3 py-1.5 rounded-full">Pending</span>
          </div>
          <p className="text-sm font-bold text-blue-700 mb-2 uppercase tracking-wide">Pending Payments</p>
          <MetricCardValue compact={formatCurrencyCompact(pendingPayments)} full={formatCurrencyFull(pendingPayments)} colorClass="text-blue-900" />
        </div>

        {/* Paid This Month */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-8 border-2 border-teal-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
          <div className="flex items-center justify-between mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider bg-teal-200 px-3 py-1.5 rounded-full">Month</span>
          </div>
          <p className="text-sm font-bold text-teal-700 mb-2 uppercase tracking-wide">Paid This Month</p>
          <MetricCardValue compact={formatCurrencyCompact(paidThisMonth)} full={formatCurrencyFull(paidThisMonth)} colorClass="text-teal-900" />
        </div>

        {/* Overdue Invoices */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 border-2 border-red-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
          <div className="flex items-center justify-between mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider bg-red-200 px-3 py-1.5 rounded-full">Alert</span>
          </div>
          <p className="text-sm font-bold text-red-700 mb-2 uppercase tracking-wide">Overdue Invoices</p>
          <MetricCardValue compact={String(overdueCount)} full={String(overdueCount)} colorClass="text-red-900" />
        </div>

      </div>

      {/* Net Profit Card */}
      {hasActiveSubscription && (
        <div className={`rounded-2xl p-8 border-2 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 ${
          isProfitable
            ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100'
            : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-100'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              isProfitable
                ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                : 'bg-gradient-to-br from-red-500 to-rose-600'
            }`}>
              {isProfitable
                ? <TrendingUp className="w-8 h-8 text-white" />
                : <TrendingDown className="w-8 h-8 text-white" />
              }
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${
                isProfitable ? 'text-emerald-700 bg-emerald-200' : 'text-red-700 bg-red-200'
              }`}>
                {isProfitable ? 'Profitable' : 'Net loss'}
              </span>
              <p className="text-xs text-gray-400 mt-1.5">Revenue − Expenses</p>
            </div>
          </div>
          <p className={`text-sm font-bold mb-2 uppercase tracking-wide ${
            isProfitable ? 'text-emerald-700' : 'text-red-700'
          }`}>Net Profit</p>
          <MetricCardValue
            compact={formatCurrencyCompact(Math.abs(netProfit))}
            full={formatCurrencyFull(Math.abs(netProfit))}
            colorClass={isProfitable ? 'text-emerald-900' : 'text-red-900'}
          />

          {/* Human-readable insight */}
          <p className={`text-sm font-medium mt-2 ${isProfitable ? 'text-emerald-600' : 'text-red-500'}`}>
            {totalRevenue === 0
              ? 'No revenue recorded yet.'
              : isProfitable
              ? `You're keeping ${profitabilityPct}% of what you earn.`
              : `Expenses exceed revenue by ${formatCurrencyCompact(Math.abs(netProfit))}.`
            }
          </p>

          {/* Expense ratio bar */}
          {totalRevenue > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-gray-400">Expenses vs Revenue</span>
                <span className={`text-xs font-black ${isProfitable ? 'text-emerald-600' : 'text-red-500'}`}>
                  {Math.min(Math.round((totalExpenses / totalRevenue) * 100), 100)}%
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isProfitable
                      ? totalExpenses / totalRevenue < 0.5
                        ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                        : 'bg-gradient-to-r from-amber-400 to-orange-400'
                      : 'bg-gradient-to-r from-red-400 to-rose-500'
                  }`}
                  style={{ width: `${Math.min((totalExpenses / totalRevenue) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 font-medium">Revenue</p>
              <p className="text-sm font-black text-gray-700">{formatCurrencyCompact(totalRevenue)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Expenses</p>
              <p className="text-sm font-black text-gray-700">{formatCurrencyCompact(totalExpenses)}</p>
            </div>
            {profitabilityPct !== null && (
              <div className="ml-auto text-right">
                <p className="text-xs text-gray-400 font-medium">Margin</p>
                <p className={`text-sm font-black ${isProfitable ? 'text-emerald-700' : 'text-red-700'}`}>
                  {isProfitable ? '+' : ''}{profitabilityPct}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expenses Section */}
      {hasActiveSubscription && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Receipt className="w-5 h-5 text-orange-500" />
              Expenses
            </h2>
            <Link href="/dashboard/expenses" className="text-blue-600 hover:text-blue-700 font-bold text-sm transition-colors">
              View All →
            </Link>
          </div>

          {/* Expense metric cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

            {/* Total Expenses */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 border-2 border-orange-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Receipt className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs font-bold text-orange-700 uppercase tracking-wider bg-orange-200 px-3 py-1.5 rounded-full">All time</span>
              </div>
              <p className="text-sm font-bold text-orange-700 mb-2 uppercase tracking-wide">Total Expenses</p>
              <MetricCardValue
                compact={formatCurrencyCompact(totalExpenses)}
                full={formatCurrencyFull(totalExpenses)}
                colorClass="text-orange-900"
              />
            </div>

            {/* This Month */}
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-8 border-2 border-rose-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider bg-rose-200 px-3 py-1.5 rounded-full">Month</span>
              </div>
              <p className="text-sm font-bold text-rose-700 mb-2 uppercase tracking-wide">Spent This Month</p>
              <MetricCardValue
                compact={formatCurrencyCompact(expensesThisMonth)}
                full={formatCurrencyFull(expensesThisMonth)}
                colorClass="text-rose-900"
              />
            </div>

            {/* Top Category */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-8 border-2 border-violet-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Tag className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs font-bold text-violet-700 uppercase tracking-wider bg-violet-200 px-3 py-1.5 rounded-full">Top</span>
              </div>
              <p className="text-sm font-bold text-violet-700 mb-2 uppercase tracking-wide">Top Category</p>
              {topCategory ? (
                <>
                  <p className="text-2xl font-black text-violet-900 leading-tight capitalize">
                    {topCategory[0].replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm font-bold text-violet-600 mt-1">
                    {formatCurrencyCompact(topCategory[1])}
                  </p>
                </>
              ) : (
                <p className="text-2xl font-black text-violet-300">—</p>
              )}
            </div>

          </div>

          {/* Recent expenses mini-list */}
          {recentExpenses.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <p className="text-sm font-black text-gray-700">Recent Expenses</p>
                <Link href="/dashboard/expenses" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                  View all →
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {recentExpenses.map((e: any) => (
                  <div key={e.id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{e.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {e.vendor && ` · ${e.vendor}`}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 flex-shrink-0 capitalize">
                      {e.category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-black text-gray-900 flex-shrink-0">
                      {formatCurrencyCompact(Number(e.amount))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentExpenses.length === 0 && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm font-medium mb-3">No expenses recorded yet.</p>
              <Link
                href="/dashboard/expenses/new"
                className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Receipt className="w-4 h-4" />
                Add your first expense
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Contract Metric Cards */}
      {hasActiveSubscription && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-purple-600" />
              Contracts
            </h2>
            <Link href="/dashboard/contracts" className="text-blue-600 hover:text-blue-700 font-bold text-sm transition-colors">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

            {/* Active Contracts */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-8 border-2 border-purple-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FileSignature className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider bg-purple-200 px-3 py-1.5 rounded-full">Active</span>
              </div>
              <p className="text-sm font-bold text-purple-700 mb-2 uppercase tracking-wide">Active Contracts</p>
              <MetricCardValue compact={String(activeContractsCount)} full={String(activeContractsCount)} colorClass="text-purple-900" />
            </div>

            {/* Total Contract Value */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-8 border-2 border-indigo-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Banknote className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider bg-indigo-200 px-3 py-1.5 rounded-full">Value</span>
              </div>
              <p className="text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wide">Total Contract Value</p>
              <MetricCardValue compact={formatCurrencyCompact(totalContractValue)} full={formatCurrencyFull(totalContractValue)} colorClass="text-indigo-900" />
            </div>

            {/* Expiring Soon */}
            <div className={`rounded-2xl p-8 border-2 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 ${
              expiringSoonCount > 0
                ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
                : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-100'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                  expiringSoonCount > 0
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                    : 'bg-gradient-to-br from-gray-400 to-slate-500'
                }`}>
                  <CalendarClock className="w-8 h-8 text-white" />
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${
                  expiringSoonCount > 0
                    ? 'text-amber-700 bg-amber-200'
                    : 'text-gray-600 bg-gray-200'
                }`}>
                  {expiringSoonCount > 0 ? 'Action needed' : 'All clear'}
                </span>
              </div>
              <p className={`text-sm font-bold mb-2 uppercase tracking-wide ${
                expiringSoonCount > 0 ? 'text-amber-700' : 'text-gray-600'
              }`}>
                Expiring Within 30 Days
              </p>
              <MetricCardValue
                compact={String(expiringSoonCount)}
                full={String(expiringSoonCount)}
                colorClass={expiringSoonCount > 0 ? 'text-amber-900' : 'text-gray-700'}
              />
            </div>

          </div>
        </div>
      )}

      {/* Time Tracking — Unbilled Hours */}
      {hasActiveSubscription && hasTimeEntries && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Unbilled Time
            </h2>
            <Link href="/dashboard/time" className="text-blue-600 hover:text-blue-700 font-bold text-sm transition-colors">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* Unbilled Hours */}
            <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl p-8 border-2 border-sky-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs font-bold text-sky-700 uppercase tracking-wider bg-sky-200 px-3 py-1.5 rounded-full">Unbilled</span>
              </div>
              <p className="text-sm font-bold text-sky-700 mb-2 uppercase tracking-wide">Unbilled Hours</p>
              <MetricCardValue
                compact={`${unbilledHours}h`}
                full={`${unbilledHours} hours`}
                colorClass="text-sky-900"
              />
              <p className="text-xs text-sky-500 font-medium mt-2">Ready to invoice</p>
            </div>

            {/* Unbilled Value */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-8 border-2 border-teal-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs font-bold text-teal-700 uppercase tracking-wider bg-teal-200 px-3 py-1.5 rounded-full">
                  {unbilledValue > 0 ? 'Earnable' : 'No rate set'}
                </span>
              </div>
              <p className="text-sm font-bold text-teal-700 mb-2 uppercase tracking-wide">Unbilled Value</p>
              {unbilledValue > 0 ? (
                <>
                  <MetricCardValue
                    compact={formatCurrencyCompact(unbilledValue)}
                    full={formatCurrencyFull(unbilledValue)}
                    colorClass="text-teal-900"
                  />
                  <Link
                    href="/dashboard/invoices/new"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors"
                  >
                    Invoice these hours →
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-2xl font-black text-teal-300">—</p>
                  <p className="text-xs text-teal-500 font-medium mt-1">
                    Set hourly rates on clients to see value
                  </p>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        <div className="bg-white rounded-2xl p-10 border-2 border-gray-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Revenue Trend</h2>
              <p className="text-sm text-gray-600 font-medium">Last 6 months performance</p>
            </div>
          </div>
          {hasInvoices && totalRevenue > 0 ? (
            <RevenueChart data={revenueChartData} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">No revenue data yet</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-sm font-medium">
                {hasActiveSubscription
                  ? 'Create and send invoices to start tracking your revenue growth'
                  : 'Subscribe to start creating invoices and tracking revenue'}
              </p>
              {hasActiveSubscription ? (
                <Link href="/dashboard/invoices/new" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all hover:shadow-lg">
                  Create First Invoice
                </Link>
              ) : (
                <Link href="/pricing" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all hover:shadow-lg">
                  {hasEverSubscribed ? 'Subscribe Now' : 'Start Free Trial'}
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-10 border-2 border-gray-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Invoice Status</h2>
              <p className="text-sm text-gray-600 font-medium">Current distribution breakdown</p>
            </div>
          </div>
          {hasInvoices ? (
            <StatusChart data={statusChartData} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">No invoices yet</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-sm font-medium">
                {hasActiveSubscription
                  ? 'Create your first invoice to start tracking payments'
                  : 'Subscribe to start creating and tracking invoices'}
              </p>
              {hasActiveSubscription ? (
                <Link href="/dashboard/invoices/new" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all hover:shadow-lg">
                  Create First Invoice
                </Link>
              ) : (
                <Link href="/pricing" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all hover:shadow-lg">
                  {hasEverSubscribed ? 'Subscribe Now' : 'Start Free Trial'}
                </Link>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Live Activity Feed */}
      {recentActivity.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-lg">⚡</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Live Activity</h2>
                <p className="text-sm text-gray-500 font-medium">Everything that has happened in your business</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-bold text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          </div>
          <div className="space-y-1">
            {recentActivity.map((item, idx) => {
              // Friendly relative time
              const ts   = new Date(item.timestamp)
              const diff = Math.floor((Date.now() - ts.getTime()) / 1000)
              const timeLabel =
                diff < 60        ? 'just now'
                : diff < 3600    ? `${Math.floor(diff / 60)}m ago`
                : diff < 86400   ? `${Math.floor(diff / 3600)}h ago`
                : diff < 604800  ? `${Math.floor(diff / 86400)}d ago`
                : ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

              const bgColor =
                item.type === 'invoice_sent'    ? 'bg-blue-50 text-blue-600'
                : item.type === 'payment_logged'  ? 'bg-teal-50 text-teal-600'
                : item.type === 'contract_signed' ? 'bg-green-50 text-green-600'
                : 'bg-amber-50 text-amber-600'

              return (
                <div key={item.id} className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${bgColor}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-400 font-medium truncate mt-0.5">{item.detail}</p>
                  </div>
                  <span className="text-xs text-gray-300 font-medium flex-shrink-0 group-hover:text-gray-400 transition-colors">{timeLabel}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Invoices & Clients */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 overflow-hidden">
          <div className="px-8 pt-8 pb-5 flex items-center justify-between border-b-2 border-gray-50">
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Recent Invoices</h2>
              <p className="text-sm text-gray-500 font-medium mt-0.5">Latest {recentInvoices.length} invoices</p>
            </div>
            {hasInvoices && (
              <Link href="/dashboard/invoices" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                View all →
              </Link>
            )}
          </div>

          {!hasInvoices ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-8">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="text-base font-black text-gray-900 mb-1">No invoices yet</h3>
              <p className="text-sm text-gray-500 mb-5 font-medium">
                {hasActiveSubscription ? 'Create your first invoice to get started' : 'Subscribe to start creating invoices'}
              </p>
              <Link
                href={hasActiveSubscription ? '/dashboard/invoices/new' : '/pricing'}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all hover:shadow-lg"
              >
                {hasActiveSubscription ? 'Create Invoice' : hasEverSubscribed ? 'Subscribe Now' : 'Start Free Trial'}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentInvoices.map(inv => {
                const statusColors: Record<string, string> = {
                  draft: 'bg-gray-100 text-gray-600 border border-gray-200',
                  sent: 'bg-blue-50 text-blue-700 border border-blue-200',
                  paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                  overdue: 'bg-red-50 text-red-700 border border-red-200',
                }
                const isOverdueInv = inv.displayStatus === 'overdue'
                return (
                  <Link
                    key={inv.id}
                    href={`/dashboard/invoices/${inv.id}`}
                    className="flex items-center gap-4 px-8 py-5 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-sm text-gray-900 font-mono">{inv.invoice_number}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wide ${statusColors[inv.displayStatus] ?? statusColors.draft}`}>
                          {inv.displayStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 font-medium truncate">{inv.clients?.name || '—'}</span>
                        <span className="text-gray-300 text-xs">·</span>
                        <span className={`text-xs font-semibold ${isOverdueInv ? 'text-red-500' : 'text-gray-400'}`}>
                          Due {new Date(inv.due_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-gray-900 flex-shrink-0 group-hover:text-blue-600 transition-colors">
                      {formatCurrencyCompact(inv.total_amount)}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Clients */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 overflow-hidden">
          <div className="px-8 pt-8 pb-5 flex items-center justify-between border-b-2 border-gray-50">
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Recent Clients</h2>
              <p className="text-sm text-gray-500 font-medium mt-0.5">Latest {clients.length} clients</p>
            </div>
            {hasClients && (
              <Link href="/dashboard/clients" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                View all →
              </Link>
            )}
          </div>

          {!hasClients ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-8">
              <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-teal-500" />
              </div>
              <h3 className="text-base font-black text-gray-900 mb-1">No clients yet</h3>
              <p className="text-sm text-gray-500 mb-5 font-medium">
                {hasActiveSubscription ? 'Add your first client to get started' : 'Subscribe to start adding clients'}
              </p>
              <Link
                href={hasActiveSubscription ? '/dashboard/clients/new' : '/pricing'}
                className="bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-teal-700 transition-all hover:shadow-lg"
              >
                {hasActiveSubscription ? 'Add Client' : hasEverSubscribed ? 'Subscribe Now' : 'Start Free Trial'}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {clients.map(client => (
                <Link
                  key={client.id}
                  href={`/dashboard/clients/${client.id}`}
                  className="flex items-center gap-4 px-8 py-5 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-teal-700 text-sm font-black">
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {client.name}
                    </p>
                    <p className="text-sm text-gray-400 font-medium truncate">
                      {client.company || client.email || '—'}
                    </p>
                  </div>
                  {client.email && (
                    <span className="text-xs text-gray-400 font-medium flex-shrink-0 hidden lg:block truncate max-w-36">
                      {client.email}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}