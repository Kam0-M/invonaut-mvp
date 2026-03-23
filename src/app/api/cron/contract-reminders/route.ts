import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import {
  generateContractReminderEmailHTML,
  generateContractReminderEmailText,
} from '@/lib/email/contract-reminder-email-template'

const resend = new Resend(process.env.RESEND_API_KEY)
const OWNER_EMAIL = 'kamohelo.thakhisi@gmail.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://invonaut-mvp.vercel.app'

// Reminder stages: how many days before expiry each fires
const REMINDER_STAGES = [
  { key: '30_day', days: 30 },
  { key: '15_day', days: 15 },
  { key:  '7_day', days: 7  },
  { key:  '1_day', days: 1  },
] as const

type ReminderStageKey = typeof REMINDER_STAGES[number]['key']

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: NextRequest) {
  // Protect the route — Vercel passes the CRON_SECRET automatically in production,
  // but we also accept a manual Authorization header for local testing.
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()

  let expiredCount = 0
  let emailsSent = 0
  const errors: string[] = []

  try {
    // ─── Step 1: Auto-expire contracts whose expiry_date has passed ───────────
    const { data: expiredContracts, error: expiredError } = await supabase
      .from('contracts')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('expiry_date', now.toISOString())
      .select('id, title')

    if (expiredError) {
      errors.push(`Auto-expire error: ${expiredError.message}`)
    } else {
      expiredCount = expiredContracts?.length ?? 0
    }

    // ─── Step 2: Fetch active contracts with upcoming expiry dates ────────────
    // Only contracts that:
    //   - are active
    //   - have an expiry_date set
    //   - have not been dismissed by the owner
    //   - expire within the next 30 days (widest reminder window)
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const { data: upcomingContracts, error: fetchError } = await supabase
      .from('contracts')
      .select(`
        id,
        title,
        expiry_date,
        reminder_stages_sent,
        reminders_dismissed,
        user_id,
        clients(name),
        user_profiles!contracts_user_id_fkey(full_name, email)
      `)
      .eq('status', 'active')
      .eq('reminders_dismissed', false)
      .not('expiry_date', 'is', null)
      .gte('expiry_date', now.toISOString())       // not already expired
      .lte('expiry_date', in30Days.toISOString())  // within 30 days

    if (fetchError) {
      errors.push(`Fetch error: ${fetchError.message}`)
    }

    // ─── Step 3: For each contract, fire any unsent reminder stages ──────────
    for (const contract of upcomingContracts ?? []) {
      const expiryDate = new Date(contract.expiry_date)
      const msUntilExpiry = expiryDate.getTime() - now.getTime()
      const daysUntilExpiry = Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24))

      const stagesSent: ReminderStageKey[] = contract.reminder_stages_sent ?? []

      // Normalize joined data (Supabase can return arrays from FK joins)
      const clientData = Array.isArray(contract.clients)
        ? contract.clients[0]
        : contract.clients
      const profileData = Array.isArray(contract.user_profiles)
        ? contract.user_profiles[0]
        : contract.user_profiles

      const ownerEmail = profileData?.email ?? OWNER_EMAIL
      const ownerName  = profileData?.full_name ?? 'there'
      const clientName = clientData?.name ?? 'your client'

      // Resend free tier restriction — only send to verified owner email
      if (ownerEmail !== OWNER_EMAIL) continue

      const newStagesSent: ReminderStageKey[] = [...stagesSent]

      for (const stage of REMINDER_STAGES) {
        // Fire this stage if:
        //   - days until expiry is AT or BELOW this stage's threshold
        //   - AND this stage hasn't been sent yet
        if (daysUntilExpiry <= stage.days && !stagesSent.includes(stage.key)) {
          try {
            await resend.emails.send({
              from:    'Invonaut <onboarding@resend.dev>',
              to:      ownerEmail,
              subject: `⏰ Contract expiring in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}: ${contract.title}`,
              html: generateContractReminderEmailHTML({
                ownerName,
                contractTitle: contract.title,
                clientName,
                expiryDate: contract.expiry_date,
                daysUntilExpiry,
                contractUrl: `${APP_URL}/dashboard/contracts/${contract.id}`,
              }),
              text: generateContractReminderEmailText({
                ownerName,
                contractTitle: contract.title,
                clientName,
                expiryDate: contract.expiry_date,
                daysUntilExpiry,
                contractUrl: `${APP_URL}/dashboard/contracts/${contract.id}`,
              }),
            })

            newStagesSent.push(stage.key)
            emailsSent++
          } catch (emailErr) {
            errors.push(`Email error for contract ${contract.id} stage ${stage.key}: ${emailErr}`)
          }
        }
      }

      // Update reminder_stages_sent if any new stages were fired
      if (newStagesSent.length > stagesSent.length) {
        const { error: updateError } = await supabase
          .from('contracts')
          .update({ reminder_stages_sent: newStagesSent })
          .eq('id', contract.id)

        if (updateError) {
          errors.push(`Update stages error for contract ${contract.id}: ${updateError.message}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      expiredCount,
      emailsSent,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error('Contract reminders cron error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}