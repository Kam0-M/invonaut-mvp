// src/components/invoices/edit-invoice-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface EditInvoiceFormProps {
  invoice: any;
  invoiceItems: any[];
  clients: any[];
}

export default function EditInvoiceForm({ 
  invoice, 
  invoiceItems, 
  clients 
}: EditInvoiceFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form state with existing data
  const [clientId, setClientId] = useState(invoice.client_id);
  const [issueDate, setIssueDate] = useState(invoice.issue_date);
  const [dueDate, setDueDate] = useState(invoice.due_date);
  const [notes, setNotes] = useState(invoice.notes || '');
  const [taxRate, setTaxRate] = useState(
    invoice.tax_amount && invoice.subtotal
      ? ((invoice.tax_amount / invoice.subtotal) * 100).toFixed(2)
      : '0'
  );

  // Initialize line items from existing data
  const [lineItems, setLineItems] = useState<LineItem[]>(
    invoiceItems.length > 0
      ? invoiceItems.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        }))
      : [{ description: '', quantity: 1, unit_price: 0, total: 0 }]
  );

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (parseFloat(taxRate) / 100);
  const totalAmount = subtotal + taxAmount;

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: '', quantity: 1, unit_price: 0, total: 0 },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    // Recalculate total for this line
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].total = updated[index].quantity * updated[index].unit_price;
    }

    setLineItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Update invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          client_id: clientId,
          issue_date: issueDate,
          due_date: dueDate,
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          notes,
        })
        .eq('id', invoice.id);

      if (invoiceError) throw invoiceError;

      // Delete old invoice items
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoice.id);

      if (deleteError) throw deleteError;

      // Insert new invoice items
      const itemsToInsert = lineItems.map((item) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Success - redirect to invoice detail
      router.push(`/dashboard/invoices/${invoice.id}`);
      router.refresh();
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      alert('Failed to update invoice: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      {/* Client Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Client *
        </label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
        >
          <option value="">Select a client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name} {client.company && `(${client.company})`}
            </option>
          ))}
        </select>
      </div>

      {/* Invoice Number (Read-only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Invoice Number
        </label>
        <input
          type="text"
          value={invoice.invoice_number}
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 mt-1">Invoice number cannot be changed</p>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Issue Date *
          </label>
          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Due Date *
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          />
        </div>
      </div>

      {/* Line Items */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Line Items *
        </label>
        <div className="space-y-2">
          {lineItems.map((item, index) => (
            <div key={index} className="flex gap-2 items-start">
              <input
                type="text"
                placeholder="Description"
                value={item.description}
                onChange={(e) =>
                  updateLineItem(index, 'description', e.target.value)
                }
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
              />
              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) =>
                  updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)
                }
                min="0"
                step="0.01"
                required
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
              />
              <input
                type="number"
                placeholder="Price"
                value={item.unit_price}
                onChange={(e) =>
                  updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)
                }
                min="0"
                step="0.01"
                required
                className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
              />
              <div className="w-28 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-right text-gray-900 font-medium">
                ${item.total.toFixed(2)}
              </div>
              <button
                type="button"
                onClick={() => removeLineItem(index)}
                disabled={lineItems.length === 1}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addLineItem}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          + Add Line Item
        </button>
      </div>

      {/* Tax Rate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tax Rate (%)
        </label>
        <input
          type="number"
          value={taxRate}
          onChange={(e) => setTaxRate(e.target.value)}
          min="0"
          max="100"
          step="0.01"
          className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
        />
      </div>

      {/* Totals */}
      <div className="bg-gray-50 p-4 rounded-md space-y-2 border border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax ({taxRate}%):</span>
          <span className="font-medium text-gray-900">${taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
          <span className="text-gray-900">Total:</span>
          <span className="text-blue-600">${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
          placeholder="Additional notes or payment instructions..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}