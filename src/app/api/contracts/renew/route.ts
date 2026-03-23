import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { contractId } = await request.json()

    if (!contractId) {
      return NextResponse.json({ success: false, error: 'Contract ID is required.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'You must be logged in.' }, { status: 401 })
    }

    // Fetch the original contract
    const { data: original } = await supabase
      .from('contracts')
      .select('id, title, client_id, template_type, content, total_value, status')
      .eq('id', contractId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!original) {
      return NextResponse.json({ success: false, error: 'Contract not found.' }, { status: 404 })
    }
    if (!['active', 'expired'].includes(original.status)) {
      return NextResponse.json({
        success: false,
        error: 'Only active or expired contracts can be renewed.',
      }, { status: 400 })
    }

    // Create the renewal as a fresh draft — same clauses, client, template
    // Dates and expiry are intentionally blank so the user can fill them in
    const { data: renewal, error: insertError } = await supabase
      .from('contracts')
      .insert({
        user_id: user.id,
        client_id: original.client_id,
        title: `${original.title} (Renewal)`,
        template_type: original.template_type,
        status: 'draft',
        content: original.content,
        total_value: original.total_value ?? null,
        start_date: null,
        end_date: null,
        expiry_date: null,
        reminder_stages_sent: [],
        reminders_dismissed: false,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError || !renewal) {
      console.error('Contract renew insert error:', insertError)
      return NextResponse.json({ success: false, error: 'Could not create renewal.' }, { status: 500 })
    }

    // Save initial version snapshot for the renewal
    await supabase.from('contract_versions').insert({
      contract_id: renewal.id,
      version_number: 1,
      content_snapshot: original.content,
      change_summary: `Renewed from contract ${contractId}`,
      created_by: user.id,
    })

    return NextResponse.json({ success: true, contractId: renewal.id })
  } catch (err) {
    console.error('Contract renew error:', err)
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 })
  }
}