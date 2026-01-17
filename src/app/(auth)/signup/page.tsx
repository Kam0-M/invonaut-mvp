'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { createClient } from '@/lib/supabase/client'
import { Sparkles } from 'lucide-react'

type FormData = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

type FormErrors = {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
  general?: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    const validationErrors: FormErrors = {}
    if (!formData.fullName.trim()) {
      validationErrors.fullName = 'Full name is required.'
    }
    if (!formData.email.trim()) {
      validationErrors.email = 'Email address is required.'
    } else if (!emailPattern.test(formData.email)) {
      validationErrors.email = 'Enter a valid email address.'
    }
    if (!formData.password) {
      validationErrors.password = 'Password is required.'
    } else if (formData.password.length < 8) {
      validationErrors.password = 'Password must be at least 8 characters.'
    }
    if (!formData.confirmPassword) {
      validationErrors.confirmPassword = 'Please confirm your password.'
    } else if (formData.password !== formData.confirmPassword) {
      validationErrors.confirmPassword = 'Passwords must match.'
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim()
          }
        }
      })

      if (error || !data.user) {
        throw new Error(error?.message ?? 'Unable to create account.')
      }

      // Email confirmation disabled - wait for profile creation then redirect
      let attempts = 0
      const maxAttempts = 30
      
      while (attempts < maxAttempts) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()
        
        if (profile) {
          // Profile exists, safe to redirect
          router.push('/dashboard')
          router.refresh()
          return
        }
        
        // Wait 500ms before checking again
        await new Promise(resolve => setTimeout(resolve, 500))
        attempts++
      }
      
      // Profile still doesn't exist after 15 seconds, redirect anyway
      router.push('/dashboard')
      router.refresh()
      
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'An unexpected error occurred. Please try again.'
      setErrors({ general: message })
    } finally {
      setIsLoading(false)
    }
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
            <span className="text-3xl font-black text-gray-900 tracking-tight">Flowance</span>
          </Link>
          <p className="text-base text-gray-600 font-medium">
            Start your 14-day free trial
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-white rounded-2xl p-10 shadow-2xl border-2 border-gray-100 hover:shadow-3xl transition-all">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Create Account</h2>
            <p className="text-base text-gray-600 font-medium">
              Join thousands of freelancers
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            {errors.general && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">
                {errors.general}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Full Name
              </label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Jordan Mendoza"
                className="h-12 text-base"
              />
              {errors.fullName && (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="h-12 text-base"
              />
              {errors.email && (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password (8+ characters)"
                className="h-12 text-base"
              />
              {errors.password && (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Confirm Password
              </label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className="h-12 text-base"
              />
              {errors.confirmPassword && (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-base text-gray-600 font-medium mt-8">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-bold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8 font-medium">
          No credit card required • 14-day free trial • Cancel anytime
        </p>
      </div>
    </div>
  )
}