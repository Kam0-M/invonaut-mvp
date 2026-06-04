'use client'
// src/components/auth/oauth-buttons.tsx
// Google OAuth sign-in button (Microsoft removed — not enabled)

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface Props {
  redirectTo?: string
}

export default function OAuthButtons({ redirectTo = '/dashboard' }: Props) {
  const [loading, setLoading] = useState(false)

  const handleGoogle = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })
    // Page redirects — no cleanup needed
  }

  return (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={loading}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 10, padding: '11px 16px', borderRadius: 10,
        border: '1px solid #E2E8F0', background: '#fff',
        fontFamily: "'DM Sans', sans-serif", fontSize: '.875rem', fontWeight: 600,
        color: '#0A0A0A', cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background .15s, border-color .15s',
        opacity: loading ? 0.7 : 1,
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#F8FAFF' }}
      onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
    >
      {loading ? (
        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )}
      Continue with Google
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </button>
  )
}
