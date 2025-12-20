'use client'

import { useRouter } from 'next/navigation'

type ClientRowProps = {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  paymentTerms: number | null
}

export function ClientRow({ id, name, company, email, phone, paymentTerms }: ClientRowProps) {
  const router = useRouter()

  return (
    <tr 
      onClick={() => router.push(`/dashboard/clients/${id}`)}
      className="hover:bg-slate-50 cursor-pointer transition-colors"
    >
      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
        {name}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
        {company || '—'}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
        {email || '—'}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
        {phone || '—'}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
        {paymentTerms ? `${paymentTerms} days` : '—'}
      </td>
    </tr>
  )
}