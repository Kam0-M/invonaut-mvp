import { createClient } from '@/lib/supabase/server'
import { NextResponse }  from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('user_id', user.id)
    .order('purchase_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    name, category, description, purchase_date, purchase_cost,
    salvage_value, useful_life_years, depreciation_method, notes,
  } = body

  if (!name || !purchase_date || purchase_cost == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('assets')
    .insert({
      user_id: user.id,
      name:                 name.trim(),
      category:             category            || 'other',
      description:          description         || null,
      purchase_date,
      purchase_cost:        Number(purchase_cost),
      salvage_value:        Number(salvage_value || 0),
      useful_life_years:    Number(useful_life_years || 5),
      depreciation_method:  depreciation_method || 'straight_line',
      notes:                notes               || null,
      status: 'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
