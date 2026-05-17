'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle } from 'lucide-react'

type FormData = { fullName: string; email: string; password: string; confirmPassword: string }
type FormErrors = { fullName?: string; email?: string; password?: string; confirmPassword?: string; general?: string }
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [formData, setFormData] = useState<FormData>({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})
    const v: FormErrors = {}
    if (!formData.fullName.trim())                                v.fullName = 'Full name is required.'
    if (!emailPattern.test(formData.email))                      v.email = 'Enter a valid email address.'
    if (formData.password.length < 8)                            v.password = 'Password must be at least 8 characters.'
    if (formData.password !== formData.confirmPassword)          v.confirmPassword = 'Passwords must match.'
    if (Object.keys(v).length > 0) { setErrors(v); return }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email, password: formData.password,
        options: { data: { full_name: formData.fullName.trim() } }
      })
      if (error || !data.user) throw new Error(error?.message ?? 'Unable to create account.')

      setSuccess(true)
      let attempts = 0
      while (attempts < 30) {
        const { data: profile } = await supabase.from('user_profiles').select('id').eq('id', data.user.id).single()
        if (profile) { router.push('/dashboard'); router.refresh(); return }
        await new Promise(r => setTimeout(r, 500))
        attempts++
      }
      router.push('/dashboard'); router.refresh()
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'An unexpected error occurred.' })
      setSuccess(false)
    } finally { setIsLoading(false) }
  }

  if (success || isLoading) return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-5 text-center">
        {success
          ? <><div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center"><CheckCircle className="w-8 h-8 text-teal-600" /></div><p className="text-xl font-black text-gray-900">Account created!</p><p className="text-gray-500 text-sm font-medium">Setting up your workspace…</p></>
          : <><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /><p className="text-gray-600 font-medium text-sm">Creating your account…</p></>
        }
      </div>
    </div>
  )

  return (
    <>
      <div className="mb-7">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1.5">Create your account</h1>
        <p className="text-gray-500 font-medium text-sm">Start free — no credit card required</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        {errors.general && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
            {errors.general}
          </div>
        )}
        {[
          { id: 'fullName', label: 'Full Name',       type: 'text',     ph: 'Jordan Mendoza',         err: errors.fullName },
          { id: 'email',    label: 'Email Address',   type: 'email',    ph: 'you@example.com',        err: errors.email },
        ].map(f => (
          <div key={f.id}>
            <label htmlFor={f.id} className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{f.label}</label>
            <Input id={f.id} name={f.id} type={f.type} value={(formData as any)[f.id]}
              onChange={handleChange} placeholder={f.ph} className="h-11" />
            {f.err && <p className="mt-1.5 text-xs font-semibold text-red-600">{f.err}</p>}
          </div>
        ))}
        <div>
          <label htmlFor="password" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Password</label>
          <PasswordInput id="password" name="password" value={formData.password}
            onChange={handleChange} placeholder="8+ characters" className="h-11" />
          {errors.password && <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.password}</p>}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Confirm Password</label>
          <PasswordInput id="confirmPassword" name="confirmPassword" value={formData.confirmPassword}
            onChange={handleChange} placeholder="Confirm password" className="h-11" />
          {errors.confirmPassword && <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.confirmPassword}</p>}
        </div>
        <button type="submit" disabled={isLoading}
          className="w-full btn-primary py-3 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-1">
          {isLoading ? 'Creating account…' : 'Create Account →'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-7">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">Sign in →</Link>
      </p>
    </>
  )
}
