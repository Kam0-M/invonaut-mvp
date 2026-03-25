import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { StatusChart } from '@/components/dashboard/status-chart'
import { ClientRowDashboard } from '@/components/dashboard/client-row-dashboard'
import { InvoiceRowDashboard } from '@/components/dashboard/invoice-row-dashboard'
import { Users, FileText, TrendingUp, DollarSign, Clock, AlertCircle, Sparkles, Lock, FileSignature, Banknote, CalendarClock } from 'lucide-react'
import { getInvoiceDisplayStatus } from '@/lib/utils/invoice-status'
import { getWelcomeMessage } from '@/lib/utils/get-welcome-message'
import ViewOnlyBanner from '@/components/view-only-banner'

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

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // ⬅️ CHECK SUBSCRIPTION STATUS + HISTORY
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id, stripe_subscription_id, subscription_status')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription = !!profile?.stripe_subscription_id && 
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')
  
  // ⬅️ NEW: Check if user has EVER subscribed (for conditional CTAs)
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
    
    return {
      ...normalizedInv,
      displayStatus
    }
  })

  // Fetch clients
  const { data: clientData } = await supabase
    .from('clients')
    .select('id, name, email, company, phone, payment_terms, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)
  
  const clients = (clientData ?? []) as Client[]
  
  const now = new Date()

  // Metrics
  const totalRevenue = invoices
    .filter(inv => inv.displayStatus === 'paid')
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)

  const pendingPayments = invoices
    .filter(inv => inv.displayStatus === 'sent')
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)

  const paidThisMonth = invoices
    .filter(inv => inv.displayStatus === 'paid')
    .filter(inv => {
      const d = new Date(inv.issue_date)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)

  const overdueCount = invoices.filter(inv => inv.displayStatus === 'overdue').length

  // Revenue chart data
  const revenueChartData = (() => {
    const monthLabels = Array.from({ length: 6 }, (_, idx) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - idx), 1))
      return { 
        year: d.getUTCFullYear(), 
        month: d.getUTCMonth(), 
        label: d.toLocaleString('en-US', { month: 'short' }) 
      }
    })

    const paidInvoices = invoices.filter(inv => inv.displayStatus === 'paid')
    
    return monthLabels.map(({ year, month, label }) => {
      const revenue = paidInvoices
        .filter(inv => {
          const d = new Date(inv.issue_date)
          return d.getUTCFullYear() === year && d.getUTCMonth() === month
        })
        .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)
      return { month: label, revenue }
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

  const recentInvoices = invoices.slice(0, 10)
  const hasInvoices = invoices.length > 0
  const hasClients = clients.length > 0

  // Get random welcome message
  const welcomeMessage = getWelcomeMessage()

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header with Gradient - Matches Landing Page */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-10 shadow-2xl">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'1\' height=\'1\' fill=\'rgba(255,255,255,0.5)\'/%3E%3C/svg%3E")', backgroundSize: '60px 60px'}}></div>
        
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-6 h-6 text-teal-300" />
              <span className="text-teal-300 font-bold text-sm uppercase tracking-wider">Dashboard</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight">{welcomeMessage}</h1>
            <p className="text-blue-100 text-lg font-medium">Track your invoices, revenue, and client activity in real-time.</p>
          </div>
          
          {/* ⬅️ LOCKED/UNLOCKED BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Create Invoice Button */}
            {hasActiveSubscription ? (
              <Link href="/dashboard/invoices/new" className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-center hover:shadow-2xl transition-all hover:scale-105">
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5" />
                  Create Invoice
                </div>
              </Link>
            ) : (
              <button
                disabled
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/20 text-white/50 font-bold cursor-not-allowed border-2 border-white/20"
                title="Subscribe to create invoices"
              >
                <Lock className="w-5 h-5" />
                Create Invoice (Locked)
              </button>
            )}

            {/* Add Client Button */}
            {hasActiveSubscription ? (
              <Link href="/dashboard/clients/new" className="inline-block bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all text-center">
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-5 h-5" />
                  Add Client
                </div>
              </Link>
            ) : (
              <button
                disabled
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white/50 border-2 border-white/20 font-bold cursor-not-allowed"
                title="Subscribe to add clients"
              >
                <Lock className="w-5 h-5" />
                Add Client (Locked)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ⬅️ VIEW-ONLY BANNER (if no subscription) */}
      {!hasActiveSubscription && <ViewOnlyBanner />}

      {/* Metrics - Premium Cards with Hover Effects */}
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
          <p className="text-4xl font-black text-green-900">{formatCurrency(totalRevenue)}</p>
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
          <p className="text-4xl font-black text-blue-900">{formatCurrency(pendingPayments)}</p>
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
          <p className="text-4xl font-black text-teal-900">{formatCurrency(paidThisMonth)}</p>
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
          <p className="text-4xl font-black text-red-900">{overdueCount}</p>
        </div>
      </div>


      {/* Contract Metrics */}
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
              <p className="text-4xl font-black text-purple-900">{activeContractsCount}</p>
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
              <p className="text-4xl font-black text-indigo-900">{formatCurrency(totalContractValue)}</p>
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
              }`}>Expiring Within 30 Days</p>
              <p className={`text-4xl font-black ${
                expiringSoonCount > 0 ? 'text-amber-900' : 'text-gray-700'
              }`}>{expiringSoonCount}</p>
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

      {/* Recent Invoices & Clients */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl p-10 border-2 border-gray-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Recent Invoices</h2>
              <p className="text-sm text-gray-600 font-medium">Latest {recentInvoices.length} invoices</p>
            </div>
            {hasInvoices && (
              <Link href="/dashboard/invoices" className="text-blue-600 hover:text-blue-700 font-bold text-sm transition-colors">
                View All →
              </Link>
            )}
          </div>

          {!hasInvoices ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">No invoices yet</h3>
              <p className="text-sm text-gray-600 mb-6 font-medium">
                {hasActiveSubscription
                  ? 'Start creating invoices to track payments'
                  : 'Subscribe to start creating invoices'}
              </p>
              {hasActiveSubscription ? (
                <Link href="/dashboard/invoices/new" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all hover:shadow-lg">
                  Create Invoice
                </Link>
              ) : (
                <Link href="/pricing" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all hover:shadow-lg">
                  {hasEverSubscribed ? 'Subscribe Now' : 'Start Free Trial'}
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <div className="overflow-hidden rounded-xl border-2 border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-700">Invoice #</th>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-700">Client</th>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-700">Due Date</th>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-700">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {recentInvoices.map(inv => (
                        <InvoiceRowDashboard
                          key={inv.id}
                          id={inv.id}
                          invoiceNumber={inv.invoice_number}
                          clientName={inv.clients?.name || null}
                          dueDate={inv.due_date}
                          totalAmount={inv.total_amount}
                          status={inv.displayStatus}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Clients */}
        <div className="bg-white rounded-2xl p-10 border-2 border-gray-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Recent Clients</h2>
              <p className="text-sm text-gray-600 font-medium">Latest {clients.length} clients</p>
            </div>
            {hasClients && (
              <Link href="/dashboard/clients" className="text-blue-600 hover:text-blue-700 font-bold text-sm transition-colors">
                View All →
              </Link>
            )}
          </div>

          {!hasClients ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">No clients yet</h3>
              <p className="text-sm text-gray-600 mb-6 font-medium">
                {hasActiveSubscription
                  ? 'Add your first client to start creating invoices'
                  : 'Subscribe to start adding clients'}
              </p>
              {hasActiveSubscription ? (
                <Link href="/dashboard/clients/new" className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 transition-all hover:shadow-lg">
                  Add Client
                </Link>
              ) : (
                <Link href="/pricing" className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 transition-all hover:shadow-lg">
                  {hasEverSubscribed ? 'Subscribe Now' : 'Start Free Trial'}
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <div className="overflow-hidden rounded-xl border-2 border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-700">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-700">Company</th>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-700">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {clients.map(client => (
                        <ClientRowDashboard
                          key={client.id}
                          id={client.id}
                          name={client.name}
                          company={client.company}
                          email={client.email}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}