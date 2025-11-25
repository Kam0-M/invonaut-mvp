import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Users, 
  DollarSign, 
  TrendingUp,
  Plus,
  Eye
} from 'lucide-react'

export default function DashboardPage() {
  const stats = [
    {
      title: 'Total Invoices',
      value: '24',
      change: '+12%',
      changeType: 'positive' as const,
      icon: FileText
    },
    {
      title: 'Active Clients',
      value: '18',
      change: '+8%',
      changeType: 'positive' as const,
      icon: Users
    },
    {
      title: 'Revenue',
      value: '$12,450',
      change: '+23%',
      changeType: 'positive' as const,
      icon: DollarSign
    },
    {
      title: 'Growth Rate',
      value: '15.2%',
      change: '+2.1%',
      changeType: 'positive' as const,
      icon: TrendingUp
    }
  ]

  const recentInvoices = [
    { id: 'INV-001', client: 'Acme Corp', amount: '$2,500', status: 'Paid', date: '2024-01-15' },
    { id: 'INV-002', client: 'Tech Solutions', amount: '$1,800', status: 'Pending', date: '2024-01-14' },
    { id: 'INV-003', client: 'Design Studio', amount: '$3,200', status: 'Paid', date: '2024-01-13' },
    { id: 'INV-004', client: 'Marketing Pro', amount: '$950', status: 'Overdue', date: '2024-01-10' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change} from last month
                  </p>
                </div>
                <Icon className="h-8 w-8 text-primary" />
              </div>
            </Card>
          )
        })}
      </div>

      {/* Recent Invoices */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Invoices</h2>
          <Button variant="outline" className="text-primary border-primary hover:bg-primary hover:text-white">
            <Eye className="w-4 h-4 mr-2" />
            View All
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.client}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      invoice.status === 'Paid' 
                        ? 'bg-green-100 text-green-800'
                        : invoice.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
