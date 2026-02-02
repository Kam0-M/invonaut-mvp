'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PasswordInput } from '@/components/ui/password-input'
import { toast } from 'sonner'
import { CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetComplete, setResetComplete] = useState(false)

  const validatePassword = () => {
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return false
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return false
    }
    return true
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validatePassword()) {
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        toast.error(error.message)
        return
      }

      setResetComplete(true)
      toast.success('Password updated successfully!')
      
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error: any) {
      toast.error('Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (resetComplete) {
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
              <h1 className="text-3xl font-black text-gray-900 mb-3">Password Reset Complete!</h1>
              <p className="text-base text-gray-600 font-medium mb-2">
                Your password has been successfully updated.
              </p>
              <p className="text-base text-gray-500 font-medium">
                Redirecting you to login...
              </p>
            </div>
          </div>
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
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Set New Password</h1>
            <p className="text-base text-gray-600 font-medium">
              Choose a strong password for your account
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                New Password
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                disabled={loading}
                className="h-12 text-base"
              />
              <p className="text-sm text-gray-500 mt-2 font-medium">
                Must be at least 8 characters long
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Confirm New Password
              </label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                disabled={loading}
                className="h-12 text-base"
              />
            </div>

            {/* Password strength indicator */}
            {password.length > 0 && (
              <div className="space-y-3 bg-gray-50 rounded-xl p-4 border-2 border-gray-100">
                <div className="flex items-center gap-3">
                  {password.length >= 8 ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                  <span className={`text-sm font-semibold ${password.length >= 8 ? 'text-green-700' : 'text-gray-500'}`}>
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {password === confirmPassword && password.length > 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                  <span className={`text-sm font-semibold ${password === confirmPassword && password.length > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                    Passwords match
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || password.length < 8 || password !== confirmPassword}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-6 font-medium">
            Remember your password?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-bold">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}