import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reviewContract } from '@/lib/ai/contract-review'
import { isSubscriptionActive } from '@/lib/subscription-status'

export async function POST(request: NextRequest) {
  try {
    const { contractId } = await request.json()

    if (!contractId) {
      return NextResponse.json({ success: false, error: 'Contract ID is required.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'You must be logged in.' }, { status: 401 })
    }

    // Check tier — Pro and Business only
    // Checklist #36: was tier-only — subscription_tier is intentionally
    // preserved on cancellation (#33), so this let a canceled Pro/Business
    // user trigger real OpenAI spend indefinitely. Must also require an
    // active subscription, same pattern as send-invoice/download-invoice.
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier, stripe_subscription_id, subscription_status, trial_end_date')
      .eq('id', user.id)
      .single()

    const tier = profile?.subscription_tier ?? 'starter'
    const canAccess = isSubscriptionActive(profile) && (tier === 'professional' || tier === 'business')
    if (!canAccess) {
      return NextResponse.json({
        success: false,
        error: 'AI Contract Review is available on Professional and Business plans.',
      }, { status: 403 })
    }

    // Fetch contract
    const { data: contract } = await supabase
      .from('contracts')
      .select('id, title, content')
      .eq('id', contractId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!contract) {
      return NextResponse.json({ success: false, error: 'Contract not found.' }, { status: 404 })
    }

    const clauses = (contract.content ?? []) as { title: string; content: string }[]

    if (clauses.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'This contract has no clauses to review.',
      }, { status: 400 })
    }

    const result = await reviewContract(contract.title, clauses)

    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    console.error('Contract review error:', err)

    // Surface quota/auth errors clearly
    if (err?.status === 429 || err?.code === 'insufficient_quota') {
      return NextResponse.json({
        success: false,
        error: 'AI review is temporarily unavailable — OpenAI quota exceeded. Add credits to your OpenAI account.',
      }, { status: 503 })
    }

    return NextResponse.json({
      success: false,
      error: 'Could not complete AI review. Please try again.',
    }, { status: 500 })
  }
}