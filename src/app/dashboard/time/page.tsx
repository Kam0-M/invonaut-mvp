// src/app/dashboard/time/page.tsx
//
// WHAT THIS PAGE DOES:
//   The main Time Tracking page. Shows three things stacked:
//   1. TimeTracker — the live start/stop timer at the top
//   2. WeeklySummary — this week's totals in a sidebar-style column
//   3. TimeEntryList — full time log with filter tabs (All / Unbilled / Billed)
//
//   The "Add Manual Entry" button links to /dashboard/time/new for entries
//   where the user remembers the hours after the fact (calls, offline work, etc).
//
// DATA FLOW:
//   All data is fetched server-side and passed as props to the client components.
//   The page re-fetches on router.refresh() — which is called by TimeTracker
//   after saving an entry and by TimeEntryList after deleting one.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Clock } from 'lucide-react'
import TimeTracker from '@/components/time/time-tracker'
import TimeEntryList from '@/components/time/time-entry-list'
import WeeklySummary from '@/components/time/weekly-summary'
import BackToTop from '@/components/ui/back-to-top'

type Client = {
  id:           string
  name:         string
  company:      string | null
  hourly_rate:  number | null
}

type TimeEntry = {
  id:               string
  description:      string
  started_at:       string
  ended_at:         string | null
  duration_seconds: number | null
  hourly_rate:      number | null
  billable:         boolean
  invoice_id:       string | null
  created_at:       string
  clients:          Client | null
}

export default async function TimePage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_subscription_id, subscription_status')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription =
    !!profile?.stripe_subscription_id &&
    (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')

  // Clients for the timer dropdown — include hourly_rate so the live amount preview works
  const { data: clientsData } = await supabase
    .from('clients')
    .select('id, name, company, hourly_rate')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  const clients = (clientsData ?? []) as Client[]

  // All time entries, newest first. Limit 200 — enough for any active user.
  const { data: entriesRaw } = await supabase
    .from('time_entries')
    .select(
      'id, description, started_at, ended_at, duration_seconds, hourly_rate, billable, invoice_id, created_at, clients(id, name, company)'
    )
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(200)

  // Normalise Supabase join — always a single object, not an array
  const entries = (entriesRaw ?? []).map((e: any): TimeEntry => ({
    ...e,
    clients: Array.isArray(e.clients) ? (e.clients[0] ?? null) : (e.clients ?? null),
  }))

  // ── No subscription ──────────────────────────────────────────────────────
  if (!hasActiveSubscription) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
            Time Tracking
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Track billable hours and turn them into invoices
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7 text-blue-600" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">Time tracking requires a plan</h3>
          <p className="text-sm text-gray-500 mb-6 font-medium">
            Log billable hours per client and convert them directly to invoice line items.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 btn-primary px-6 py-3 rounded-xl"
          >
            Start free trial
          </Link>
        </div>
      </div>
    )
  }

  // ── Main view ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-bold text-[#0055FF] uppercase tracking-widest inv-overline mb-1">Time Tracking</p>
          <p className="text-sm text-gray-500 font-medium">Track billable hours · convert to invoices with one click</p>
        </div>
        <Link href="/dashboard/time/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-primary rounded-xl text-sm transition-all hover:shadow-md flex-shrink-0">
          <Plus className="w-4 h-4" />Manual Entry
        </Link>
      </div>

      {/* Live timer */}
      <TimeTracker clients={clients} />

      {/* Weekly summary + full entry log */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <WeeklySummary entries={entries} />
        </div>
        <div className="xl:col-span-2">
          <TimeEntryList entries={entries} />
        </div>
      </div>
      <BackToTop />
    </div>
  )
}