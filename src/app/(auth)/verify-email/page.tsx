'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Mail, CheckCircle, Loader2 } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string>('')
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    const checkEmailConfirmation = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!isMounted) return
      
      if (user?.email) {
        setEmail(user.email)
        
        // If already confirmed, redirect to dashboard immediately
        if (user.email_confirmed_at) {
          console.log('✅ Email already confirmed, redirecting to dashboard...')
          router.push('/dashboard')
          router.refresh()
          return
        }
      }
      
      setIsChecking(false)
    }
    
    // Initial check
    checkEmailConfirmation()

    // Auto-check every 2 seconds if email was confirmed
    const interval = setInterval(async () => {
      if (!isMounted) return
      
      const supabase = createClient()
      
      // Refresh session to get latest data
      await supabase.auth.refreshSession()
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.email_confirmed_at) {
        console.log('✅ Email confirmed! Redirecting to dashboard...')
        clearInterval(interval)
        router.push('/dashboard')
        router.refresh()
      }
    }, 2000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [router])

  const resendEmail = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    })

    if (!error) {
      alert('✅ Confirmation email sent! Check your inbox.')
    } else {
      alert('❌ Failed to resend email. Please try again later.')
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 px-4 py-12 flex items-center justify-center">
      <Card className="max-w-md w-full p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-blue-100 p-4">
            {isChecking ? (
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            ) : (
              <Mail className="w-12 h-12 text-blue-600" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isChecking ? 'Checking email status...' : 'Check your email'}
          </h1>
          {!isChecking && (
            <>
              <p className="text-sm text-gray-600 leading-relaxed">
                We've sent a confirmation link to:
              </p>
              {email && (
                <p className="text-base font-semibold text-blue-600 break-words">
                  {email}
                </p>
              )}
            </>
          )}
        </div>

        {/* Instructions */}
        {!isChecking && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700 space-y-2">
                <p className="font-medium">To complete signup:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Open the email from Flowance</li>
                  <li>Click "Confirm Your Email"</li>
                  <li>You'll be automatically redirected to your dashboard</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Auto-checking indicator */}
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-green-600 animate-spin flex-shrink-0" />
            <div className="text-sm text-green-700">
              <p className="font-medium">Waiting for confirmation...</p>
              <p className="text-xs mt-1">This page will automatically redirect once you confirm your email.</p>
            </div>
          </div>
        </div>

        {/* Resend button */}
        {!isChecking && (
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">
              Didn't receive the email?
            </p>
            <button 
              onClick={resendEmail}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Resend confirmation email
            </button>
          </div>
        )}

        {/* Help text */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            Check your spam folder if you don't see the email.
          </p>
        </div>
      </Card>
    </div>
  )
}