'use client'

import { useRouter } from 'next/navigation'

type InvoiceRowProps = {
  id: string
  invoiceNumber: string
  clientName: string | null
  issueDate: string
  dueDate: string
  totalAmount: number
  status: string
}

export function InvoiceRow({
  id,
  invoiceNumber,
  clientName,
  issueDate,
  dueDate,
  totalAmount,
  status
}: InvoiceRowProps) {
  const router = useRouter()

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <tr
      onClick={() => router.push(`/dashboard/invoices/${id}`)}
      className="hover:bg-slate-50 cursor-pointer transition-colors"
    >
      <td className="px-6 py-4 text-sm font-medium text-slate-900">
        {invoiceNumber}
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">
        {clientName || '—'}
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">
        {formatDate(issueDate)}
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">
        {formatDate(dueDate)}
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">
        {formatCurrency(totalAmount)}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
            status === 'paid'
              ? 'bg-green-100 text-green-800'
              : status === 'sent'
              ? 'bg-blue-100 text-blue-800'
              : status === 'overdue'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {status}
        </span>
      </td>
    </tr>
  )
}