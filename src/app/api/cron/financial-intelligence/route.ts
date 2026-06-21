import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// ── Inline admin client — same pattern as all other cron routes ──────────────
function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ── Lazy OpenAI init — never module-level ────────────────────────────────────
function getOpenAI() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { default: OpenAI } = require('openai')
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Soft CRON_SECRET check — matches existing cron pattern
  // If secret isn't set (local dev), allow through
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Fetch all Pro/Business subscribers who should get intelligence features —
  // includes trialing, not just active. Previously this only matched 'active',
  // which silently skipped every real user still in their 14-day trial (6 of 9
  // real Pro/Business signups at time of audit) — compounding the ai_risk_score
  // gap (Checklist #3), since the cron that computes it never ran for them at all.
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, subscription_tier')
    .in('subscription_tier', ['professional', 'business'])
    .in('subscription_status', ['active', 'trialing'])

  if (!profiles?.length) return NextResponse.json({ processed: 0 })

  let processed = 0, errors = 0

  for (const profile of profiles) {
    try {
      await runIntelligenceForUser(supabase, profile.id, profile.subscription_tier)
      processed++
    } catch (err) {
      console.error(`[intelligence-cron] user ${profile.id}:`, err)
      errors++
    }
  }

  return NextResponse.json({ processed, errors })
}

async function runIntelligenceForUser(supabase: any, userId: string, tier: string) {
  const now   = new Date()
  const day30 = new Date(now); day30.setDate(day30.getDate() - 30)
  const day60 = new Date(now); day60.setDate(day60.getDate() - 60)
  const day90 = new Date(now); day90.setDate(day90.getDate() - 90)

  // ── Gather full financial context ──────────────────────────────────────────
  const [
    { data: invoices },
    { data: clients },
    { data: expenses },
    { data: timeEntries },
    { data: bankTx },
    { data: connectedAccounts },
    { data: directPayments },
    { data: contracts },
  ] = await Promise.all([
    supabase.from('invoices').select('id,invoice_number,status,total_amount,due_date,issue_date,ai_risk_score,client_id').eq('user_id', userId),
    supabase.from('clients').select('id,name,payment_terms').eq('user_id', userId),
    supabase.from('expenses').select('id,amount,category,date').eq('user_id', userId).gte('date', day90.toISOString().split('T')[0]),
    supabase.from('time_entries').select('id,duration_seconds,hourly_rate,billable,invoice_id,client_id').eq('user_id', userId).is('invoice_id', null).eq('billable', true),
    supabase.from('bank_transactions').select('id,amount,direction,date,merchant_name,description,category').eq('user_id', userId).gte('date', day90.toISOString().split('T')[0]),
    supabase.from('connected_accounts').select('id,current_balance,available_balance').eq('user_id', userId).eq('sync_status', 'active'),
    supabase.from('payments').select('id,amount,payment_date,client_id').eq('user_id', userId).gte('payment_date', day90.toISOString().split('T')[0]),
    supabase.from('contracts').select('client_id,status').eq('user_id', userId).in('status', ['active', 'sent']),
  ])

  // ── Derived metrics ────────────────────────────────────────────────────────
  const outstanding = (invoices ?? []).filter((i: any) => i.status === 'sent')
  const paid30      = (invoices ?? []).filter((i: any) => i.status === 'paid' && new Date(i.issue_date) >= day30)

  // Revenue concentration
  const revByClient: Record<string, number> = {}
  paid30.forEach((inv: any) => { revByClient[inv.client_id] = (revByClient[inv.client_id] ?? 0) + Number(inv.total_amount) })
  const totalRev30    = Object.values(revByClient).reduce((a, b) => a + b, 0)
  const topClientRev  = Math.max(0, ...(Object.values(revByClient) as number[]))
  const topClientId   = Object.entries(revByClient).sort(([,a],[,b]) => (b as number)-(a as number))[0]?.[0]
  const topClientName = (clients ?? []).find((c: any) => c.id === topClientId)?.name ?? 'Unknown'
  const concentration = totalRev30 > 0 ? topClientRev / totalRev30 : 0

  // Unbilled work
  const unbilledHours = (timeEntries ?? []).reduce((s: any, t: any) => s + (t.duration_seconds / 3600), 0)
  const unbilledValue = (timeEntries ?? []).reduce((s: any, t: any) => s + (t.duration_seconds / 3600) * (t.hourly_rate ?? 0), 0)

  // Spending change
  const recentSpend = (expenses ?? []).filter((e: any) => new Date(e.date) >= day30).reduce((s: any, e: any) => s + Number(e.amount), 0)
  const priorSpend  = (expenses ?? []).filter((e: any) => new Date(e.date) < day30 && new Date(e.date) >= day60).reduce((s: any, e: any) => s + Number(e.amount), 0)
  const spendChange = priorSpend > 0 ? Math.round(((recentSpend - priorSpend) / priorSpend) * 100) : 0

  // Cash balance
  const cashBalance = (connectedAccounts ?? []).reduce((s: any, a: any) => s + (a.available_balance ?? a.current_balance ?? 0), 0)

  // Stagnant clients
  const activeClientIds = new Set([
    ...(paid30.map((i: any) => i.client_id)),
    ...(outstanding.map((i: any) => i.client_id)),
    ...((directPayments ?? []).map((p: any) => p.client_id)),
  ])
  const allInvoicedClientIds = new Set((invoices ?? []).map((i: any) => i.client_id))
  const stagnantClients = (clients ?? [])
    .filter((c: any) => allInvoicedClientIds.has(c.id) && !activeClientIds.has(c.id))
    .slice(0, 3)
    .map((c: any) => c.name)

  // Contract coverage gaps
  const contractedClients = new Set((contracts ?? []).map((c: any) => c.client_id))
  const uncoveredClients = Object.keys(revByClient)
    .filter(id => !contractedClients.has(id))
    .map(id => (clients ?? []).find((c: any) => c.id === id)?.name)
    .filter(Boolean)
    .slice(0, 3)

  // ── Build context for GPT ──────────────────────────────────────────────────
  const context = {
    tier,
    cash_balance:              Math.round(cashBalance),
    bank_connected:            (connectedAccounts ?? []).length > 0,
    outstanding_count:         outstanding.length,
    outstanding_value:         Math.round(outstanding.reduce((s: any, i: any) => s + Number(i.total_amount), 0)),
    overdue_count:             outstanding.filter((i: any) => new Date(i.due_date + 'T12:00:00') < now).length,
    revenue_30d:               Math.round(totalRev30),
    top_client_name:           topClientName,
    top_client_pct:            Math.round(concentration * 100),
    unbilled_hours:            Math.round(unbilledHours * 10) / 10,
    unbilled_value:            Math.round(unbilledValue),
    spend_change_pct:          spendChange,
    recent_spend_30d:          Math.round(recentSpend),
    stagnant_clients:          stagnantClients,
    uncovered_paying_clients:  uncoveredClients,
    high_risk_invoice_count:   outstanding.filter((i: any) => (i.ai_risk_score ?? 0) >= 70).length,
  }

  // ── Call GPT ───────────────────────────────────────────────────────────────
  const systemPrompt = `You are a financial intelligence engine for Invonaut, a finance OS for freelancers and small businesses.
Analyse the user's financial context and return a JSON array of insights (max 5).

Each insight MUST follow this exact schema:
{
  "type": "cash_dip" | "revenue_concentration" | "spending_spike" | "unbilled_work" | "stagnant_client" | "contract_gap" | "pipeline_risk" | "opportunity",
  "urgency": "critical" | "warning" | "info" | "opportunity",
  "title": string (max 60 chars),
  "body": string (1-2 sentences, specific numbers, direct tone — no marketing language),
  "action_label": string | null,
  "action_url": string | null,
  "confidence": number (0.0-1.0)
}

Rules:
- Only generate insights for genuinely notable conditions. Healthy states need no insight.
- cash_balance below $500 with bank connected = critical cash_dip.
- revenue concentration above 60% from one client = warning.
- unbilled_value above $500 = opportunity. Include the dollar amount.
- stagnant_clients present = info or warning (mention by name).
- spend_change_pct above 30% = spending_spike warning.
- uncovered_paying_clients = contract_gap warning.
- Prioritise by urgency. Return ONLY valid JSON array, no markdown.`

  let insights: any[] = []
  try {
    const openai = getOpenAI()
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1000,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: `Context:\n${JSON.stringify(context, null, 2)}` },
      ],
    })
    const raw   = res.choices[0]?.message?.content ?? '[]'
    const clean = raw.replace(/```json|```/g, '').trim()
    insights    = JSON.parse(clean)
  } catch (err) {
    console.error('[intelligence-cron] GPT or parse error:', err)
  }

  // ── Expire old active insights (older than 7 days) ─────────────────────────
  await supabase
    .from('financial_insights')
    .update({ status: 'expired' })
    .eq('user_id', userId)
    .eq('status', 'active')
    .lt('expires_at', now.toISOString())

  // ── Store new insights ─────────────────────────────────────────────────────
  if (insights.length > 0) {
    const rows = insights.slice(0, 5).map((ins: any) => ({
      user_id:       userId,
      type:          ins.type        ?? 'info',
      urgency:       ins.urgency     ?? 'info',
      title:         (ins.title      ?? 'Insight').slice(0, 200),
      body:          ins.body        ?? '',
      action_label:  ins.action_label ?? null,
      action_url:    ins.action_url   ?? null,
      ai_confidence: ins.confidence   ?? null,
      expires_at:    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }))
    await supabase.from('financial_insights').insert(rows)
  }

  // ── Side effects: risk profiles + subscription detection ──────────────────
  await Promise.all([
    computeClientRiskProfiles(supabase, userId, invoices ?? [], clients ?? []),
    detectSubscriptions(supabase, userId, bankTx ?? []),
  ])
}

// ── Client risk profile computation ───────────────────────────────────────────
async function computeClientRiskProfiles(supabase: any, userId: string, invoices: any[], clients: any[]) {
  const now = new Date()
  for (const client of clients) {
    const allInv    = invoices.filter((i: any) => i.client_id === client.id)
    const paidInv   = allInv.filter((i: any) => i.status === 'paid')
    if (allInv.length === 0) continue

    const totalRevenue   = paidInv.reduce((s: any, i: any) => s + Number(i.total_amount), 0)
    const largestInvoice = paidInv.length > 0 ? Math.max(...paidInv.map((i: any) => Number(i.total_amount))) : 0
    const lateCount      = paidInv.filter((i: any) => new Date(i.due_date + 'T12:00:00') < now).length
    const onTimeRate     = allInv.length > 0 ? Math.max(0, (allInv.length - lateCount)) / allInv.length : 1

    const riskLevel  = onTimeRate >= 0.85 ? 'low' : onTimeRate >= 0.60 ? 'medium' : 'high'
    const riskReason = riskLevel === 'high'   ? `Paid late on ${Math.round((1 - onTimeRate) * 100)}% of invoices`
                     : riskLevel === 'medium' ? 'Some late payment history — worth monitoring'
                     : 'Consistently pays on time'
    const termsRec   = riskLevel === 'high'   ? 'Consider requiring a 50% upfront deposit'
                     : riskLevel === 'medium' ? 'Consider switching to Net 15 terms'
                     : null

    await supabase.from('client_risk_profiles').upsert({
      user_id:           userId,
      client_id:         client.id,
      total_invoices:    allInv.length,
      paid_invoices:     paidInv.length,
      on_time_rate:      Math.round(onTimeRate * 1000) / 1000,
      late_invoices:     lateCount,
      largest_invoice:   largestInvoice,
      total_revenue:     totalRevenue,
      risk_level:        riskLevel,
      risk_reason:       riskReason,
      payment_terms_rec: termsRec,
      last_computed_at:  now.toISOString(),
    }, { onConflict: 'user_id,client_id' })

    // ── Checklist #3 fix: write invoices.ai_risk_score per invoice ───────────
    // Previously this column was read in 6 places and written in 0 — every
    // real user's invoices had ai_risk_score = null forever, silently killing
    // the sidebar high-risk badge, this cron's own high_risk_invoice_count
    // metric, and the follow-up cron's risk-based early-intervention branch.
    // Deterministic, zero-OpenAI-cost, same approach already proven out above
    // for client_risk_profiles. Score (0-100) combines:
    //   - this client's overall payment history (onTimeRate, computed above)
    //   - how many days overdue THIS invoice specifically is
    //   - how large THIS invoice is relative to this client's typical invoice
    const avgInvoiceAmount = allInv.reduce((s: any, i: any) => s + Number(i.total_amount), 0) / allInv.length

    await Promise.all(allInv.map((inv: any) => {
      const historyRisk = (1 - onTimeRate) * 50  // 0–50

      let daysOverdue = 0
      if (inv.status === 'sent') {
        const due = new Date(inv.due_date + 'T12:00:00')
        daysOverdue = Math.max(0, Math.floor((now.getTime() - due.getTime()) / 86400000))
      }
      const overdueRisk = Math.min(40, daysOverdue * 2)  // 0–40, 2pts/day, caps at 20 days late

      const sizeRatio = avgInvoiceAmount > 0 ? Number(inv.total_amount) / avgInvoiceAmount : 1
      const sizeRisk  = Math.min(10, Math.max(0, (sizeRatio - 1) * 10))  // 0–10, unusually large for this client

      const aiRiskScore = Math.round(Math.min(100, Math.max(0, historyRisk + overdueRisk + sizeRisk)))

      return supabase.from('invoices').update({ ai_risk_score: aiRiskScore }).eq('id', inv.id)
    }))
  }
}

// ── Subscription detection from bank transactions ─────────────────────────────
async function detectSubscriptions(supabase: any, userId: string, transactions: any[]) {
  const outflows = transactions.filter((tx: any) => tx.direction === 'outflow' && !tx.pending)
  const groups: Record<string, any[]> = {}

  outflows.forEach((tx: any) => {
    const merchant = (tx.merchant_name ?? tx.description ?? '').toLowerCase().trim()
    const bucket   = Math.round(Math.abs(tx.amount) * 100)  // cents to avoid float keys
    const key      = `${merchant}__${bucket}`
    if (!groups[key]) groups[key] = []
    groups[key].push(tx)
  })

  for (const [, txs] of Object.entries(groups)) {
    if (txs.length < 2) continue

    const merchant  = txs[0].merchant_name ?? txs[0].description ?? 'Unknown'
    const amount    = Math.abs(txs[0].amount)
    const dates     = txs.map((tx: any) => new Date(tx.date + 'T12:00:00').getTime()).sort((a, b) => a - b)
    const gaps      = dates.slice(1).map((d, i) => (d - dates[i]) / 86400000)
    const avgGap    = gaps.reduce((a, b) => a + b, 0) / gaps.length
    const frequency = avgGap <= 10 ? 'weekly' : avgGap <= 35 ? 'monthly' : avgGap <= 100 ? 'quarterly' : 'annual'

    await supabase.from('subscription_detections').upsert({
      user_id:          userId,
      merchant_name:    merchant,
      amount,
      frequency,
      first_seen_date:  new Date(dates[0]).toISOString().split('T')[0],
      last_seen_date:   new Date(dates[dates.length - 1]).toISOString().split('T')[0],
      occurrence_count: txs.length,
      suggested_category: txs[0].category ?? 'Software',
    }, { onConflict: 'user_id,merchant_name,amount', ignoreDuplicates: false })
  }
}
