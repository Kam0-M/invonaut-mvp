'use client'
// Animated accordion FAQ — one item open at a time

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type FAQItem = { q: string; a: string }

const FAQS: FAQItem[] = [
  {
    q: 'How accurate are the AI payment predictions?',
    a: 'The AI analyzes client payment history, invoice terms, and behavioral patterns to predict payment probability. Predictions improve over time as your data grows. Add OpenAI credits in your account to activate this feature instantly — no code changes needed.',
  },
  {
    q: 'Can I white-label my invoices with my own branding?',
    a: 'Yes — Professional and Business plan users can upload a custom logo and set brand colors in Settings → Branding. Clients will see your identity on every invoice, email, and portal page. No Invonaut branding.',
  },
  {
    q: 'How do automated follow-ups work?',
    a: "When an invoice goes overdue, Invonaut's AI flags it and prepares a professional follow-up email. You can trigger it manually or let the cron job run it automatically for high-risk invoices. Follow-ups are rate-limited to once every 48 hours per invoice to protect client relationships.",
  },
  {
    q: 'What is the Client Portal?',
    a: "The Client Portal is a branded link you send to each client. They can view their invoices, download PDFs, and sign contracts — no account required. Access is via a secure magic link that expires after 7 days.",
  },
  {
    q: "Can I track income that doesn't have an invoice?",
    a: 'Yes — the Direct Payments module lets you log cash, POS, bank transfers, mobile money, and prepayments. These appear alongside invoice income in your analytics and cash flow forecast, giving you a complete picture.',
  },
  {
    q: 'How does the 90-day cash forecast work?',
    a: 'The forecast combines your current bank balance (which you enter), your outstanding invoice due dates, AI-predicted payment dates, and your average weekly expenses. It projects your balance week by week so you can see cash dips before they happen.',
  },
  {
    q: 'Can I edit or delete invoices after sending?',
    a: 'Draft invoices can be fully edited. Once sent, invoices become read-only to maintain a clean audit trail — but you can mark them paid, send reminders, or cancel them. Direct payments and expenses can always be edited or deleted.',
  },
  {
    q: 'How do I cancel or change my plan?',
    a: 'Go to Billing in the sidebar. You can upgrade (prorated), downgrade (takes effect at period end), or cancel (your data stays safe and you can reactivate anytime). No penalties.',
  },
  {
    q: 'Is my financial data secure?',
    a: 'All data is encrypted in transit (TLS) and at rest (AES-256). Supabase Row Level Security ensures your data is completely isolated — no other user can access it. We never sell or share your data with third parties.',
  },
  {
    q: 'What happens after my free trial ends?',
    a: "If you don't add a payment method before the trial ends, your account moves to view-only mode — you can still see all your data but can't create new records. Subscribe anytime to restore full access.",
  },
]

export default function HelpFaq() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {FAQS.map((item, i) => (
        <div
          key={i}
          className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
            open === i
              ? 'border-blue-200 bg-blue-50/40'
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span className={`text-sm font-bold transition-colors ${open === i ? 'text-blue-700' : 'text-gray-900'}`}>
              {item.q}
            </span>
            <ChevronDown
              className={`w-4 h-4 flex-shrink-0 transition-all duration-200 ${
                open === i ? 'rotate-180 text-blue-600' : 'text-gray-400'
              }`}
            />
          </button>
          <div className={`overflow-hidden transition-all duration-200 ${open === i ? 'max-h-48' : 'max-h-0'}`}>
            <p className="px-5 pb-4 text-sm text-gray-600 font-medium leading-relaxed border-t border-blue-100 pt-3">
              {item.a}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
