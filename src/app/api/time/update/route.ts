// src/app/api/time/update/route.ts
// Two operations in one route:
//
// 1. Mark entries as billed — called when an invoice is saved after the user
//    selects time entries via UnbilledEntriesPicker.
//    Body: { action: 'mark_billed', entryIds: string[], invoiceId: string }
//
// 2. Delete a single entry — called by the delete button in TimeEntryList.
//    Body: { action: 'delete', entryId: string }
//
// RLS guarantees users can only touch their own entries, but we double-check.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'You must be logged in.' }, { status: 401 })
    }

    // ── Mark entries as billed ──────────────────────────────────────────────
    if (action === 'mark_billed') {
      const { entryIds, invoiceId } = body

      if (!Array.isArray(entryIds) || entryIds.length === 0) {
        return NextResponse.json({ success: false, error: 'No entry IDs provided.' }, { status: 400 })
      }
      if (!invoiceId) {
        return NextResponse.json({ success: false, error: 'Invoice ID is required.' }, { status: 400 })
      }

      // Verify invoice belongs to user
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('id', invoiceId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!invoice) {
        return NextResponse.json({ success: false, error: 'Invoice not found.' }, { status: 404 })
      }

      const { error: updateError } = await supabase
        .from('time_entries')
        .update({ invoice_id: invoiceId })
        .in('id', entryIds)
        .eq('user_id', user.id)
        .is('invoice_id', null)   // safety: never overwrite an already-billed entry

      if (updateError) {
        console.error('mark_billed error:', updateError)
        return NextResponse.json({ success: false, error: 'Could not mark entries as billed.' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    // ── Delete a single entry ───────────────────────────────────────────────
    if (action === 'delete') {
      const { entryId } = body

      if (!entryId) {
        return NextResponse.json({ success: false, error: 'Entry ID is required.' }, { status: 400 })
      }

      // Only allow deleting unbilled entries
      const { data: entry } = await supabase
        .from('time_entries')
        .select('id, invoice_id')
        .eq('id', entryId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!entry) {
        return NextResponse.json({ success: false, error: 'Entry not found.' }, { status: 404 })
      }
      if (entry.invoice_id) {
        return NextResponse.json({ success: false, error: 'Cannot delete a billed entry.' }, { status: 400 })
      }

      const { error: deleteError } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('delete entry error:', deleteError)
        return NextResponse.json({ success: false, error: 'Could not delete entry.' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Unknown action.' }, { status: 400 })
  } catch (err) {
    console.error('Time update error:', err)
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 })
  }
}