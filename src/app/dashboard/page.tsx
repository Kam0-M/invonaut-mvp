import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { StatusChart } from '@/components/dashboard/status-chart'

type Invoice = {
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

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, issue_date, due_date, total_amount, subtotal, tax_amount, created_at, clients(name, company)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const invoices: Invoice[] = (data ?? []) as Invoice[]
  const now = new Date()

  // Metrics
  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)

  const pendingPayments = invoices
    .filter(inv => inv.status === 'sent')
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)

  const paidThisMonth = invoices
    .filter(inv => inv.status === 'paid')
    .filter(inv => {
      const d = new Date(inv.issue_date)
      return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth()
    })
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)

  const overdueCount = invoices.filter(inv => {
    if (inv.status !== 'sent') return false
    const due = new Date(inv.due_date)
    return due.getTime() < now.getTime()
  }).length

  // Revenue chart data (last 6 months)
  const monthLabels = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - idx), 1))
    return { key: `${d.getUTCFullYear()}-${d.getUTCMonth()}`, label: d.toLocaleString('en-US', { month: 'short' }) }
  })

  const revenueChartData = monthLabels.map(({ key, label }) => {
    const [yearStr, monthStr] = key.split('-')
    const year = Number(yearStr)
    const month = Number(monthStr)
    const revenue = invoices
      .filter(inv => inv.status === 'paid')
      .filter(inv => {
        const d = new Date(inv.issue_date)
        return d.getUTCFullYear() === year && d.getUTCMonth() === month
      })
      .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)
    return { month: label, revenue }
  })

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
    value: invoices.filter(inv => inv.status === status).length,
    color: statusColors[status]
  }))

  const recentInvoices = invoices.slice(0, 5)

  const metricCards = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
    { label: 'Pending Payments', value: formatCurrency(pendingPayments) },
    { label: 'Paid This Month', value: formatCurrency(paidThisMonth) },
    { label: 'Overdue Invoices', value: overdueCount.toString() }
  ]

  const hasInvoices = invoices.length > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Track your invoices, revenue, and client activity.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/invoices/new">
            <Button className="bg-primary text-white hover:bg-primary/90">Create Invoice</Button>
          </Link>
          <Link href="/dashboard/clients/new">
            <Button variant="outline">Add Client</Button>
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
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Revenue (Last 6 Months)</h2>
            <span className="text-sm text-slate-500">Paid invoices</span>
          </div>
          {hasInvoices ? (
            <RevenueChart data={revenueChartData} />
          ) : (
            <p className="text-sm text-slate-500">No data yet</p>
          )}
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Invoice Status</h2>
            <span className="text-sm text-slate-500">Draft, Sent, Paid, Overdue</span>
          </div>
          {hasInvoices ? (
            <StatusChart data={statusChartData} />
          ) : (
            <p className="text-sm text-slate-500">No data yet</p>
          )}
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recent Invoices</h2>
            <p className="text-sm text-slate-500">Latest activity</p>
          </div>
          {hasInvoices && (
            <Link href="/dashboard/invoices">
              <Button variant="outline">View All</Button>
            </Link>
          )}
        </div>

        {!hasInvoices ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <p className="text-base font-medium text-slate-900">No invoices yet.</p>
            <p className="text-sm text-slate-500">Create your first invoice to see metrics and charts.</p>
            <div className="flex gap-3 mt-2">
              <Link href="/dashboard/invoices/new">
                <Button className="bg-primary text-white hover:bg-primary/90">Create Invoice</Button>
              </Link>
              <Link href="/dashboard/clients/new">
                <Button variant="outline">Add Client</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Issue Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {recentInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      <Link href={`/dashboard/invoices/${inv.id}`} className="underline-offset-4 hover:underline">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {inv.clients?.name || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(inv.issue_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(inv.due_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          inv.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : inv.status === 'sent'
                            ? 'bg-blue-100 text-blue-800'
                            : inv.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

