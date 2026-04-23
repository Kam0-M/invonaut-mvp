'use client'
// src/components/dashboard/onboarding-checklist.tsx
//
// Shows only when the user has no data yet (new user).
// Tracks 5 onboarding steps. Dismissible via localStorage.
// Steps link directly to the action.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, ChevronRight, X, Zap } from 'lucide-react'

interface Props {
  hasClients:     boolean
  hasSentInvoice: boolean
  hasTimeEntry:   boolean
  hasPayment:     boolean
  hasPortal:      boolean
}

export default function OnboardingChecklist({
  hasClients, hasSentInvoice, hasTimeEntry, hasPayment, hasPortal,
}: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [mounted,   setMounted]   = useState(false)

  useEffect(() => {
    setMounted(true)
    setDismissed(localStorage.getItem('invonaut_onboarding_dismissed') === 'true')
  }, [])

  const steps = [
    {
      id: 'client', label: 'Add your first client',
      hint: 'Every invoice, payment, and contract links back to a client.',
      href: '/dashboard/clients/new', done: hasClients,
    },
    {
      id: 'invoice', label: 'Create and send your first invoice',
      hint: 'Once sent, AI starts tracking payment risk and can remind automatically.',
      href: '/dashboard/invoices/new', done: hasSentInvoice,
    },
    {
      id: 'time', label: 'Log your first time entry',
      hint: 'Track billable hours — then turn them into an invoice with one click.',
      href: '/dashboard/time', done: hasTimeEntry,
    },
    {
      id: 'payment', label: 'Log a direct payment',
      hint: 'Cash, POS, bank, mobile money — income that doesn\'t need an invoice.',
      href: '/dashboard/payments/new', done: hasPayment,
    },
    {
      id: 'portal', label: 'Set up your client portal',
      hint: 'Give clients a branded link to view invoices and sign contracts.',
      href: '/dashboard/portal', done: hasPortal,
    },
  ]

  const completedCount = steps.filter(s => s.done).length
  const allDone        = completedCount === steps.length
  const progress       = (completedCount / steps.length) * 100

  const handleDismiss = () => {
    localStorage.setItem('invonaut_onboarding_dismissed', 'true')
    setDismissed(true)
  }

  if (!mounted || dismissed || allDone) return null

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm">
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'radial-gradient(circle, #2563EB 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">Get started with Invonaut</h3>
              <p className="text-sm text-gray-500 font-medium">{completedCount} of {steps.length} steps complete</p>
            </div>
          </div>
          <button onClick={handleDismiss}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white transition-all flex-shrink-0"
            title="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Progress */}
        <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-blue-600 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
        {/* Steps */}
        <div className="space-y-1">
          {steps.map(step => (
            step.done ? (
              <div key={step.id} className="flex items-center gap-3 p-2.5 rounded-xl opacity-50">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-500 line-through">{step.label}</span>
              </div>
            ) : (
              <Link key={step.id} href={step.href}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-blue-100 hover:shadow-sm transition-all group">
                <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{step.label}</p>
                  <p className="text-xs text-gray-400 truncate">{step.hint}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </Link>
            )
          ))}
        </div>
      </div>
    </div>
  )
}
