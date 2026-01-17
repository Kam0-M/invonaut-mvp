'use client'

import { useRouter } from 'next/navigation'

type InvoiceRowProps = {
  invoice: {
    id: string
    invoice_number: string
    issue_date: string
    due_date: string
    total_amount: number
    status: string
    clients: { name: string } | null
  }
}

export function InvoiceRow({ invoice }: InvoiceRowProps) {
  const router = useRouter()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-2 border-gray-300'
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-2 border-blue-300'
      case 'paid':
        return 'bg-green-100 text-green-800 border-2 border-green-300'
      case 'overdue':
        return 'bg-red-100 text-red-800 border-2 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-2 border-gray-300'
    }
  }

  return (
    <tr
      onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
      className="hover:bg-blue-50 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0"
    >
      <td className="px-6 py-4 text-sm font-black text-gray-900">
        {invoice.invoice_number}
      </td>
      <td className="px-6 py-4 text-sm font-bold text-gray-700">
        {invoice.clients?.name || '—'}
      </td>
      <td className="px-6 py-4 text-sm font-medium text-gray-600">
        {formatDate(invoice.issue_date)}
      </td>
      <td className="px-6 py-4 text-sm font-medium text-gray-600">
        {formatDate(invoice.due_date)}
      </td>
      <td className="px-6 py-4 text-sm font-black text-gray-900">
        {formatCurrency(invoice.total_amount)}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wide ${getStatusColor(
            invoice.status
          )}`}
        >
          {invoice.status}
        </span>
      </td>
    </tr>
  )
}