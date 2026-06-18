'use client'
// src/app/admin/payouts/page.tsx
// Protected admin page — only accessible to kamohelo.thakhisi@gmail.com
// Shows all pending affiliate payout requests. Mark paid → sends email to affiliate.

import { useEffect, useState } from 'react'
import { CheckCircle, Clock, DollarSign, Loader2, AlertCircle, ExternalLink } from 'lucide-react'

type Payout = {
  id:              string
  amount:          number
  commission_count: number
  status:          string
  payout_method:   string | null
  payout_email:    string
  payout_reference: string | null
  requested_at:    string
  paid_at:         string | null
  affiliate_email: string
  affiliate_name:  string
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
}

function PayoutRow({ payout, onPaid }: { payout: Payout; onPaid: (id: string) => void }) {
  const [loading,   setLoading]   = useState(false)
  const [reference, setReference] = useState('')
  const [error,     setError]     = useState('')

  async function markPaid() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/payouts/${payout.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: reference || 'manual' }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed'); return }
      onPaid(payout.id)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const methodLabel: Record<string, string> = {
    paypal: 'PayPal', wise: 'Wise', bank: 'Bank Transfer', other: 'Other',
  }

  return (
    <div style={{background:'#fff',borderRadius:14,border:'1px solid #E2E8F0',padding:'20px 24px',marginBottom:12}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
        {/* Left — affiliate info */}
        <div style={{flex:1,minWidth:200}}>
          <p style={{margin:0,fontWeight:800,fontSize:'.95rem',color:'#0A0A0A'}}>{payout.affiliate_name}</p>
          <p style={{margin:'2px 0 0',fontSize:'.82rem',color:'#64748B'}}>{payout.affiliate_email}</p>
          <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap'}}>
            <span style={{background:'rgba(0,85,255,0.07)',color:'#0055FF',fontSize:'.72rem',fontWeight:700,padding:'3px 8px',borderRadius:6,letterSpacing:'.02em'}}>
              {methodLabel[payout.payout_method || ''] || payout.payout_method || '—'}
            </span>
            <span style={{background:'#F8FAFF',color:'#64748B',fontSize:'.72rem',fontWeight:600,padding:'3px 8px',borderRadius:6}}>
              To: {payout.payout_email}
            </span>
            <span style={{background:'#F1F5F9',color:'#64748B',fontSize:'.72rem',fontWeight:600,padding:'3px 8px',borderRadius:6}}>
              {payout.commission_count} commission{payout.commission_count !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Centre — amount + date */}
        <div style={{textAlign:'center',minWidth:100}}>
          <p style={{margin:0,fontSize:'1.4rem',fontWeight:800,color:'#0A0A0A',fontFamily:"'DM Mono',monospace"}}>
            ${Number(payout.amount).toFixed(2)}
          </p>
          <p style={{margin:'2px 0 0',fontSize:'.75rem',color:'#94A3B8'}}>
            Requested {fmtDate(payout.requested_at)}
          </p>
        </div>

        {/* Right — mark paid */}
        <div style={{display:'flex',flexDirection:'column',gap:6,minWidth:200,alignItems:'flex-end'}}>
          <input
            value={reference}
            onChange={e => setReference(e.target.value)}
            placeholder="Reference / transaction ID (optional)"
            style={{
              width:'100%',fontSize:'.8rem',padding:'7px 10px',borderRadius:8,
              border:'1px solid #E2E8F0',outline:'none',background:'#F8FAFF',
              color:'#374151',fontFamily:'inherit',boxSizing:'border-box',
            }}
          />
          <button
            onClick={markPaid}
            disabled={loading}
            style={{
              display:'inline-flex',alignItems:'center',gap:6,
              background:'linear-gradient(135deg,#0055FF,#0040DD)',
              color:'#fff',border:'none',borderRadius:9,padding:'9px 18px',
              fontWeight:700,fontSize:'.82rem',cursor:loading?'not-allowed':'pointer',
              opacity:loading?0.7:1,fontFamily:'inherit',
            }}
          >
            {loading ? <Loader2 size={13} className="animate-spin"/> : <CheckCircle size={13}/>}
            {loading ? 'Marking…' : 'Mark Paid — Send Email'}
          </button>
          {error && <p style={{margin:0,fontSize:'.78rem',color:'#DC2626'}}>{error}</p>}
        </div>
      </div>
    </div>
  )
}

export default function AdminPayoutsPage() {
  const [pending, setPending]   = useState<Payout[]>([])
  const [history, setHistory]   = useState<Payout[]>([])
  const [loading, setLoading]   = useState(true)
  const [error,   setError]     = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/payouts')
      if (res.status === 403) { setError('Forbidden — admin only'); setLoading(false); return }
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to load'); return }
      setPending(json.pending || [])
      setHistory(json.history || [])
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function handlePaid(id: string) {
    const p = pending.find(x => x.id === id)
    if (p) {
      setPending(prev => prev.filter(x => x.id !== id))
      setHistory(prev => [{ ...p, status: 'paid', paid_at: new Date().toISOString() }, ...prev])
    }
  }

  const totalPending = pending.reduce((s, p) => s + Number(p.amount), 0)

  return (
    <div style={{minHeight:'100vh',background:'#F8FAFF',fontFamily:"'Inter',sans-serif",padding:'40px 24px'}}>
      <div style={{maxWidth:860,margin:'0 auto'}}>

        {/* Header */}
        <div style={{marginBottom:32}}>
          <p style={{margin:'0 0 6px',fontSize:'.72rem',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'#0055FF',WebkitFontSmoothing:'antialiased'}}>
            Admin
          </p>
          <h1 style={{margin:0,fontSize:'1.75rem',fontWeight:800,color:'#0A0A0A',letterSpacing:'-.02em'}}>
            Affiliate Payouts
          </h1>
          <p style={{margin:'6px 0 0',color:'#64748B',fontSize:'.9rem'}}>
            Review and mark payout requests as paid. An email is sent automatically to each affiliate when you confirm.
          </p>
        </div>

        {loading && (
          <div style={{textAlign:'center',paddingTop:60}}>
            <Loader2 size={24} style={{color:'#0055FF',animation:'spin 1s linear infinite'}}/>
          </div>
        )}

        {error && (
          <div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:12,padding:'16px 20px',display:'flex',gap:10,alignItems:'center'}}>
            <AlertCircle size={16} style={{color:'#DC2626',flexShrink:0}}/>
            <p style={{margin:0,color:'#DC2626',fontSize:'.9rem'}}>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Pending payouts */}
            <div style={{marginBottom:40}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <Clock size={16} style={{color:'#FF6B35'}}/>
                  <h2 style={{margin:0,fontSize:'1rem',fontWeight:800,color:'#0A0A0A'}}>
                    Pending Payouts
                  </h2>
                  {pending.length > 0 && (
                    <span style={{background:'#FF6B35',color:'#fff',fontSize:'.7rem',fontWeight:700,padding:'2px 7px',borderRadius:99}}>
                      {pending.length}
                    </span>
                  )}
                </div>
                {pending.length > 0 && (
                  <span style={{fontSize:'.9rem',fontWeight:700,color:'#0A0A0A',fontFamily:"'DM Mono',monospace"}}>
                    Total owed: ${totalPending.toFixed(2)}
                  </span>
                )}
              </div>

              {pending.length === 0 ? (
                <div style={{background:'#fff',borderRadius:14,border:'1px solid #E2E8F0',padding:'40px 24px',textAlign:'center'}}>
                  <CheckCircle size={28} style={{color:'#00C4A0',margin:'0 auto 10px'}}/>
                  <p style={{margin:0,color:'#64748B',fontWeight:600}}>All caught up — no pending payouts</p>
                </div>
              ) : (
                pending.map(p => <PayoutRow key={p.id} payout={p} onPaid={handlePaid}/>)
              )}
            </div>

            {/* Payout history */}
            {history.length > 0 && (
              <div>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                  <DollarSign size={16} style={{color:'#00C4A0'}}/>
                  <h2 style={{margin:0,fontSize:'1rem',fontWeight:800,color:'#0A0A0A'}}>
                    Payout History
                  </h2>
                </div>
                <div style={{background:'#fff',borderRadius:14,border:'1px solid #E2E8F0',overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:'.82rem',minWidth:560}}>
                    <thead>
                      <tr style={{background:'#F8FAFF',borderBottom:'1px solid #E2E8F0'}}>
                        {['Affiliate','Method','Amount','Paid at','Ref'].map(h => (
                          <th key={h} style={{padding:'10px 16px',textAlign:'left',fontWeight:700,color:'#64748B',fontSize:'.72rem',textTransform:'uppercase',letterSpacing:'.06em'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((p,i) => (
                        <tr key={p.id} style={{borderBottom: i < history.length-1 ? '1px solid #F1F5F9' : 'none'}}>
                          <td style={{padding:'10px 16px',color:'#374151',fontWeight:600}}>{p.affiliate_name}<br/><span style={{color:'#94A3B8',fontWeight:400,fontSize:'.75rem'}}>{p.affiliate_email}</span></td>
                          <td style={{padding:'10px 16px',color:'#64748B',textTransform:'capitalize'}}>{p.payout_method || '—'}</td>
                          <td style={{padding:'10px 16px',fontFamily:"'DM Mono',monospace",fontWeight:700,color:'#0A0A0A'}}>${Number(p.amount).toFixed(2)}</td>
                          <td style={{padding:'10px 16px',color:'#64748B'}}>{p.paid_at ? fmtDate(p.paid_at) : '—'}</td>
                          <td style={{padding:'10px 16px',color:'#94A3B8',fontSize:'.78rem'}}>{p.payout_reference || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        <div style={{marginTop:40,textAlign:'center'}}>
          <a href="/dashboard" style={{color:'#0055FF',fontSize:'.82rem',fontWeight:600,textDecoration:'none'}}>
            ← Back to dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
