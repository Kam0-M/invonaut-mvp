'use client'
// src/components/portal/pay-now-button.tsx
// Client component — handles fetch + redirect to Stripe Checkout.

import { useState } from 'react'
import { CreditCard, Loader2, AlertCircle } from 'lucide-react'

type Props = {
  invoiceId:    string
  token:        string
  slug:         string
  amount:       number
  brandColor:   string
  formatAmount: string   // pre-formatted string e.g. "$1,250.00"
}

export default function PayNowButton({ invoiceId, token, slug, brandColor, formatAmount }: Props) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handlePay() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/portal/create-invoice-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ invoiceId, token, slug }),
      })
      const json = await res.json()
      if (!res.ok || !json.url) {
        setError(json.error || 'Unable to start checkout. Please try again.')
        return
      }
      window.location.href = json.url
    } catch {
      setError('Network error — please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={loading}
        style={{
          display:        'inline-flex',
          alignItems:     'center',
          gap:            8,
          background:     loading ? '#94A3B8' : `linear-gradient(135deg, ${brandColor || '#0055FF'}, ${brandColor ? brandColor + 'CC' : '#0040DD'})`,
          color:          '#fff',
          border:         'none',
          borderRadius:   12,
          padding:        '14px 28px',
          fontWeight:     800,
          fontSize:       '.95rem',
          cursor:         loading ? 'not-allowed' : 'pointer',
          boxShadow:      loading ? 'none' : '0 4px 14px rgba(0,0,0,0.18)',
          transition:     'all 0.15s ease',
          fontFamily:     "'Inter', sans-serif",
          letterSpacing:  '-.01em',
          width:          '100%',
          justifyContent: 'center',
        }}
      >
        {loading
          ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          : <CreditCard size={16} />}
        {loading ? 'Opening Stripe…' : `Pay Now — ${formatAmount}`}
      </button>

      <p style={{
        margin:     '8px 0 0',
        fontSize:   '.72rem',
        color:      '#94A3B8',
        textAlign:  'center',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap:        4,
      }}>
        <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
          <rect x="1" y="5" width="8" height="7" rx="1.5" stroke="#94A3B8" strokeWidth="1.2"/>
          <path d="M3 5V3.5a2 2 0 0 1 4 0V5" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        Secured by Stripe · Card payments accepted
      </p>

      {error && (
        <div style={{
          marginTop:    10,
          background:   '#FEF2F2',
          border:       '1px solid #FECACA',
          borderRadius: 8,
          padding:      '10px 14px',
          display:      'flex',
          gap:          8,
          alignItems:   'flex-start',
        }}>
          <AlertCircle size={14} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: '.82rem', color: '#DC2626' }}>{error}</p>
        </div>
      )}
    </div>
  )
}
