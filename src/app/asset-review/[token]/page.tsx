'use client'
// src/app/asset-review/[token]/page.tsx
// Public magic-link review page — no Invonaut account required

import React, { useEffect, useState, use } from 'react'
import { CheckCircle2, XCircle, Clock, AlertTriangle, Loader2, Building2, Calendar, DollarSign, Hash, Tag, FileText } from 'lucide-react'

interface Asset {
  id: string; name: string; category: string; description: string | null
  purchase_date: string; purchase_cost: number; salvage_value: number
  useful_life_years: number; serial_number: string | null; has_serial_number: boolean
  notes: string | null; workflow_status: string
}
interface TokenData {
  status: 'valid' | 'used' | 'expired' | 'invalid'
  asset?: Asset
  submitter_name?: string
  token?: { reviewer_name: string | null; reviewer_email: string }
}

const fmtC  = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
const fmtD  = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
const CAP   = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600..900&family=DM+Sans:opsz,wght@9..40,300..700&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }
  body { font-family: 'DM Sans', sans-serif; background: #F8FAFF }
  .f-display { font-family: 'Fraunces', serif; font-optical-sizing: auto }
  .f-mono    { font-family: 'DM Mono', monospace }
  .card { background:#fff; border:1px solid #E2E8F0; border-radius:20px; overflow:hidden }
  .btn-approve { display:flex; align-items:center; gap:9px; padding:14px 28px; border-radius:11px;
    background:linear-gradient(135deg,#059669,#10B981); color:#fff; font-weight:700; font-size:.9rem;
    border:none; cursor:pointer; font-family:'DM Sans',sans-serif; transition:opacity .15s }
  .btn-approve:hover:not(:disabled) { opacity:.88 }
  .btn-reject  { display:flex; align-items:center; gap:9px; padding:14px 28px; border-radius:11px;
    background:#fff; color:#DC2626; font-weight:700; font-size:.9rem;
    border:1.5px solid #FCA5A5; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .15s }
  .btn-reject:hover:not(:disabled)  { background:#FEF2F2; border-color:#DC2626 }
  .btn-approve:disabled, .btn-reject:disabled { opacity:.5; cursor:not-allowed }
  .tag { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:20px;
    font-size:.7rem; font-weight:700; letter-spacing:.04em; text-transform:uppercase }
  .tag-pending  { background:rgba(245,158,11,0.1);  color:#D97706 }
  .tag-approved { background:rgba(16,185,129,0.1);  color:#059669 }
  .tag-rejected { background:rgba(220,38,38,0.1);   color:#DC2626 }
  .field { display:flex; flex-direction:column; gap:5px }
  .field label { font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.09em; color:#94A3B8 }
  .field span  { font-size:.9rem; color:#0A0A0A; font-weight:500 }
  .note-area { width:100%; padding:12px 14px; border:1px solid #E2E8F0; border-radius:10px;
    font-family:'DM Sans',sans-serif; font-size:.85rem; color:#0A0A0A; resize:vertical; min-height:80px;
    outline:none; transition:border-color .15s }
  .note-area:focus { border-color:#0055FF }
`

export default function AssetReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)

  const [data,         setData]         = useState<TokenData | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [reviewerName, setReviewerName] = useState('')
  const [rejectionNote,setRejNote]      = useState('')
  const [showReject,   setShowReject]   = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [result,       setResult]       = useState<'approved' | 'rejected' | null>(null)
  const [error,        setError]        = useState('')

  useEffect(() => {
    fetch(`/api/assets/review?token=${token}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setData({ status: 'invalid' }); setLoading(false) })
  }, [token])

  const submit = async (action: 'approve' | 'reject') => {
    setSubmitting(true); setError('')
    try {
      const res  = await fetch('/api/assets/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action, reviewer_name: reviewerName, rejection_note: rejectionNote }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Something went wrong'); setSubmitting(false); return }
      // Use the action echoed back from the API as the source of truth
      setResult((json.action as 'approved' | 'rejected') || action)
      setSubmitting(false)
    } catch { setError('Network error. Please try again.'); setSubmitting(false) }
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Loader2 size={28} style={{ color: '#0055FF', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  const asset = data?.asset

  // ── Invalid / expired / used ────────────────────────────────────────────────
  if (!data || data.status !== 'valid' || !asset) {
    const msgs: Record<string, { icon: React.ReactElement; title: string; body: string }> = {
      used:    { icon: <CheckCircle2 size={40} color="#059669" />, title: 'Already reviewed', body: 'This review link has already been used. The asset has been processed.' },
      expired: { icon: <Clock size={40} color="#D97706" />,        title: 'Link expired',      body: 'This review link expired after 7 days. Ask the submitter to send a new request.' },
      invalid: { icon: <AlertTriangle size={40} color="#DC2626" />,title: 'Invalid link',      body: 'This review link is invalid or has been revoked. Please contact the person who sent it.' },
    }
    const m = msgs[data?.status ?? 'invalid'] || msgs['invalid']
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="card" style={{ maxWidth: 420, width: '100%', padding: '48px 40px', textAlign: 'center' }}>
          <div style={{ marginBottom: 20 }}>{m.icon}</div>
          <h2 className="f-display" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0A0A0A', marginBottom: 10 }}>{m.title}</h2>
          <p style={{ fontSize: '.88rem', color: '#64748B', lineHeight: 1.6 }}>{m.body}</p>
          <p style={{ marginTop: 24, fontSize: '.72rem', color: '#94A3B8' }}>Powered by <strong style={{ color: '#0055FF' }}>Invonaut</strong></p>
        </div>
      </div>
    )
  }

  // ── Success state ───────────────────────────────────────────────────────────
  if (result) {
    const approved = result === 'approved'
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="card" style={{ maxWidth: 460, width: '100%', padding: '52px 44px', textAlign: 'center' }}>
          {approved
            ? <CheckCircle2 size={48} color="#059669" style={{ marginBottom: 20 }} />
            : <XCircle      size={48} color="#DC2626" style={{ marginBottom: 20 }} />}
          <h2 className="f-display" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0A0A0A', marginBottom: 10, letterSpacing: '-.02em' }}>
            {approved ? 'Asset approved!' : 'Asset rejected'}
          </h2>
          <p style={{ fontSize: '.9rem', color: '#64748B', lineHeight: 1.65, marginBottom: 8 }}>
            {approved ? (
              <>You&apos;ve approved <strong style={{ color: '#0A0A0A' }}>{asset.name}</strong>. It&apos;s now active in the asset register and contributing to the depreciation schedule.</>
            ) : (
              <>You&apos;ve rejected <strong style={{ color: '#0A0A0A' }}>{asset.name}</strong>. The submitter has been notified and can make edits before resubmitting.</>
            )}
          </p>
          <div style={{ marginTop: 28, padding: '16px 20px', background: approved ? 'rgba(16,185,129,0.06)' : 'rgba(220,38,38,0.05)', borderRadius: 12, border: `1px solid ${approved ? 'rgba(16,185,129,0.15)' : 'rgba(220,38,38,0.12)'}` }}>
            <p style={{ fontSize: '.78rem', color: approved ? '#059669' : '#DC2626', fontWeight: 600 }}>
              {approved ? '✓ No further action needed' : '✗ Submitter notified to revise'}
            </p>
          </div>
          <p style={{ marginTop: 28, fontSize: '.7rem', color: '#C4CBDA' }}>Powered by <strong style={{ color: '#0055FF' }}>Invonaut</strong></p>
        </div>
      </div>
    )
  }

  // ── Main review UI ──────────────────────────────────────────────────────────
  const annualDep = (Number(asset.purchase_cost) - Number(asset.salvage_value)) / Number(asset.useful_life_years)

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 80px', fontFamily: "'DM Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#0044EE,#0066FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, overflow: 'hidden' }}>
            <img src="/naut-white.svg" alt="Invonaut" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <p style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#94A3B8' }}>Invonaut · Asset Review</p>
            <p style={{ fontSize: '.78rem', fontWeight: 600, color: '#374151' }}>{data.submitter_name}</p>
          </div>
        </div>
        <h1 className="f-display" style={{ fontSize: 'clamp(1.5rem,4vw,2rem)', fontWeight: 800, color: '#0A0A0A', letterSpacing: '-.025em', lineHeight: 1.1, marginBottom: 8 }}>
          Review Asset Registration
        </h1>
        <p style={{ fontSize: '.88rem', color: '#64748B', lineHeight: 1.6 }}>
          <strong>{data.submitter_name}</strong> has submitted the following asset and is awaiting your approval before it enters the register.
        </p>
      </div>

      {/* Asset detail card */}
      <div className="card" style={{ marginBottom: 20 }}>
        {/* Card header */}
        <div style={{ background: 'linear-gradient(135deg,#001EB0 0%,#0044EE 50%,#0066FF 100%)', padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <p style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 6 }}>Asset Name</p>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', letterSpacing: '-.02em', lineHeight: 1.2 }}>{asset.name}</h2>
            </div>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, fontSize:'.68rem', fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase', background:'rgba(255,255,255,0.18)', color:'#fff', border:'1px solid rgba(255,255,255,0.35)', backdropFilter:'blur(4px)' }}><Clock size={10}/>Pending</span>
          </div>
        </div>

        {/* Fields grid */}
        <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          <div className="field">
            <label><Tag size={9} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Category</label>
            <span style={{ textTransform: 'capitalize' }}>{asset.category}</span>
          </div>
          <div className="field">
            <label><Calendar size={9} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Purchase Date</label>
            <span>{fmtD(asset.purchase_date)}</span>
          </div>
          <div className="field">
            <label><DollarSign size={9} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Purchase Cost</label>
            <span style={{ color: '#0055FF', fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{fmtC(Number(asset.purchase_cost))}</span>
          </div>
          <div className="field">
            <label><DollarSign size={9} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Salvage Value</label>
            <span className="f-mono">{fmtC(Number(asset.salvage_value))}</span>
          </div>
          <div className="field">
            <label>Useful Life</label>
            <span>{asset.useful_life_years} years</span>
          </div>
          <div className="field">
            <label>Annual Depreciation</label>
            <span className="f-mono" style={{ color: '#FF6B35' }}>{fmtC(annualDep)}/yr</span>
          </div>
          {asset.has_serial_number && asset.serial_number && (
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label><Hash size={9} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Serial Number</label>
              <span className="f-mono" style={{ background: '#F8FAFF', padding: '6px 10px', borderRadius: 7, border: '1px solid #E2E8F0', display: 'inline-block', fontSize: '.85rem' }}>{asset.serial_number}</span>
            </div>
          )}
          {asset.description && (
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label><FileText size={9} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Description</label>
              <span style={{ color: '#64748B' }}>{asset.description}</span>
            </div>
          )}
          {asset.notes && (
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Notes</label>
              <span style={{ color: '#64748B' }}>{asset.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Reviewer name */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
        <label style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.09em', color: '#94A3B8', display: 'block', marginBottom: 8 }}>
          Your name (optional)
        </label>
        <input
          value={reviewerName}
          onChange={e => setReviewerName(e.target.value)}
          placeholder="e.g. Sarah Chen"
          style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: '.88rem', color: '#0A0A0A', outline: 'none' }}
        />
        <p style={{ fontSize: '.7rem', color: '#94A3B8', marginTop: 6 }}>This will be recorded against your decision.</p>
      </div>

      {/* Rejection note (shown when reject is expanded) */}
      {showReject && (
        <div className="card" style={{ padding: '20px 24px', marginBottom: 20, border: '1.5px solid #FCA5A5' }}>
          <label style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.09em', color: '#DC2626', display: 'block', marginBottom: 8 }}>
            Reason for rejection (optional but helpful)
          </label>
          <textarea
            className="note-area"
            value={rejectionNote}
            onChange={e => setRejNote(e.target.value)}
            placeholder="e.g. Serial number is incorrect, cost doesn't match invoice, wrong category…"
          />
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, marginBottom: 16 }}>
          <p style={{ fontSize: '.83rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: 7 }}><AlertTriangle size={13} />{error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn-approve" onClick={() => submit('approve')} disabled={submitting}>
          {submitting && !showReject ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={15} />}
          Approve asset
        </button>

        {!showReject
          ? <button className="btn-reject" onClick={() => setShowReject(true)} disabled={submitting}><XCircle size={15} />Reject</button>
          : <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-reject" onClick={() => submit('reject')} disabled={submitting} style={{ background: '#FEF2F2' }}>
                {submitting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <XCircle size={15} />}
                Confirm rejection
              </button>
              <button onClick={() => { setShowReject(false); setRejNote('') }} disabled={submitting}
                style={{ padding: '14px 18px', borderRadius: 11, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: '.82rem', fontWeight: 600, color: '#64748B', fontFamily: "'DM Sans', sans-serif" }}>
                Cancel
              </button>
            </div>
        }
      </div>

      <p style={{ marginTop: 28, fontSize: '.7rem', color: '#C4CBDA', textAlign: 'center' }}>
        Powered by <strong style={{ color: '#0055FF' }}>Invonaut</strong> · No account required
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
