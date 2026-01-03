import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClientRow } from '@/components/clients/client-row'
import { ArrowLeft, Plus } from 'lucide-react'

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
    .select('id, name, email, phone, company, payment_terms, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500)
  
  const clients = (data ?? []) as Client[]
  const clientCount = clients.length

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Clients</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {clientCount === 0
                ? 'No clients yet'
                : clientCount === 1
                ? '1 client'
                : `${clientCount} clients`}
            </p>
          </div>
        </div>
        <Link href="/dashboard/clients/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90">
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Add New Client</span>
            <span className="sm:hidden">Add Client</span>
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
              <Plus className="w-4 h-4 mr-2" />
              Add New Client
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-4 sm:px-0">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 table-fixed">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-[200px]">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-[200px]">
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
                <ClientRow
                  key={client.id}
                  id={client.id}
                  name={client.name}
                  company={client.company}
                  email={client.email}
                  phone={client.phone}
                  paymentTerms={client.payment_terms}
                />
              ))}
            </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}