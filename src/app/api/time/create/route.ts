// src/app/api/time/create/route.ts
// Saves a completed time entry to the database.
// Called by the timer widget (on Stop) and the manual entry form (on Save).
//
// Body: { description, clientId?, startedAt, endedAt, durationSeconds, hourlyRate?, billable? }
// Returns: { success, entryId }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      description,
      clientId,
      startedAt,
      endedAt,
      durationSeconds,
      hourlyRate,
      billable = true,
    } = body

    // Validation
    if (!description?.trim()) {
      return NextResponse.json({ success: false, error: 'Description is required.' }, { status: 400 })
    }
    if (!startedAt) {
      return NextResponse.json({ success: false, error: 'Start time is required.' }, { status: 400 })
    }
    if (!durationSeconds || durationSeconds < 1) {
      return NextResponse.json({ success: false, error: 'Duration must be at least 1 second.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'You must be logged in.' }, { status: 401 })
    }

    // Verify client belongs to user if provided
    if (clientId) {
      const { data: clientRow } = await supabase
        .from('clients')
        .select('id, hourly_rate')
        .eq('id', clientId)
        .eq('user_id', user.id)
        .maybeSingle()
      if (!clientRow) {
        return NextResponse.json({ success: false, error: 'Client not found.' }, { status: 404 })
      }
    }

    const { data: entry, error: insertError } = await supabase
      .from('time_entries')
      .insert({
        user_id:          user.id,
        client_id:        clientId || null,
        description:      description.trim(),
        started_at:       startedAt,
        ended_at:         endedAt || null,
        duration_seconds: Number(durationSeconds),
        hourly_rate:      hourlyRate ? Number(hourlyRate) : null,
        billable:         billable !== false,
      })
      .select('id')
      .single()

    if (insertError || !entry) {
      console.error('Time entry insert error:', insertError)
      return NextResponse.json({ success: false, error: 'Could not save time entry.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, entryId: entry.id })
  } catch (err) {
    console.error('Time create error:', err)
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 })
  }
}