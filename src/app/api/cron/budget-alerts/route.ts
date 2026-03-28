import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import {
  generateBudgetAlertEmailHTML,
  generateBudgetAlertEmailText,
} from '@/lib/email/budget-alert-email-template'
import { getCategoryLabel } from '@/lib/ai/expense-categorization'

const resend = new Resend(process.env.RESEND_API_KEY)
const OWNER_EMAIL = 'kamohelo.thakhisi@gmail.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://invonaut-mvp-git-main-kam0-ms-projects.vercel.app'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()

  // Current month as 'YYYY-MM' — used for deduplication
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Start and end of current month for expense query
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const monthEnd = nextMonth.toISOString().split('T')[0]

  let emailsSent = 0
  const errors: string[] = []

  try {
    // Fetch all expense_budgets for Business tier users only
    const { data: budgets, error: budgetError } = await supabase
      .from('expense_budgets')
      .select(`
        id,
        user_id,
        category,
        monthly_limit,
        alert_80_sent_month,
        alert_100_sent_month,
        user_profiles!expense_budgets_user_id_fkey(full_name, email, subscription_tier)
      `)

    if (budgetError) {
      return NextResponse.json({ success: false, error: budgetError.message }, { status: 500 })
    }

    for (const budget of budgets ?? []) {
      const profileData = Array.isArray(budget.user_profiles)
        ? budget.user_profiles[0]
        : budget.user_profiles

      // Business tier only
      if (profileData?.subscription_tier !== 'business') continue

      const ownerEmail = profileData?.email ?? OWNER_EMAIL
      const ownerName  = profileData?.full_name ?? 'there'

      // Resend free tier — only verified owner email for now
      if (ownerEmail !== OWNER_EMAIL) continue

      // Sum this category's expenses for the current month
      const { data: expenseRows } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', budget.user_id)
        .eq('category', budget.category)
        .gte('date', monthStart)
        .lt('date', monthEnd)

      const amountSpent = (expenseRows ?? []).reduce(
        (sum, e: any) => sum + Number(e.amount || 0), 0
      )

      const limit = Number(budget.monthly_limit)
      const percentUsed = limit > 0 ? Math.round((amountSpent / limit) * 100) : 0

      const categoryLabel = getCategoryLabel(budget.category)
      const expensesUrl = `${APP_URL}/dashboard/expenses?category=${budget.category}`

      const emailBase = {
        ownerName,
        category: budget.category,
        categoryLabel,
        monthlyLimit: limit,
        amountSpent,
        percentUsed,
        expensesUrl,
      }

      // ── 100% threshold ────────────────────────────────────────────────────
      if (percentUsed >= 100 && budget.alert_100_sent_month !== currentMonth) {
        try {
          await resend.emails.send({
            from:    'Invonaut <onboarding@resend.dev>',
            to:      ownerEmail,
            subject: `🚨 Budget exceeded: ${categoryLabel} (${percentUsed}% used)`,
            html: generateBudgetAlertEmailHTML({ ...emailBase, threshold: 100 }),
            text: generateBudgetAlertEmailText({ ...emailBase, threshold: 100 }),
          })

          await supabase
            .from('expense_budgets')
            .update({ alert_100_sent_month: currentMonth })
            .eq('id', budget.id)

          emailsSent++
        } catch (err) {
          errors.push(`100% alert error for budget ${budget.id}: ${err}`)
        }
      }

      // ── 80% threshold (only if 100% hasn't fired yet this month) ─────────
      else if (
        percentUsed >= 80 &&
        percentUsed < 100 &&
        budget.alert_80_sent_month !== currentMonth
      ) {
        try {
          await resend.emails.send({
            from:    'Invonaut <onboarding@resend.dev>',
            to:      ownerEmail,
            subject: `⚠️ Budget alert: ${categoryLabel} is at ${percentUsed}%`,
            html: generateBudgetAlertEmailHTML({ ...emailBase, threshold: 80 }),
            text: generateBudgetAlertEmailText({ ...emailBase, threshold: 80 }),
          })

          await supabase
            .from('expense_budgets')
            .update({ alert_80_sent_month: currentMonth })
            .eq('id', budget.id)

          emailsSent++
        } catch (err) {
          errors.push(`80% alert error for budget ${budget.id}: ${err}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      month: currentMonth,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error('Budget alerts cron error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}