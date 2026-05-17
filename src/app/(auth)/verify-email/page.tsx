'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react'

export default function VerifyEmailPage() {
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const handleResend = async () => {
    setResending(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) { toast.error('No email address found. Please sign in again.'); return }
      const { error } = await supabase.auth.resend({ type: 'signup', email: user.email })
      if (error) { toast.error(error.message); return }
      setResent(true)
      setTimeout(() => setResent(false), 4000)
    } catch { toast.error('Failed to resend. Please try again.') }
    finally { setResending(false) }
  }

  return (
    <>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors ${resent ? 'bg-teal-50' : 'bg-blue-50'}`}>
        {resent
          ? <CheckCircle className="w-6 h-6 text-teal-600" />
          : <Mail className="w-6 h-6 text-blue-600" />
        }
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1.5">
          {resent ? 'Email sent!' : 'Verify your email'}
        </h1>
        <p className="text-gray-500 text-sm font-medium">
          {resent
            ? 'Check your inbox for a new verification link.'
            : "We sent a verification link to your email. Click it to activate your account."
          }
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 mb-6">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">What to do</p>
        <div className="space-y-3">
          {[
            { n: '1', text: 'Check your inbox (and spam folder)' },
            { n: '2', text: 'Click the "Verify email" button in the email' },
            { n: '3', text: "You'll be redirected to your dashboard" },
          ].map(s => (
            <div key={s.n} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</span>
              <span className="text-sm text-gray-600 font-medium">{s.text}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleResend}
        disabled={resending || resent}
        className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
        {resending ? 'Resending…' : resent ? 'Email resent ✓' : 'Resend verification email'}
      </button>

      <div className="flex items-center justify-center gap-6 mt-2">
        <Link href="/login" className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>
        <span className="text-gray-200">|</span>
        <Link href="/signup" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
          Wrong email? Sign up again
        </Link>
      </div>
    </>
  )
}
