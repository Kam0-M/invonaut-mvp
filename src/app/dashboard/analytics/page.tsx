// src/app/dashboard/analytics/page.tsx
// Fully redesigned with psychology-driven layout:
// Business Health Score → AI Insights → Metrics → Invoice Health →
// Revenue Intelligence → Client Intelligence → Expense Breakdown → 12-month chart
export const dynamic = 'force-dynamic'

import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import Link               from 'next/link'
import {
  TrendingUp, FileText, CheckCircle2, AlertCircle,
  Clock, Banknote, BarChart3, Zap, ArrowRight,
  TrendingDown, Activity, Target, Lock,
} from 'lucide-react'
import { ExpenseBreakdownChart }   from '@/components/dashboard/expense-breakdown-chart'
import { StackedRevenueChart }     from '@/components/analytics/stacked-revenue-chart'
import { EXPENSE_CATEGORIES }      from '@/lib/ai/expense-categorization'
import { getInvoiceDisplayStatus } from '@/lib/utils/invoice-status'
import ClientIntelligencePanel     from '@/components/analytics/client-intelligence-panel'
import type { ClientStat }         from '@/components/analytics/client-intelligence-panel'
import BackToTop from '@/components/ui/back-to-top'
import { makeCurrencyFormatter } from '@/lib/context/currency-context'

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtFull = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)

const fmt = (n: number): string => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 999_500)       return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000)        return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}

const yFmt = (v: number) => {
  if (v === 0)        return '$0'
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `$${Math.round(v / 1_000)}K`
  return `$${v}`
}

const categoryChartColors: Record<string, string> = {
  software: '#0066FF', hardware: '#6B7280', travel: '#F59E0B',
  meals: '#FF6B35', marketing: '#EC4899', office: '#00D4AA',
  professional: '#6366F1', utilities: '#14B8A6', education: '#8B5CF6',
  insurance: '#22C55E', taxes: '#EF4444', other: '#9CA3AF',
}

// ─── Sort config ──────────────────────────────────────────────────────────────
type SortKey  = 'revenue' | 'rate' | 'invoices' | 'overdue'
type LimitVal = 5 | 10 | 20
type ViewMode = 'list' | 'table' | 'revenue' | 'rate'
type Orient   = 'v' | 'h'

const SORT_OPTIONS = [
  { key: 'revenue'  as SortKey, label: 'Revenue',     description: 'Highest total paid value'  },
  { key: 'rate'     as SortKey, label: 'Pay Rate',     description: 'Most consistent payment'   },
  { key: 'invoices' as SortKey, label: 'Most Active',  description: 'Most invoices issued'      },
  { key: 'overdue'  as SortKey, label: 'Overdue Risk', description: 'Most overdue invoices'     },
]
const LIMIT_OPTIONS:  LimitVal[] = [5, 10, 20]
const VIEW_OPTIONS:   ViewMode[] = ['list', 'table', 'revenue', 'rate']
const ORIENT_OPTIONS: Orient[]   = ['v', 'h']

// ─── Business Health Score ────────────────────────────────────────────────────
function computeHealthScore(params: {
  collectionRate:     number | null
  profitMargin:       number | null
  overdueRatio:       number   // overdue / total invoices
  revenueGrowth:      number | null  // pct change vs prev month
  hasData:            boolean
}): { score: number; grade: 'A' | 'B' | 'C' | 'D' | 'F'; color: string; bg: string; border: string; glow: string; label: string; sub: string } {
  if (!params.hasData) return {
    score: 0, grade: 'F',
    color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200',
    glow: '0 0 28px rgba(107,114,128,0.10)',
    label: 'No data yet', sub: 'Start invoicing to generate your score'
  }

  let score = 0

  // Collection rate (0–35 pts)
  const cr = params.collectionRate ?? 50
  score += Math.round((cr / 100) * 35)

  // Profit margin (0–30 pts) — negative margin = 0
  const pm = Math.max(0, Math.min(100, params.profitMargin ?? 0))
  score += Math.round((pm / 100) * 30)

  // Overdue penalty (0–20 pts, 20 = no overdue)
  const odPenalty = Math.round(params.overdueRatio * 20)
  score += Math.max(0, 20 - odPenalty)

  // Revenue growth bonus (0–15 pts)
  const rg = params.revenueGrowth ?? 0
  if (rg > 20)  score += 15
  else if (rg > 0)  score += 8
  else if (rg === 0) score += 4

  score = Math.min(100, Math.max(0, score))

  if (score >= 85) return { score, grade: 'A', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200', glow: '0 0 40px rgba(0,212,170,0.15)', label: 'Excellent', sub: 'Your business is firing on all cylinders' }
  if (score >= 70) return { score, grade: 'B', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', glow: '0 0 40px rgba(0,102,255,0.12)', label: 'Good', sub: 'Solid performance with room to grow' }
  if (score >= 55) return { score, grade: 'C', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', glow: '0 0 40px rgba(217,119,6,0.12)', label: 'Fair', sub: 'Some areas need attention' }
  if (score >= 35) return { score, grade: 'D', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', glow: '0 0 40px rgba(255,107,53,0.12)', label: 'At risk', sub: 'Take action on overdue invoices and margins' }
  return { score, grade: 'F', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', glow: '0 0 40px rgba(239,68,68,0.12)', label: 'Critical', sub: 'Immediate attention needed across multiple areas' }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ sortBy?: string; limit?: string; viewMode?: string; orientation?: string }>
}) {
  const params      = await searchParams
  const sortBy      = (SORT_OPTIONS.map(s => s.key).includes(params.sortBy as SortKey) ? params.sortBy : 'revenue') as SortKey
  const limit       = LIMIT_OPTIONS.includes(Number(params.limit) as LimitVal) ? (Number(params.limit) as LimitVal) : 10
  const viewMode    = (VIEW_OPTIONS.includes(params.viewMode as ViewMode) ? params.viewMode : 'list') as ViewMode
  const orientation = (ORIENT_OPTIONS.includes(params.orientation as Orient) ? params.orientation : 'v') as Orient

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_subscription_id, subscription_status, subscription_tier')
    .eq('id', user.id).single()

  const fmt = makeCurrencyFormatter((profile as any)?.currency || 'USD', (profile as any)?.currency_symbol || '$')
  const hasActiveSubscription = !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')

  const tier  = profile?.subscription_tier ?? 'starter'
  const isPro = tier === 'professional' || tier === 'business'

  // ── Data fetching (parallel) ──────────────────────────────────────────────
  const [
    { data: invoicesRaw },
    { data: clientsRaw },
    { data: expensesRaw },
    { data: directPaymentsRaw },
    { data: revCategoriesRaw },
  ] = await Promise.all([
    supabase.from('invoices').select('id, status, issue_date, due_date, total_amount, client_id, revenue_category_id').eq('user_id', user.id),
    supabase.from('clients').select('id, name, company').eq('user_id', user.id),
    supabase.from('expenses').select('amount, category, date').eq('user_id', user.id),
    supabase.from('direct_payments').select('id, amount, payment_type, payment_method, payment_date, revenue_category_id, client_id').eq('user_id', user.id),
    supabase.from('revenue_categories').select('id, name, color').eq('user_id', user.id),
  ])

  const invoices       = (invoicesRaw ?? []).map((inv: any) => ({ ...inv, displayStatus: getInvoiceDisplayStatus({ status: inv.status, due_date: inv.due_date }) }))
  const clients        = (clientsRaw  ?? []) as { id: string; name: string; company: string | null }[]
  const expenses       = (expensesRaw ?? []) as { amount: number; category: string; date: string }[]
  const directPayments = (directPaymentsRaw ?? []) as { id: string; amount: number; payment_type: string; payment_method: string; payment_date: string; revenue_category_id: string | null; client_id: string | null }[]
  const revCategories  = (revCategoriesRaw ?? []) as { id: string; name: string; color: string }[]
  const catMap         = new Map(revCategories.map(c => [c.id, c]))

  // ── Summary metrics ───────────────────────────────────────────────────────
  const paidInvoices    = invoices.filter(i => i.displayStatus === 'paid')
  const sentInvoices    = invoices.filter(i => ['sent','paid','overdue'].includes(i.displayStatus))
  const overdueInvoices = invoices.filter(i => i.displayStatus === 'overdue')
  const draftInvoices   = invoices.filter(i => i.displayStatus === 'draft')
  const activeSent      = invoices.filter(i => i.displayStatus === 'sent')

  const invoiceRevenue  = paidInvoices.reduce((s, i) => s + Number(i.total_amount || 0), 0)
  const directRevenue   = directPayments.reduce((s, p) => s + Number(p.amount || 0), 0)
  const totalRevenue    = invoiceRevenue + directRevenue
  const totalExpenses   = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const netProfit       = totalRevenue - totalExpenses
  const isProfitable    = netProfit >= 0
  const profitMargin    = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : null
  const overdueValue    = overdueInvoices.reduce((s, i) => s + Number(i.total_amount || 0), 0)
  const pendingValue    = activeSent.reduce((s, i) => s + Number(i.total_amount || 0), 0)
  const avgInvoiceSize  = paidInvoices.length > 0 ? invoiceRevenue / paidInvoices.length : 0
  const collectionRate  = sentInvoices.length > 0 ? Math.round((paidInvoices.length / sentInvoices.length) * 100) : null
  const overdueRatio    = invoices.length > 0 ? overdueInvoices.length / invoices.length : 0

  // Month-over-month revenue growth
  const now = new Date()
  const thisMonth = (() => {
    const y = now.getFullYear(), m = now.getMonth()
    return paidInvoices.filter(i => { const d = new Date(i.issue_date + 'T12:00:00'); return d.getFullYear()===y && d.getMonth()===m })
      .reduce((s, i) => s + Number(i.total_amount||0), 0)
    + directPayments.filter(p => { const d = new Date(p.payment_date + 'T12:00:00'); return d.getFullYear()===y && d.getMonth()===m })
      .reduce((s, p) => s + Number(p.amount||0), 0)
  })()
  const lastMonth = (() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const y = d.getFullYear(), m = d.getMonth()
    return paidInvoices.filter(i => { const dd = new Date(i.issue_date + 'T12:00:00'); return dd.getFullYear()===y && dd.getMonth()===m })
      .reduce((s, i) => s + Number(i.total_amount||0), 0)
    + directPayments.filter(p => { const dd = new Date(p.payment_date + 'T12:00:00'); return dd.getFullYear()===y && dd.getMonth()===m })
      .reduce((s, p) => s + Number(p.amount||0), 0)
  })()
  const revenueGrowth = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null

  // ── Business Health Score ─────────────────────────────────────────────────
  const health = computeHealthScore({
    collectionRate, profitMargin, overdueRatio, revenueGrowth,
    hasData: invoices.length > 0 || directPayments.length > 0,
  })

  // ── Revenue intelligence ──────────────────────────────────────────────────
  const invoiceSourcePct = totalRevenue > 0 ? Math.round((invoiceRevenue / totalRevenue) * 100) : 0
  const directSourcePct  = totalRevenue > 0 ? 100 - invoiceSourcePct : 0

  const revByCategoryMap = new Map<string, { name: string; color: string; total: number }>()
  let uncategorizedTotal = 0
  ;[...paidInvoices.map(i => ({ amount: Number(i.total_amount||0), catId: i.revenue_category_id })),
    ...directPayments.map(p => ({ amount: Number(p.amount||0), catId: p.revenue_category_id }))
  ].forEach(({ amount, catId }) => {
    if (catId && catMap.has(catId)) {
      const cat = catMap.get(catId)!
      const ex  = revByCategoryMap.get(catId)
      revByCategoryMap.set(catId, { name: cat.name, color: cat.color, total: (ex?.total ?? 0) + amount })
    } else { uncategorizedTotal += amount }
  })
  const revByCategory = Array.from(revByCategoryMap.values()).sort((a, b) => b.total - a.total)
  if (uncategorizedTotal > 0) revByCategory.push({ name: 'Uncategorized', color: '#9CA3AF', total: uncategorizedTotal })

  const methodTotals: Record<string, number> = { invoice: invoiceRevenue }
  directPayments.forEach(p => { methodTotals[p.payment_method] = (methodTotals[p.payment_method] || 0) + Number(p.amount || 0) })
  const METHOD_LABELS: Record<string, string> = { invoice: 'Invoice', cash: 'Cash', bank: 'Bank Transfer', mobile: 'Mobile Money', pos: 'POS' }
  const revByMethod = Object.entries(methodTotals)
    .map(([method, total]) => ({ method, label: METHOD_LABELS[method] ?? method, total }))
    .filter(m => m.total > 0).sort((a, b) => b.total - a.total)

  // ── Per-client stats ──────────────────────────────────────────────────────
  const clientMap = new Map<string, ClientStat>()
  clients.forEach(c => clientMap.set(c.id, { id: c.id, name: c.name, company: c.company, totalRevenue: 0, paidCount: 0, overdueCount: 0, totalSent: 0, totalInvoices: 0, collectionRate: null }))
  invoices.forEach(inv => {
    if (!inv.client_id) return
    const e = clientMap.get(inv.client_id)
    if (!e) return
    e.totalInvoices++
    if (inv.displayStatus === 'paid')    { e.totalRevenue += Number(inv.total_amount||0); e.paidCount++; e.totalSent++ }
    else if (inv.displayStatus === 'sent')    { e.totalSent++ }
    else if (inv.displayStatus === 'overdue') { e.overdueCount++; e.totalSent++ }
  })
  // Add direct payment revenue per client (unified revenue — Phase 14/15)
  directPayments.forEach(p => {
    if (!p.client_id) return
    const e = clientMap.get(p.client_id)
    if (e) e.totalRevenue += Number(p.amount || 0)
  })
  clientMap.forEach(c => { c.collectionRate = c.totalSent > 0 ? Math.round((c.paidCount / c.totalSent) * 100) : null })
  const allClientStats = Array.from(clientMap.values()).filter(c => c.totalRevenue > 0 || c.totalInvoices > 0)
  const sortedClients = [...allClientStats].sort((a, b) => {
    switch (sortBy) {
      case 'rate':
        if (a.collectionRate === null && b.collectionRate === null) return b.totalRevenue - a.totalRevenue
        if (a.collectionRate === null) return 1
        if (b.collectionRate === null) return -1
        if (b.collectionRate !== a.collectionRate) return b.collectionRate - a.collectionRate
        return b.totalRevenue - a.totalRevenue
      case 'invoices':
        return b.totalInvoices !== a.totalInvoices ? b.totalInvoices - a.totalInvoices : b.totalRevenue - a.totalRevenue
      case 'overdue':
        if (b.overdueCount !== a.overdueCount) return b.overdueCount - a.overdueCount
        const aRate = a.collectionRate ?? 100, bRate = b.collectionRate ?? 100
        return aRate !== bRate ? aRate - bRate : b.totalRevenue - a.totalRevenue
      default: return b.totalRevenue - a.totalRevenue
    }
  }).slice(0, limit)

  // ── Expense breakdown ─────────────────────────────────────────────────────
  const categoryBreakdown = EXPENSE_CATEGORIES
    .map(cat => ({ name: cat.label, value: expenses.filter(e => e.category === cat.value).reduce((s, e) => s + Number(e.amount||0), 0), color: categoryChartColors[cat.value] ?? '#9CA3AF' }))
    .filter(c => c.value > 0).sort((a, b) => b.value - a.value)

  // ── 12-month chart data ───────────────────────────────────────────────────
  const revExpData = Array.from({ length: 12 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - idx), 1)
    const y = d.getFullYear(), m = d.getMonth()
    const invRev = paidInvoices.filter((i: any) => { const dd = new Date(i.issue_date+'T12:00:00'); return dd.getFullYear()===y && dd.getMonth()===m }).reduce((s: number, i: any) => s + Number(i.total_amount||0), 0)
    const dirRev = directPayments.filter(p => { const dd = new Date(p.payment_date+'T12:00:00'); return dd.getFullYear()===y && dd.getMonth()===m }).reduce((s, p) => s + Number(p.amount||0), 0)
    const exp    = expenses.filter(e => { const dd = new Date(e.date+'T12:00:00'); return dd.getFullYear()===y && dd.getMonth()===m }).reduce((s, e) => s + Number(e.amount||0), 0)
    return { month: d.toLocaleString('en-US', { month: 'short' }), invoiceRev: invRev, directRev: dirRev, revenue: invRev + dirRev, expenses: exp, profit: invRev + dirRev - exp }
  })

  const overdueCount = overdueInvoices.length

  // ── AI insights ───────────────────────────────────────────────────────────
  type Insight = { text: string; color: string; href: string }
  const insights: Insight[] = []
  if (overdueValue > 0)    insights.push({ text: `${fmt(overdueValue)} in overdue invoices — recoverable now`, color: 'bg-red-50 text-red-700 border-red-200', href: '/dashboard/invoices?status=overdue' })
  if (revenueGrowth !== null && revenueGrowth >= 15) insights.push({ text: `Revenue up ${revenueGrowth}% vs last month — strong momentum`, color: 'bg-teal-50 text-teal-700 border-teal-200', href: '/dashboard/analytics' })
  if (revenueGrowth !== null && revenueGrowth < -10) insights.push({ text: `Revenue down ${Math.abs(revenueGrowth)}% vs last month — review pipeline`, color: 'bg-amber-50 text-amber-700 border-amber-200', href: '/dashboard/invoices?status=sent' })
  if (pendingValue > 0)    insights.push({ text: `${fmt(pendingValue)} in the pipeline — ${activeSent.length} sent invoice${activeSent.length !== 1 ? 's' : ''} outstanding`, color: 'bg-blue-50 text-blue-700 border-blue-200', href: '/dashboard/invoices?status=sent' })
  if (collectionRate !== null && collectionRate >= 90 && overdueCount === 0) insights.push({ text: `${collectionRate}% collection rate — your clients pay reliably`, color: 'bg-teal-50 text-teal-700 border-teal-200', href: '/dashboard/analytics' })

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Analytics</p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-black text-gray-900">Business Intelligence</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Activity className="w-3 h-3" />AI-powered
            </span>
          </div>
        </div>
        <Link href="/dashboard/cash"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0">
          Cash flow →
        </Link>
      </div>

      {!hasActiveSubscription ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-blue-600" />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2">Subscribe to unlock Analytics</h3>
          <p className="text-sm text-gray-500 font-medium max-w-sm mx-auto mb-6">
            Get full visibility into your revenue, expenses, and client behavior.
          </p>
          <Link href="/pricing" className="inline-flex items-center gap-2 btn-primary px-5 py-2.5 rounded-xl text-sm">
            View Plans
          </Link>
        </div>
      ) : !isPro ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center" style={{ boxShadow: '0 0 32px rgba(0,102,255,0.08)' }}>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Professional Plan</p>
          <h3 className="text-xl font-black text-gray-900 mb-2">Revenue Intelligence & Analytics</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            Business health score, client intelligence, expense breakdown, 12-month revenue trends, and AI-powered insights — all in one view.
          </p>
          <Link href="/dashboard/billing" className="btn-primary px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
            <Zap className="w-4 h-4" />Upgrade to Professional
          </Link>
        </div>
      ) : (
        <>
          {/* ── AI insight strip ─────────────────────────────────────────── */}
          {insights.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white flex-shrink-0">
                <Zap className="w-3.5 h-3.5" /><span className="text-xs font-black tracking-wide">AI</span>
              </div>
              {insights.slice(0, 2).map((ins, i) => (
                <Link key={i} href={ins.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold hover:shadow-sm hover:-translate-y-0.5 transition-all ${ins.color}`}>
                  {ins.text}
                </Link>
              ))}
            </div>
          )}

          {/* ── Business Health Score ─────────────────────────────────────── */}
          <div
            className={`relative overflow-hidden rounded-2xl border p-6 inv-fade-up inv-fade-up-1 ${health.border} ${health.bg}`}
            style={{ boxShadow: health.glow }}
          >
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-5">
                {/* Score circle */}
                <div className="relative flex-shrink-0">
                  <svg width="80" height="80" className="-rotate-90">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-200" />
                    <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="6"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${2 * Math.PI * 32 * (1 - health.score / 100)}`}
                      strokeLinecap="round"
                      className={health.color}
                      style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl font-black ${health.color}`}>{health.grade}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Business Health Score</p>
                  <h2 className={`text-2xl font-black ${health.color}`}>{health.label}</h2>
                  <p className="text-sm text-gray-500 font-medium mt-0.5">{health.sub}</p>
                </div>
              </div>

              {/* Score breakdown pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Collection',    value: collectionRate !== null ? `${collectionRate}%` : '—', good: (collectionRate ?? 0) >= 80 },
                  { label: 'Profit margin', value: profitMargin !== null ? `${profitMargin}%` : '—',     good: (profitMargin ?? 0) > 0   },
                  { label: 'Overdue risk',  value: `${overdueCount} inv.`,                              good: overdueCount === 0         },
                  { label: 'MoM growth',    value: revenueGrowth !== null ? `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth}%` : '—', good: (revenueGrowth ?? 0) >= 0 },
                ].map(item => (
                  <div key={item.label}
                    className={`px-3 py-2 rounded-xl border text-center ${item.good ? 'bg-white/70 border-gray-200' : 'bg-red-50/70 border-red-200'}`}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{item.label}</p>
                    <p className={`text-sm font-black mt-0.5 ${item.good ? 'text-gray-900' : 'text-red-600'}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Score bar */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Score {health.score}/100</p>
                <div className="flex items-center gap-3 text-[10px] font-bold text-gray-300">
                  <span>0</span><span>Critical</span><span className="text-gray-400">→</span><span>Excellent</span><span>100</span>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${
                  health.grade === 'A' ? 'bg-teal-500' :
                  health.grade === 'B' ? 'bg-blue-500' :
                  health.grade === 'C' ? 'bg-amber-500' :
                  health.grade === 'D' ? 'bg-orange-500' : 'bg-red-500'
                }`} style={{ width: `${health.score}%` }} />
              </div>
            </div>
          </div>

          {/* ── 4 core metric cards ───────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 inv-fade-up inv-fade-up-2">

            <Link href="/dashboard/invoices"
              className="bg-white rounded-2xl border border-blue-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group inv-glow-blue">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition-colors" />
              </div>
              <p className="text-2xl font-black text-gray-900 leading-none mb-1" title={fmtFull(totalRevenue)}>{fmt(totalRevenue)}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Revenue</p>
              {revenueGrowth !== null && (
                <p className={`text-xs font-bold mt-1 ${revenueGrowth >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                  {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth}% vs last month
                </p>
              )}
            </Link>

            <Link href="/dashboard/expenses"
              className="bg-white rounded-2xl border border-orange-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              style={{ boxShadow: '0 0 28px rgba(255,107,53,0.08), 0 2px 12px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-orange-400 transition-colors" />
              </div>
              <p className="text-2xl font-black text-gray-900 leading-none mb-1" title={fmtFull(totalExpenses)}>{fmt(totalExpenses)}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Expenses</p>
              {totalRevenue > 0 && (
                <p className="text-xs font-bold mt-1 text-orange-500">
                  {Math.round((totalExpenses / totalRevenue) * 100)}% of revenue
                </p>
              )}
            </Link>

            <div className={`bg-white rounded-2xl border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${isProfitable ? 'border-teal-100' : 'border-red-100'}`}
              style={{ boxShadow: isProfitable ? '0 0 28px rgba(0,212,170,0.10)' : '0 0 28px rgba(239,68,68,0.10)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isProfitable ? 'bg-teal-500' : 'bg-red-500'}`}>
                  {isProfitable ? <TrendingUp className="w-4 h-4 text-white" /> : <TrendingDown className="w-4 h-4 text-white" />}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isProfitable ? 'bg-teal-50 text-teal-700' : 'bg-red-50 text-red-700'}`}>
                  {isProfitable ? 'Profit' : 'Loss'}
                </span>
              </div>
              <p className="text-2xl font-black text-gray-900 leading-none mb-1" title={fmtFull(Math.abs(netProfit))}>{fmt(Math.abs(netProfit))}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Net {isProfitable ? 'Profit' : 'Loss'}</p>
              {profitMargin !== null && (
                <p className={`text-xs font-bold mt-1 ${isProfitable ? 'text-teal-600' : 'text-red-500'}`}>
                  {isProfitable ? '+' : ''}{profitMargin}% margin
                </p>
              )}
            </div>

            <Link href="/dashboard/invoices"
              className={`bg-white rounded-2xl border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group ${
                collectionRate === null ? 'border-gray-100' : collectionRate >= 80 ? 'border-teal-100' : collectionRate >= 60 ? 'border-amber-100' : 'border-red-100'
              }`}
              style={{ boxShadow: collectionRate !== null && collectionRate >= 80 ? '0 0 28px rgba(0,212,170,0.10)' : collectionRate !== null && collectionRate < 60 ? '0 0 28px rgba(239,68,68,0.10)' : 'none' }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  collectionRate === null ? 'bg-gray-300' : collectionRate >= 80 ? 'bg-teal-500' : collectionRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                }`}>
                  <Target className="w-4 h-4 text-white" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-teal-400 transition-colors" />
              </div>
              <p className={`text-2xl font-black leading-none mb-1 ${
                collectionRate === null ? 'text-gray-400' : collectionRate >= 80 ? 'text-teal-700' : collectionRate >= 60 ? 'text-amber-700' : 'text-red-700'
              }`}>{collectionRate !== null ? `${collectionRate}%` : '—'}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Collection Rate</p>
              <p className="text-xs text-gray-400 font-medium mt-1">{paidInvoices.length} of {sentInvoices.length} invoices paid</p>
            </Link>
          </div>

          {/* ── Invoice Health ────────────────────────────────────────────── */}
          {invoices.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 inv-fade-up inv-fade-up-3">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice Health</p>
                    <p className="text-sm font-black text-gray-900 mt-0.5">Pipeline breakdown</p>
                  </div>
                </div>
                <Link href="/dashboard/invoices" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                  View all →
                </Link>
              </div>

              {/* Pipeline bar */}
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex mb-3">
                {[
                  { s: 'paid',    count: paidInvoices.length,   color: '#00D4AA' },
                  { s: 'sent',    count: activeSent.length,     color: '#0066FF' },
                  { s: 'overdue', count: overdueInvoices.length, color: '#EF4444' },
                  { s: 'draft',   count: draftInvoices.length,  color: '#E5E7EB' },
                ].filter(s => s.count > 0).map(s => (
                  <div key={s.s} title={`${s.s}: ${s.count}`} className="h-full transition-all"
                    style={{ width: `${(s.count / invoices.length) * 100}%`, background: s.color }} />
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Paid',    count: paidInvoices.length,    value: invoiceRevenue, color: 'text-teal-600', dot: '#00D4AA', href: '/dashboard/invoices?status=paid' },
                  { label: 'Sent',    count: activeSent.length,      value: pendingValue,   color: 'text-blue-600', dot: '#0066FF', href: '/dashboard/invoices?status=sent' },
                  { label: 'Overdue', count: overdueInvoices.length, value: overdueValue,   color: 'text-red-600',  dot: '#EF4444', href: '/dashboard/invoices?status=overdue' },
                  { label: 'Draft',   count: draftInvoices.length,   value: null,           color: 'text-gray-500', dot: '#D1D5DB', href: '/dashboard/invoices?status=draft' },
                ].map(item => (
                  <Link key={item.label} href={item.href}
                    className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.dot }} />
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{item.label}</p>
                    </div>
                    <p className={`text-xl font-black ${item.color}`}>{item.count}</p>
                    {item.value !== null && item.value > 0 && (
                      <p className="text-xs text-gray-400 font-medium mt-0.5" title={fmtFull(item.value)}>{fmt(item.value)}</p>
                    )}
                  </Link>
                ))}
              </div>

              {avgInvoiceSize > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-xs text-gray-600">
                    <span className="font-bold text-blue-700">Insight: </span>
                    Average paid invoice is <span className="font-bold">{fmt(avgInvoiceSize)}</span>.
                    {overdueValue > 0 && <> Recovering <span className="font-bold text-red-600">{fmt(overdueValue)}</span> in overdue invoices would {totalRevenue > 0 ? `increase total revenue by ${Math.round((overdueValue/totalRevenue)*100)}%` : 'unlock significant cash flow'}.</>}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Revenue Intelligence ─────────────────────────────────────── */}
          {totalRevenue > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 inv-fade-up inv-fade-up-3">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center">
                  <Banknote className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue Intelligence</p>
                  <p className="text-sm font-black text-gray-900 mt-0.5">Where your money comes from</p>
                </div>
              </div>

              {/* By Source */}
              <div className="mb-6">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">By Source</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    { label: 'Invoice Income',   value: invoiceRevenue, pct: invoiceSourcePct, color: '#0066FF', cls: 'bg-blue-50 border-blue-100' },
                    { label: 'Direct Payments',  value: directRevenue,  pct: directSourcePct,  color: '#00D4AA', cls: 'bg-teal-50 border-teal-100' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl p-4 border ${s.cls}`}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{s.label}</p>
                      <p className="text-xl font-black text-gray-900" title={fmtFull(s.value)}>{fmt(s.value)}</p>
                      <p className="text-xs font-bold mt-1" style={{ color: s.color }}>{s.pct}% of total</p>
                    </div>
                  ))}
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  {invoiceSourcePct > 0 && <div className="h-full bg-blue-600" style={{ width: `${invoiceSourcePct}%` }} />}
                  {directSourcePct  > 0 && <div className="h-full bg-teal-400" style={{ width: `${directSourcePct}%`  }} />}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-4">
                    {[{ l: 'Invoice', c: '#0066FF' },{ l: 'Direct', c: '#00D4AA' }].map(x => (
                      <div key={x.l} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: x.c }} />
                        <span className="text-xs font-medium text-gray-500">{x.l}</span>
                      </div>
                    ))}
                  </div>
                  {/* P15-C: Income reliability insight */}
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                    invoiceSourcePct >= 70 ? 'bg-teal-50 text-teal-700' :
                    invoiceSourcePct >= 40 ? 'bg-blue-50 text-blue-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {invoiceSourcePct >= 70 ? 'High predictability' :
                     invoiceSourcePct >= 40 ? 'Mixed sources' :
                     totalRevenue === 0     ? 'No revenue yet' :
                                             'Mostly direct income'}
                  </span>
                </div>
              </div>

              {/* By Category */}
              {revByCategory.length > 0 && (
                <div className="mb-6">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">By Category</p>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-center">
                    <ExpenseBreakdownChart data={revByCategory.map(c => ({ name: c.name, value: c.total, color: c.color }))} />
                    <div className="space-y-2">
                      {revByCategory.map(cat => (
                        <div key={cat.name} className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-sm font-bold text-gray-700 truncate">{cat.name}</span>
                              <span className="text-sm font-black text-gray-900 flex-shrink-0" title={fmtFull(cat.total)}>{fmt(cat.total)}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${totalRevenue > 0 ? (cat.total/totalRevenue)*100 : 0}%`, backgroundColor: cat.color }} />
                            </div>
                          </div>
                          <span className="text-xs font-bold text-gray-400 flex-shrink-0 w-9 text-right">
                            {totalRevenue > 0 ? Math.round((cat.total/totalRevenue)*100) : 0}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {revByCategory.length === 1 && revByCategory[0].name === 'Uncategorized' && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <p className="text-xs text-amber-800 font-medium">
                        <span className="font-bold">Tag your income: </span>
                        Add revenue categories in <Link href="/dashboard/settings" className="font-bold underline">Settings</Link> to unlock this breakdown.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* By Payment Method */}
              {revByMethod.length > 1 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">By Payment Method</p>
                  <div className="space-y-2.5">
                    {revByMethod.map(m => (
                      <div key={m.method} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-500 w-24 flex-shrink-0 truncate">{m.label}</span>
                        <div className="flex-1">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-blue-500 transition-all"
                              style={{ width: `${totalRevenue > 0 ? (m.total/totalRevenue)*100 : 0}%` }} />
                          </div>
                        </div>
                        <span className="text-sm font-black text-gray-900 flex-shrink-0 w-16 text-right" title={fmtFull(m.total)}>{fmt(m.total)}</span>
                        <span className="text-xs font-bold text-gray-400 flex-shrink-0 w-9 text-right">
                          {totalRevenue > 0 ? Math.round((m.total/totalRevenue)*100) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Client Intelligence ───────────────────────────────────────── */}
          {allClientStats.length > 0 && (
            <ClientIntelligencePanel
              allClientStats={allClientStats} sortedClients={sortedClients}
              sortBy={sortBy} limit={limit} viewMode={viewMode} orientation={orientation}
            />
          )}

          {/* ── Expense Breakdown ─────────────────────────────────────────── */}
          {expenses.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 inv-fade-up inv-fade-up-4">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Expense Breakdown</p>
                    <p className="text-sm font-black text-gray-900 mt-0.5">
                      {fmt(totalExpenses)} across {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/expenses" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">View all →</Link>
              </div>
              {categoryBreakdown.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm font-bold text-gray-400 mb-3">No categorized expenses yet</p>
                  <Link href="/dashboard/expenses/new" className="text-xs font-bold text-blue-600 hover:text-blue-700">Add expense →</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-center">
                  <ExpenseBreakdownChart data={categoryBreakdown} />
                  <div className="space-y-2">
                    {categoryBreakdown.map(cat => (
                      <div key={cat.name} className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-gray-700 truncate">{cat.name}</span>
                            <span className="text-sm font-black text-gray-900 flex-shrink-0" title={fmtFull(cat.value)}>{fmt(cat.value)}</span>
                          </div>
                          <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${totalExpenses > 0 ? (cat.value/totalExpenses)*100 : 0}%`, backgroundColor: cat.color }} />
                          </div>
                        </div>
                        <span className="text-xs font-bold text-gray-400 flex-shrink-0 w-9 text-right">
                          {totalExpenses > 0 ? Math.round((cat.value/totalExpenses)*100) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 12-month Revenue vs Expenses ─────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 inv-fade-up inv-fade-up-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">12-Month Trend</p>
                <p className="text-sm font-black text-gray-900 mt-0.5">Revenue vs Expenses — full year view</p>
              </div>
              <Link href="/dashboard/cash" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">Cash flow →</Link>
            </div>
            <StackedRevenueChart data={revExpData} />
          </div>

          {/* ── Forward CTA ───────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl bg-gray-900 p-6 flex items-center justify-between gap-4 flex-wrap inv-fade-up inv-fade-up-5">
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="absolute top-0 right-0 w-48 h-48 opacity-[0.07]" style={{ background: 'radial-gradient(circle, #00D4AA 0%, transparent 70%)' }} />
            <div className="relative z-10">
              <p className="text-sm font-black text-white mb-0.5">Want the full financial picture?</p>
              <p className="text-xs text-gray-400 font-medium">90-day forecast, runway calculator, and cash timeline in Cash Management.</p>
            </div>
            <Link href="/dashboard/cash"
              className="relative z-10 inline-flex items-center gap-2 btn-primary px-4 py-2 rounded-xl text-sm flex-shrink-0">
              Open Cash Management →
            </Link>
          </div>
        </>
      )}
      <BackToTop />
    </div>
  )
}