// src/app/vs/freshbooks/page.tsx
import type { Metadata } from 'next'
import ComparisonPage from '@/components/vs/comparison-page'
import type { ComparisonConfig } from '@/components/vs/comparison-page'

export const metadata: Metadata = {
  title: 'Invonaut vs FreshBooks — Autonomous Finance OS vs Cloud Accounting Software',
  description: 'FreshBooks is established cloud accounting software. Invonaut is an autonomous finance OS. See exactly what each tool does, and which one fits your business.',
  openGraph: {
    title: 'Invonaut vs FreshBooks',
    description: 'Autonomous Finance OS vs Cloud Accounting Software — an honest comparison.',
    url: 'https://invonaut-mvp.vercel.app/vs/freshbooks',
  },
}

const config: ComparisonConfig = {
  competitor:     'FreshBooks',
  competitorSlug: 'freshbooks',

  whatTheyAre: 'Cloud accounting software with invoicing, time tracking, expense management, and payroll. Built primarily for service-based small businesses who want accounting and invoicing in one place.',
  whatWeAre:   'An autonomous finance operating system. Handles the financial operations layer — contracts, invoicing, automated follow-up, cash forecasting, client portal — without daily manual input.',

  intro: `FreshBooks and Invonaut overlap in invoicing, time tracking, and expense management. Where they diverge is in what the software does on its own.

FreshBooks gives you good tools and expects you to use them. Invonaut acts on your behalf — follow-ups go out automatically, contracts are watched, cash position is recalculated daily, and payment risk is scored per invoice. FreshBooks is also a more complete accounting tool; Invonaut is not tax software and doesn't replace a bookkeeper.`,

  features: [
    // Invoicing
    { category: 'Invoicing & payments',  name: 'Professional branded invoicing',          inv: true,      comp: true  },
    { category: 'Invoicing & payments',  name: 'AI payment risk scoring',                 inv: true,      comp: false, invNote: 'Per invoice, updated daily' },
    { category: 'Invoicing & payments',  name: 'Automated invoice follow-up',             inv: true,      comp: 'partial', invNote: 'Daily, AI-triggered', compNote: 'Manual reminders only' },
    { category: 'Invoicing & payments',  name: 'Client portal with magic link access',    inv: true,      comp: 'partial', compNote: 'Requires client login' },
    { category: 'Invoicing & payments',  name: 'Direct payment logging (cash, POS, etc.)',inv: true,      comp: false },
    { category: 'Invoicing & payments',  name: 'Invoice file attachments',                inv: true,      comp: true  },

    // Cash & forecasting
    { category: 'Cash & forecasting',    name: '90-day cash flow forecast',               inv: true,      comp: false },
    { category: 'Cash & forecasting',    name: 'Runway calculator',                       inv: true,      comp: false },
    { category: 'Cash & forecasting',    name: 'Business Health Score',                   inv: true,      comp: false },
    { category: 'Cash & forecasting',    name: 'Bank connection / reconciliation',        inv: true,      comp: true  },

    // Contracts
    { category: 'Contracts',             name: 'Contract templates + e-signatures',       inv: true,      comp: 'partial', compNote: 'Add-on via integration' },
    { category: 'Contracts',             name: 'Contract auto-expiry reminders',          inv: true,      comp: false },
    { category: 'Contracts',             name: 'Contract library and management',         inv: true,      comp: false },

    // Operations
    { category: 'Operations',            name: 'Time tracking → invoice',                 inv: true,      comp: true  },
    { category: 'Operations',            name: 'Expense tracking with categories',        inv: true,      comp: true  },
    { category: 'Operations',            name: 'White-label branding',                    inv: true,      comp: 'partial', compNote: 'Limited on lower plans' },
    { category: 'Operations',            name: 'AI expense categorisation',               inv: true,      comp: false },
    { category: 'Operations',            name: 'Mileage tracking',                        inv: false,     comp: true  },

    // Accounting
    { category: 'Accounting',            name: 'Double-entry accounting',                 inv: false,     comp: true  },
    { category: 'Accounting',            name: 'Tax-ready financial statements',          inv: false,     comp: true  },
    { category: 'Accounting',            name: 'Payroll (US)',                            inv: false,     comp: true, compNote: 'Add-on via Gusto' },
    { category: 'Accounting',            name: 'Accountant collaboration tools',          inv: false,     comp: true  },
  ],

  theyWinAt: [
    {
      label: 'Full accounting suite',
      detail: 'FreshBooks is proper accounting software with double-entry bookkeeping, tax preparation support, accountant collaboration, and payroll. If you need a complete financial record-keeping system, FreshBooks goes significantly deeper than Invonaut.',
    },
    {
      label: 'Mileage and project tracking',
      detail: 'FreshBooks tracks mileage for expense reimbursement and has project management features that connect to billing. Invonaut has no mileage tracking.',
    },
    {
      label: 'Established ecosystem',
      detail: 'FreshBooks has been around since 2003, has deep integrations with accounting tools, and a large user community with well-documented workflows.',
    },
  ],

  weWinAt: [
    {
      label: 'Autonomous follow-up — zero manual work',
      detail: 'FreshBooks lets you send manual reminders. Invonaut\'s AI scores every invoice for payment risk and sends follow-ups automatically, daily, prioritised by urgency. The difference is whether you remember to do it or the system does it without you.',
    },
    {
      label: 'Cash forecasting built in',
      detail: 'FreshBooks shows you historical cash flow. Invonaut projects forward 90 days — combining outstanding invoice amounts, AI payment probability, and tracked expenses to show what your cash position will look like, before it happens.',
    },
    {
      label: 'Contract management with automatic protection',
      detail: 'FreshBooks has no contract management. Invonaut includes templates, e-signatures, and sends four automatic reminders before any contract expires — so you\'re never caught unprotected because an agreement quietly lapsed.',
    },
    {
      label: 'Complete income picture',
      detail: 'FreshBooks is invoice-driven. Cash payments, bank transfers, and POS payments don\'t surface unless you manually reconcile them. Invonaut captures all income types natively — so your revenue figures reflect what\'s actually coming in.',
    },
    {
      label: 'Pricing at this feature level',
      detail: 'FreshBooks starts at around $19/mo but meaningful features — time tracking, client history, lower invoice limits — require higher tiers ($55/mo). Invonaut\'s Professional plan at $59/mo includes everything: AI, contracts, cash forecasting, and unlimited invoices.',
    },
  ],

  pricing: {
    compLabel: 'Lite from ~$19/mo (5 clients, limited invoices). Plus ~$33/mo. Premium ~$55/mo. Advanced from ~$150/mo.',
    invLabel:  'Starter $29/mo · Professional $59/mo · Business $109/mo. Annual billing saves up to 17%. 14-day free trial on every plan.',
    pricingNote: 'FreshBooks\' Lite plan is cheap but restrictive — 5 clients, limited invoices. Meaningful usage starts at $33–55/mo. Invonaut Professional at $59/mo includes unlimited invoices, AI features, contracts, cash forecasting, and everything else. Annual billing brings it to $49/mo.',
  },

  verdict: `If you need accounting software — proper bookkeeping, tax preparation, an accountant portal — FreshBooks is the stronger tool. It's been built for that purpose for over two decades.

If you need your financial operations to run without daily input — invoices followed up, contracts watched, cash forecasted, all income logged — that's where Invonaut is different. The two products are complementary, not interchangeable. Invonaut handles the operational layer; it doesn't replace an accountant or a bookkeeper.`,
}

export default function Page() {
  return <ComparisonPage config={config} />
}
