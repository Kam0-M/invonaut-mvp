'use client'

// Checklist #34 — locked-state UI inconsistency. Three inline feature gates
// (contract-review.tsx, budget-settings.tsx, intelligence-feed.tsx) each built
// their own version of "this needs a higher plan": two rendered a static,
// non-clickable pill with zero path to actually upgrade, while only the
// Intelligence Feed's had a working CTA — and all three used slightly
// different copy and layout for the same concept. This is the single shared
// version: same shell as the rest of the app's Card Standard, always a real,
// clickable upgrade link.

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface InlineUpgradePromptProps {
  icon: LucideIcon
  title: string
  description: string
  requiredPlan: 'Professional' | 'Business' | 'Professional & Business'
}

export default function InlineUpgradePrompt({
  icon: Icon,
  title,
  description,
  requiredPlan,
}: InlineUpgradePromptProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
      <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#0055FF]" />
        {title}
      </h3>
      <p className="text-xs text-gray-400 leading-relaxed">
        {description}
      </p>
      <Link
        href="/dashboard/billing"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0055FF] bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors"
      >
        {requiredPlan} only · Upgrade <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
