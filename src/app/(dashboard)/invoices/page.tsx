import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Search, 
  Filter,
  Download,
  MoreHorizontal
} from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function InvoicesPage() {
  const invoices = [
    { 
      id: 'INV-001', 
      client: 'Acme Corp', 
      amount: '$2,500', 
      status: 'Paid', 
      date: '2024-01-15',
      dueDate: '2024-02-15'
    },
    { 
      id: 'INV-002', 
      client: 'Tech Solutions', 
      amount: '$1,800', 
      status: 'Pending', 
      date: '2024-01-14',
      dueDate: '2024-02-14'
    },
    { 
      id: 'INV-003', 
      client: 'Design Studio', 
      amount: '$3,200', 
      status: 'Paid', 
      date: '2024-01-13',
      dueDate: '2024-02-13'
    },
    { 
      id: 'INV-004', 
      client: 'Marketing Pro', 
      amount: '$950', 
      status: 'Overdue', 
      date: '2024-01-10',
      dueDate: '2024-02-10'
    },
    { 
      id: 'INV-005', 
      client: 'Creative Agency', 
      amount: '$4,100', 
      status: 'Draft', 
      date: '2024-01-12',
      dueDate: '2024-02-12'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'Overdue':
        return 'bg-red-100 text-red-800'
      case 'Draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search invoices..."
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" className="flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card className="p-6">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.dueDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
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
