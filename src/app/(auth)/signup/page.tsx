'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { createClient } from '@/lib/supabase/client'

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
      // Step 1: Create auth user
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

      // Step 2: Wait a moment for Supabase to process
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Step 3: Insert user profile with matching auth user ID
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,  // ← CRITICAL FIX: Must match auth.users.id
          full_name: formData.fullName.trim(),
          email: formData.email.trim()
        })

      if (profileError) {
        console.error('Profile creation failed:', profileError.message)
        // Don't block signup - user can create profile later
      }

      // Step 4: Check if email confirmation is required
      if (data.user && !data.user.email_confirmed_at) {
        // Email confirmation required - show verification page
        router.push('/verify-email')
      } else {
        // Email confirmed or confirmation disabled - go to dashboard
        router.push('/dashboard')
        router.refresh()
      }
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
    <div className="min-h-screen w-full bg-slate-50 px-4 py-12">
      <div className="mx-auto flex w-full max-w-md flex-col space-y-8 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-2xl shadow-slate-200/60 backdrop-blur">
        <div className="space-y-1 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: '#0066FF' }}>
            Flowance
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-500">
            Securely manage your finances and collaborate with your team.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
          {errors.general && (
            <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-600">
              {errors.general}
            </p>
          )}

          <div>
            <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
              Full name
            </label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Jordan Mendoza"
              className="mt-2"
            />
            {errors.fullName && (
              <p className="mt-1 text-xs font-medium text-red-600">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@flowance.com"
              className="mt-2"
            />
            {errors.email && (
              <p className="mt-1 text-xs font-medium text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              className="mt-2"
            />
            {errors.password && (
              <p className="mt-1 text-xs font-medium text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
              Confirm password
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              className="mt-2"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs font-medium text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0066FF] text-white transition hover:bg-[#0051cc] focus-visible:outline-offset-2"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-[#0066FF] underline-offset-4 transition hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}