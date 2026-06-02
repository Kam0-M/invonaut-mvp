import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description, amount, date, vendor, category, clientId, receiptUrl, notes, is_cogs } = body

    if (!description?.trim()) {
      return NextResponse.json({ success: false, error: 'Description is required.' }, { status: 400 })
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) < 0) {
      return NextResponse.json({ success: false, error: 'A valid amount is required.' }, { status: 400 })
    }
    if (!date) {
      return NextResponse.json({ success: false, error: 'Date is required.' }, { status: 400 })
    }
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category is required.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'You must be logged in.' }, { status: 401 })
    }

    // Verify client belongs to user if provided
    if (clientId) {
      const { data: clientRow } = await supabase
        .from('clients').select('id').eq('id', clientId).eq('user_id', user.id).maybeSingle()
      if (!clientRow) {
        return NextResponse.json({ success: false, error: 'Client not found.' }, { status: 404 })
      }
    }

    const { data: expense, error: insertError } = await supabase
      .from('expenses')
      .insert({
        user_id:     user.id,
        client_id:   clientId || null,
        description: description.trim(),
        amount:      Number(amount),
        date,
        vendor:      vendor?.trim() || null,
        category,
        receipt_url: receiptUrl || null,
        notes:       notes?.trim() || null,
        is_cogs:     is_cogs === true,
        updated_at:  new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError || !expense) {
      console.error('Expense insert error:', insertError)
      return NextResponse.json({ success: false, error: 'Could not save expense.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, expenseId: expense.id })
  } catch (err) {
    console.error('Expense create error:', err)
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 })
  }
}