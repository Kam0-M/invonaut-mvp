'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, Mail, CheckCircle, Sparkles } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      
      const redirectUrl = `${window.location.origin}/reset-password`
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      })

      if (error) {
        toast.error(error.message)
        return
      }

      setEmailSent(true)
      toast.success('Password reset email sent!')
    } catch (error: any) {
      toast.error('Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50 flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'1\' height=\'1\' fill=\'rgba(0,0,0,0.5)\'/%3E%3C/svg%3E")', backgroundSize: '60px 60px'}}></div>
        
        <div className="relative z-10 w-full max-w-md bg-white rounded-2xl p-10 shadow-2xl border-2 border-gray-100">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
            </div>
            
            <div>
              <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Check Your Email</h1>
              <p className="text-base text-gray-600 font-medium mb-2">
                We've sent a password reset link to:
              </p>
              <p className="text-base font-bold text-blue-600">{email}</p>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-left">
              <p className="text-sm font-bold text-gray-900 mb-3">
                Next steps:
              </p>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside font-medium">
                <li>Check your email inbox</li>
                <li>Click the password reset link</li>
                <li>Enter your new password</li>
                <li>Sign in with your new credentials</li>
              </ol>
            </div>

            <p className="text-sm text-gray-500 font-medium">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setEmailSent(false)}
                className="text-blue-600 hover:text-blue-700 font-bold"
              >
                try again
              </button>
            </p>
          </div>

          <Link href="/login" className="block mt-8">
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Back to Login
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'1\' height=\'1\' fill=\'rgba(0,0,0,0.5)\'/%3E%3C/svg%3E")', backgroundSize: '60px 60px'}}></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <span className="text-3xl font-black text-gray-900 tracking-tight">Invonaut</span>
          </Link>
        </div>

        {/* Reset Card */}
        <div className="bg-white rounded-2xl p-10 shadow-2xl border-2 border-gray-100">
          <div className="text-center space-y-4 mb-8">
            <div className="flex justify-center">
              <div className="p-4 bg-blue-100 rounded-full">
                <Mail className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Forgot Password?</h1>
            <p className="text-base text-gray-600 font-medium">
              No worries! Enter your email and we'll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleResetRequest} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                className="h-12 text-base"
              />
              <p className="text-sm text-gray-500 mt-2 font-medium">
                Enter the email associated with your account
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <Link href="/login" className="block mt-6">
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Back to Login
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}