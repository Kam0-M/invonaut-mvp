import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    const { contractId, newExpiryDate } = await request.json()

    if (!contractId) {
      return NextResponse.json({ success: false, error: 'Contract ID is required.' }, { status: 400 })
    }
    if (!newExpiryDate) {
      return NextResponse.json({ success: false, error: 'New expiry date is required.' }, { status: 400 })
    }

    // Must be a future date
    if (new Date(newExpiryDate) <= new Date()) {
      return NextResponse.json({ success: false, error: 'Expiry date must be in the future.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'You must be logged in.' }, { status: 401 })
    }

    // Verify contract belongs to this user and is active or expired
    const { data: contract } = await supabase
      .from('contracts')
      .select('id, status')
      .eq('id', contractId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!contract) {
      return NextResponse.json({ success: false, error: 'Contract not found.' }, { status: 404 })
    }
    if (!['active', 'expired'].includes(contract.status)) {
      return NextResponse.json({
        success: false,
        error: 'Only active or expired contracts can be extended.',
      }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        expiry_date: newExpiryDate,
        status: 'active',                  // re-activate if it was expired
        reminder_stages_sent: [],          // reset so all reminder emails fire again
        reminders_dismissed: false,        // reset so owner gets notified again
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId)

    if (updateError) {
      return NextResponse.json({ success: false, error: 'Could not extend contract.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contract extend error:', err)
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 })
  }
}