'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PasswordInput } from '@/components/ui/password-input'
import { toast } from 'sonner'
import Link from 'next/link'
import { KeyRound, Check, Loader2, AlertCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password,   setPassword]   = useState('')
  const [confirm,    setConfirm]    = useState('')
  const [loading,    setLoading]    = useState(false)
  const [done,       setDone]       = useState(false)
  const [validSession, setValid]    = useState<boolean | null>(null)

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => setValid(!!data.session))
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { toast.error('Password must be at least 8 characters.'); return }
    if (password !== confirm) { toast.error('Passwords must match.'); return }
    setLoading(true)
    try {
      const { error } = await createClient().auth.updateUser({ password })
      if (error) { toast.error(error.message); return }
      setDone(true)
      setTimeout(() => { router.push('/dashboard'); router.refresh() }, 2000)
    } catch { toast.error('Failed to reset password.') }
    finally { setLoading(false) }
  }

  if (validSession === null) return (
    <div style={{ textAlign: 'center', paddingTop: 40 }}>
      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#0055FF', margin: '0 auto' }} />
    </div>
  )

  if (!validSession) return (
    <div>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <AlertCircle size={22} color="#DC2626" />
      </div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.9rem', fontWeight: 800, color: '#0A0A0A', letterSpacing: '-.025em', lineHeight: 1.1, marginBottom: 12 }}>Link expired.</h1>
      <p style={{ fontSize: '.875rem', color: '#64748B', lineHeight: 1.7, marginBottom: 28 }}>
        This password reset link has expired or already been used. Request a new one.
      </p>
      <Link href="/forgot-password" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '13px', borderRadius: 10, background: 'linear-gradient(135deg,#0044EE,#0066FF)', color: '#fff', fontWeight: 700, fontSize: '.9rem', textDecoration: 'none', boxShadow: '0 4px 16px rgba(0,85,255,0.3)' }}>
        Request a new link
      </Link>
    </div>
  )

  if (done) return (
    <div style={{ textAlign: 'center', paddingTop: 40 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#F0FDF4', border: '2px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <Check size={22} color="#16A34A" strokeWidth={3} />
      </div>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.6rem', fontWeight: 800, color: '#0A0A0A', marginBottom: 10 }}>Password updated.</h2>
      <p style={{ fontSize: '.875rem', color: '#64748B' }}>Taking you to your dashboard…</p>
    </div>
  )

  return (
    <div>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <KeyRound size={20} color="#0055FF" />
      </div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.9rem', fontWeight: 800, color: '#0A0A0A', letterSpacing: '-.025em', lineHeight: 1.1, marginBottom: 10 }}>
        Choose a new password.
      </h1>
      <p style={{ fontSize: '.875rem', color: '#64748B', lineHeight: 1.7, marginBottom: 32 }}>
        Pick something strong that you haven't used before.
      </p>

      <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>New password</label>
          <PasswordInput id="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="8+ characters" required autoComplete="new-password" className="w-full" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>Confirm new password</label>
          <PasswordInput id="confirm" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Same password again" required autoComplete="new-password" className="w-full" />
        </div>
        <button
          type="submit" disabled={loading}
          style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#0044EE,#0066FF)', color: '#fff', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: '.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,85,255,0.3)', opacity: loading ? 0.7 : 1, marginTop: 4 }}
        >
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
