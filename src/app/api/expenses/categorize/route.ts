import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { suggestCategory } from '@/lib/ai/expense-categorization'

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

    const category = await suggestCategory(description, vendor)
    return NextResponse.json({ success: true, category })
  } catch (err) {
    console.error('Categorize error:', err)
    // Non-fatal — fall back to 'other' silently
    return NextResponse.json({ success: true, category: 'other' })
  }
}