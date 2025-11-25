import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Send, Edit } from 'lucide-react'
import Link from 'next/link'

interface InvoiceDetailPageProps {
  params: {
    id: string
  }
}

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const invoiceId = params.id

  // Mock invoice data - in real app, fetch from API
  const invoice = {
    id: invoiceId,
    client: 'Acme Corp',
    amount: '$2,500',
    status: 'Paid',
    date: '2024-01-15',
    dueDate: '2024-02-15',
    items: [
      { description: 'Web Development', quantity: 40, rate: 50, amount: 2000 },
      { description: 'UI/UX Design', quantity: 10, rate: 50, amount: 500 }
    ],
    subtotal: 2500,
    tax: 0,
    total: 2500
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Invoice {invoice.id}</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Send className="w-4 h-4 mr-2" />
            Send
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Invoice Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Invoice ID</label>
                <p className="mt-1 text-sm text-gray-900">{invoice.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  invoice.status === 'Paid' 
                    ? 'bg-green-100 text-green-800'
                    : invoice.status === 'Pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {invoice.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <p className="mt-1 text-sm text-gray-900">{invoice.date}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <p className="mt-1 text-sm text-gray-900">{invoice.dueDate}</p>
              </div>
            </div>
          </Card>

          {/* Invoice Items */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${item.rate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${item.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Invoice Summary */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-sm font-medium">${invoice.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tax</span>
                <span className="text-sm font-medium">${invoice.tax}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-base font-semibold">${invoice.total}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Client</h2>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">{invoice.client}</p>
              <p className="text-sm text-gray-600">client@example.com</p>
              <p className="text-sm text-gray-600">123 Business St</p>
              <p className="text-sm text-gray-600">City, State 12345</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
