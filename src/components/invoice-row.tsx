'use client'

import { useRouter } from 'next/navigation'

type InvoiceRowProps = {
  id: string
  invoiceNumber: string
  status: string
  totalAmount: number
  dueDate: string
}

export function InvoiceRow({ id, invoiceNumber, status, totalAmount, dueDate }: InvoiceRowProps) {
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <tr 
      onClick={() => router.push(`/dashboard/invoices/${id}`)}
      className="hover:bg-slate-50 cursor-pointer transition-colors"
    >
      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
        {invoiceNumber}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm">
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(status)}`}>
          {status}
        </span>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
        ${totalAmount.toFixed(2)}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
        {new Date(dueDate).toLocaleDateString()}
      </td>
    </tr>
  )
}