import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { contractId, invoiceId, linkType } = await request.json()

    if (!contractId || !invoiceId) {
      return NextResponse.json({ success: false, error: 'Contract ID and Invoice ID are required.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'You must be logged in.' }, { status: 401 })
    }

    // Verify both contract and invoice belong to this user
    const [{ data: contract }, { data: invoice }] = await Promise.all([
      supabase.from('contracts').select('id').eq('id', contractId).eq('user_id', user.id).maybeSingle(),
      supabase.from('invoices').select('id').eq('id', invoiceId).eq('user_id', user.id).maybeSingle(),
    ])

    if (!contract) return NextResponse.json({ success: false, error: 'Contract not found.' }, { status: 404 })
    if (!invoice) return NextResponse.json({ success: false, error: 'Invoice not found.' }, { status: 404 })

    const { error: insertError } = await supabase
      .from('contract_invoice_links')
      .insert({
        contract_id: contractId,
        invoice_id: invoiceId,
        link_type: linkType || 'initial_payment',
      })

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ success: false, error: 'This invoice is already linked to this contract.' }, { status: 409 })
      }
      return NextResponse.json({ success: false, error: 'Could not create link.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contract link create error:', err)
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { contractId, invoiceId } = await request.json()

    if (!contractId || !invoiceId) {
      return NextResponse.json({ success: false, error: 'Contract ID and Invoice ID are required.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'You must be logged in.' }, { status: 401 })
    }

    // Verify contract belongs to this user before deleting
    const { data: contract } = await supabase
      .from('contracts').select('id').eq('id', contractId).eq('user_id', user.id).maybeSingle()

    if (!contract) return NextResponse.json({ success: false, error: 'Contract not found.' }, { status: 404 })

    await supabase
      .from('contract_invoice_links')
      .delete()
      .eq('contract_id', contractId)
      .eq('invoice_id', invoiceId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contract link delete error:', err)
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 })
  }
}