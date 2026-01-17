'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, CheckCircle, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string>('')
  const [isChecking, setIsChecking] = useState(true)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [manualRedirect, setManualRedirect] = useState(false)

  const addDebug = (message: string) => {
    console.log(message)
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    let isMounted = true
    
    const checkEmailConfirmation = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!isMounted) return
      
      addDebug(`User ID: ${user?.id}`)
      addDebug(`Email: ${user?.email}`)
      addDebug(`Email Confirmed At: ${user?.email_confirmed_at}`)
      
      if (user?.email) {
        setEmail(user.email)
      }
      
      // ALWAYS finish checking and show the page
      // Don't auto-redirect even if confirmed
      setIsChecking(false)
    }
    
    checkEmailConfirmation()

    // Poll for confirmation every 3 seconds
    const interval = setInterval(async () => {
      if (!isMounted) return
      
      const supabase = createClient()
      
      addDebug('Polling for email confirmation...')
      await supabase.auth.refreshSession()
      
      const { data: { user } } = await supabase.auth.getUser()
      
      addDebug(`Poll - Email Confirmed: ${!!user?.email_confirmed_at}`)
      
      if (user?.email_confirmed_at && !manualRedirect) {
        addDebug('✅ Email confirmed detected!')
        setManualRedirect(true)
        clearInterval(interval)
      }
    }, 3000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [manualRedirect])

  const handleManualRedirect = async () => {
    addDebug('Manual redirect triggered')
    
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      addDebug('❌ No user found')
      return
    }
    
    addDebug(`Checking for profile: ${user.id}`)
    
    // Wait for profile creation
    let attempts = 0
    while (attempts < 30) {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .eq('id', user.id)
        .single()
      
      addDebug(`Profile attempt ${attempts + 1}: ${profile ? 'Found' : 'Not found'}`)
      
      if (profile) {
        addDebug(`✅ Profile found: ${JSON.stringify(profile)}`)
        addDebug('Redirecting to dashboard...')
        
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 1000)
        return
      }
      
      if (error) {
        addDebug(`Profile error: ${error.message}`)
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
      attempts++
    }
    
    addDebug('⚠️ Profile not found after 30 attempts, redirecting anyway')
    router.push('/dashboard')
    router.refresh()
  }

  const resendEmail = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    })

    if (!error) {
      addDebug('✅ Resend successful')
      alert('✅ Confirmation email sent! Check your inbox.')
    } else {
      addDebug(`❌ Resend failed: ${error.message}`)
      alert('❌ Failed to resend email. Please try again later.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'1\' height=\'1\' fill=\'rgba(0,0,0,0.5)\'/%3E%3C/svg%3E")', backgroundSize: '60px 60px'}}></div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <span className="text-3xl font-black text-gray-900 tracking-tight">Flowance</span>
          </Link>
        </div>

        {/* Verify Card */}
        <div className="bg-white rounded-2xl p-10 shadow-2xl border-2 border-gray-100">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="rounded-full bg-blue-100 p-6">
              {isChecking ? (
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
              ) : manualRedirect ? (
                <Loader2 className="w-16 h-16 text-green-600 animate-spin" />
              ) : (
                <Mail className="w-16 h-16 text-blue-600" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              {isChecking ? 'Checking email status...' : 
               manualRedirect ? 'Email Confirmed!' :
               'Check Your Email'}
            </h1>
            {!isChecking && !manualRedirect && (
              <>
                <p className="text-base text-gray-600 font-medium">
                  We've sent a confirmation link to:
                </p>
                {email && (
                  <p className="text-lg font-black text-blue-600 break-words">
                    {email}
                  </p>
                )}
              </>
            )}
            {manualRedirect && (
              <p className="text-base text-gray-600 font-medium">
                Setting up your account...
              </p>
            )}
          </div>

          {/* Instructions */}
          {!isChecking && !manualRedirect && (
            <>
              <div className="rounded-xl bg-blue-50 border-2 border-blue-200 p-6 mb-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="text-sm text-gray-700 space-y-3">
                    <p className="font-bold text-gray-900">To complete signup:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-2 font-medium">
                      <li>Check your email inbox for a message from Flowance</li>
                      <li>Click the "Confirm Your Email" button in the email</li>
                      <li>Return to this page</li>
                      <li>Click "Continue to Dashboard" below once confirmed</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Manual continue button */}
              <button
                onClick={handleManualRedirect}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105 mb-6"
              >
                I've Confirmed - Continue to Dashboard
              </button>

              {/* Auto-checking indicator */}
              <div className="rounded-xl bg-green-50 border-2 border-green-200 p-6 mb-6">
                <div className="flex items-start gap-4">
                  <Loader2 className="w-6 h-6 text-green-600 animate-spin flex-shrink-0 mt-1" />
                  <div className="text-sm text-green-700">
                    <p className="font-bold text-green-900 mb-2">Auto-checking for confirmation...</p>
                    <p className="font-medium">Or click the button above once you've confirmed your email.</p>
                  </div>
                </div>
              </div>

              {/* Resend button */}
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-3 font-medium">
                  Didn't receive the email?
                </p>
                <button 
                  onClick={resendEmail}
                  className="text-base text-blue-600 hover:text-blue-700 font-bold transition-colors"
                >
                  Resend confirmation email
                </button>
              </div>

              {/* Help text */}
              <div className="mt-8 pt-8 border-t-2 border-gray-100">
                <p className="text-sm text-center text-gray-500 font-medium">
                  Check your spam folder if you don't see the email.
                </p>
              </div>
            </>
          )}

          {/* Debug Info */}
          {debugInfo.length > 0 && (
            <details className="mt-6 pt-6 border-t-2 border-gray-100">
              <summary className="text-sm font-bold text-gray-700 cursor-pointer mb-3">
                🐛 Debug Info (Click to expand)
              </summary>
              <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="text-xs font-mono space-y-1">
                  {debugInfo.map((info, i) => (
                    <div key={i} className="text-gray-700">{info}</div>
                  ))}
                </div>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}