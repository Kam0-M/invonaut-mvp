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
        return 'bg-gray-100 text-gray-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <tr
      onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
      className="hover:bg-slate-50 cursor-pointer transition-colors"
    >
      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
        {invoice.invoice_number}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
        {invoice.clients?.name || '—'}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
        {formatDate(invoice.issue_date)}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
        {formatDate(invoice.due_date)}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
        {formatCurrency(invoice.total_amount)}
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
            invoice.status
          )}`}
        >
          {invoice.status}
        </span>
      </td>
    </tr>
  )
}
