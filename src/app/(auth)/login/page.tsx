'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { createClient } from '@/lib/supabase/client'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type LoginForm = {
  email: string
  password: string
}

type LoginErrors = {
  email?: string
  password?: string
  general?: string
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [formState, setFormState] = useState<LoginForm>({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<LoginErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    const validationErrors: LoginErrors = {}
    if (!formState.email.trim()) {
      validationErrors.email = 'Email address is required.'
    } else if (!emailPattern.test(formState.email)) {
      validationErrors.email = 'Enter a valid email address.'
    }
    if (!formState.password) {
      validationErrors.password = 'Password is required.'
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formState.email.trim(),
        password: formState.password
      })

      if (error) {
        const message =
          error.message === 'Invalid login credentials'
            ? 'Email or password is incorrect'
            : 'Login failed. Please try again'
        throw new Error(message)
      }

      router.push('/dashboard')
      router.refresh()
    } catch (caughtError) {
      const fallback =
        caughtError instanceof Error ? caughtError.message : 'Login failed. Please try again'
      setErrors({ general: fallback })
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
          <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-500">
            Sign in to continue managing your clients and invoices.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errors.general && (
            <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-600">
              {errors.general}
            </p>
          )}

          <div>
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formState.email}
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
              value={formState.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              className="mt-2"
            />
            {errors.password && (
              <p className="mt-1 text-xs font-medium text-red-600">{errors.password}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0066FF] text-white transition hover:bg-[#0051cc] focus-visible:outline-offset-2"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-semibold text-[#0066FF] underline-offset-4 transition hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}