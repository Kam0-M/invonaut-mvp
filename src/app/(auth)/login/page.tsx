'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2, ArrowRight } from 'lucide-react'
import OAuthButtons from '@/components/auth/oauth-buttons'

export default function LoginPage() {
  const router   = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.includes('Invalid login credentials')) toast.error('Incorrect email or password.')
        else if (error.message.includes('Email not confirmed'))  toast.error('Please verify your email first.')
        else toast.error(error.message)
        setLoading(false)
        return
      }
      if (data.user) {
        setDone(true)
        setTimeout(() => { router.push('/dashboard'); router.refresh() }, 800)
      }
    } catch { toast.error('Something went wrong. Please try again.'); setLoading(false) }
  }

  if (done) return (
    <div style={{ textAlign: 'center', paddingTop: 40 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <ArrowRight size={20} color="#16A34A" />
      </div>
      <p style={{ fontFamily: "'Fraunces', serif", fontSize: '1.3rem', fontWeight: 700, color: '#0A0A0A', marginBottom: 6 }}>Signing you in…</p>
      <p style={{ fontSize: '.85rem', color: '#64748B' }}>Taking you to your dashboard.</p>
    </div>
  )

  return (
    <div>
      {/* Heading */}
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', fontWeight: 800, color: '#0A0A0A', letterSpacing: '-.025em', lineHeight: 1.1, marginBottom: 8 }}>
        Welcome back.
      </h1>
      <p style={{ fontSize: '.875rem', color: '#64748B', marginBottom: 32 }}>
        Don't have an account?{' '}
        <Link href="/signup" style={{ color: '#0055FF', fontWeight: 600, textDecoration: 'none' }}>Sign up free</Link>
      </p>

      {/* OAuth */}
      <OAuthButtons redirectTo="/dashboard" />

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
        <span style={{ fontSize: '.75rem', color: '#94A3B8', fontWeight: 600, whiteSpace: 'nowrap' }}>or continue with email</span>
        <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
            Email address
          </label>
          <Input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" required autoComplete="email"
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: '.78rem', fontWeight: 700, color: '#374151' }}>Password</label>
            <Link href="/forgot-password" style={{ fontSize: '.75rem', color: '#0055FF', fontWeight: 600, textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" required autoComplete="current-password"
            className="w-full"
          />
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
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p style={{ fontSize: '.72rem', color: '#94A3B8', textAlign: 'center', marginTop: 24, lineHeight: 1.6 }}>
        By signing in you agree to our{' '}
        <Link href="/terms"   style={{ color: '#64748B', textDecoration: 'underline' }}>Terms</Link> and{' '}
        <Link href="/privacy" style={{ color: '#64748B', textDecoration: 'underline' }}>Privacy Policy</Link>.
      </p>
    </div>
  )
}
