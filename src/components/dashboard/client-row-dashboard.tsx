'use client'

type ClientRowDashboardProps = {
  id: string
  name: string
  company: string | null
  email: string | null
}

export function ClientRowDashboard({ id, name, company, email }: ClientRowDashboardProps) {
  return (
    <tr 
      className="hover:bg-blue-50 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0"
      onClick={() => window.location.href = `/dashboard/clients/${id}`}
    >
      <td className="px-4 py-4 text-sm font-black text-gray-900">
        {name}
      </td>
      <td className="px-4 py-4 text-sm font-bold text-gray-700">
        {company || '—'}
      </td>
      <td className="px-4 py-4 text-sm font-medium text-gray-600">
        {email || '—'}
      </td>
    </tr>
  )
}