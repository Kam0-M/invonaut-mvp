import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SLUG_REGEX = /^[a-z0-9-]{3,40}$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
    const isEnabled = Boolean(body.isEnabled)
    const customMessage =
      typeof body.customMessage === 'string' ? body.customMessage : ''

    if (!slug || !SLUG_REGEX.test(slug)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid portal URL. Use 3–40 lowercase letters, numbers, or hyphens only.'
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in.' },
        { status: 401 }
      )
    }

    const { data: existing, error: existingError } = await supabase
      .from('portal_settings')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingError) {
      return NextResponse.json(
        { success: false, error: 'Could not load portal settings.' },
        { status: 500 }
      )
    }

    const now = new Date().toISOString()

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from('portal_settings')
        .update({
          slug,
          is_enabled: isEnabled,
          custom_message: customMessage || null,
          updated_at: now
        })
        .eq('user_id', user.id)

      if (updateError) {
        if (
          updateError.code === '23505' ||
          updateError.message?.toLowerCase().includes('duplicate')
        ) {
          return NextResponse.json(
            {
              success: false,
              error:
                'This portal URL is taken. Please choose a different one.'
            },
            { status: 409 }
          )
        }
        return NextResponse.json(
          { success: false, error: 'Could not save portal settings.' },
          { status: 500 }
        )
      }
    } else {
      const { error: insertError } = await supabase
        .from('portal_settings')
        .insert({
          user_id: user.id,
          slug,
          is_enabled: isEnabled,
          custom_message: customMessage || null,
          updated_at: now
        })

      if (insertError) {
        if (
          insertError.code === '23505' ||
          insertError.message?.toLowerCase().includes('duplicate')
        ) {
          return NextResponse.json(
            {
              success: false,
              error:
                'This portal URL is taken. Please choose a different one.'
            },
            { status: 409 }
          )
        }
        return NextResponse.json(
          { success: false, error: 'Could not save portal settings.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Portal save-settings error:', err)
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
