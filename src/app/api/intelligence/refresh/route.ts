import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier, subscription_status')
    .eq('id', user.id)
    .single()

  const tier = profile?.subscription_tier ?? 'starter'
  if (!['professional', 'business'].includes(tier)) {
    return NextResponse.json({ error: 'Intelligence requires Professional or Business plan.' }, { status: 403 })
  }

  // Trigger the cron for just this user by calling the internal route
  try {
    const baseUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const cronSecret = process.env.CRON_SECRET ?? 'dev'
    await fetch(`${baseUrl}/api/cron/financial-intelligence`, {
      method:  'GET',
      headers: { authorization: `Bearer ${cronSecret}` },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[intelligence/refresh]', err)
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 })
  }
}
