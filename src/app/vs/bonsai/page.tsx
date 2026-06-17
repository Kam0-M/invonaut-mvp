// src/app/vs/bonsai/page.tsx
import type { Metadata } from 'next'
import ComparisonPage from '@/components/vs/comparison-page'
import type { ComparisonConfig } from '@/components/vs/comparison-page'

export const metadata: Metadata = {
  title: 'Invonaut vs Bonsai — Autonomous Finance OS vs Freelance Business Management',
  description: 'Bonsai is a project and contract management tool for freelancers. Invonaut is an autonomous finance OS. Here\'s what each does, and which fits your business.',
  openGraph: {
    title: 'Invonaut vs Bonsai',
    description: 'Autonomous Finance OS vs Freelance Business Management — an honest comparison.',
    url: 'https://invonaut-mvp.vercel.app/vs/bonsai',
  },
}

const config: ComparisonConfig = {
  competitor:     'Bonsai',
  competitorSlug: 'bonsai',

  whatTheyAre: 'An all-in-one platform for freelancers — proposals, project management, contracts, invoicing, and basic CRM. Designed to manage the full client engagement from pitch to delivery.',
  whatWeAre:   'An autonomous finance operating system focused on the financial layer: getting paid faster, forecasting cash, protecting agreements, and eliminating administrative overhead — automatically.',

  intro: `Bonsai and Invonaut share common ground in contracts, invoicing, and time tracking. Where they diverge is in purpose and depth.

Bonsai is built around managing client projects — proposals, scopes, deliverables. Invonaut is built around the financial operations of a business — AI payment risk, cash forecasting, autonomous follow-up, and business health intelligence. If project delivery is your primary challenge, Bonsai fits that. If getting paid efficiently and maintaining financial visibility is your primary challenge, that's Invonaut's focus.`,

  features: [
    // Invoicing
    { category: 'Invoicing & payments',  name: 'Branded professional invoices',          inv: true,  comp: true  },
    { category: 'Invoicing & payments',  name: 'AI payment risk scoring',                inv: true,  comp: false, invNote: 'Per invoice, updated daily' },
    { category: 'Invoicing & payments',  name: 'Automated invoice follow-up',            inv: true,  comp: 'partial', invNote: 'Daily, AI-triggered', compNote: 'Basic reminders' },
    { category: 'Invoicing & payments',  name: 'Log direct payments (cash, POS, mobile)',inv: true,  comp: false },
    { category: 'Invoicing & payments',  name: 'Client portal with magic link',          inv: true,  comp: true,  compNote: 'Requires client account' },
    { category: 'Invoicing & payments',  name: 'Recurring invoice automation',           inv: 'partial', comp: true },

    // Cash & intelligence
    { category: 'Cash & intelligence',   name: '90-day cash flow forecast',              inv: true,  comp: false },
    { category: 'Cash & intelligence',   name: 'Runway calculator',                      inv: true,  comp: false },
    { category: 'Cash & intelligence',   name: 'Business Health Score',                  inv: true,  comp: false },
    { category: 'Cash & intelligence',   name: 'AI financial intelligence feed',         inv: true,  comp: false },
    { category: 'Cash & intelligence',   name: 'Bank connection / transaction sync',     inv: true,  comp: false },

    // Contracts
    { category: 'Contracts',             name: 'Contract templates + e-signatures',      inv: true,  comp: true  },
    { category: 'Contracts',             name: 'Contract auto-expiry reminders',         inv: true,  comp: false, invNote: 'At 30/15/7/1 days' },
    { category: 'Contracts',             name: 'AI contract review',                     inv: true,  comp: false },
    { category: 'Contracts',             name: 'Proposals / quotes',                     inv: false, comp: true,  compNote: 'Core feature' },

    // Operations
    { category: 'Operations',            name: 'Time tracking → invoice from hours',     inv: true,  comp: true  },
    { category: 'Operations',            name: 'Expense tracking',                       inv: true,  comp: true  },
    { category: 'Operations',            name: 'Revenue categories',                     inv: true,  comp: false },
    { category: 'Operations',            name: 'White-label branding',                   inv: true,  comp: 'partial', compNote: 'Limited customisation' },
    { category: 'Operations',            name: 'AI expense categorisation',              inv: true,  comp: false },

    // Project management
    { category: 'Project management',    name: 'Project tracking and milestones',        inv: false, comp: true,  compNote: 'Core feature' },
    { category: 'Project management',    name: 'CRM and client relationship tracking',   inv: false, comp: true  },
    { category: 'Project management',    name: 'Task management',                        inv: false, comp: true  },
    { category: 'Project management',    name: 'Scheduler / booking',                   inv: false, comp: true  },
  ],

  theyWinAt: [
    {
      label: 'Project delivery management',
      detail: 'Bonsai is built around the full project lifecycle — proposals, scopes, milestones, deliverable tracking. If the complexity in your business is managing what you deliver, not just getting paid for it, Bonsai addresses that directly. Invonaut has no project management features.',
    },
    {
      label: 'Proposals and quotes',
      detail: 'Bonsai has polished proposal templates that connect to contracts and invoices. If winning new clients with professional proposals is a frequent workflow, that\'s a Bonsai strength. Invonaut doesn\'t have a proposals feature.',
    },
    {
      label: 'CRM for freelancers',
      detail: 'Bonsai tracks leads and client relationships. For freelancers who are actively pitching and building a pipeline, that CRM layer is useful. Invonaut is finance-focused and doesn\'t manage the pre-engagement stage.',
    },
  ],

  weWinAt: [
    {
      label: 'Autonomous financial operations',
      detail: 'Bonsai sends basic invoice reminders. Invonaut scores every invoice for payment risk with AI, sends follow-ups automatically based on risk level, watches every contract for expiry, and recalculates your 90-day cash position daily — without you logging in. Bonsai requires active use. Invonaut works in the background.',
    },
    {
      label: 'Cash forecasting and runway visibility',
      detail: 'Bonsai has no cash flow forecasting. Invonaut projects 90 days forward — combining outstanding invoices, AI-estimated payment probability, and tracked expenses to show your cash position before it becomes a problem.',
    },
    {
      label: 'Business Health Score',
      detail: 'Invonaut computes a composite health score across collection rate, profit margin, overdue risk, and revenue growth — giving you a single number that represents how the business is actually performing. Bonsai has no equivalent.',
    },
    {
      label: 'Complete income visibility',
      detail: 'Bonsai is invoice-driven. If a client pays by bank transfer, cash, or POS, it doesn\'t show up unless reconciled manually. Invonaut captures all income types natively — direct payments, cash, bank, mobile — so your actual revenue is always visible.',
    },
    {
      label: 'Contract auto-expiry protection',
      detail: 'Bonsai has contracts but doesn\'t watch them automatically. Invonaut sends reminders at 30, 15, 7, and 1 day before any contract expires. You\'re never left unprotected because an agreement quietly lapsed.',
    },
  ],

  pricing: {
    compLabel: 'Bonsai starts at ~$25/mo (Starter). Professional ~$39/mo. Business ~$79/mo. Annual billing applies.',
    invLabel:  'Invonaut Starter $29/mo · Professional $59/mo · Business $109/mo. 14-day free trial, no card required.',
    pricingNote: 'Bonsai\'s Starter plan is comparable in price to Invonaut\'s Starter, but the feature overlap is modest — Bonsai leans toward project management, Invonaut leans toward financial operations. At the Professional level, Bonsai is cheaper but Invonaut includes cash forecasting, AI risk scoring, and financial intelligence that Bonsai doesn\'t offer at any tier.',
  },

  verdict: `Bonsai and Invonaut are solving adjacent but different problems. Bonsai is built for freelancers who need to manage client projects — from proposal to delivery. That's a real and valuable product.

Invonaut is built for businesses that need their financial operations to run without constant attention. If you find yourself manually chasing payments, wondering about your cash position, or only realising a contract lapsed after the fact — that's the gap Invonaut is designed to close. The two tools can complement each other, but they're not direct replacements.`,
}

export default function Page() {
  return <ComparisonPage config={config} />
}
