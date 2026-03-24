import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractId, title, clientId, templateType, totalValue, startDate, endDate, expiryDate, content } = body

    if (!contractId) {
      return NextResponse.json({ success: false, error: 'Contract ID is required.' }, { status: 400 })
    }
    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: 'Contract title is required.' }, { status: 400 })
    }
    if (!clientId) {
      return NextResponse.json({ success: false, error: 'Client is required.' }, { status: 400 })
    }
    if (!Array.isArray(content) || content.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one clause is required.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'You must be logged in.' }, { status: 401 })
    }

    // Verify contract belongs to this user and is still a draft
    const { data: existing } = await supabase
      .from('contracts')
      .select('id, status')
      .eq('id', contractId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Contract not found.' }, { status: 404 })
    }
    if (existing.status !== 'draft') {
      return NextResponse.json({
        success: false,
        error: 'Only draft contracts can be edited. Use Extend to change the expiry date on active contracts.',
      }, { status: 400 })
    }

    // Verify client belongs to this user
    const { data: clientRow } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!clientRow) {
      return NextResponse.json({ success: false, error: 'Client not found.' }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        title: title.trim(),
        client_id: clientId,
        template_type: templateType || 'custom',
        content,
        total_value: totalValue ?? null,
        start_date: startDate || null,
        end_date: endDate || null,
        expiry_date: expiryDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId)

    if (updateError) {
      console.error('Contract update error:', updateError)
      return NextResponse.json({ success: false, error: 'Could not update contract.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, contractId })
  } catch (err) {
    console.error('Contract update error:', err)
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 })
  }
}