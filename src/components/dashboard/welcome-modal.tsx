'use client'
// Welcome modal — shown once to new users (no invoices + no clients)
// Dismissed to localStorage key inv_welcome_done

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Users, Clock, X, ArrowRight, Sparkles } from 'lucide-react'

export default function WelcomeModal({ businessName }: { businessName: string | null }) {
  const [visible, setVisible] = useState(false)
  const [step,    setStep]    = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const done = localStorage.getItem('inv_welcome_done')
    if (!done) setVisible(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem('inv_welcome_done', '1')
    setVisible(false)
  }

  const steps = [
    {
      icon: Users,
      color: '#0055FF',
      bg: 'rgba(0,85,255,0.08)',
      title: 'Add your first client',
      body: 'Every invoice, contract, and time entry links to a client. Start by adding the first person or business you work with.',
      cta: 'Add a client',
      href: '/dashboard/clients',
    },
    {
      icon: FileText,
      color: '#00C4A0',
      bg: 'rgba(0,196,160,0.08)',
      title: 'Send your first invoice',
      body: 'Create a professional invoice in under a minute. Invonaut tracks it, follows up automatically if unpaid, and reports on it.',
      cta: 'Create an invoice',
      href: '/dashboard/invoices',
    },
    {
      icon: Clock,
      color: '#FF6B35',
      bg: 'rgba(255,107,53,0.08)',
      title: 'Track your time',
      body: 'Log billable hours as you work. When you\'re ready, convert them to an invoice in one click — no manual maths.',
      cta: 'Start tracking time',
      href: '/dashboard/time',
    },
  ]

  const current = steps[step]

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(10,10,10,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) dismiss() }}
    >
      <div style={{
        background: '#fff', borderRadius: 20, padding: '32px 32px 28px',
        maxWidth: 440, width: '100%', position: 'relative',
        boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
        fontFamily: "'DM Sans', Inter, sans-serif",
      }}>
        {/* Close */}
        <button
          onClick={dismiss}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        {step === 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Sparkles size={16} color="#0055FF" />
              <span style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#0055FF' }}>Welcome to Invonaut</span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0A0A0A', letterSpacing: '-.025em', lineHeight: 1.15, marginBottom: 6 }}>
              Hey{businessName ? `, ${businessName.split(' ')[0]}` : ''}! Let&apos;s get you set up
            </h2>
            <p style={{ fontSize: '.875rem', color: '#64748B', lineHeight: 1.6 }}>
              Three quick steps and you&apos;ll have your full financial workflow running. Takes about 5 minutes.
            </p>
          </div>
        )}

        {/* Step cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {steps.map((s, i) => {
            const Icon = s.icon
            const isActive = i === step
            const isDone   = i < step
            return (
              <div
                key={i}
                onClick={() => setStep(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                  border: `1.5px solid ${isActive ? s.color : isDone ? '#E2E8F0' : '#F1F5F9'}`,
                  background: isActive ? s.bg : isDone ? '#F8FAFF' : '#FAFAFA',
                  transition: 'all .15s',
                  opacity: !isActive && !isDone && i > step ? 0.55 : 1,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: isActive ? s.color : isDone ? '#E2E8F0' : '#F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isDone
                    ? <span style={{ color: '#64748B', fontSize: 14, fontWeight: 800 }}>✓</span>
                    : <Icon size={16} color={isActive ? '#fff' : '#94A3B8'} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '.85rem', fontWeight: 700, color: isActive ? '#0A0A0A' : '#64748B', marginBottom: 1 }}>
                    Step {i + 1} — {s.title}
                  </p>
                  {isActive && <p style={{ fontSize: '.78rem', color: '#64748B', lineHeight: 1.5 }}>{s.body}</p>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => { dismiss(); router.push(current.href) }}
            style={{
              flex: 1, padding: '12px 20px', borderRadius: 11,
              background: `linear-gradient(135deg, ${step === 0 ? '#0044EE,#0066FF' : step === 1 ? '#00A88A,#00C4A0' : '#E04E20,#FF6B35'})`,
              color: '#fff', fontWeight: 700, fontSize: '.875rem', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {current.cta} <ArrowRight size={14} />
          </button>
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              style={{ padding: '12px 18px', borderRadius: 11, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', fontWeight: 600, fontSize: '.82rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
            >
              Skip for now
            </button>
          ) : (
            <button
              onClick={dismiss}
              style={{ padding: '12px 18px', borderRadius: 11, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', fontWeight: 600, fontSize: '.82rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
            >
              I&apos;ll explore myself
            </button>
          )}
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
          {steps.map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{ width: i === step ? 20 : 7, height: 7, borderRadius: 4, background: i === step ? '#0055FF' : '#E2E8F0', transition: 'all .2s', cursor: 'pointer' }} />
          ))}
        </div>
      </div>
    </div>
  )
}
