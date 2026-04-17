// src/app/api/direct-payments/delete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })
    }

    const { id } = await request.json()
    if (!id) return NextResponse.json({ success: false, error: 'Payment ID required' }, { status: 400 })

    // Fetch to verify ownership and get attachment URL for storage cleanup
    const { data: payment } = await supabase
      .from('direct_payments')
      .select('id, attachment_url')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!payment) return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 })

    // Clean up storage attachment if present
    if (payment.attachment_url) {
      const marker = '/payment-attachments/'
      const markerIdx = payment.attachment_url.indexOf(marker)
      if (markerIdx !== -1) {
        const storagePath = decodeURIComponent(payment.attachment_url.slice(markerIdx + marker.length))
        await supabase.storage.from('payment-attachments').remove([storagePath])
        // Non-fatal — still delete the DB record even if storage cleanup fails
      }
    }

    const { error: deleteError } = await supabase
      .from('direct_payments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/direct-payments/delete error:', err)
    return NextResponse.json({ success: false, error: err.message || 'Failed to delete payment' }, { status: 500 })
  }
}