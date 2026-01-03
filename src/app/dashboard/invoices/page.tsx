import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InvoiceList } from '@/components/invoices/invoice-list'
import { ArrowLeft, Plus } from 'lucide-react'

type Invoice = {
  id: string
  invoice_number: string
  issue_date: string
  due_date: string
  total_amount: number
  status: string
  last_followed_up?: string | null
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

  const { data: allInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, issue_date, due_date, total_amount, status, last_followed_up, clients(name, company)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500)

  // Transform the data to handle clients array from Supabase join
  const invoices: Invoice[] = (allInvoices ?? []).map((inv: any) => ({
    ...inv,
    clients: Array.isArray(inv.clients) && inv.clients.length > 0 
      ? inv.clients[0] 
      : inv.clients
  }))
  
  const invoiceCount = invoices.length

  return (
    <div className="space-y-6">
      {/* Header with Back Button (Left) and Create Button (Right) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
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
        </div>
        <Link href="/dashboard/invoices/new">
          <Button className="bg-primary text-white hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
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
              <Plus className="w-4 h-4 mr-2" />
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