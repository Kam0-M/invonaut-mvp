// Public endpoint — no auth cookie needed, validated by token
import { createClient as adminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function createAdmin() {
  return adminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: Request) {
  const { token, action, reviewer_name, rejection_note } = await req.json()

  if (!token || !action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const admin = createAdmin()

  // Validate token
  const { data: tokenRow, error: tokenErr } = await admin
    .from('asset_review_tokens')
    .select('*')
    .eq('token', token)
    .single()

  if (tokenErr || !tokenRow) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
  if (tokenRow.used_at)      return NextResponse.json({ error: 'This review link has already been used' }, { status: 410 })
  if (new Date(tokenRow.expires_at) < new Date()) return NextResponse.json({ error: 'This review link has expired' }, { status: 410 })

  const newStatus   = action === 'approve' ? 'approved' : 'rejected'
  const now         = new Date().toISOString()

  // Update asset
  const { error: assetErr } = await admin
    .from('assets')
    .update({
      workflow_status:  newStatus,
      reviewed_at:      now,
      reviewed_by_name: reviewer_name || tokenRow.reviewer_name || 'Reviewer',
      rejection_note:   action === 'reject' ? (rejection_note || null) : null,
    })
    .eq('id', tokenRow.asset_id)

  if (assetErr) return NextResponse.json({ error: assetErr.message }, { status: 500 })

  // Mark token as used
  await admin.from('asset_review_tokens').update({ used_at: now }).eq('id', tokenRow.id)

  return NextResponse.json({ ok: true, action, asset_id: tokenRow.asset_id })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const admin = createAdmin()

  const { data: tokenRow, error } = await admin
    .from('asset_review_tokens')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !tokenRow) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })

  // Check if expired or used
  if (tokenRow.used_at)                           return NextResponse.json({ status: 'used' })
  if (new Date(tokenRow.expires_at) < new Date()) return NextResponse.json({ status: 'expired' })

  // Fetch asset details
  const { data: asset } = await admin
    .from('assets')
    .select('*')
    .eq('id', tokenRow.asset_id)
    .single()

  // Fetch business name
  const { data: profile } = await admin
    .from('user_profiles')
    .select('business_name, full_name')
    .eq('id', tokenRow.user_id)
    .single()

  return NextResponse.json({
    status:   'valid',
    asset,
    token:    tokenRow,
    submitter_name: profile?.business_name || profile?.full_name || 'Your colleague',
  })
}
