'use client'
// src/components/dashboard/onboarding-checklist.tsx
//
// Shows only when the user has an active subscription.
// Tracks 5 onboarding steps. Dismissible — restores via a "Setup guide" pill.
// Tasks auto-check as user completes them (props recomputed on every dashboard refresh).
// Celebration fires when all 5 steps are done.

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, ChevronRight, X, Zap, PartyPopper, RotateCcw } from 'lucide-react'

interface Props {
  hasClients:     boolean
  hasSentInvoice: boolean
  hasTimeEntry:   boolean
  hasPayment:     boolean
  hasPortal:      boolean
  tier?:          string
  hasLogo?:       boolean
}

export default function OnboardingChecklist({
  hasClients, hasSentInvoice, hasTimeEntry, hasPayment, hasPortal,
  tier = 'starter', hasLogo = false,
}: Props) {
  const isPro = tier === 'professional' || tier === 'business'
  const [dismissed,    setDismissed]    = useState(false)
  const [celebrating,  setCelebrating]  = useState(false)
  const [showRestore,  setShowRestore]  = useState(false)
  const [mounted,      setMounted]      = useState(false)
  const prevAllDone = useRef(false)

  useEffect(() => {
    setMounted(true)
    setDismissed(localStorage.getItem('invonaut_onboarding_dismissed') === 'true')
  }, [])

  const coreSteps = [
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
      hint: 'Cash, POS, bank, mobile money — income that doesn't need an invoice.',
      href: '/dashboard/payments/new', done: hasPayment,
    },
    {
      id: 'portal', label: 'Set up your client portal',
      hint: 'Give clients a branded link to view invoices and sign contracts.',
      href: '/dashboard/portal', done: hasPortal,
    },
  ]

  const proSteps = isPro ? [
    {
      id: 'logo', label: 'Upload your logo',
      hint: 'Your logo appears on every invoice PDF and in your client portal.',
      href: '/dashboard/settings', done: hasLogo,
    },
    {
      id: 'cashflow', label: 'Check your 90-day cash flow',
      hint: 'See your runway, upcoming payments, and revenue vs expenses — updated in real time.',
      href: '/dashboard/cash', done: false, // always show as a nudge
    },
  ] : []

  const steps = [...coreSteps, ...proSteps]

  const completedCount = steps.filter(s => s.done).length
  const allDone        = completedCount === steps.length
  const progress       = (completedCount / steps.length) * 100

  // Detect when all tasks are newly completed → trigger celebration
  useEffect(() => {
    if (!mounted) return
    if (allDone && !prevAllDone.current && !dismissed) {
      setCelebrating(true)
      // Auto-dismiss after celebration
      const t = setTimeout(() => {
        localStorage.setItem('invonaut_onboarding_dismissed', 'true')
        setDismissed(true)
        setCelebrating(false)
      }, 4000)
      return () => clearTimeout(t)
    }
    prevAllDone.current = allDone
  }, [allDone, mounted, dismissed])

  const handleDismiss = () => {
    localStorage.setItem('invonaut_onboarding_dismissed', 'true')
    setDismissed(true)
    setShowRestore(true)
  }

  const handleRestore = () => {
    localStorage.removeItem('invonaut_onboarding_dismissed')
    setDismissed(false)
    setShowRestore(false)
  }

  if (!mounted) return null

  // Celebration screen — shown when all tasks just completed
  if (celebrating) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 shadow-sm">
        <style>{`
          @keyframes inv-confetti-pop {
            0%   { transform: scale(0.5) rotate(-10deg); opacity: 0; }
            60%  { transform: scale(1.15) rotate(4deg);  opacity: 1; }
            100% { transform: scale(1)   rotate(0deg);   opacity: 1; }
          }
          @keyframes inv-confetti-float {
            0%, 100% { transform: translateY(0px) rotate(0deg);   }
            33%       { transform: translateY(-6px) rotate(3deg);  }
            66%       { transform: translateY(-3px) rotate(-2deg); }
          }
          .inv-celebrate-icon { animation: inv-confetti-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) both; }
          .inv-celebrate-float { animation: inv-confetti-float 2s ease-in-out infinite; }
        `}</style>
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, #10B981 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />
        <div className="relative z-10 p-8 text-center">
          <div className="inv-celebrate-icon inv-celebrate-float inline-flex w-16 h-16 rounded-2xl bg-emerald-500 items-center justify-center mb-4 shadow-lg shadow-emerald-200">
            <PartyPopper className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">You're all set!</h3>
          <p className="text-sm text-gray-600 font-medium max-w-xs mx-auto">
            You've completed every setup step. Invonaut is fully running for your business — the system is watching from here.
          </p>
          <div className="flex justify-center gap-2 mt-4">
            {[...Array(5)].map((_, i) => (
              <CheckCircle2 key={i} className="w-5 h-5 text-emerald-500" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Dismissed — show a small restore pill so they can bring it back
  if (dismissed) {
    if (allDone) return null  // No point restoring if everything is done
    return (
      <button
        onClick={handleRestore}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-gray-200 text-sm font-bold text-gray-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-all shadow-sm"
        title="Restore setup guide"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Setup guide ({completedCount}/{steps.length})
      </button>
    )
  }

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
