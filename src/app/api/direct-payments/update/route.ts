// src/app/api/direct-payments/update/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })
    }

    const formData = await request.formData()
    const id = formData.get('id') as string
    if (!id) return NextResponse.json({ success: false, error: 'Payment ID required' }, { status: 400 })

    // Verify ownership
    const { data: existing } = await supabase
      .from('direct_payments')
      .select('id, attachment_url')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    if (!existing) return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 })

    const amount            = parseFloat(formData.get('amount') as string)
    const paymentType       = formData.get('payment_type') as string
    const paymentMethod     = formData.get('payment_method') as string
    const revenueCategoryId = formData.get('revenue_category_id') as string
    const description       = (formData.get('description') as string || '').trim()
    const notes             = (formData.get('notes') as string || '').trim() || null
    const paymentDate       = formData.get('payment_date') as string
    const clientId          = (formData.get('client_id') as string || '').trim() || null
    const removeAttachment  = formData.get('remove_attachment') === 'true'
    const attachmentFile    = formData.get('attachment') as File | null

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Amount must be greater than 0' }, { status: 400 })
    }
    if (!revenueCategoryId) {
      return NextResponse.json({ success: false, error: 'Revenue category is required' }, { status: 400 })
    }
    if (!description) {
      return NextResponse.json({ success: false, error: 'Description is required' }, { status: 400 })
    }

    // Handle attachment
    let attachmentUrl: string | null = existing.attachment_url

    if (attachmentFile && attachmentFile.size > 0) {
      if (attachmentFile.size > MAX_ATTACHMENT_BYTES) {
        return NextResponse.json({ success: false, error: 'Attachment must be under 10MB' }, { status: 400 })
      }
      const safeName = attachmentFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = `${user.id}/${Date.now()}-${safeName}`
      const { error: uploadError } = await supabase.storage
        .from('payment-attachments')
        .upload(filePath, attachmentFile, { cacheControl: '3600', upsert: false, contentType: attachmentFile.type })
      if (uploadError) throw new Error(`Attachment upload failed: ${uploadError.message}`)
      const { data: urlData } = supabase.storage.from('payment-attachments').getPublicUrl(filePath)
      attachmentUrl = urlData.publicUrl
    } else if (removeAttachment) {
      attachmentUrl = null
    }

    const { data: payment, error: updateError } = await supabase
      .from('direct_payments')
      .update({
        client_id:           clientId,
        revenue_category_id: revenueCategoryId,
        amount,
        payment_type:        paymentType,
        payment_method:      paymentMethod,
        description,
        notes,
        payment_date:        paymentDate,
        attachment_url:      attachmentUrl,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        id, amount, payment_type, payment_method, description,
        notes, payment_date, attachment_url, created_at,
        revenue_categories (id, name, color),
        clients (id, name, company)
      `)
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ success: true, payment })
  } catch (err: any) {
    console.error('PATCH /api/direct-payments/update error:', err)
    return NextResponse.json({ success: false, error: err.message || 'Failed to update payment' }, { status: 500 })
  }
}
