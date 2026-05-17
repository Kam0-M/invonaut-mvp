'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PasswordInput } from '@/components/ui/password-input'
import { toast } from 'sonner'
import Link from 'next/link'
import { KeyRound, CheckCircle, Loader2, XCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetComplete, setResetComplete] = useState(false)
  const [validSession, setValidSession] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setValidSession(!!data.session)
    })
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { toast.error('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { toast.error('Passwords must match.'); return }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) { toast.error(error.message); return }
      setResetComplete(true)
      setTimeout(() => { router.push('/dashboard'); router.refresh() }, 2500)
    } catch { toast.error('Failed to reset password. Please try again.') }
    finally { setLoading(false) }
  }

  if (validSession === null) return (
    <div className="flex flex-col items-center gap-4 py-8">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <p className="text-sm text-gray-500 font-medium">Verifying reset link…</p>
    </div>
  )

  if (validSession === false) return (
    <>
      <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
        <XCircle className="w-6 h-6 text-red-500" />
      </div>
      <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Link expired</h1>
      <p className="text-gray-500 text-sm font-medium mb-8">
        This password reset link has expired or has already been used. Request a new one.
      </p>
      <Link href="/forgot-password"
        className="w-full btn-primary py-3 rounded-xl font-bold text-sm text-center block">
        Request New Link →
      </Link>
      <Link href="/login"
        className="block text-center text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors mt-5">
        Back to login
      </Link>
    </>
  )

  if (resetComplete) return (
    <div className="flex flex-col items-center text-center gap-4 py-8">
      <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-teal-600" />
      </div>
      <h1 className="text-2xl font-black text-gray-900 tracking-tight">Password updated!</h1>
      <p className="text-gray-500 text-sm font-medium">Redirecting you to your dashboard…</p>
      <Loader2 className="w-5 h-5 text-blue-600 animate-spin mt-2" />
    </div>
  )

  return (
    <>
      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
        <KeyRound className="w-6 h-6 text-blue-600" />
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1.5">Set new password</h1>
        <p className="text-gray-500 text-sm font-medium">Choose a strong password for your account.</p>
      </div>

      <form onSubmit={handleReset} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">New Password</label>
          <PasswordInput value={password} onChange={e => setPassword(e.target.value)}
            placeholder="8+ characters" required disabled={loading} className="h-11" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Confirm Password</label>
          <PasswordInput value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password" required disabled={loading} className="h-11" />
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Requirements</p>
          {[
            { label: '8+ characters',    met: password.length >= 8 },
            { label: 'Passwords match',   met: password === confirmPassword && confirmPassword.length > 0 },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className={`w-1.5 h-1.5 rounded-full ${r.met ? 'bg-teal-500' : 'bg-gray-300'}`} />
              <span className={`text-xs font-medium ${r.met ? 'text-teal-700' : 'text-gray-400'}`}>{r.label}</span>
            </div>
          ))}
        </div>

        <button type="submit" disabled={loading}
          className="w-full btn-primary py-3 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Updating…' : 'Update Password →'}
        </button>
      </form>
    </>
  )
}
