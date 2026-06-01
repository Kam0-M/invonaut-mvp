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
    serial_number, has_serial_number, workflow_status, reviewer_email,
  } = body

  if (!name || !purchase_date || purchase_cost == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Serial number required when has_serial_number is true
  if (has_serial_number && !serial_number?.trim()) {
    return NextResponse.json({ error: 'Serial number is required for this asset type' }, { status: 400 })
  }

  const finalStatus = workflow_status || 'draft'

  const { data, error } = await supabase
    .from('assets')
    .insert({
      user_id:              user.id,
      name:                 name.trim(),
      category:             category              || 'other',
      description:          description           || null,
      purchase_date,
      purchase_cost:        Number(purchase_cost),
      salvage_value:        Number(salvage_value  || 0),
      useful_life_years:    Number(useful_life_years || 5),
      depreciation_method:  depreciation_method   || 'straight_line',
      notes:                notes                 || null,
      serial_number:        has_serial_number ? (serial_number?.trim() || null) : null,
      has_serial_number:    has_serial_number ?? true,
      workflow_status:      finalStatus,
      reviewer_email:       reviewer_email        || null,
      status:               'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
