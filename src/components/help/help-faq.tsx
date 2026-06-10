'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type FAQItem = { q: string; a: string }

const FAQS: FAQItem[] = [
  {
    q: 'How accurate are the AI payment predictions?',
    a: 'The AI analyses client payment history, invoice terms, and behavioural patterns to predict payment probability. Predictions sharpen over time as your data grows. You need OpenAI credits added to your account to activate this — go to platform.openai.com/billing. No code changes needed.',
  },
  {
    q: 'Can clients pay invoices online?',
    a: 'Yes. Every invoice sent through the client portal includes a Pay Now button powered by Stripe. Clients pay by card in seconds and the invoice is automatically marked paid. No Stripe account is needed on the client side — just a card.',
  },
  {
    q: 'What financial reports does Invonaut generate?',
    a: 'The Financial Reports Hub includes a full P&L with EBITDA waterfall, Balance Sheet, Asset Register with depreciation tracking, Period Breakdown, and Period Comparison. Everything is generated automatically from the data you\'re already recording — no manual compilation.',
  },
  {
    q: 'Can I connect my bank account?',
    a: 'Yes — Business and Professional plan users can connect their bank account via Plaid. Transactions sync automatically and you can reconcile them against your invoices. Your actual bank balance feeds the 90-day cash forecast.',
  },
  {
    q: 'Can I white-label my invoices with my own branding?',
    a: 'Yes. Professional and Business plan users can upload a custom logo and set brand colours in Settings → Branding. Your identity appears on every invoice, email, client portal, and PDF. No Invonaut branding.',
  },
  {
    q: 'How do automated follow-ups work?',
    a: 'When an invoice goes overdue, the system flags it and queues a professional reminder email on your behalf. Follow-ups are rate-limited to once every 48 hours per invoice to protect client relationships. You can also trigger them manually at any time.',
  },
  {
    q: 'What is the Client Portal?',
    a: 'Each of your clients gets a secure, branded portal where they can view all their invoices, download PDFs, sign contracts, and pay online with a card. Access is via a magic link — no account required. You send the link; they click; done.',
  },
  {
    q: "Can I track income that doesn't come from an invoice?",
    a: 'Yes — the Direct Payments module lets you log cash, POS, bank transfers, and mobile money payments alongside invoice income. Everything appears unified in your analytics, cash flow forecast, and P&L.',
  },
  {
    q: 'How does the 90-day cash forecast work?',
    a: 'The forecast combines your current balance (from manual entry or bank sync), outstanding invoice due dates, AI-predicted payment dates, and average weekly expenses. It projects your balance week by week so you can see cash gaps before they arrive.',
  },
  {
    q: 'Can I edit or delete an invoice after sending?',
    a: 'Draft invoices can be fully edited. Once sent, invoices become read-only to preserve a clean audit trail — but you can mark them paid, trigger reminders, or cancel them. Expenses and direct payments can always be edited or deleted.',
  },
  {
    q: 'How do I change or cancel my plan?',
    a: 'Go to Billing in the sidebar. Upgrades are prorated immediately. Downgrades take effect at the end of the billing period. Cancellations leave your data intact — you can reactivate at any time.',
  },
  {
    q: 'Is my financial data secure?',
    a: 'All data is encrypted in transit (TLS) and at rest (AES-256). Supabase Row Level Security fully isolates your data — no other user can access it. Your data is never sold or shared with any third party.',
  },
]

export default function HelpFaq() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {FAQS.map((item, i) => (
        <div
          key={i}
          className="rounded-2xl border transition-all duration-200 overflow-hidden"
          style={{
            borderColor: open === i ? 'rgba(0,85,255,0.2)' : '#F1F5F9',
            background:  open === i ? 'rgba(0,85,255,0.03)' : '#fff',
          }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span
              className="text-sm font-bold transition-colors"
              style={{color: open === i ? '#0055FF' : '#0A0A0A'}}
            >
              {item.q}
            </span>
            <ChevronDown
              className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
              style={{
                transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)',
                color: open === i ? '#0055FF' : '#94A3B8',
              }}
            />
          </button>
          <div
            className="overflow-hidden transition-all duration-200"
            style={{maxHeight: open === i ? '200px' : '0px'}}
          >
            <p
              className="px-5 pb-4 text-sm leading-relaxed"
              style={{
                color:'#64748B',
                borderTop:'1px solid rgba(0,85,255,0.08)',
                paddingTop:12,
              }}
            >
              {item.a}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
