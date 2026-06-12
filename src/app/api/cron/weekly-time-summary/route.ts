// src/app/api/cron/weekly-time-summary/route.ts
//
// Runs every Monday at 9am UTC via Vercel Cron (registered in vercel.json).
//
// WHAT IT DOES:
//   Sends a weekly time summary email to every Professional or Business user
//   who has at least one time entry from the previous week (Mon–Sun).
//
// TIER GATING:
//   Only Professional and Business users receive the email.
//   Starter users track time but don't get the weekly digest.
//
// DEDUPLICATION:
//   There's no stored flag for this cron — it naturally deduplicates because
//   it queries the PREVIOUS calendar week and only sends if there are entries.
//   Running it twice in the same Monday window is safe (same data, same result).
//
// IMPORTANT:
//   Uses the admin Supabase client (service role key) because RLS would block
//   cross-user queries. This is the same pattern as every other cron in this app.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import {
  generateWeeklyTimeSummaryHTML,
  generateWeeklyTimeSummaryText,
  type WeeklyTimeSummaryEmailData,
} from '@/lib/email/weekly-time-summary-email-template'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://invonaut-mvp-git-main-kam0-ms-projects.vercel.app'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Returns Monday 00:00:00 and Sunday 23:59:59 of the PREVIOUS calendar week (UTC)
function getPreviousWeekBounds(): { start: Date; end: Date } {
  const now    = new Date()
  const day    = now.getUTCDay()              // 0 = Sun, 1 = Mon, ...
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - day - 6)   // previous Monday
  monday.setUTCHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  sunday.setUTCHours(23, 59, 59, 999)
  return { start: monday, end: sunday }
}

function formatWeekLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export async function GET(request: NextRequest) {
  // Auth check — same pattern as all other crons
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase  = createAdminClient()
  const { start: weekStart, end: weekEnd } = getPreviousWeekBounds()

  const weekStartISO = weekStart.toISOString()
  const weekEndISO   = weekEnd.toISOString()

  let emailsSent = 0
  const errors: string[] = []

  try {
    // ── 1. Fetch all Pro/Business users with their profile info ──────────────
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, subscription_tier, subscription_status, stripe_subscription_id')
      .in('subscription_tier', ['professional', 'business'])

    if (profilesError) {
      return NextResponse.json({ success: false, error: profilesError.message }, { status: 500 })
    }

    const eligibleProfiles = (profiles ?? []).filter(p =>
      p.stripe_subscription_id &&
      (p.subscription_status === 'active' || p.subscription_status === 'trialing')
    )

    // ── 2. For each eligible user, fetch their time entries for last week ────
    for (const profile of eligibleProfiles) {
      try {
        const { data: entries, error: entriesError } = await supabase
          .from('time_entries')
          .select('id, duration_seconds, hourly_rate, billable, invoice_id, client_id, clients(id, name)')
          .eq('user_id', profile.id)
          .gte('started_at', weekStartISO)
          .lte('started_at', weekEndISO)

        if (entriesError || !entries || entries.length === 0) continue

        // ── 3. Calculate summary numbers ─────────────────────────────────────
        const totalSeconds    = entries.reduce((s, e) => s + (e.duration_seconds ?? 0), 0)
        const billableSeconds = entries
          .filter(e => e.billable)
          .reduce((s, e) => s + (e.duration_seconds ?? 0), 0)

        // Total unbilled value (billable + no invoice + has rate)
        const unbilledValue = entries
          .filter(e => e.billable && !e.invoice_id && e.hourly_rate)
          .reduce((s, e) => {
            const hours = (e.duration_seconds ?? 0) / 3600
            return s + Math.round(hours * e.hourly_rate! * 100) / 100
          }, 0)

        const unbilledEntries = entries.filter(e => e.billable && !e.invoice_id).length

        // Per-client breakdown
        const clientMap = new Map<string, { name: string; hours: number; unbilledValue: number }>()
        entries.forEach((e: any) => {
          const client = Array.isArray(e.clients) ? e.clients[0] : e.clients
          const key    = client?.id ?? '__none'
          const name   = client?.name ?? 'No client'
          const hours  = (e.duration_seconds ?? 0) / 3600
          const uv     = e.billable && !e.invoice_id && e.hourly_rate
            ? Math.round(hours * e.hourly_rate * 100) / 100
            : 0
          const prev = clientMap.get(key) ?? { name, hours: 0, unbilledValue: 0 }
          clientMap.set(key, { name, hours: prev.hours + hours, unbilledValue: prev.unbilledValue + uv })
        })

        const clientBreakdown = Array.from(clientMap.values())
          .sort((a, b) => b.hours - a.hours)
          .map(c => ({ ...c, hours: Math.round(c.hours * 100) / 100 }))

        const emailData: WeeklyTimeSummaryEmailData = {
          ownerName:       profile.full_name?.split(' ')[0] || 'there',
          weekStart:       formatWeekLabel(weekStart),
          weekEnd:         formatWeekLabel(weekEnd),
          totalHours:      Math.round((totalSeconds / 3600) * 100) / 100,
          billableHours:   Math.round((billableSeconds / 3600) * 100) / 100,
          unbilledValue,
          unbilledEntries,
          clientBreakdown,
          timeUrl:         `${APP_URL}/dashboard/time`,
          invoiceUrl:      `${APP_URL}/dashboard/invoices/new`,
        }

        // ── 4. Send the email ─────────────────────────────────────────────────
        const toEmail = profile.email ?? ''
        if (!toEmail) continue

        await getResend().emails.send({
          from:    'Invonaut <notifications@invonaut.app>',
          to:      [toEmail],
          subject: `Your time summary: ${emailData.totalHours} hrs tracked (${emailData.weekStart} – ${emailData.weekEnd})`,
          html:    generateWeeklyTimeSummaryHTML(emailData),
          text:    generateWeeklyTimeSummaryText(emailData),
        })

        emailsSent++
      } catch (userErr: any) {
        console.error(`weekly-time-summary: error for user ${profile.id}:`, userErr?.message)
        errors.push(`${profile.id}: ${userErr?.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      eligibleUsers: eligibleProfiles.length,
      weekStart: weekStartISO,
      weekEnd:   weekEndISO,
      errors:    errors.length > 0 ? errors : undefined,
    })
  } catch (err: any) {
    console.error('weekly-time-summary cron error:', err)
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 })
  }
}