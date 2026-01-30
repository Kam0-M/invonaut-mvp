import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Create admin Supabase client (bypasses RLS)
function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== DOWNGRADE API CALLED ===')
    
    // Use regular client for auth check
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const targetTier = formData.get('planId') as string

    console.log('Downgrade request:', { 
      targetTier, 
      userId: user.id,
    })

    if (!targetTier) {
      console.error('Missing planId')
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Use admin client for database operations
    const adminSupabase = createAdminClient()

    // Get user profile
    const { data: profile, error: profileError } = await adminSupabase
      .from('user_profiles')
      .select('stripe_subscription_id, subscription_tier')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profile.stripe_subscription_id) {
      console.error('No subscription ID found')
      return NextResponse.json({ error: 'No active subscription to downgrade' }, { status: 400 })
    }

    const currentTier = profile.subscription_tier
    console.log(`Processing downgrade: ${currentTier} → ${targetTier}`)

    // Validate downgrade is valid
    if (targetTier === 'starter' || targetTier === 'professional') {
      console.log('Setting subscription to cancel at period end...')

      // Step 1: Update Stripe subscription
      const subscription = await stripe.subscriptions.update(
        profile.stripe_subscription_id,
        {
          cancel_at_period_end: true,
        }
      )

      console.log('✅ Subscription set to cancel at period end')
      console.log('Cancel date:', subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : 'null')

      // Step 2: Store target tier in database
      const { error: updateError } = await adminSupabase
        .from('user_profiles')
        .update({ 
          target_tier: targetTier  // Store where they're downgrading to
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Failed to update target_tier:', updateError)
        // Don't fail the request, but log it
      } else {
        console.log(`✅ Stored target_tier: ${targetTier}`)
      }

      // Step 3: Redirect to cancellation pending page
      return NextResponse.redirect(
        new URL('/cancellation-pending', request.url)
      )
    }

    // Invalid target
    console.error('Invalid downgrade target:', targetTier)
    return NextResponse.json({ 
      error: 'Invalid downgrade target' 
    }, { status: 400 })

  } catch (error) {
    console.error('Downgrade error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process downgrade' },
      { status: 500 }
    )
  }
}