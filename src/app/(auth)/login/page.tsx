'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2, CheckCircle, Sparkles } from 'lucide-react'

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please try again.')
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please verify your email before logging in.')
        } else {
          toast.error(error.message)
        }
        setLoading(false)
        return
      }

      if (data.user) {
        setLoginSuccess(true)
        
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 1500)
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  // Loading/Success Screen
  if (loading || loginSuccess) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-gray-50 flex items-center justify-center z-50">
        <div className="w-full max-w-md mx-4 bg-white rounded-2xl p-10 shadow-2xl border-2 border-gray-100">
          <div className="flex flex-col items-center justify-center space-y-6">
            {loginSuccess ? (
              <>
                <div className="p-4 bg-green-100 rounded-full">
                  <CheckCircle className="w-16 h-16 text-green-600" />
                </div>
                <h2 className="text-3xl font-black text-gray-900">Welcome Back!</h2>
                <p className="text-base text-gray-600 font-medium">Taking you to your dashboard...</p>
              </>
            ) : (
              <>
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                <h2 className="text-2xl font-black text-gray-900">Signing you in...</h2>
                <p className="text-base text-gray-600 font-medium">Please wait a moment</p>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'1\' height=\'1\' fill=\'rgba(0,0,0,0.5)\'/%3E%3C/svg%3E")', backgroundSize: '60px 60px'}}></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <span className="text-3xl font-black text-gray-900 tracking-tight">Invonaut</span>
          </Link>
          <p className="text-base text-gray-600 font-medium">
            AI-Powered Invoicing for Freelancers
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-10 shadow-2xl border-2 border-gray-100 hover:shadow-3xl transition-all">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Welcome Back</h2>
            <p className="text-base text-gray-600 font-medium">
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
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
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Password
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
                className="h-12 text-base"
              />
              <div className="mt-3 text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Sign In
            </button>
          </form>

          <div className="mt-8 text-center text-base text-gray-600 font-medium">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-bold">
              Sign up
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8 font-medium">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}