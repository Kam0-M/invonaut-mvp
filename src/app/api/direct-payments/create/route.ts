// src/app/api/direct-payments/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })
    }

    const formData = await request.formData()

    const amount             = parseFloat(formData.get('amount') as string)
    const paymentType        = formData.get('payment_type') as string
    const paymentMethod      = formData.get('payment_method') as string
    const revenueCategoryId  = formData.get('revenue_category_id') as string
    const description        = (formData.get('description') as string || '').trim()
    const notes              = (formData.get('notes') as string || '').trim() || null
    const paymentDate        = formData.get('payment_date') as string
    const clientId           = (formData.get('client_id') as string || '').trim() || null
    const attachmentFile     = formData.get('attachment') as File | null

    // Validation
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Amount must be greater than 0' }, { status: 400 })
    }
    if (!['cash', 'prepay'].includes(paymentType)) {
      return NextResponse.json({ success: false, error: 'Invalid payment type' }, { status: 400 })
    }
    if (!['cash', 'bank', 'mobile', 'pos'].includes(paymentMethod)) {
      return NextResponse.json({ success: false, error: 'Invalid payment method' }, { status: 400 })
    }
    if (!revenueCategoryId) {
      return NextResponse.json({ success: false, error: 'Revenue category is required' }, { status: 400 })
    }
    if (!description) {
      return NextResponse.json({ success: false, error: 'Description is required' }, { status: 400 })
    }
    if (!paymentDate) {
      return NextResponse.json({ success: false, error: 'Payment date is required' }, { status: 400 })
    }

    // Verify category belongs to this user
    const { data: catCheck } = await supabase
      .from('revenue_categories')
      .select('id')
      .eq('id', revenueCategoryId)
      .eq('user_id', user.id)
      .single()
    if (!catCheck) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    }

    // Verify client belongs to this user if provided
    if (clientId) {
      const { data: clientCheck } = await supabase
        .from('clients')
        .select('id')
        .eq('id', clientId)
        .eq('user_id', user.id)
        .single()
      if (!clientCheck) {
        return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 })
      }
    }

    // Upload attachment if provided
    let attachmentUrl: string | null = null
    if (attachmentFile && attachmentFile.size > 0) {
      if (attachmentFile.size > MAX_ATTACHMENT_BYTES) {
        return NextResponse.json({ success: false, error: 'Attachment must be under 10MB' }, { status: 400 })
      }
      const safeName = attachmentFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = `${user.id}/${Date.now()}-${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('payment-attachments')
        .upload(filePath, attachmentFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: attachmentFile.type || 'application/octet-stream',
        })

      if (uploadError) throw new Error(`Attachment upload failed: ${uploadError.message}`)

      const { data: urlData } = supabase.storage
        .from('payment-attachments')
        .getPublicUrl(filePath)
      attachmentUrl = urlData.publicUrl
    }

    // Insert
    const { data: payment, error: insertError } = await supabase
      .from('direct_payments')
      .insert({
        user_id:             user.id,
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
      .select(`
        id, amount, payment_type, payment_method, description,
        notes, payment_date, attachment_url, created_at,
        revenue_categories (id, name, color),
        clients (id, name, company)
      `)
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ success: true, payment })
  } catch (err: any) {
    console.error('POST /api/direct-payments/create error:', err)
    return NextResponse.json({ success: false, error: err.message || 'Failed to create payment' }, { status: 500 })
  }
}