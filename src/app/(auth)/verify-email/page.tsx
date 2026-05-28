'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { Mail, RefreshCw, Check, ArrowLeft } from 'lucide-react'

export default function VerifyEmailPage() {
  const [resending, setResending] = useState(false)
  const [resent,    setResent]    = useState(false)

  const handleResend = async () => {
    setResending(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) { toast.error('No email address found. Please sign in again.'); return }
      const { error } = await supabase.auth.resend({ type: 'signup', email: user.email })
      if (error) { toast.error(error.message); return }
      setResent(true)
      setTimeout(() => setResent(false), 5000)
    } catch { toast.error('Failed to resend. Please try again.') }
    finally { setResending(false) }
  }

  return (
    <div>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: resent ? '#F0FDF4' : '#EFF6FF', border: `1px solid ${resent ? '#BBF7D0' : '#BFDBFE'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, transition: 'all .2s' }}>
        {resent
          ? <Check size={22} color="#16A34A" strokeWidth={2.5} />
          : <Mail size={20} color="#0055FF" />
        }
      </div>

      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.9rem', fontWeight: 800, color: '#0A0A0A', letterSpacing: '-.025em', lineHeight: 1.1, marginBottom: 12 }}>
        {resent ? 'Email sent again.' : 'Verify your email.'}
      </h1>
      <p style={{ fontSize: '.875rem', color: '#64748B', lineHeight: 1.75, marginBottom: 32 }}>
        {resent
          ? 'We sent another confirmation link. Check your inbox and spam folder.'
          : "We sent a confirmation link to your email. Click it to activate your account. Check your spam folder if you don't see it."
        }
      </p>

      <button
        onClick={handleResend} disabled={resending || resent}
        style={{ width: '100%', padding: '13px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', cursor: resending || resent ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: '.875rem', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: resending || resent ? 0.6 : 1, transition: 'background .15s' }}
        onMouseEnter={e => { if (!resending && !resent) e.currentTarget.style.background = '#F8FAFF' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
      >
        <RefreshCw size={15} style={{ animation: resending ? 'spin 1s linear infinite' : 'none' }} />
        {resending ? 'Sending…' : resent ? 'Email sent ✓' : 'Resend confirmation email'}
      </button>

      <div style={{ marginTop: 24 }}>
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '.85rem', color: '#64748B', fontWeight: 600, textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </div>
    </div>
  )
}
