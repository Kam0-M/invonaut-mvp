import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditInvoiceForm from '@/components/invoices/edit-invoice-form';

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch invoice with items and client info
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(
      `
      *,
      clients (id, name, email, company),
      invoice_items (*)
    `
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (invoiceError || !invoice) {
    redirect('/dashboard/invoices');
  }

  // Only allow editing draft invoices
  if (invoice.status !== 'draft') {
    redirect(`/dashboard/invoices/${id}`);
  }

  // Fetch all clients for dropdown
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, company')
    .eq('user_id', user.id)
    .order('name');

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Invoice</h1>
          <p className="text-gray-600 mt-1">
            Update invoice details and line items
          </p>
        </div>

        <EditInvoiceForm
          invoice={invoice}
          invoiceItems={invoice.invoice_items || []}
          clients={clients || []}
        />
      </div>
    </div>
  );
}