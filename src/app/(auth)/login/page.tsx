'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2, CheckCircle, Zap } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.includes('Invalid login credentials')) toast.error('Invalid email or password. Please try again.')
        else if (error.message.includes('Email not confirmed'))  toast.error('Please verify your email before logging in.')
        else toast.error(error.message)
        setLoading(false)
        return
      }
      if (data.user) {
        setLoginSuccess(true)
        setTimeout(() => { router.push('/dashboard'); router.refresh() }, 1500)
      }
    } catch { toast.error('An unexpected error occurred.'); setLoading(false) }
  }

  if (loading || loginSuccess) return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-5 text-center">
        {loginSuccess
          ? <><div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center"><CheckCircle className="w-8 h-8 text-teal-600" /></div><p className="text-xl font-black text-gray-900">Welcome back!</p><p className="text-gray-500 text-sm font-medium">Taking you to your dashboard…</p></>
          : <><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /><p className="text-gray-600 font-medium text-sm">Signing you in…</p></>
        }
      </div>
    </div>
  )

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1.5">Welcome back</h1>
        <p className="text-gray-500 font-medium text-sm">Sign in to your Invonaut account</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email</label>
          <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" required disabled={loading} className="h-11" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Password</label>
            <Link href="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">Forgot password?</Link>
          </div>
          <PasswordInput id="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password" required disabled={loading} className="h-11" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full btn-primary py-3 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2">
          {loading ? 'Signing in…' : 'Sign In →'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-8">
        No account?{' '}
        <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">Create one free →</Link>
      </p>
    </>
  )
}
