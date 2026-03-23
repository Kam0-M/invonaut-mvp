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

    // Verify contract belongs to this user before updating
    const { data: contract } = await supabase
      .from('contracts')
      .select('id')
      .eq('id', contractId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!contract) {
      return NextResponse.json({ success: false, error: 'Contract not found.' }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from('contracts')
      .update({ reminders_dismissed: true })
      .eq('id', contractId)

    if (updateError) {
      return NextResponse.json({ success: false, error: 'Could not dismiss reminders.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Dismiss reminders error:', err)
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 })
  }
}