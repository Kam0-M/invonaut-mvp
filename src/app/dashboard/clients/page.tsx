import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Client = {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  address: string | null
  payment_terms: number | null
  created_at?: string
}

export default async function ClientsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const clients = (data ?? []) as Client[]
  const clientCount = clients.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500">
            {clientCount === 0
              ? 'No clients yet'
              : clientCount === 1
              ? '1 client'
              : `${clientCount} clients`}
          </p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button className="bg-primary text-white hover:bg-primary/90">
            Add New Client
          </Button>
        </Link>
      </div>

      {clients.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 border-dashed py-12 text-center">
          <p className="text-base font-medium text-slate-900">
            No clients yet.
          </p>
          <p className="text-sm text-slate-500 mb-4">
            Add your first client to get started with Flowance.
          </p>
          <Link href="/dashboard/clients/new">
            <Button className="bg-primary text-white hover:bg-primary/90">
              Add New Client
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Payment terms
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {clients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                    {client.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {client.company || '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {client.email || '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {client.phone || '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {client.payment_terms ? `${client.payment_terms} days` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}