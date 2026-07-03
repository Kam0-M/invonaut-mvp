import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { suggestCategory } from '@/lib/ai/expense-categorization'
import { isSubscriptionActive } from '@/lib/subscription-status'

export async function POST(request: NextRequest) {
  try {
    const { description, vendor } = await request.json()

    if (!description?.trim()) {
      return NextResponse.json({ success: false, error: 'Description is required.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'You must be logged in.' }, { status: 401 })
    }

    // AI categorisation is a Professional+ feature
    // Checklist #36: was tier-only — a canceled Pro/Business user kept
    // triggering real OpenAI spend indefinitely, since subscription_tier is
    // intentionally preserved on cancellation (#33).
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier, stripe_subscription_id, subscription_status, trial_end_date')
      .eq('id', user.id)
      .single()
    const tier = profile?.subscription_tier ?? 'starter'
    const canAccess = isSubscriptionActive(profile) && (tier === 'professional' || tier === 'business')
    if (!canAccess) {
      return NextResponse.json({ success: true, category: null })
    }

    const category = await suggestCategory(description, vendor)
    return NextResponse.json({ success: true, category })
  } catch (err) {
    console.error('Categorize error:', err)
    // Checklist #30: this previously returned {success:true, category:'other'}
    // on ANY error, indistinguishable from the client's perspective from the AI
    // genuinely deciding "other" was the right answer. Surface an honest failure
    // instead so the UI can tell the user AI categorization didn't run, rather
    // than presenting an unconfirmed guess as if it were a confident suggestion.
    return NextResponse.json(
      { success: false, error: 'AI categorization is unavailable right now. Pick a category manually.' },
      { status: 502 }
    )
  }
}