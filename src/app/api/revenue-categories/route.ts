// src/app/api/revenue-categories/route.ts
//
// Handles all CRUD for revenue_categories.
//
// GET    /api/revenue-categories            — list all for the user (sorted by name)
// POST   /api/revenue-categories            — create a new category
// PATCH  /api/revenue-categories            — update a category (name, description, color)
// DELETE /api/revenue-categories            — delete a category
//
// DELETE guard (Option A from spec):
//   If any invoices reference this category, deletion is blocked.
//   The response includes the count so the UI can show a helpful message.
//   Future: direct_payments will also be checked here in Phase 14.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── GET ────────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('revenue_categories')
      .select('id, name, description, color, created_at')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, categories: data || [] })
  } catch (err: any) {
    console.error('GET /api/revenue-categories error:', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// ── POST ───────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })
    }

    const body = await request.json()
    const name        = (body.name        || '').trim()
    const description = (body.description || '').trim() || null
    const color       = body.color || '#6366F1'

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('revenue_categories')
      .insert({ user_id: user.id, name, description, color })
      .select('id, name, description, color, created_at')
      .single()

    if (error) {
      // Unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: `A category named "${name}" already exists.` },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ success: true, category: data })
  } catch (err: any) {
    console.error('POST /api/revenue-categories error:', err)
    return NextResponse.json({ success: false, error: 'Failed to create category' }, { status: 500 })
  }
}

// ── PATCH ──────────────────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, description, color } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Category ID is required' }, { status: 400 })
    }

    const updates: Record<string, any> = {}
    if (name        !== undefined) updates.name        = (name || '').trim()
    if (description !== undefined) updates.description = (description || '').trim() || null
    if (color       !== undefined) updates.color       = color

    if (updates.name === '') {
      return NextResponse.json({ success: false, error: 'Name cannot be empty' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('revenue_categories')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, name, description, color, created_at')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: `A category named "${updates.name}" already exists.` },
          { status: 409 }
        )
      }
      throw error
    }

    if (!data) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, category: data })
  } catch (err: any) {
    console.error('PATCH /api/revenue-categories error:', err)
    return NextResponse.json({ success: false, error: 'Failed to update category' }, { status: 500 })
  }
}

// ── DELETE ─────────────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Category ID is required' }, { status: 400 })
    }

    // ── Option A: block deletion if any invoices or direct_payments reference this category ──
    const { count: invoiceCount, error: invoiceCountError } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('revenue_category_id', id)
      .eq('user_id', user.id)

    if (invoiceCountError) throw invoiceCountError

    const { count: paymentCount, error: paymentCountError } = await supabase
      .from('direct_payments')
      .select('id', { count: 'exact', head: true })
      .eq('revenue_category_id', id)
      .eq('user_id', user.id)

    if (paymentCountError) throw paymentCountError

    const totalUsage = (invoiceCount || 0) + (paymentCount || 0)

    if (totalUsage > 0) {
      const parts = []
      if (invoiceCount && invoiceCount > 0) parts.push(`${invoiceCount} invoice${invoiceCount !== 1 ? 's' : ''}`)
      if (paymentCount && paymentCount > 0) parts.push(`${paymentCount} direct payment${paymentCount !== 1 ? 's' : ''}`)
      return NextResponse.json(
        {
          success: false,
          blocked: true,
          usageCount: totalUsage,
          error: `This category is used by ${parts.join(' and ')}. Reassign them before deleting.`,
        },
        { status: 409 }
      )
    }

    const { error: deleteError } = await supabase
      .from('revenue_categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/revenue-categories error:', err)
    return NextResponse.json({ success: false, error: 'Failed to delete category' }, { status: 500 })
  }
}
