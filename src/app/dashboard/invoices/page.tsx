import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InvoiceList } from '@/components/invoices/invoice-list'

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
        <InvoiceList invoices={invoices} />
      )}
    </div>
  )
}