'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Check } from 'lucide-react'
import OAuthButtons from '@/components/auth/oauth-buttons'

type F = { fullName: string; email: string; password: string; confirm: string }
type E = Partial<Record<keyof F | 'general', string>>

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignupPage() {
  const router = useRouter()
  const [form,    setForm]    = useState<F>({ fullName: '', email: '', password: '', confirm: '' })
  const [errors,  setErrors]  = useState<E>({})
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  const set = (k: keyof F) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const v: E = {}
    if (!form.fullName.trim())          v.fullName = 'Your name is required.'
    if (!emailRe.test(form.email))      v.email    = 'Enter a valid email address.'
    if (form.password.length < 8)       v.password = 'At least 8 characters.'
    if (form.password !== form.confirm) v.confirm  = 'Passwords must match.'
    if (Object.keys(v).length) { setErrors(v); return }

    setLoading(true); setErrors({})
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { full_name: form.fullName.trim() } },
      })
      if (error) { setErrors({ general: error.message }); setLoading(false); return }
      if (data.user) {
        // ── Capture affiliate referral if cookie present ──────────────────
        try {
          const refCookie = document.cookie
            .split('; ')
            .find(c => c.startsWith('inv_ref='))
            ?.split('=')[1]
          if (refCookie) {
            await fetch('/api/affiliate/track-signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ referral_code: refCookie, referred_user_id: data.user.id }),
            })
            // Clear the cookie after capturing
            document.cookie = 'inv_ref=; max-age=0; path=/'
          }
        } catch { /* non-fatal — don't block signup flow */ }

        if (data.session) {
          // Email confirmation disabled — go straight to dashboard
          router.push('/dashboard'); router.refresh()
        } else {
          setDone(true)
        }
      }
    } catch { setErrors({ general: 'Something went wrong. Please try again.' }); setLoading(false) }
  }

  if (done) return (
    <div style={{ textAlign: 'center', paddingTop: 40 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#F0FDF4', border: '2px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <Check size={22} color="#16A34A" strokeWidth={3} />
      </div>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.6rem', fontWeight: 800, color: '#0A0A0A', marginBottom: 10 }}>Check your email.</h2>
      <p style={{ fontSize: '.875rem', color: '#64748B', lineHeight: 1.7 }}>
        We sent a confirmation link to<br/>
        <strong style={{ color: '#0A0A0A' }}>{form.email}</strong>.<br/>
        Click it to activate your account.
      </p>
      <Link href="/login" style={{ display: 'inline-block', marginTop: 28, fontSize: '.85rem', color: '#0055FF', fontWeight: 600, textDecoration: 'none' }}>
        Back to sign in →
      </Link>
    </div>
  )

  return (
    <div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', fontWeight: 800, color: '#0A0A0A', letterSpacing: '-.025em', lineHeight: 1.1, marginBottom: 8 }}>
        Start for free.
      </h1>
      <p style={{ fontSize: '.875rem', color: '#64748B', marginBottom: 32 }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: '#0055FF', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
      </p>

      {/* OAuth */}
      <OAuthButtons redirectTo="/dashboard" />

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
        <span style={{ fontSize: '.75rem', color: '#94A3B8', fontWeight: 600, whiteSpace: 'nowrap' }}>or continue with email</span>
        <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
      </div>

      {errors.general && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: '.825rem', color: '#DC2626', marginBottom: 14 }}>
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>Full name</label>
          <Input value={form.fullName} onChange={set('fullName')} placeholder="Your name" required style={{ width: '100%' }} />
          {errors.fullName && <p style={{ fontSize: '.72rem', color: '#DC2626', marginTop: 4 }}>{errors.fullName}</p>}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>Email address</label>
          <Input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required autoComplete="email" style={{ width: '100%' }} />
          {errors.email && <p style={{ fontSize: '.72rem', color: '#DC2626', marginTop: 4 }}>{errors.email}</p>}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>Password</label>
          <PasswordInput id="password" value={form.password} onChange={set('password')} placeholder="8+ characters" required autoComplete="new-password" className="w-full" />
          {errors.password && <p style={{ fontSize: '.72rem', color: '#DC2626', marginTop: 4 }}>{errors.password}</p>}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>Confirm password</label>
          <PasswordInput id="confirm" value={form.confirm} onChange={set('confirm')} placeholder="Same password again" required autoComplete="new-password" className="w-full" />
          {errors.confirm && <p style={{ fontSize: '.72rem', color: '#DC2626', marginTop: 4 }}>{errors.confirm}</p>}
        </div>

        <button
          type="submit" disabled={loading}
          style={{
            width: '100%', padding: '13px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg, #0044EE, #0066FF)', color: '#fff',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 16px rgba(0,85,255,0.3)', opacity: loading ? 0.7 : 1,
            marginTop: 4,
          }}
        >
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
          {loading ? 'Creating account…' : 'Create free account'}
        </button>
      </form>

      <p style={{ fontSize: '.72rem', color: '#94A3B8', textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
        No credit card required · 14-day free trial · Cancel anytime
      </p>
      <p style={{ fontSize: '.72rem', color: '#94A3B8', textAlign: 'center', marginTop: 8, lineHeight: 1.6 }}>
        By signing up you agree to our{' '}
        <Link href="/terms"   style={{ color: '#64748B', textDecoration: 'underline' }}>Terms</Link> and{' '}
        <Link href="/privacy" style={{ color: '#64748B', textDecoration: 'underline' }}>Privacy Policy</Link>.
      </p>
    </div>
  )
}
