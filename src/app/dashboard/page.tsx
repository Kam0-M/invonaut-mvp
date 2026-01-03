import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { StatusChart } from '@/components/dashboard/status-chart'
import { ClientRowDashboard } from '@/components/dashboard/client-row-dashboard'
import { InvoiceRowDashboard } from '@/components/dashboard/invoice-row-dashboard'
import { Users, FileText, TrendingUp } from 'lucide-react'
import { getInvoiceDisplayStatus } from '@/lib/utils/invoice-status'

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

  // Fetch invoices
  const { data: invoiceData } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, issue_date, due_date, total_amount, created_at, clients!inner(name, company)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)
    
  const rawInvoices = (invoiceData ?? []) as any[]
  
  // Map invoices and calculate display status for each
  const invoices: Invoice[] = rawInvoices.map(inv => {
    const normalizedInv = {
      ...inv,
      clients: Array.isArray(inv.clients) && inv.clients.length > 0 ? inv.clients[0] : inv.clients
    }
    
    // Calculate display status dynamically
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

  // Metrics - use displayStatus for calculations
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

  // Revenue chart data (last 6 months) - use displayStatus
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

  // Status chart data - use displayStatus
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

  const recentInvoices = invoices.slice(0, 10)
  const hasInvoices = invoices.length > 0
  const hasClients = clients.length > 0

  const metricCards = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
    { label: 'Pending Payments', value: formatCurrency(pendingPayments) },
    { label: 'Paid This Month', value: formatCurrency(paidThisMonth) },
    { label: 'Overdue Invoices', value: overdueCount.toString() }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Track your invoices, revenue, and client activity.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link href="/dashboard/invoices/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90">Create Invoice</Button>
          </Link>
          <Link href="/dashboard/clients/new" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">Add Client</Button>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(card => (
          <Card key={card.label} className="p-4">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="p-4 sm:p-6">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Revenue (Last 6 Months)</h2>
            <span className="text-xs sm:text-sm text-slate-500">Paid invoices</span>
          </div>
          {hasInvoices && totalRevenue > 0 ? (
            <RevenueChart data={revenueChartData} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No revenue data yet</h3>
              <p className="text-sm text-gray-600 mb-4">Create and send invoices to start tracking your revenue</p>
              <Link href="/dashboard/invoices/new">
                <Button className="bg-[#0066FF] text-white hover:bg-[#0052CC]">Create Invoice</Button>
              </Link>
            </div>
          )}
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Invoice Status</h2>
            <span className="text-xs sm:text-sm text-slate-500">Draft, Sent, Paid, Overdue</span>
          </div>
          {hasInvoices ? (
            <StatusChart data={statusChartData} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices yet</h3>
              <p className="text-sm text-gray-600 mb-4">Create your first invoice to start tracking payments</p>
              <Link href="/dashboard/invoices/new">
                <Button className="bg-[#0066FF] text-white hover:bg-[#0052CC]">Create Invoice</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Invoices & Clients - Side by Side */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent Invoices */}
        <Card className="p-4 sm:p-6">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">Recent Invoices</h2>
              <p className="text-xs sm:text-sm text-slate-500">Latest {recentInvoices.length} invoices</p>
            </div>
            {hasInvoices && (
              <Link href="/dashboard/invoices" className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">View All</Button>
              </Link>
            )}
          </div>

          {!hasInvoices ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices yet</h3>
              <p className="text-sm text-gray-600 mb-4">Create your first invoice to start tracking payments</p>
              <Link href="/dashboard/invoices/new">
                <Button className="bg-[#0066FF] text-white hover:bg-[#0052CC]">Create Invoice</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Invoice #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Client
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Due Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
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
        </Card>

        {/* Recent Clients */}
        <Card className="p-4 sm:p-6">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">Recent Clients</h2>
              <p className="text-xs sm:text-sm text-slate-500">Latest {clients.length} clients</p>
            </div>
            {hasClients && (
              <Link href="/dashboard/clients" className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">View All</Button>
              </Link>
            )}
          </div>

          {!hasClients ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No clients yet</h3>
              <p className="text-sm text-gray-600 mb-4">Add your first client to start creating invoices</p>
              <Link href="/dashboard/clients/new">
                <Button className="bg-[#0066FF] text-white hover:bg-[#0052CC]">Add Client</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Company
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
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
        </Card>
      </div>
    </div>
  )
}