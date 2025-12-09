import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InvoiceRow } from './invoice-row'

type Invoice = {
  id: string
  invoice_number: string
  issue_date: string
  due_date: string
  total_amount: number
  status: string
  clients: {
    name: string
  } | null
}

export default async function InvoicesPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data } = await supabase
    .from('invoices')
    .select('*, clients(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const invoices = (data ?? []) as Invoice[]
  const invoiceCount = invoices.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500">
            {invoiceCount === 0
              ? 'No invoices yet'
              : invoiceCount === 1
              ? '1 invoice'
              : `${invoiceCount} invoices`}
          </p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button className="bg-primary text-white hover:bg-primary/90">
            Create Invoice
          </Button>
        </Link>
      </div>

      {invoices.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 border-dashed py-12 text-center">
          <p className="text-base font-medium text-slate-900">
            No invoices yet.
          </p>
          <p className="text-sm text-slate-500 mb-4">
            Create your first invoice to start tracking payments.
          </p>
          <Link href="/dashboard/invoices/new">
            <Button className="bg-primary text-white hover:bg-primary/90">
              Create Invoice
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Issue Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {invoices.map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}