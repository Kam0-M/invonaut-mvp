import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSubscriptionActive } from '@/lib/subscription-status'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Checklist #36: was tier-only — a canceled Pro/Business user could keep
  // triggering this indefinitely (subscription_tier is intentionally
  // preserved on cancellation, #33). Compounds #37 below, since each click
  // wasn't even scoped to the caller.
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier, stripe_subscription_id, subscription_status, trial_end_date')
    .eq('id', user.id)
    .single()

  const tier = profile?.subscription_tier ?? 'starter'
  const canAccess = isSubscriptionActive(profile) && (tier === 'professional' || tier === 'business')
  if (!canAccess) {
    return NextResponse.json({ error: 'Intelligence requires an active Professional or Business plan.' }, { status: 403 })
  }

  // Trigger the cron for just this user by calling the internal route.
  // Checklist #37: previously called with no user-scoping parameter, and
  // the cron route had no searchParams handling to target a single user —
  // so any one click re-ran full AI intelligence generation (real OpenAI
  // spend) for every Pro/Business subscriber on the platform, not just the
  // clicker. The cron route now honors ?userId= to scope the run.
  try {
    const baseUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const cronSecret = process.env.CRON_SECRET ?? 'dev'
    await fetch(`${baseUrl}/api/cron/financial-intelligence?userId=${encodeURIComponent(user.id)}`, {
      method:  'GET',
      headers: { authorization: `Bearer ${cronSecret}` },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[intelligence/refresh]', err)
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 })
  }
}
