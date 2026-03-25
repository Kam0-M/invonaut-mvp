import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, clientId, templateType, totalValue, startDate, endDate, expiryDate, content } = body

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

    const { data: contract, error: insertError } = await supabase
      .from('contracts')
      .insert({
        user_id: user.id,
        client_id: clientId,
        title: title.trim(),
        template_type: templateType || 'custom',
        status: 'draft',
        content,
        total_value: totalValue ?? null,
        start_date: startDate ?? null,
        end_date: endDate ?? null,
        expiry_date: expiryDate ?? null,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError || !contract) {
      console.error('Contract insert error:', insertError)
      return NextResponse.json({ success: false, error: 'Could not save contract.' }, { status: 500 })
    }

    // Save initial version snapshot
    await supabase.from('contract_versions').insert({
      contract_id: contract.id,
      version_number: 1,
      content_snapshot: content,
      change_summary: 'Initial draft',
      created_by: user.id,
    })

    return NextResponse.json({ success: true, contractId: contract.id })
  } catch (err: unknown) {
    console.error('Contract create error:', err)
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 })
  }
}