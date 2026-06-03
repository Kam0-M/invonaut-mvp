'use client'

import { useCurrency } from '@/lib/context/currency-context'
// src/app/dashboard/affiliate/page.tsx
// Design: matches the editorial quality of the landing page and /affiliate public page.
// Fraunces headlines, blue gradient accents, clean layout — not the generic dashboard style.

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Copy, Check, DollarSign, Users, TrendingUp,
  Clock, Zap, ExternalLink, CreditCard, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2, Loader2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface AffiliateStats {
  affiliated: boolean
  account?: {
    referral_code: string
    referral_link: string
    status: string
    payout_method: string | null
    payout_email: string | null
    total_earned: number
    total_paid: number
  }
  stats?: {
    total_referrals: number
    active_referrals: number
    pending_earnings: number
    eligible_amount: number
    total_earned: number
  }
  referrals?: Array<{
    id: string
    status: string
    signup_date: string | null
    current_plan: string | null
  }>
  commissions?: Array<{
    id: string
    amount: number
    status: string
    period_start: string | null
    period_end: string | null
    created_at: string
  }>
  payouts?: Array<{
    id: string
    amount: number
    commission_count: number
    status: string
    payout_method: string | null
    requested_at: string
    paid_at: string | null
  }>
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..800&family=DM+Sans:opsz,wght@9..40,300..700&family=DM+Mono:ital,wght@0,400;0,500&display=swap');
  .f-display { font-family:'Fraunces',serif; font-optical-sizing:auto; }
  .f-mono    { font-family:'DM Mono',monospace; }
  .aff-join-card {
    background: linear-gradient(145deg,#002ECC 0%,#0044EE 40%,#0055FF 70%,#003DCC 100%);
    border-radius: 20px;
    padding: 56px 48px;
    position: relative;
    overflow: hidden;
  }
  .aff-join-card::before {
    content:'';
    position:absolute;
    inset:0;
    background: radial-gradient(ellipse 60% 60% at 110% -10%, rgba(0,196,160,0.18) 0%, transparent 55%),
                radial-gradient(ellipse 40% 50% at -5% 110%, rgba(255,255,255,0.06) 0%, transparent 55%);
    pointer-events:none;
  }
  .aff-stat-card {
    background:#fff;
    border:1px solid #E2E8F0;
    border-radius:16px;
    padding:24px;
    transition: box-shadow .15s, transform .15s;
  }
  .aff-stat-card:hover { box-shadow:0 4px 20px rgba(0,85,255,0.08); transform:translateY(-1px); }
  .aff-link-box {
    display:flex; align-items:center; gap:10;
    background:#F8FAFF; border:1px solid rgba(0,85,255,0.15); border-radius:12px;
    padding:14px 16px;
    font-family:'DM Mono',monospace; font-size:.82rem; color:#0A0A0A;
    overflow:hidden;
  }
  .copy-btn {
    flex-shrink:0; padding:8px 16px; border-radius:8px;
    background:linear-gradient(135deg,#0044EE,#0066FF);
    color:#fff; font-size:.78rem; font-weight:700;
    border:none; cursor:pointer; display:flex; align-items:center; gap:6px;
    transition: opacity .15s;
    font-family:'DM Sans',sans-serif;
  }
  .copy-btn:hover { opacity:.9; }
  .aff-table th {
    font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em;
    color:#94A3B8; padding:0 0 12px; text-align:left; border-bottom:1px solid #E2E8F0;
  }
  .aff-table td {
    font-size:.83rem; color:#374151; padding:14px 0; border-bottom:1px solid #F1F5F9;
    vertical-align:middle;
  }
  .aff-table tr:last-child td { border-bottom:none; }
  .status-pill {
    display:inline-flex; align-items:center; gap:5px;
    padding:3px 10px; border-radius:100px; font-size:.67rem; font-weight:700;
  }
  .payout-input {
    width:100%; padding:10px 14px; border:1px solid #E2E8F0; border-radius:10px;
    font-family:'DM Sans',sans-serif; font-size:.875rem; color:#0A0A0A;
    background:#fff; outline:none; transition:border-color .15s;
  }
  .payout-input:focus { border-color:#0055FF; }
  .payout-select {
    padding:10px 14px; border:1px solid #E2E8F0; border-radius:10px;
    font-family:'DM Sans',sans-serif; font-size:.875rem; color:#0A0A0A;
    background:#fff; outline:none; transition:border-color .15s; cursor:pointer;
  }
  .payout-select:focus { border-color:#0055FF; }
`

function fmt(n: number) {
  return fmt(n)
}
function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
}

function StatusPill({ status }: { status: string }) {
  const MAP: Record<string,{bg:string,color:string,label:string}> = {
    active:     {bg:'#F0FDF4', color:'#16A34A', label:'Active'},
    pending:    {bg:'#EFF6FF', color:'#2563EB', label:'Pending'},
    churned:    {bg:'#F9FAFB', color:'#6B7280', label:'Churned'},
    approved:   {bg:'#F0FDF4', color:'#16A34A', label:'Approved'},
    paid:       {bg:'#F0FDF4', color:'#16A34A', label:'Paid'},
    processing: {bg:'#FFFBEB', color:'#D97706', label:'Processing'},
    failed:     {bg:'#FEF2F2', color:'#DC2626', label:'Failed'},
    refunded:   {bg:'#F9FAFB', color:'#6B7280', label:'Refunded'},
  }
  const s = MAP[status] || {bg:'#F9FAFB', color:'#6B7280', label:status}
  return (
    <span className="status-pill" style={{background:s.bg, color:s.color}}>
      <span style={{width:5,height:5,borderRadius:'50%',background:s.color,display:'inline-block'}}/>
      {s.label}
    </span>
  )
}

// ─── Join Screen ──────────────────────────────────────────────────────────────
function JoinScreen({ onJoined }: { onJoined: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const join = async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/affiliate/join', { method:'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to join'); setLoading(false); return }
      onJoined()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const EARNINGS = [
    { refs: 5,  monthly: '$49',   annual: '$588'   },
    { refs: 20, monthly: '$196',  annual: '$2,352' },
    { refs: 50, monthly: '$490',  annual: '$5,880' },
  ]

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif", color:'#0A0A0A'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>

      {/* Header breadcrumb */}
      <div style={{marginBottom:32}}>
        <Link href="/dashboard" style={{fontSize:'.75rem',fontWeight:700,color:'#94A3B8',textDecoration:'none',letterSpacing:'.02em'}}>
          ← Dashboard
        </Link>
      </div>

      {/* Join card — editorial blue gradient like landing page CTA */}
      <div className="aff-join-card" style={{marginBottom:40}}>
        <div style={{position:'relative',zIndex:1,maxWidth:640}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,border:'1px solid rgba(255,255,255,0.2)',borderRadius:100,padding:'5px 14px',marginBottom:28,fontSize:'.72rem',fontWeight:700,color:'rgba(255,255,255,0.7)',background:'rgba(255,255,255,0.08)'}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'#00C4A0',display:'inline-block',flexShrink:0}}/>
            Affiliate Programme — Open to all users
          </div>
          <h1 className="f-display" style={{fontSize:'clamp(2rem,4vw,3.2rem)',fontWeight:800,letterSpacing:'-.025em',lineHeight:1.05,color:'#fff',marginBottom:16}}>
            Earn 30% recurring<br/>for every referral.
          </h1>
          <p style={{fontSize:'1rem',color:'rgba(255,255,255,0.6)',lineHeight:1.8,marginBottom:36,maxWidth:480}}>
            Share your unique referral link. Earn 30% of every payment your referrals make — every month, for as long as they stay subscribed. No cap, no expiry, no approval needed.
          </p>
          <div style={{display:'flex',gap:14,alignItems:'center',flexWrap:'wrap'}}>
            <button
              onClick={join}
              disabled={loading}
              style={{background:'#fff',color:'#0044EE',padding:'13px 32px',borderRadius:10,fontWeight:800,fontSize:'.95rem',border:'none',cursor:loading?'not-allowed':'pointer',display:'inline-flex',alignItems:'center',gap:9,boxShadow:'0 4px 20px rgba(0,0,0,0.2)',opacity:loading?0.7:1,fontFamily:"'DM Sans',sans-serif"}}>
              {loading ? <Loader2 size={16} className="animate-spin"/> : <Zap size={16}/>}
              {loading ? 'Setting up…' : 'Join free — get my link'}
            </button>
            <Link href="/affiliate" target="_blank" style={{color:'rgba(255,255,255,0.5)',fontSize:'.85rem',fontWeight:600,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:5}}>
              Learn more <ExternalLink size={12}/>
            </Link>
          </div>
          {error && (
            <p style={{marginTop:16,fontSize:'.82rem',color:'rgba(255,100,100,0.9)',display:'flex',alignItems:'center',gap:6}}>
              <AlertCircle size={14}/>{error}
            </p>
          )}
        </div>
      </div>

      {/* Earnings table preview */}
      <div style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:16,overflow:'hidden',marginBottom:32}}>
        <div style={{padding:'24px 28px 16px',borderBottom:'1px solid #E2E8F0'}}>
          <p style={{fontSize:'.68rem',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'#94A3B8',marginBottom:8}}>Earnings preview</p>
          <p className="f-display" style={{fontSize:'1.3rem',fontWeight:800,color:'#0A0A0A',letterSpacing:'-.02em'}}>What 30% looks like.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',borderBottom:'1px solid #E2E8F0'}}>
          {['Referrals','Monthly','Annual'].map(h => (
            <div key={h} style={{padding:'12px 20px',background:'#0A0A0A'}}>
              <p style={{fontSize:'.68rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'rgba(255,255,255,0.4)'}}>{h}</p>
            </div>
          ))}
        </div>
        {EARNINGS.map((row,i) => (
          <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',background:i%2===0?'#fff':'#F8FAFF'}}>
            <div style={{padding:'16px 20px'}}><p style={{fontSize:'.875rem',fontWeight:600,color:'#0A0A0A'}}>{row.refs} people</p></div>
            <div style={{padding:'16px 20px'}}><p style={{fontSize:'1rem',fontWeight:800,color:'#0055FF'}}>{row.monthly}/mo</p></div>
            <div style={{padding:'16px 20px'}}><p style={{fontSize:'1rem',fontWeight:800,color:'#16A34A'}}>{row.annual}/yr</p></div>
          </div>
        ))}
        <div style={{padding:'16px 20px',background:'#F8FAFF',borderTop:'1px solid #E2E8F0'}}>
          <p style={{fontSize:'.78rem',color:'#94A3B8'}}>Based on Professional plan at $49/mo. Business plan referrals earn $29.70/mo each.</p>
        </div>
      </div>

      {/* 3-step how it works */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'#E2E8F0',borderRadius:16,overflow:'hidden'}}>
        {[
          {n:'01',title:'Join free',       body:'One click. No approval process. Your referral link is ready immediately.'},
          {n:'02',title:'Share your link', body:'Post it anywhere — social, email, your website, client conversations.'},
          {n:'03',title:'Earn every month',body:'30% recurring commission for as long as your referrals stay subscribed.'},
        ].map((s,i) => (
          <div key={i} style={{padding:'32px 28px',background:'#fff',borderRight:i<2?'1px solid #E2E8F0':'none'}}>
            <div className="f-display" style={{fontSize:'2rem',fontWeight:800,marginBottom:16,lineHeight:1,
              background:'linear-gradient(135deg,#0055FF,#4D8EFF)',
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',opacity:.3}}>
              {s.n}
            </div>
            <p style={{fontWeight:700,fontSize:'.875rem',color:'#0A0A0A',marginBottom:8,letterSpacing:'-.01em'}}>{s.title}</p>
            <p style={{fontSize:'.825rem',color:'#64748B',lineHeight:1.75}}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Dashboard Screen ─────────────────────────────────────────────────────────
function DashboardScreen({ data, onRefresh }: { data: AffiliateStats; onRefresh: () => void }) {
  const [copied,        setCopied]        = useState(false)
  const [showPayout,    setShowPayout]    = useState(false)
  const [payoutMethod,  setPayoutMethod]  = useState(data.account?.payout_method || '')
  const [payoutEmail,   setPayoutEmail]   = useState(data.account?.payout_email  || '')
  const [savingPayout,  setSavingPayout]  = useState(false)
  const [requestingPO,  setRequestingPO]  = useState(false)
  const [poMsg,         setPoMsg]         = useState('')
  const [showHistory,   setShowHistory]   = useState(false)

  const a      = data.account!
  const s      = data.stats!
  const refLink = a.referral_link

  const copy = () => {
    navigator.clipboard.writeText(refLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const savePayout = async () => {
    setSavingPayout(true)
    await fetch('/api/affiliate/request-payout', {
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ payout_method: payoutMethod, payout_email: payoutEmail }),
    })
    setSavingPayout(false)
    onRefresh()
  }

  const requestPayout = async () => {
    setRequestingPO(true); setPoMsg('')
    const res  = await fetch('/api/affiliate/request-payout', { method:'POST' })
    const json = await res.json()
    if (res.ok) {
      setPoMsg(`✓ Payout of ${fmt(json.amount)} requested successfully.`)
      onRefresh()
    } else {
      setPoMsg(json.error || 'Something went wrong.')
    }
    setRequestingPO(false)
  }

  const STAT_CARDS = [
    { label:'Total earned',      value:fmt(s.total_earned),     sub:'all time',                  color:'#0055FF', bg:'#EFF6FF' },
    { label:'Active referrals',  value:s.active_referrals,      sub:`of ${s.total_referrals} total`, color:'#16A34A', bg:'#F0FDF4' },
    { label:'Pending earnings',  value:fmt(s.pending_earnings), sub:'awaiting approval',         color:'#D97706', bg:'#FFFBEB' },
    { label:'Ready to pay out',  value:fmt(s.eligible_amount),  sub:s.eligible_amount >= 20 ? '≥ $20 min ✓' : `$${(20-s.eligible_amount).toFixed(2)} until minimum`, color: s.eligible_amount >= 20 ? '#16A34A' : '#94A3B8', bg: s.eligible_amount >= 20 ? '#F0FDF4' : '#F9FAFB' },
  ]

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",color:'#0A0A0A'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>

      {/* Header */}
      <div style={{marginBottom:36}}>
        <Link href="/dashboard" style={{fontSize:'.75rem',fontWeight:700,color:'#94A3B8',textDecoration:'none',letterSpacing:'.02em'}}>
          ← Dashboard
        </Link>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:16,marginTop:12}}>
          <div>
            <h1 className="f-display" style={{fontSize:'clamp(1.6rem,3vw,2.4rem)',fontWeight:800,letterSpacing:'-.022em',lineHeight:1.08,color:'#0A0A0A',marginBottom:6}}>
              Affiliate Programme
            </h1>
            <p style={{fontSize:'.875rem',color:'#64748B'}}>
              Earn 30% recurring commission for every referral.
            </p>
          </div>
          <Link href="/affiliate" target="_blank" style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:'.78rem',fontWeight:600,color:'#0055FF',textDecoration:'none',padding:'7px 14px',border:'1px solid rgba(0,85,255,0.2)',borderRadius:8,background:'rgba(0,85,255,0.03)'}}>
            Public page <ExternalLink size={12}/>
          </Link>
        </div>
      </div>

      {/* Referral link box */}
      <div style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:16,padding:'24px 28px',marginBottom:28}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:12}}>
          <div>
            <p style={{fontSize:'.68rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#94A3B8',marginBottom:4}}>Your referral link</p>
            <p style={{fontSize:'.8rem',color:'#64748B'}}>Share this link anywhere. 30-day cookie window.</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span className="f-mono" style={{fontSize:'.72rem',fontWeight:700,background:'#EFF6FF',color:'#0055FF',padding:'4px 10px',borderRadius:6,letterSpacing:'.04em'}}>
              {a.referral_code}
            </span>
          </div>
        </div>
        <div className="aff-link-box">
          <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'#374151'}}>
            {refLink}
          </span>
          <button className="copy-btn" onClick={copy}>
            {copied ? <><Check size={13}/>Copied!</> : <><Copy size={13}/>Copy</>}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:28}}>
        {STAT_CARDS.map(c => (
          <div key={c.label} className="aff-stat-card">
            <p style={{fontSize:'.68rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#94A3B8',marginBottom:12}}>{c.label}</p>
            <p className="f-display" style={{fontSize:'1.6rem',fontWeight:800,color:c.color,letterSpacing:'-.02em',marginBottom:4}}>{c.value}</p>
            <p style={{fontSize:'.75rem',color:'#94A3B8'}}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Payout section */}
      <div style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:16,padding:'24px 28px',marginBottom:28}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12,marginBottom: showPayout ? 24 : 0}}>
          <div>
            <p style={{fontWeight:800,fontSize:'.95rem',color:'#0A0A0A',marginBottom:4,letterSpacing:'-.01em'}}>Payout settings</p>
            <p style={{fontSize:'.8rem',color:'#64748B'}}>
              {a.payout_method ? `${a.payout_method} · ${a.payout_email}` : 'Add your payout details to request payments'}
            </p>
          </div>
          <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
            {s.eligible_amount >= 20 && (
              <button onClick={requestPayout} disabled={requestingPO}
                style={{padding:'9px 20px',borderRadius:9,background:'linear-gradient(135deg,#0044EE,#0066FF)',color:'#fff',fontWeight:700,fontSize:'.82rem',border:'none',cursor:requestingPO?'not-allowed':'pointer',display:'inline-flex',alignItems:'center',gap:7,opacity:requestingPO?0.7:1,fontFamily:"'DM Sans',sans-serif"}}>
                {requestingPO ? <Loader2 size={13} className="animate-spin"/> : <DollarSign size={13}/>}
                Request {fmt(s.eligible_amount)} payout
              </button>
            )}
            <button onClick={() => setShowPayout(!showPayout)}
              style={{padding:'9px 16px',borderRadius:9,border:'1px solid #E2E8F0',background:'#fff',color:'#374151',fontWeight:600,fontSize:'.82rem',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:6,fontFamily:"'DM Sans',sans-serif"}}>
              {showPayout ? <><ChevronUp size={13}/>Hide</> : <><ChevronDown size={13}/>Edit</>}
            </button>
          </div>
        </div>
        {poMsg && (
          <div style={{padding:'10px 14px',borderRadius:9,background:poMsg.startsWith('✓')?'#F0FDF4':'#FEF2F2',border:`1px solid ${poMsg.startsWith('✓')?'#BBF7D0':'#FECACA'}`,fontSize:'.82rem',color:poMsg.startsWith('✓')?'#16A34A':'#DC2626',marginBottom:16,display:'flex',alignItems:'center',gap:7}}>
            {poMsg.startsWith('✓') ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
            {poMsg}
          </div>
        )}
        {showPayout && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 2fr auto',gap:12,alignItems:'flex-end'}}>
            <div>
              <label style={{fontSize:'.75rem',fontWeight:700,color:'#374151',display:'block',marginBottom:6}}>Method</label>
              <select className="payout-select" value={payoutMethod} onChange={e=>setPayoutMethod(e.target.value)} style={{width:'100%'}}>
                <option value="">Select…</option>
                <option value="PayPal">PayPal</option>
                <option value="Bank transfer">Bank transfer</option>
                <option value="Wise">Wise</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:'.75rem',fontWeight:700,color:'#374151',display:'block',marginBottom:6}}>Email / account</label>
              <input className="payout-input" value={payoutEmail} onChange={e=>setPayoutEmail(e.target.value)} placeholder="your@email.com or account ID"/>
            </div>
            <button onClick={savePayout} disabled={savingPayout}
              style={{padding:'10px 18px',borderRadius:9,background:savingPayout?'#F1F5F9':'#0A0A0A',color:savingPayout?'#94A3B8':'#fff',fontWeight:700,fontSize:'.82rem',border:'none',cursor:savingPayout?'not-allowed':'pointer',whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif"}}>
              {savingPayout ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Referrals table */}
      <div style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:16,padding:'24px 28px',marginBottom:28}}>
        <p style={{fontWeight:800,fontSize:'.95rem',color:'#0A0A0A',marginBottom:20,letterSpacing:'-.01em'}}>
          Referrals
          <span style={{marginLeft:10,fontSize:'.72rem',fontWeight:700,color:'#94A3B8',fontFamily:"'DM Sans',sans-serif"}}>{s.total_referrals} total</span>
        </p>
        {(data.referrals || []).length === 0 ? (
          <div style={{textAlign:'center',padding:'32px 0'}}>
            <p style={{fontSize:'.875rem',color:'#94A3B8',marginBottom:8}}>No referrals yet.</p>
            <p style={{fontSize:'.8rem',color:'#C4CBDA'}}>Share your link above to start earning.</p>
          </div>
        ) : (
          <table className="aff-table" style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th>Joined</th>
                <th>Plan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data.referrals || []).map(r => (
                <tr key={r.id}>
                  <td style={{color:'#6B7280',fontFamily:"'DM Mono',monospace",fontSize:'.77rem'}}>{fmtDate(r.signup_date)}</td>
                  <td style={{fontWeight:600,textTransform:'capitalize'}}>{r.current_plan || '—'}</td>
                  <td><StatusPill status={r.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Commission history */}
      <div style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:16,padding:'24px 28px'}}>
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',background:'none',border:'none',cursor:'pointer',padding:0,fontFamily:"'DM Sans',sans-serif"}}>
          <p style={{fontWeight:800,fontSize:'.95rem',color:'#0A0A0A',letterSpacing:'-.01em'}}>
            Commission history
            <span style={{marginLeft:10,fontSize:'.72rem',fontWeight:700,color:'#94A3B8'}}>{(data.commissions||[]).length} entries</span>
          </p>
          {showHistory ? <ChevronUp size={16} color="#94A3B8"/> : <ChevronDown size={16} color="#94A3B8"/>}
        </button>

        {showHistory && (
          <div style={{marginTop:20}}>
            {(data.commissions || []).length === 0 ? (
              <p style={{fontSize:'.875rem',color:'#94A3B8',textAlign:'center',padding:'20px 0'}}>No commissions yet.</p>
            ) : (
              <table className="aff-table" style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Period</th>
                    <th style={{textAlign:'right'}}>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.commissions || []).map(c => (
                    <tr key={c.id}>
                      <td style={{color:'#6B7280',fontFamily:"'DM Mono',monospace",fontSize:'.77rem'}}>{fmtDate(c.created_at)}</td>
                      <td style={{color:'#6B7280',fontSize:'.77rem'}}>
                        {c.period_start && c.period_end ? `${fmtDate(c.period_start)} – ${fmtDate(c.period_end)}` : '—'}
                      </td>
                      <td style={{textAlign:'right',fontWeight:800,color:'#16A34A'}}>{fmt(c.amount)}</td>
                      <td><StatusPill status={c.status}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Payout history inline */}
        {(data.payouts || []).length > 0 && showHistory && (
          <div style={{marginTop:28,paddingTop:24,borderTop:'1px solid #F1F5F9'}}>
            <p style={{fontWeight:700,fontSize:'.82rem',color:'#374151',marginBottom:14,letterSpacing:'-.01em'}}>Payout requests</p>
            <table className="aff-table" style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr>
                  <th>Requested</th>
                  <th>Method</th>
                  <th style={{textAlign:'right'}}>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data.payouts || []).map(p => (
                  <tr key={p.id}>
                    <td style={{color:'#6B7280',fontFamily:"'DM Mono',monospace",fontSize:'.77rem'}}>{fmtDate(p.requested_at)}</td>
                    <td style={{color:'#6B7280'}}>{p.payout_method || '—'}</td>
                    <td style={{textAlign:'right',fontWeight:800,color:'#0A0A0A'}}>{fmt(p.amount)}</td>
                    <td><StatusPill status={p.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AffiliateDashboardPage() {
  const { format: fmt } = useCurrency()
  const [data,    setData]    = useState<AffiliateStats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/affiliate/stats')
      const json = await res.json()
      setData(json)
    } catch { setData({ affiliated: false }) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div style={{fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',minHeight:300,color:'#94A3B8',gap:10}}>
        <style dangerouslySetInnerHTML={{__html:CSS}}/>
        <Loader2 size={18} className="animate-spin"/>
        <span style={{fontSize:'.875rem'}}>Loading affiliate data…</span>
      </div>
    )
  }

  if (!data) return null

  if (!data.affiliated) {
    return <JoinScreen onJoined={load}/>
  }

  return <DashboardScreen data={data} onRefresh={load}/>
}
