'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2, Check, ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) { toast.error(error.message); return }
      setSent(true)
    } catch { toast.error('Failed to send reset email.') }
    finally { setLoading(false) }
  }

  if (sent) return (
    <div>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <Check size={22} color="#16A34A" strokeWidth={2.5} />
      </div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.9rem', fontWeight: 800, color: '#0A0A0A', letterSpacing: '-.025em', lineHeight: 1.1, marginBottom: 12 }}>
        Check your email.
      </h1>
      <p style={{ fontSize: '.875rem', color: '#64748B', lineHeight: 1.75, marginBottom: 6 }}>
        We sent a reset link to
      </p>
      <p style={{ fontSize: '.9rem', fontWeight: 700, color: '#0055FF', marginBottom: 28, wordBreak: 'break-all' }}>
        {email}
      </p>
      <div style={{ padding: '14px 16px', background: '#F8FAFF', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: '.8rem', color: '#64748B', lineHeight: 1.7, marginBottom: 28 }}>
        <p style={{ fontWeight: 700, color: '#0A0A0A', marginBottom: 8, fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Next steps</p>
        {['Open the email from Invonaut', 'Click the reset link', 'Choose a new password', 'Sign in'].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < 3 ? 6 : 0 }}>
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '.65rem', fontWeight: 700, color: '#0055FF' }}>{i + 1}</span>
            {s}
          </div>
        ))}
      </div>
      <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '.85rem', color: '#64748B', textDecoration: 'none', fontWeight: 600 }}>
        <ArrowLeft size={14} /> Back to sign in
      </Link>
    </div>
  )

  return (
    <div>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <Mail size={20} color="#0055FF" />
      </div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.9rem', fontWeight: 800, color: '#0A0A0A', letterSpacing: '-.025em', lineHeight: 1.1, marginBottom: 10 }}>
        Reset your password.
      </h1>
      <p style={{ fontSize: '.875rem', color: '#64748B', lineHeight: 1.7, marginBottom: 32 }}>
        Enter your email and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>Email address</label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={{ width: '100%' }} />
        </div>
        <button
          type="submit" disabled={loading}
          style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #0044EE, #0066FF)', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,85,255,0.3)', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <div style={{ marginTop: 24 }}>
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '.85rem', color: '#64748B', textDecoration: 'none', fontWeight: 600 }}>
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </div>
    </div>
  )
}
