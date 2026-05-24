import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { insight_id } = await req.json()
  if (!insight_id) return NextResponse.json({ error: 'Missing insight_id' }, { status: 400 })

  const { error } = await supabase
    .from('financial_insights')
    .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
    .eq('id', insight_id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
