import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { client_id, entry_ids } = await req.json()
  if (!client_id || !entry_ids?.length) {
    return NextResponse.json({ error: 'Missing client_id or entry_ids' }, { status: 400 })
  }

  // Fetch time entries and verify ownership
  const { data: entries } = await supabase
    .from('time_entries')
    .select('id, description, duration_seconds, hourly_rate, client_id')
    .in('id', entry_ids)
    .eq('user_id', user.id)
    .eq('client_id', client_id)
    .is('invoice_id', null)
    .eq('billable', true)

  if (!entries?.length) return NextResponse.json({ error: 'No valid entries found' }, { status: 404 })

  // Fetch client
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, payment_terms')
    .eq('id', client_id)
    .eq('user_id', user.id)
    .single()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Fetch profile for invoice number
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('business_name')
    .eq('id', user.id)
    .single()

  // Generate invoice number
  const { count } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
  const invoiceNumber = `INV-${String((count ?? 0) + 1).padStart(5, '0')}`

  // Build line items from time entries
  const lineItems = entries.map(e => ({
    description: e.description || 'Professional services',
    quantity:    Math.round((e.duration_seconds / 3600) * 100) / 100,
    unit_price:  e.hourly_rate ?? 0,
    total:       Math.round((e.duration_seconds / 3600) * (e.hourly_rate ?? 0) * 100) / 100,
  }))

  const subtotal = lineItems.reduce((s, i) => s + i.total, 0)
  const dueDate  = new Date()
  dueDate.setDate(dueDate.getDate() + (client.payment_terms ?? 30))

  // Create invoice as draft
  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .insert({
      user_id:        user.id,
      client_id,
      invoice_number: invoiceNumber,
      status:         'draft',
      issue_date:     new Date().toISOString().split('T')[0],
      due_date:       dueDate.toISOString().split('T')[0],
      subtotal,
      tax_amount:     0,
      total_amount:   subtotal,
      notes:          `Invoice generated from ${entries.length} time entr${entries.length !== 1 ? 'ies' : 'y'}`,
    })
    .select('id')
    .single()

  if (invError || !invoice) return NextResponse.json({ error: invError?.message ?? 'Failed to create invoice' }, { status: 500 })

  // Insert line items
  await supabase.from('invoice_items').insert(
    lineItems.map(item => ({
      invoice_id:   invoice.id,
      description:  item.description,
      quantity:     item.quantity,
      unit_price:   item.unit_price,
      total:        item.total,
    }))
  )

  // Mark time entries as billed
  await supabase
    .from('time_entries')
    .update({ invoice_id: invoice.id })
    .in('id', entry_ids)
    .eq('user_id', user.id)

  return NextResponse.json({ success: true, invoice_id: invoice.id })
}
