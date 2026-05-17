'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) { toast.error(error.message); return }
      setEmailSent(true)
    } catch { toast.error('Failed to send reset email. Please try again.') }
    finally { setLoading(false) }
  }

  if (emailSent) return (
    <>
      <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mb-6">
        <CheckCircle className="w-6 h-6 text-teal-600" />
      </div>
      <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Check your email</h1>
      <p className="text-gray-500 text-sm font-medium mb-1">We sent a password reset link to:</p>
      <p className="text-sm font-black text-blue-600 mb-8 break-all">{email}</p>

      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-6 text-sm text-gray-600 space-y-2">
        <p className="font-bold text-gray-900 text-xs uppercase tracking-widest mb-3">Next steps</p>
        {['Check your inbox','Click the reset link in the email','Set your new password','Sign in'].map((s,i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">{i+1}</span>
            <span className="font-medium">{s}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center mb-6">
        Didn't get it? Check spam or{' '}
        <button onClick={() => setEmailSent(false)} className="text-blue-600 font-bold hover:text-blue-700">try again</button>
      </p>
      <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to login
      </Link>
    </>
  )

  return (
    <>
      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
        <Mail className="w-6 h-6 text-blue-600" />
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1.5">Forgot password?</h1>
        <p className="text-gray-500 text-sm font-medium">Enter your email and we'll send a reset link.</p>
      </div>

      <form onSubmit={handleResetRequest} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
          <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" required disabled={loading} className="h-11" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full btn-primary py-3 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Sending…' : 'Send Reset Link →'}
        </button>
      </form>

      <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors mt-7">
        <ArrowLeft className="w-4 h-4" /> Back to login
      </Link>
    </>
  )
}
