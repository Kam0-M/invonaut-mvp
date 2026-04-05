// src/app/api/cash/snapshot/route.ts
//
// GET  — returns the most recent cash_snapshot for the logged-in user.
//        Used by RunwayCalculator to hydrate the balance input on mount.
//
// POST — saves a new snapshot row.
//        The RunwayCalculator calls this when the user types a new balance and clicks Save.
//        We store each entry as a new row (audit trail) rather than upsert,
//        so the user can see how their balance has changed over time in the future.
//        The "latest" snapshot is always the one with the highest created_at.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('cash_snapshots')
    .select('id, balance, notes, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // Returns null snapshot if none exists — caller treats this as "no balance set"
  return NextResponse.json({ success: true, snapshot: data ?? null })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { balance, notes } = body

    if (balance === undefined || balance === null || isNaN(Number(balance))) {
      return NextResponse.json({ success: false, error: 'A valid balance is required.' }, { status: 400 })
    }
    if (Number(balance) < 0) {
      return NextResponse.json({ success: false, error: 'Balance cannot be negative.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('cash_snapshots')
      .insert({
        user_id: user.id,
        balance: Number(balance),
        notes:   notes?.trim() || null,
      })
      .select('id, balance, created_at')
      .single()

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Could not save balance.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, snapshot: data })
  } catch (err) {
    console.error('cash/snapshot POST error:', err)
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 })
  }
}