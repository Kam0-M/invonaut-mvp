// src/app/vs/wave/page.tsx
import type { Metadata } from 'next'
import ComparisonPage from '@/components/vs/comparison-page'
import type { ComparisonConfig } from '@/components/vs/comparison-page'

export const metadata: Metadata = {
  title: 'Invonaut vs Wave — Autonomous Finance OS vs Free Accounting Software',
  description: 'Wave is free accounting and invoicing software. Invonaut is an autonomous finance OS. Here\'s what each tool actually does, and when each one makes more sense.',
  openGraph: {
    title: 'Invonaut vs Wave',
    description: 'Autonomous Finance OS vs Free Accounting Software — an honest comparison.',
    url: 'https://invonaut-mvp.vercel.app/vs/wave',
  },
}

const config: ComparisonConfig = {
  competitor:     'Wave',
  competitorSlug: 'wave',

  whatTheyAre: 'Free accounting software with invoicing, receipt scanning, and bookkeeping. Built for small businesses who need basic financial records at no cost.',
  whatWeAre:   'An autonomous finance operating system. Handles the financial operations of your business — contracts, invoicing, follow-ups, cash forecasting — automatically, every day.',

  intro: `Wave is accounting software. Invonaut is not accounting software — it doesn't replace your accountant or produce tax returns. Wave does that, and does it well, for free.
  
Where they part ways: Wave requires you to do things. Invonaut does things for you. Invoice follow-ups, contract reminders, cash flow forecasting, AI payment risk scoring — Wave has none of these. Invonaut runs all of them automatically, every day, without you logging in.`,

  features: [
    // Invoicing
    { category: 'Invoicing & payments',  name: 'Send invoices with your branding',        inv: true,  comp: true  },
    { category: 'Invoicing & payments',  name: 'AI payment risk scoring',                 inv: true,  comp: false,  invNote: 'Per invoice, updated daily', compNote: '—' },
    { category: 'Invoicing & payments',  name: 'Automated invoice follow-up emails',      inv: true,  comp: false,  invNote: 'Runs daily at 9am',          compNote: '—' },
    { category: 'Invoicing & payments',  name: 'Log direct payments (cash, POS, mobile)', inv: true,  comp: 'partial', compNote: 'Manual entry only' },
    { category: 'Invoicing & payments',  name: 'Client portal with magic link',           inv: true,  comp: false },

    // Cash & forecasting
    { category: 'Cash & forecasting',    name: '90-day cash flow forecast',               inv: true,  comp: false },
    { category: 'Cash & forecasting',    name: 'Runway calculator',                       inv: true,  comp: false },
    { category: 'Cash & forecasting',    name: 'Bank connection / transaction sync',      inv: true,  comp: true,  compNote: 'Free via Wave Connect' },
    { category: 'Cash & forecasting',    name: 'Business Health Score',                   inv: true,  comp: false },

    // Contracts
    { category: 'Contracts',             name: 'Contract templates + e-signatures',       inv: true,  comp: false },
    { category: 'Contracts',             name: 'Contract auto-expiry reminders',          inv: true,  comp: false },
    { category: 'Contracts',             name: 'Digital signature workflow',              inv: true,  comp: false },

    // Operations
    { category: 'Operations',            name: 'Time tracking → invoice',                 inv: true,  comp: false },
    { category: 'Operations',            name: 'Expense tracking with categories',        inv: true,  comp: true  },
    { category: 'Operations',            name: 'White-label branding for clients',        inv: true,  comp: 'partial', compNote: 'Limited customisation' },
    { category: 'Operations',            name: 'Revenue categories & reporting',          inv: true,  comp: 'partial' },

    // Accounting
    { category: 'Accounting',            name: 'Double-entry bookkeeping',                inv: false, comp: true,  compNote: 'Core feature' },
    { category: 'Accounting',            name: 'Tax-ready financial statements',          inv: false, comp: true,  compNote: 'P&L, balance sheet' },
    { category: 'Accounting',            name: 'Payroll processing',                      inv: false, comp: true,  compNote: 'Paid add-on' },
  ],

  theyWinAt: [
    {
      label: 'It\'s free',
      detail: 'Wave\'s core product costs nothing. For a business that needs basic invoicing and accounting records without budget for software, that\'s a real advantage.',
    },
    {
      label: 'Accounting and bookkeeping',
      detail: 'Wave has proper double-entry accounting, tax-ready statements, and bookkeeping tools. Invonaut is not an accounting product — if your primary need is accurate financial records for tax purposes, Wave does that.',
    },
    {
      label: 'Payroll',
      detail: 'Wave offers a payroll add-on for US and Canadian businesses. Invonaut has no payroll feature.',
    },
  ],

  weWinAt: [
    {
      label: 'Autonomy — your back office runs itself',
      detail: 'Wave doesn\'t follow up late invoices. Invonaut does, automatically, every day. Wave doesn\'t remind you when a contract expires. Invonaut sends four reminders. Wave doesn\'t recalculate your 90-day cash position each morning. Invonaut does. The difference is whether the software requires you or works without you.',
    },
    {
      label: 'Contract management and protection',
      detail: 'Wave has no contract features. Invonaut includes templates, digital signatures, and automatic expiry reminders at 30, 15, 7, and 1 day before expiry — so you\'re never caught off-guard by a lapsed agreement.',
    },
    {
      label: 'Cash forecasting and financial intelligence',
      detail: 'Wave\'s reports show what has happened. Invonaut\'s 90-day forecast shows what is about to happen — projected income based on outstanding invoices, current expenses, and AI-calculated payment probabilities.',
    },
    {
      label: 'Complete income visibility',
      detail: 'Wave is invoice-centric. If a client pays cash, by bank transfer, or via POS, Wave misses it unless you manually record it as a transaction. Invonaut captures all income types natively — so your real revenue shows up, not just your invoiced revenue.',
    },
  ],

  pricing: {
    compLabel: 'Free for core features. Payments processing at 2.9% + 30¢. Wave Payroll from $20/mo.',
    invLabel:  'Starter $29/mo · Professional $59/mo · Business $109/mo. Annual billing saves up to 17%. 14-day free trial.',
    pricingNote: 'Wave is free for accounting and invoicing. Invonaut starts at $29/mo. The right question is whether the time Wave costs you — manually chasing invoices, manually logging cash payments, manually tracking contract dates — is worth more than $29.',
  },

  verdict: `If you need free accounting software with basic invoicing, Wave is genuinely good at that. Use it alongside a spreadsheet and a reminder app and you\'ll manage.

If you want the financial operations of your business to run without constant attention — invoices followed up, contracts tracked, cash forecasted, payments logged — that\'s what Invonaut is built for. The tools are solving different problems. Invonaut doesn\'t replace Wave\'s accounting. It replaces the administrative hours you spend doing what Wave doesn\'t automate.`,
}

export default function Page() {
  return <ComparisonPage config={config} />
}
