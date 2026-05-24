import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subscription_id, dismiss } = await req.json()

  const { data: sub } = await supabase
    .from('subscription_detections')
    .select('*')
    .eq('id', subscription_id)
    .eq('user_id', user.id)
    .single()

  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (dismiss) {
    await supabase
      .from('subscription_detections')
      .update({ log_status: 'dismissed', dismissed_at: new Date().toISOString() })
      .eq('id', subscription_id)
    return NextResponse.json({ success: true })
  }

  // Create an expense record
  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({
      user_id:     user.id,
      description: sub.merchant_name,
      amount:      sub.amount,
      category:    sub.suggested_category ?? 'Software',
      date:        sub.last_seen_date,
      vendor:      sub.merchant_name,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase
    .from('subscription_detections')
    .update({ log_status: 'logged', logged_expense_id: expense.id })
    .eq('id', subscription_id)

  return NextResponse.json({ success: true })
}
