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
      className="hover:bg-slate-50 cursor-pointer transition-colors"
      onClick={() => window.location.href = `/dashboard/clients/${id}`}
    >
      <td className="px-4 py-3 text-sm font-medium text-slate-900">
        {name}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {company || '-'}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {email || '-'}
      </td>
    </tr>
  )
}