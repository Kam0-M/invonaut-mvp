'use client'
// src/components/reports/reports-client.tsx
// Five tabs: P&L Statement · Period Breakdown · Comparison · Asset Register · Balance Sheet

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useCurrency } from '@/lib/context/currency-context'
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Minus,
  FileText, BarChart2, Scale, Building2, Printer, Info, GitCompare,
  Plus, Trash2, Loader2, ChevronDown, ChevronUp, CheckCircle2, AlertCircle,
  Hash, Send, Save, Clock, XCircle, Eye, ToggleLeft, ToggleRight,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Invoice        { id:string; status:string; displayStatus:string; issue_date:string; due_date:string; total_amount:number; revenue_category_id:string|null }
interface DirectPayment  { id:string; amount:number; payment_date:string; revenue_category_id:string|null; payment_type:string; payment_method:string; description:string }
interface Expense        { id:string; amount:number; date:string; category:string; description:string; vendor:string; is_cogs?:boolean }
interface RevCategory    { id:string; name:string; color:string }
interface Asset {
  id:string; user_id?:string; name:string; category:string; description?:string|null
  purchase_date:string; purchase_cost:number; salvage_value:number; useful_life_years:number
  depreciation_method:string; status:string; disposed_at?:string|null; disposed_value?:number|null; notes?:string|null
  serial_number?:string|null; has_serial_number?:boolean
  workflow_status?:string; reviewer_email?:string; submitted_at?:string|null
  reviewed_at?:string|null; reviewed_by_name?:string|null; rejection_note?:string|null
}
interface Liability { id:string; user_id?:string; name:string; amount:number; liability_type:string; notes?:string|null }

interface Props {
  businessName:string; tier:string
  invoices:Invoice[]; directPayments:DirectPayment[]; expenses:Expense[]; revCategories:RevCategory[]
  initialAssets:Asset[]; initialLiabilities:Liability[]
  latestCashBalance:number|null
}

// ─── Depreciation ──────────────────────────────────────────────────────────────
function calcDep(a: Asset) {
  const cost    = Number(a.purchase_cost  || 0)
  const salvage = Number(a.salvage_value  || 0)
  const life    = Number(a.useful_life_years || 5)
  if (life <= 0) return { annualDep:0, accumulated:0, bookValue:cost }
  const annualDep    = (cost - salvage) / life
  const purchaseDate = new Date(a.purchase_date + 'T12:00:00')
  const years        = (Date.now() - purchaseDate.getTime()) / (1000*60*60*24*365.25)
  const accumulated  = Math.min(annualDep * Math.max(years, 0), cost - salvage)
  return { annualDep, accumulated, bookValue: cost - accumulated }
}

// ─── Date helpers ──────────────────────────────────────────────────────────────
function rangeFor(key:string) {
  const now=new Date(), y=now.getFullYear(), m=now.getMonth()
  const R: Record<string,{start:Date,end:Date,label:string}> = {
    this_month:   {start:new Date(y,m,1),        end:new Date(y,m+1,0),          label:now.toLocaleString('default',{month:'long',year:'numeric'})},
    last_month:   {start:new Date(y,m-1,1),      end:new Date(y,m,0),            label:new Date(y,m-1,1).toLocaleString('default',{month:'long',year:'numeric'})},
    this_quarter: {start:new Date(y,Math.floor(m/3)*3,1), end:new Date(y,Math.floor(m/3)*3+3,0), label:`Q${Math.floor(m/3)+1} ${y}`},
    last_quarter: {start:new Date(y,Math.floor(m/3)*3-3,1),end:new Date(y,Math.floor(m/3)*3,0),  label:`Q${Math.floor(m/3)||4} ${Math.floor(m/3)?y:y-1}`},
    this_year:    {start:new Date(y,0,1),         end:new Date(y,11,31),          label:`Full Year ${y}`},
    last_year:    {start:new Date(y-1,0,1),       end:new Date(y-1,11,31),        label:`Full Year ${y-1}`},
    all_time:     {start:new Date(2020,0,1),      end:new Date(y+1,0,1),          label:'All Time'},
  }
  return R[key]||R['this_year']
}
function inRange(dateStr:string,start:Date,end:Date) {
  const d=new Date(dateStr+'T12:00:00'); return d>=start&&d<=end
}

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtPct = (n:number) => `${n>=0?'+':''}${n.toFixed(1)}%`
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const EXP_COLORS: Record<string,string> = {
  software:'#0066FF',hardware:'#6B7280',travel:'#F59E0B',meals:'#FF6B35',marketing:'#EC4899',
  office:'#00D4AA',professional:'#6366F1',utilities:'#14B8A6',education:'#8B5CF6',
  insurance:'#22C55E',taxes:'#EF4444',other:'#9CA3AF',
}
const ASSET_CATS = ['equipment','vehicle','computer','furniture','software','property','other']
const LIAB_TYPES = ['loan','credit_card','accounts_payable','tax_payable','other']

const WORKFLOW_LABELS: Record<string,{label:string,color:string,bg:string}> = {
  draft:          {label:'Draft',          color:'#64748B', bg:'rgba(100,116,139,0.1)'},
  pending_review: {label:'Pending Review', color:'#D97706', bg:'rgba(245,158,11,0.1)'},
  approved:       {label:'Approved',       color:'#059669', bg:'rgba(5,150,105,0.1)'},
  rejected:       {label:'Rejected',       color:'#DC2626', bg:'rgba(220,38,38,0.1)'},
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..800&family=DM+Sans:opsz,wght@9..40,300..700&family=DM+Mono:ital,wght@0,400;0,500&display=swap');
  .f-display{font-family:'Fraunces',serif;font-optical-sizing:auto}
  .f-mono{font-family:'DM Mono',monospace}
  .rpt-tab{padding:9px 20px;border-radius:9px;font-size:.82rem;font-weight:700;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:7px;transition:background .15s,color .15s;font-family:'DM Sans',sans-serif}
  .rpt-tab-active{background:#0A0A0A;color:#fff}
  .rpt-tab-inactive{background:transparent;color:#64748B}
  .rpt-tab-inactive:hover{background:#F1F5F9;color:#374151}
  .rpt-range-btn{padding:7px 14px;border-radius:7px;font-size:.75rem;font-weight:700;border:1px solid #E2E8F0;cursor:pointer;background:#fff;color:#64748B;transition:all .12s;font-family:'DM Sans',sans-serif;white-space:nowrap}
  .rpt-range-btn:hover{border-color:#0055FF;color:#0055FF;background:rgba(0,85,255,0.03)}
  .rpt-range-btn-active{border-color:#0055FF!important;color:#0055FF!important;background:rgba(0,85,255,0.06)!important}
  .rpt-stat{background:#fff;border:1px solid #E2E8F0;border-radius:16px;padding:24px 24px 20px;transition:box-shadow .15s,transform .15s}
  .rpt-stat:hover{box-shadow:0 4px 20px rgba(0,85,255,0.07);transform:translateY(-1px)}
  .rpt-section{background:#fff;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden}
  .rpt-section-head{padding:20px 24px 16px;border-bottom:1px solid #F1F5F9}
  .rpt-table{width:100%;border-collapse:collapse}
  .rpt-table th{font-size:.66rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94A3B8;padding:0 24px 12px;text-align:left;border-bottom:1px solid #E2E8F0}
  .rpt-table th:not(:first-child){text-align:right}
  .rpt-table td{font-size:.83rem;color:#374151;padding:13px 24px;border-bottom:1px solid #F8FAFC}
  .rpt-table td:not(:first-child){text-align:right;font-family:'DM Mono',monospace;font-size:.79rem}
  .rpt-table tr:last-child td{border-bottom:none}
  .rpt-table tbody tr:hover td{background:#F8FAFF}
  .rpt-total-row td{font-weight:800;border-top:2px solid #E2E8F0!important;border-bottom:none!important;padding-top:14px;background:#F8FAFF}
  .bar-track{background:#F1F5F9;border-radius:4px;height:6px;flex:1}
  .bar-fill{height:6px;border-radius:4px;transition:width .4s}
  .rpt-input{width:100%;padding:9px 12px;border:1px solid #E2E8F0;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:.825rem;color:#0A0A0A;background:#fff;outline:none;transition:border-color .15s}
  .rpt-input:focus{border-color:#0055FF}
  .rpt-select{padding:9px 12px;border:1px solid #E2E8F0;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:.825rem;color:#0A0A0A;background:#fff;outline:none;cursor:pointer;width:100%}
  .rpt-select:focus{border-color:#0055FF}
  .rpt-add-btn{padding:9px 20px;border-radius:9px;background:linear-gradient(135deg,#0044EE,#0066FF);color:#fff;font-weight:700;font-size:.82rem;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:7px;font-family:'DM Sans',sans-serif}
  .rpt-add-btn:disabled{opacity:.6;cursor:not-allowed}
  .del-btn{padding:5px;border-radius:6px;border:none;background:transparent;cursor:pointer;color:#94A3B8;display:flex;align-items:center;transition:color .12s,background .12s}
  .del-btn:hover{color:#EF4444;background:#FEF2F2}
  .toggle-switch{width:38px;height:22px;border-radius:11px;border:none;cursor:pointer;display:flex;align-items:center;padding:2px;transition:background .2s;flex-shrink:0}
  .toggle-switch-on{background:#0055FF}
  .toggle-switch-off{background:#CBD5E1}
  .toggle-thumb{width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,0.2)}
  .toggle-thumb-on{transform:translateX(16px)}
  .toggle-thumb-off{transform:translateX(0)}
  .wf-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:.66rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
  .comp-col{background:#fff;border:1px solid #E2E8F0;border-radius:14px;overflow:hidden;flex:1}
  .comp-col-head{padding:16px 20px;border-bottom:1px solid #F1F5F9}
  .waterfall-row{display:grid;grid-template-columns:200px 1fr 120px;align-items:center;gap:12px;padding:10px 0}
  .waterfall-bar{height:24px;border-radius:4px;transition:width .5s}
  @media print {
    @page { size: A4 portrait; margin: 20mm 15mm; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    header, nav, aside, .sidebar { display: none !important; }
    html, body    { overflow: visible !important; height: auto !important; background: white !important; }
    main          { overflow: visible !important; height: auto !important; background: white !important; }
    div[class*="h-screen"]  { height: auto !important; overflow: visible !important; }
    div[class*="overflow-hidden"] { overflow: visible !important; }
    div[class*="overflow-y"]      { overflow: visible !important; }
    div[class*="flex-1"]          { height: auto !important; }
    *                    { scrollbar-width: none !important; }
    *::-webkit-scrollbar { display: none !important; }
    .no-print   { display: none !important; }
    .print-only { display: flex !important; }
    .stat-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
    .cat-cols  { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
    .rpt-stat    { page-break-inside: avoid; box-shadow: none !important; padding: 16px !important; overflow: visible !important; }
    .rpt-section { box-shadow: none !important; overflow: visible !important; }
    .rpt-section + .rpt-section { margin-top: 16px; }
    table { font-size: 11px !important; }
    .rpt-table td, .rpt-table th { padding: 8px 12px !important; font-size: 10.5px !important; }
    .bs-hero                { border-radius: 10px !important; padding: 16px 24px !important; overflow: visible !important; }
    .bs-hero > div          { padding: 0 16px !important; }
    .bs-hero .f-display     { font-size: 1.1rem !important; letter-spacing: -.01em !important; line-height: 1.2 !important; }
    .bs-hero p:first-child  { font-size: .6rem !important; margin-bottom: 6px !important; }
    h1 { font-size: 1.4rem !important; }
    .rpt-section-head { padding: 14px 18px 12px !important; }
  }
`

// ─── Sub-components ───────────────────────────────────────────────────────────
function CatRow({name,amount,total,color}:{name:string,amount:number,total:number,color:string}) {
  const { format: fmtC } = useCurrency()
  const pct=total>0?(amount/total)*100:0
  return (
    <div style={{padding:'12px 24px',display:'flex',alignItems:'center',gap:14}}>
      <div style={{width:8,height:8,borderRadius:'50%',background:color,flexShrink:0}}/>
      <span style={{flex:1,fontSize:'.82rem',color:'#374151',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</span>
      <div className="bar-track" style={{maxWidth:100}}><div className="bar-fill" style={{width:`${pct}%`,background:color}}/></div>
      <span style={{fontSize:'.78rem',color:'#94A3B8',fontWeight:600,minWidth:36,textAlign:'right'}}>{pct.toFixed(0)}%</span>
      <span className="f-mono" style={{fontSize:'.78rem',color:'#0A0A0A',fontWeight:700,minWidth:88,textAlign:'right'}}>{fmtC(amount)}</span>
    </div>
  )
}

function PeriodChart({rows}:{rows:{label:string,revenue:number,expenses:number}[]}) {
  const max=Math.max(...rows.flatMap(r=>[r.revenue,r.expenses]),1), H=160
  return (
    <div style={{padding:'24px 24px 0'}}>
      <div style={{display:'flex',gap:4,alignItems:'flex-end',height:H+28}}>
        {rows.map((r,i)=>(
          <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
            <div style={{display:'flex',gap:2,alignItems:'flex-end',width:'100%',height:H}}>
              <div style={{flex:1,borderRadius:'3px 3px 0 0',background:'linear-gradient(180deg,#0066FF,#0044CC)',height:`${Math.round((r.revenue/max)*H)}px`,minHeight:r.revenue>0?3:0,opacity:.85}} title={`Revenue: ${fmtC(r.revenue)}`}/>
              <div style={{flex:1,borderRadius:'3px 3px 0 0',background:'linear-gradient(180deg,#FF6B35,#E04E20)',height:`${Math.round((r.expenses/max)*H)}px`,minHeight:r.expenses>0?3:0,opacity:.75}} title={`Expenses: ${fmtC(r.expenses)}`}/>
            </div>
            <span style={{fontSize:'.6rem',color:'#94A3B8',fontWeight:600,letterSpacing:'.02em'}}>{r.label}</span>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:20,padding:'16px 0 20px',borderTop:'1px solid #F1F5F9',marginTop:8}}>
        {[{c:'#0066FF',l:'Revenue'},{c:'#FF6B35',l:'Expenses'}].map(x=>(
          <div key={x.l} style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{width:10,height:10,borderRadius:2,background:x.c,display:'inline-block'}}/>
            <span style={{fontSize:'.72rem',fontWeight:600,color:'#64748B'}}>{x.l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({on, onToggle, label}:{on:boolean, onToggle:()=>void, label:string}) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={onToggle}>
      <button className={`toggle-switch ${on?'toggle-switch-on':'toggle-switch-off'}`} type="button">
        <div className={`toggle-thumb ${on?'toggle-thumb-on':'toggle-thumb-off'}`}/>
      </button>
      <span style={{fontSize:'.82rem',fontWeight:600,color:on?'#0A0A0A':'#64748B'}}>{label}</span>
    </div>
  )
}

// ─── Workflow badge ────────────────────────────────────────────────────────────
function WFBadge({status}:{status:string}) {
  const s = WORKFLOW_LABELS[status] || WORKFLOW_LABELS['draft']
  return <span className="wf-badge" style={{color:s.color,background:s.bg}}>{s.label}</span>
}

// ─── Add Asset Form (updated with serial + workflow) ──────────────────────────
function AddAssetForm({onAdd}:{onAdd:(a:Asset)=>void}) {
  const [open,       setOpen]      = useState(false)
  const [saving,     setSaving]    = useState(false)
  const [submitting, setSubmitting]= useState(false)
  const [err,        setErr]       = useState('')
  const [savedAsset, setSavedAsset]= useState<Asset|null>(null)
  const [showReview, setShowReview]= useState(false)
  const [reviewEmail,setReviewEmail]=useState('')
  const [reviewName, setReviewName] =useState('')

  const [f, setF] = useState({
    name:'', category:'equipment', purchase_date:'', purchase_cost:'',
    salvage_value:'0', useful_life_years:'5', description:'', notes:'',
    serial_number:'', has_serial_number:true,
  })
  const set = (k:string, v:string|boolean) => setF(p=>({...p,[k]:v}))

  const resetForm = () => {
    setF({name:'',category:'equipment',purchase_date:'',purchase_cost:'',salvage_value:'0',useful_life_years:'5',description:'',notes:'',serial_number:'',has_serial_number:true})
    setSavedAsset(null); setShowReview(false); setReviewEmail(''); setReviewName(''); setErr('')
  }

  const saveDraft = async () => {
    if (!f.name||!f.purchase_date||!f.purchase_cost) { setErr('Name, date and cost are required'); return }
    if (f.has_serial_number && !f.serial_number.trim()) { setErr('Serial number is required — or toggle it off if this asset has none'); return }
    setSaving(true); setErr('')
    const res  = await fetch('/api/assets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...f,workflow_status:'draft'})})
    const data = await res.json()
    if (!res.ok) { setErr(data.error||'Failed to save'); setSaving(false); return }
    setSavedAsset(data)
    setSaving(false)
  }

  const submitForReview = async () => {
    if (!reviewEmail.trim()) { setErr('Reviewer email is required'); return }
    if (!savedAsset) return
    setSubmitting(true); setErr('')
    const res  = await fetch('/api/assets/submit-review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({asset_id:savedAsset.id,reviewer_email:reviewEmail.trim(),reviewer_name:reviewName.trim()||null})})
    const data = await res.json()
    if (!res.ok) { setErr(data.error||'Failed to send review request'); setSubmitting(false); return }
    onAdd({...savedAsset, workflow_status:'pending_review', reviewer_email:reviewEmail.trim()})
    resetForm(); setOpen(false); setSubmitting(false)
  }

  const saveAsFinal = async () => {
    if (!f.name||!f.purchase_date||!f.purchase_cost) { setErr('Name, date and cost are required'); return }
    if (f.has_serial_number && !f.serial_number.trim()) { setErr('Serial number is required — or toggle it off if this asset has none'); return }
    setSaving(true); setErr('')
    const res  = await fetch('/api/assets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...f,workflow_status:'approved'})})
    const data = await res.json()
    if (!res.ok) { setErr(data.error||'Failed'); setSaving(false); return }
    onAdd(data); resetForm(); setOpen(false); setSaving(false)
  }

  return (
    <div style={{borderTop:'1px solid #F1F5F9'}}>
      <button onClick={()=>{setOpen(!open);if(open)resetForm()}} style={{width:'100%',padding:'14px 24px',display:'flex',alignItems:'center',gap:8,background:'none',border:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontSize:'.82rem',fontWeight:700,color:'#0055FF'}}>
        {open ? <><ChevronUp size={14}/>Hide form</> : <><Plus size={14}/>Add asset</>}
      </button>
      {open && (
        <div style={{padding:'0 24px 24px',display:'flex',flexDirection:'column',gap:16}}>

          {/* ── Main fields ── */}
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:10}}>
            <div><label style={{fontSize:'.72rem',fontWeight:700,color:'#374151',display:'block',marginBottom:5}}>Asset name *</label>
              <input className="rpt-input" value={f.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. MacBook Pro 16" disabled={!!savedAsset}/></div>
            <div><label style={{fontSize:'.72rem',fontWeight:700,color:'#374151',display:'block',marginBottom:5}}>Category</label>
              <select className="rpt-select" value={f.category} onChange={e=>set('category',e.target.value)} disabled={!!savedAsset}>
                {ASSET_CATS.map(c=><option key={c} value={c} style={{textTransform:'capitalize'}}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select></div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10}}>
            <div><label style={{fontSize:'.72rem',fontWeight:700,color:'#374151',display:'block',marginBottom:5}}>Purchase date *</label>
              <input className="rpt-input" type="date" value={f.purchase_date} onChange={e=>set('purchase_date',e.target.value)} disabled={!!savedAsset}/></div>
            <div><label style={{fontSize:'.72rem',fontWeight:700,color:'#374151',display:'block',marginBottom:5}}>Cost ($) *</label>
              <input className="rpt-input" type="number" min="0" step="0.01" value={f.purchase_cost} onChange={e=>set('purchase_cost',e.target.value)} placeholder="0.00" disabled={!!savedAsset}/></div>
            <div><label style={{fontSize:'.72rem',fontWeight:700,color:'#374151',display:'block',marginBottom:5}}>Salvage value ($)</label>
              <input className="rpt-input" type="number" min="0" step="0.01" value={f.salvage_value} onChange={e=>set('salvage_value',e.target.value)} disabled={!!savedAsset}/></div>
            <div><label style={{fontSize:'.72rem',fontWeight:700,color:'#374151',display:'block',marginBottom:5}}>Useful life (yrs)</label>
              <input className="rpt-input" type="number" min="1" max="50" value={f.useful_life_years} onChange={e=>set('useful_life_years',e.target.value)} disabled={!!savedAsset}/></div>
          </div>

          {/* ── Serial number toggle ── */}
          <div style={{background:'#F8FAFF',border:'1px solid #E2E8F0',borderRadius:10,padding:'14px 16px'}}>
            <Toggle
              on={f.has_serial_number}
              onToggle={()=>{ if(!savedAsset) set('has_serial_number',!f.has_serial_number) }}
              label="This asset has a serial number"
            />
            {f.has_serial_number && (
              <div style={{marginTop:12}}>
                <label style={{fontSize:'.72rem',fontWeight:700,color:'#374151',display:'flex',alignItems:'center',gap:5,marginBottom:5}}>
                  <Hash size={10}/>Serial number *
                </label>
                <input
                  className="rpt-input"
                  value={f.serial_number}
                  onChange={e=>set('serial_number',e.target.value)}
                  placeholder="e.g. C02XL0AAJGH5"
                  disabled={!!savedAsset}
                  style={{fontFamily:"'DM Mono',monospace",fontSize:'.82rem'}}
                />
              </div>
            )}
            {!f.has_serial_number && (
              <p style={{marginTop:8,fontSize:'.72rem',color:'#94A3B8'}}>No serial number — e.g. software licences, intangible assets, or off-the-shelf furniture</p>
            )}
          </div>

          <div><label style={{fontSize:'.72rem',fontWeight:700,color:'#374151',display:'block',marginBottom:5}}>Description (optional)</label>
            <input className="rpt-input" value={f.description} onChange={e=>set('description',e.target.value)} placeholder="Model, location, purpose…" disabled={!!savedAsset}/></div>

          {err && <p style={{fontSize:'.78rem',color:'#DC2626',display:'flex',alignItems:'center',gap:6}}><AlertCircle size={13}/>{err}</p>}

          {/* ── Step 1: not yet saved ── */}
          {!savedAsset && (
            <div style={{display:'flex',gap:10,flexWrap:'wrap',paddingTop:4}}>
              <button className="rpt-add-btn" onClick={saveDraft} disabled={saving} style={{background:'linear-gradient(135deg,#374151,#1F2937)'}}>
                {saving?<><Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/>Saving…</>:<><Save size={13}/>Save draft</>}
              </button>
              <button className="rpt-add-btn" onClick={saveAsFinal} disabled={saving}>
                {saving?<><Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/>Saving…</>:<><CheckCircle2 size={13}/>Save as approved</>}
              </button>
              <button onClick={()=>{setOpen(false);resetForm()}} style={{padding:'9px 16px',borderRadius:9,border:'1px solid #E2E8F0',background:'#fff',cursor:'pointer',fontSize:'.82rem',fontWeight:600,color:'#64748B',fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
            </div>
          )}

          {/* ── Step 2: saved as draft, now submit for review ── */}
          {savedAsset && (
            <div style={{background:'rgba(0,85,255,0.04)',border:'1px solid rgba(0,85,255,0.15)',borderRadius:12,padding:'16px 18px'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <CheckCircle2 size={15} color="#059669"/>
                <span style={{fontSize:'.82rem',fontWeight:700,color:'#059669'}}>Draft saved — <span style={{color:'#374151',fontWeight:500}}>now submit for review or go back and edit</span></span>
              </div>

              {!showReview ? (
                <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                  <button className="rpt-add-btn" onClick={()=>setShowReview(true)}>
                    <Send size={13}/>Submit for review
                  </button>
                  <button onClick={()=>{setSavedAsset(null);setErr('')}} style={{padding:'9px 16px',borderRadius:9,border:'1px solid #E2E8F0',background:'#fff',cursor:'pointer',fontSize:'.82rem',fontWeight:600,color:'#374151',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:6}}>
                    Edit draft
                  </button>
                  <button onClick={()=>{onAdd(savedAsset);resetForm();setOpen(false)}} style={{padding:'9px 16px',borderRadius:9,border:'1px solid #E2E8F0',background:'#fff',cursor:'pointer',fontSize:'.82rem',fontWeight:600,color:'#64748B',fontFamily:"'DM Sans',sans-serif"}}>
                    Keep as draft only
                  </button>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    <div>
                      <label style={{fontSize:'.72rem',fontWeight:700,color:'#374151',display:'block',marginBottom:5}}>Reviewer email *</label>
                      <input className="rpt-input" type="email" value={reviewEmail} onChange={e=>setReviewEmail(e.target.value)} placeholder="accountant@example.com"/>
                    </div>
                    <div>
                      <label style={{fontSize:'.72rem',fontWeight:700,color:'#374151',display:'block',marginBottom:5}}>Reviewer name (optional)</label>
                      <input className="rpt-input" value={reviewName} onChange={e=>setReviewName(e.target.value)} placeholder="e.g. Sarah Chen"/>
                    </div>
                  </div>
                  <p style={{fontSize:'.72rem',color:'#64748B'}}>They'll receive an email with a secure review link — no Invonaut account required.</p>
                  {err && <p style={{fontSize:'.78rem',color:'#DC2626',display:'flex',alignItems:'center',gap:6}}><AlertCircle size={13}/>{err}</p>}
                  <div style={{display:'flex',gap:10}}>
                    <button className="rpt-add-btn" onClick={submitForReview} disabled={submitting}>
                      {submitting?<><Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/>Sending…</>:<><Send size={13}/>Send review request</>}
                    </button>
                    <button onClick={()=>{setShowReview(false);setErr('')}} style={{padding:'9px 16px',borderRadius:9,border:'1px solid #E2E8F0',background:'#fff',cursor:'pointer',fontSize:'.82rem',fontWeight:600,color:'#64748B',fontFamily:"'DM Sans',sans-serif"}}>Back</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function AddLiabilityForm({onAdd}:{onAdd:(l:Liability)=>void}) {
  const [open,   setOpen]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState('')
  const [f, setF] = useState({name:'',amount:'',liability_type:'loan',notes:''})
  const set = (k:string,v:string) => setF(p=>({...p,[k]:v}))

  const submit = async () => {
    if (!f.name||!f.amount) { setErr('Name and amount are required'); return }
    setSaving(true); setErr('')
    const res  = await fetch('/api/liabilities',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(f)})
    const data = await res.json()
    if (!res.ok) { setErr(data.error||'Failed'); setSaving(false); return }
    onAdd(data)
    setF({name:'',amount:'',liability_type:'loan',notes:''})
    setSaving(false); setOpen(false)
  }

  const TYPE_LABELS: Record<string,string> = {loan:'Loan',credit_card:'Credit Card',accounts_payable:'Accounts Payable',tax_payable:'Tax Payable',other:'Other'}

  return (
    <div style={{borderTop:'1px solid #F1F5F9'}}>
      <button onClick={()=>setOpen(!open)} style={{width:'100%',padding:'14px 24px',display:'flex',alignItems:'center',gap:8,background:'none',border:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontSize:'.82rem',fontWeight:700,color:'#FF6B35'}}>
        {open ? <><ChevronUp size={14}/>Hide form</> : <><Plus size={14}/>Add liability</>}
      </button>
      {open && (
        <div style={{padding:'0 24px 24px',display:'flex',flexDirection:'column',gap:12}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:10}}>
            <div><label style={{fontSize:'.72rem',fontWeight:700,color:'#374151',display:'block',marginBottom:5}}>Name *</label>
              <input className="rpt-input" value={f.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Business loan, Amex card"/></div>
            <div><label style={{fontSize:'.72rem',fontWeight:700,color:'#374151',display:'block',marginBottom:5}}>Amount owed ($) *</label>
              <input className="rpt-input" type="number" min="0" step="0.01" value={f.amount} onChange={e=>set('amount',e.target.value)} placeholder="0.00"/></div>
            <div><label style={{fontSize:'.72rem',fontWeight:700,color:'#374151',display:'block',marginBottom:5}}>Type</label>
              <select className="rpt-select" value={f.liability_type} onChange={e=>set('liability_type',e.target.value)}>
                {LIAB_TYPES.map(t=><option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select></div>
          </div>
          <div><label style={{fontSize:'.72rem',fontWeight:700,color:'#374151',display:'block',marginBottom:5}}>Notes (optional)</label>
            <input className="rpt-input" value={f.notes} onChange={e=>set('notes',e.target.value)} placeholder="Interest rate, due date, lender name…"/></div>
          {err && <p style={{fontSize:'.78rem',color:'#DC2626',display:'flex',alignItems:'center',gap:6}}><AlertCircle size={13}/>{err}</p>}
          <div style={{display:'flex',gap:10}}>
            <button className="rpt-add-btn" onClick={submit} disabled={saving} style={{background:'linear-gradient(135deg,#E04E20,#FF6B35)'}}>
              {saving?<><Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/>Saving…</>:<><CheckCircle2 size={13}/>Save liability</>}
            </button>
            <button onClick={()=>{setOpen(false);setErr('')}} style={{padding:'9px 16px',borderRadius:9,border:'1px solid #E2E8F0',background:'#fff',cursor:'pointer',fontSize:'.82rem',fontWeight:600,color:'#64748B',fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Balance Sheet Section Row ─────────────────────────────────────────────────
function BSRow({label,amount,indent=false,bold=false,total=false,color}:{label:string,amount:number|null,indent?:boolean,bold?:boolean,total?:boolean,color?:string}) {
  const { format: fmtC } = useCurrency()
  return (
    <tr style={total?{background:'#F8FAFF'}:{}}>
      <td style={{paddingLeft:indent?48:24,fontWeight:bold||total?800:400,fontSize:total?'.88rem':'.83rem',color:total?'#0A0A0A':'#374151',borderBottom:total?'none':'1px solid #F8FAFC',paddingTop:total?14:13,paddingBottom:total?14:13,borderTop:total?'2px solid #E2E8F0':'none'}}>
        {label}
      </td>
      <td style={{textAlign:'right',paddingRight:24,fontFamily:"'DM Mono',monospace",fontSize:total?'.88rem':'.79rem',fontWeight:bold||total?800:400,color:color||(total?'#0A0A0A':'#374151'),borderBottom:total?'none':'1px solid #F8FAFC',paddingTop:total?14:13,paddingBottom:total?14:13,borderTop:total?'2px solid #E2E8F0':'none'}}>
        {amount===null?'—':fmtC(amount)}
      </td>
    </tr>
  )
}

// ─── Delta badge ───────────────────────────────────────────────────────────────
function Delta({a,b,inverted=false}:{a:number,b:number,inverted?:boolean}) {
  const { format: fmtC } = useCurrency()
  if (b===0) return <span style={{fontSize:'.72rem',color:'#94A3B8'}}>—</span>
  const diff   = a - b
  const pct    = (diff / Math.abs(b)) * 100
  const isGood = inverted ? diff < 0 : diff > 0
  const col    = diff===0?'#94A3B8':isGood?'#059669':'#DC2626'
  const arrow  = diff>0?'↑':diff<0?'↓':'→'
  return (
    <div style={{display:'flex',flexDirection:'column',gap:2,alignItems:'flex-end'}}>
      <span className="f-mono" style={{fontSize:'.79rem',fontWeight:700,color:col}}>{fmtC(diff>=0?diff:-diff)}</span>
      <span style={{fontSize:'.65rem',fontWeight:700,color:col}}>{arrow} {Math.abs(pct).toFixed(1)}%</span>
    </div>
  )
}

// ─── Comparison column helper ──────────────────────────────────────────────────
function compCalc(invoices:Invoice[], directPayments:DirectPayment[], expenses:Expense[], start:Date, end:Date) {
  const paidInv   = invoices.filter(i=>i.displayStatus==='paid'&&inRange(i.issue_date,start,end))
  const payments  = directPayments.filter(p=>inRange(p.payment_date,start,end))
  const exps      = expenses.filter(e=>inRange(e.date,start,end))
  const cogs      = exps.filter(e=>e.is_cogs).reduce((s,e)=>s+Number(e.amount||0),0)
  const opex      = exps.filter(e=>!e.is_cogs).reduce((s,e)=>s+Number(e.amount||0),0)
  const revenue   = paidInv.reduce((s,i)=>s+Number(i.total_amount||0),0) + payments.reduce((s,p)=>s+Number(p.amount||0),0)
  const totalExp  = exps.reduce((s,e)=>s+Number(e.amount||0),0)
  const gross     = revenue - cogs
  const ebit      = gross - opex
  return { revenue, cogs, opex, totalExp, gross, ebit, net: revenue - totalExp }
}

// ─── Waterfall bar ─────────────────────────────────────────────────────────────
function WaterfallRow({label,value,max,color,indent=false,isTotal=false,note}:{label:string,value:number,max:number,color:string,indent?:boolean,isTotal?:boolean,note?:string}) {
  const { format: fmtC } = useCurrency()
  const pct = max>0?(Math.abs(value)/max)*100:0
  return (
    <div style={{display:'grid',gridTemplateColumns:'190px 1fr 130px',alignItems:'center',gap:14,padding:`${isTotal?'14px':'9px'} 0`,borderTop:isTotal?'2px solid #E2E8F0':'none'}}>
      <div style={{paddingLeft:indent?20:0}}>
        <p style={{fontSize:'.8rem',fontWeight:isTotal?800:500,color:isTotal?'#0A0A0A':'#374151'}}>{label}</p>
        {note&&<p style={{fontSize:'.68rem',color:'#94A3B8',marginTop:2}}>{note}</p>}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div style={{flex:1,background:'#F1F5F9',borderRadius:4,height:isTotal?10:7,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:4,transition:'width .4s'}}/>
        </div>
      </div>
      <div style={{textAlign:'right'}}>
        <span className="f-mono" style={{fontSize:isTotal?'.88rem':'.8rem',fontWeight:isTotal?800:600,color:value<0?'#DC2626':color}}>{fmtC(value)}</span>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export function ReportsClient({businessName,tier,invoices,directPayments,expenses,revCategories,initialAssets,initialLiabilities,latestCashBalance}: Props) {
  const { format: fmtC } = useCurrency()
  const [tab,       setTab]     = useState<'pl'|'period'|'comparison'|'assets'|'balance'>('pl')
  const [rangeKey,  setRangeKey]= useState('this_year')
  const [assets,     setAssets]     = useState<Asset[]>(initialAssets)
  const [liabilities,setLiabilities]= useState<Liability[]>(initialLiabilities)
  const [showEbitda, setShowEbitda] = useState(false)

  // Comparison state
  const [compA, setCompA] = useState('this_year')
  const [compB, setCompB] = useState('last_year')

  const range = rangeFor(rangeKey)

  // ── Delete handlers ────────────────────────────────────────────────────────
  const deleteAsset = useCallback(async (id:string) => {
    await fetch(`/api/assets/${id}`,{method:'DELETE'})
    setAssets(p=>p.filter(a=>a.id!==id))
  },[])
  const deleteLiability = useCallback(async (id:string) => {
    await fetch(`/api/liabilities/${id}`,{method:'DELETE'})
    setLiabilities(p=>p.filter(l=>l.id!==id))
  },[])

  // ── P&L core data ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const {start,end} = range
    const paidInvoices = invoices.filter(i=>i.displayStatus==='paid'&&inRange(i.issue_date,start,end))
    const payments     = directPayments.filter(p=>inRange(p.payment_date,start,end))
    const exps         = expenses.filter(e=>inRange(e.date,start,end))
    const invoiceRevenue = paidInvoices.reduce((s,i)=>s+Number(i.total_amount||0),0)
    const paymentRevenue = payments.reduce((s,p)=>s+Number(p.amount||0),0)
    const totalRevenue   = invoiceRevenue + paymentRevenue
    const cogsExp        = exps.filter(e=>e.is_cogs).reduce((s,e)=>s+Number(e.amount||0),0)
    const opexExp        = exps.filter(e=>!e.is_cogs).reduce((s,e)=>s+Number(e.amount||0),0)
    const totalExpenses  = exps.reduce((s,e)=>s+Number(e.amount||0),0)
    const grossProfit    = totalRevenue - cogsExp
    const ebit           = grossProfit - opexExp
    // Annual depreciation for EBITDA
    const annualDep      = assets.filter(a=>a.status==='active'&&a.workflow_status==='approved').reduce((s,a)=>s+calcDep(a).annualDep,0)
    const ebitda         = ebit + annualDep
    const profitMargin   = totalRevenue>0?(ebit/totalRevenue)*100:0
    const catMap = new Map<string,{name:string,color:string,amount:number}>()
    const addRev = (amount:number,catId:string|null) => {
      const cat=revCategories.find(c=>c.id===catId); const key=cat?.id||'__unc__'
      const cur=catMap.get(key)||{name:cat?.name||'Uncategorised',color:cat?.color||'#94A3B8',amount:0}
      catMap.set(key,{...cur,amount:cur.amount+amount})
    }
    paidInvoices.forEach(i=>addRev(Number(i.total_amount||0),i.revenue_category_id))
    payments.forEach(p=>addRev(Number(p.amount||0),p.revenue_category_id))
    const revByCategory = Array.from(catMap.values()).sort((a,b)=>b.amount-a.amount)
    const expCatMap = new Map<string,{name:string,color:string,amount:number}>()
    exps.forEach(e=>{
      const key=e.category||'other'
      const cur=expCatMap.get(key)||{name:(e.category||'Other'),color:EXP_COLORS[e.category]||'#94A3B8',amount:0}
      expCatMap.set(key,{...cur,amount:cur.amount+Number(e.amount||0)})
    })
    const expByCategory=Array.from(expCatMap.values()).sort((a,b)=>b.amount-a.amount)
    return {paidInvoices,payments,exps,invoiceRevenue,paymentRevenue,totalRevenue,totalExpenses,cogsExp,opexExp,grossProfit,ebit,ebitda,annualDep,profitMargin,revByCategory,expByCategory}
  },[invoices,directPayments,expenses,revCategories,rangeKey,assets])

  // ── 12-month period rows ───────────────────────────────────────────────────
  const periodRows = useMemo(()=>{
    const now=new Date()
    return Array.from({length:12},(_,i)=>{
      const d=new Date(now.getFullYear(),now.getMonth()-11+i,1); const y=d.getFullYear(),m=d.getMonth()
      const start=new Date(y,m,1),end=new Date(y,m+1,0)
      const rev=invoices.filter(inv=>inv.displayStatus==='paid'&&inRange(inv.issue_date,start,end)).reduce((s,i)=>s+Number(i.total_amount||0),0)
               +directPayments.filter(p=>inRange(p.payment_date,start,end)).reduce((s,p)=>s+Number(p.amount||0),0)
      const exp=expenses.filter(e=>inRange(e.date,start,end)).reduce((s,e)=>s+Number(e.amount||0),0)
      return {label:MONTHS[m],y,m,revenue:rev,expenses:exp,profit:rev-exp}
    })
  },[invoices,directPayments,expenses])

  // ── Comparison data ────────────────────────────────────────────────────────
  const compData = useMemo(()=>{
    const rA=rangeFor(compA), rB=rangeFor(compB)
    return {
      a: compCalc(invoices,directPayments,expenses,rA.start,rA.end),
      b: compCalc(invoices,directPayments,expenses,rB.start,rB.end),
      labelA: rA.label,
      labelB: rB.label,
    }
  },[invoices,directPayments,expenses,compA,compB])

  // ── Asset register computed values ────────────────────────────────────────
  const assetSummary = useMemo(()=>{
    const active=assets.filter(a=>a.status==='active'&&a.workflow_status==='approved')
    const allActive=assets.filter(a=>a.status==='active')
    const totalCost=active.reduce((s,a)=>s+Number(a.purchase_cost||0),0)
    const totalAccumDep=active.reduce((s,a)=>s+calcDep(a).accumulated,0)
    const totalNetBV=active.reduce((s,a)=>s+calcDep(a).bookValue,0)
    return {totalCost,totalAccumDep,totalNetBV,activeCount:active.length,allCount:allActive.length}
  },[assets])

  // ── Balance Sheet computed values ─────────────────────────────────────────
  const balanceSheet = useMemo(()=>{
    const cashBalance = latestCashBalance!==null ? Number(latestCashBalance) : null
    const ar = invoices.filter(i=>['sent','overdue'].includes(i.displayStatus)).reduce((s,i)=>s+Number(i.total_amount||0),0)
    const totalCurrentAssets = (cashBalance??0) + ar
    const totalFixedAssets = assetSummary.totalNetBV
    const totalAssets = totalCurrentAssets + totalFixedAssets
    const totalLiabilities = liabilities.reduce((s,l)=>s+Number(l.amount||0),0)
    const netEquity = totalAssets - totalLiabilities
    return {cashBalance,ar,totalCurrentAssets,totalFixedAssets,totalAssets,totalLiabilities,netEquity}
  },[invoices,assetSummary,liabilities,latestCashBalance])

  const RANGE_OPTS=[
    {key:'this_month',label:'This month'},{key:'last_month',label:'Last month'},
    {key:'this_quarter',label:'This quarter'},{key:'last_quarter',label:'Last quarter'},
    {key:'this_year',label:'This year'},{key:'last_year',label:'Last year'},
    {key:'all_time',label:'All time'},
  ]

  const TABS=[
    {key:'pl',         label:'P&L Statement',   icon:FileText  },
    {key:'period',     label:'Period Breakdown', icon:BarChart2 },
    {key:'comparison', label:'Comparison',       icon:GitCompare},
    {key:'assets',     label:'Asset Register',   icon:Building2 },
    {key:'balance',    label:'Balance Sheet',    icon:Scale     },
  ]

  const {totalRevenue,totalExpenses,grossProfit,ebit,ebitda,annualDep,cogsExp,opexExp,profitMargin,revByCategory,expByCategory}=filtered
  const waterfallMax = totalRevenue > 0 ? totalRevenue : 1

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",color:'#0A0A0A',maxWidth:1100,margin:'0 auto'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>

      {/* Print-only header */}
      <div className="print-only" style={{display:'none',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24,paddingBottom:16,borderBottom:'2px solid #0A0A0A'}}>
        <div>
          <p style={{fontSize:'1.3rem',fontWeight:800,fontFamily:"'Fraunces',serif",color:'#0A0A0A',letterSpacing:'-.02em'}}>Financial Reports</p>
          <p style={{fontSize:'.8rem',color:'#64748B',marginTop:4}}>{businessName}</p>
        </div>
        <p style={{fontSize:'.75rem',color:'#94A3B8',fontFamily:"'DM Mono',monospace"}}>
          Generated {new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}
        </p>
      </div>

      {/* Header */}
      <div className="no-print" style={{marginBottom:32}}>
        <Link href="/dashboard" style={{fontSize:'.75rem',fontWeight:700,color:'#94A3B8',textDecoration:'none',letterSpacing:'.02em'}}>← Dashboard</Link>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:16,marginTop:12}}>
          <div>
            <h1 className="f-display" style={{fontSize:'clamp(1.6rem,3vw,2.4rem)',fontWeight:800,letterSpacing:'-.022em',lineHeight:1.08,color:'#0A0A0A',marginBottom:5}}>Financial Reports</h1>
            <p style={{fontSize:'.875rem',color:'#64748B'}}>{businessName}</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <p style={{fontSize:'.7rem',color:'#94A3B8',fontStyle:'italic'}}>Prints across multiple pages</p>
            <button onClick={()=>window.print()} className="no-print" style={{display:'inline-flex',alignItems:'center',gap:7,padding:'9px 18px',border:'1px solid #E2E8F0',borderRadius:9,background:'#fff',color:'#374151',fontWeight:600,fontSize:'.8rem',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
              <Printer size={14}/> Print / Export
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="no-print" style={{display:'flex',gap:4,padding:'4px',background:'#F8FAFF',borderRadius:12,width:'fit-content',marginBottom:28,border:'1px solid #E2E8F0',flexWrap:'wrap'}}>
        {TABS.map(t=>(
          <button key={t.key} className={`rpt-tab ${tab===t.key?'rpt-tab-active':'rpt-tab-inactive'}`} onClick={()=>setTab(t.key as any)}>
            <t.icon size={13}/>{t.label}
          </button>
        ))}
      </div>

      {/* Date range — P&L only */}
      {tab==='pl' && (
        <div className="no-print" style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:28,alignItems:'center'}}>
          <span style={{fontSize:'.72rem',fontWeight:700,color:'#94A3B8',letterSpacing:'.06em',textTransform:'uppercase',marginRight:4}}>Period</span>
          {RANGE_OPTS.map(o=>(
            <button key={o.key} className={`rpt-range-btn ${rangeKey===o.key?'rpt-range-btn-active':''}`} onClick={()=>setRangeKey(o.key)}>{o.label}</button>
          ))}
        </div>
      )}

      {/* ══════════════════════ TAB: P&L ══════════════════════ */}
      {tab==='pl' && (
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span className="f-display" style={{fontSize:'1rem',fontWeight:700,color:'#0A0A0A',letterSpacing:'-.01em'}}>{range.label}</span>
            <span style={{fontSize:'.72rem',color:'#94A3B8',fontWeight:600}}>— Profit & Loss Statement</span>
          </div>

          {/* Stat cards */}
          <div className="stat-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
            {[
              {label:'Total Revenue',  value:fmtC(totalRevenue),  sub:`${filtered.paidInvoices.length} invoices + ${filtered.payments.length} payments`, color:'#0055FF', bg:'rgba(0,85,255,0.05)',   icon:TrendingUp},
              {label:'Total Expenses', value:fmtC(totalExpenses), sub:`${filtered.exps.length} expense entries`,                                          color:'#FF6B35', bg:'rgba(255,107,53,0.05)', icon:TrendingDown},
              {label:'Net Profit',     value:fmtC(ebit),          sub:ebit>=0?'After all operating costs':'Net loss',                                     color:ebit>=0?'#16A34A':'#DC2626', bg:ebit>=0?'rgba(22,163,74,0.05)':'rgba(220,38,38,0.05)', icon:ebit>=0?ArrowUpRight:ArrowDownRight},
              {label:'EBITDA',         value:fmtC(ebitda),        sub:`Adds back ${fmtC(annualDep)} depreciation`,                                        color:'#00C4A0', bg:'rgba(0,196,160,0.06)', icon:Minus},
            ].map(c=>(
              <div key={c.label} className="rpt-stat">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                  <p style={{fontSize:'.68rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#94A3B8'}}>{c.label}</p>
                  <div style={{width:28,height:28,borderRadius:7,background:c.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <c.icon size={14} color={c.color}/>
                  </div>
                </div>
                <p className="f-display" style={{fontSize:'1.65rem',fontWeight:800,color:c.color,letterSpacing:'-.02em',marginBottom:5}}>{c.value}</p>
                <p style={{fontSize:'.72rem',color:'#94A3B8'}}>{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Formal P&L table */}
          <div className="rpt-section">
            <div className="rpt-section-head" style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
              <div>
                <p style={{fontSize:'.68rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#94A3B8',marginBottom:4}}>Summary</p>
                <p className="f-display" style={{fontSize:'1.1rem',fontWeight:800,color:'#0A0A0A',letterSpacing:'-.02em'}}>Profit & Loss — {range.label}</p>
              </div>
              <button onClick={()=>setShowEbitda(!showEbitda)} style={{display:'inline-flex',alignItems:'center',gap:7,padding:'7px 14px',border:'1px solid #E2E8F0',borderRadius:8,background:showEbitda?'#0A0A0A':'#fff',color:showEbitda?'#fff':'#374151',fontWeight:600,fontSize:'.75rem',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'all .15s'}}>
                {showEbitda?<><XCircle size={12}/>Hide waterfall</> : <><Eye size={12}/>EBITDA waterfall</>}
              </button>
            </div>

            {/* EBITDA Waterfall view */}
            {showEbitda && (
              <div style={{padding:'20px 24px 8px',borderBottom:'1px solid #F1F5F9',background:'#FAFCFF'}}>
                <p style={{fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#94A3B8',marginBottom:16}}>Top-line to Bottom-line — {range.label}</p>
                <WaterfallRow label="Revenue (Top Line)" value={totalRevenue} max={waterfallMax} color="#0055FF" note="All invoices + direct payments"/>
                <WaterfallRow label="Cost of Goods (COGS)" value={-cogsExp} max={waterfallMax} color="#FF6B35" indent note="Expenses marked as COGS"/>
                <WaterfallRow label="Gross Profit" value={grossProfit} max={waterfallMax} color={grossProfit>=0?'#059669':'#DC2626'} isTotal note={`Margin: ${totalRevenue>0?((grossProfit/totalRevenue)*100).toFixed(1):'0'}%`}/>
                <div style={{height:1,background:'#F1F5F9',margin:'4px 0'}}/>
                <WaterfallRow label="Operating Expenses" value={-opexExp} max={waterfallMax} color="#F59E0B" indent note="Non-COGS expenses"/>
                <WaterfallRow label="EBIT" value={ebit} max={waterfallMax} color={ebit>=0?'#059669':'#DC2626'} isTotal note="Earnings Before Interest & Tax"/>
                <div style={{height:1,background:'#F1F5F9',margin:'4px 0'}}/>
                <WaterfallRow label="Depreciation (add back)" value={annualDep} max={waterfallMax} color="#00C4A0" indent note={`${assets.filter(a=>a.status==='active'&&a.workflow_status==='approved').length} approved assets`}/>
                <WaterfallRow label="EBITDA (Bottom Line)" value={ebitda} max={waterfallMax} color={ebitda>=0?'#00C4A0':'#DC2626'} isTotal note="Earnings Before Interest, Tax, Depreciation & Amortisation"/>
                <p style={{fontSize:'.68rem',color:'#94A3B8',paddingBottom:12,paddingTop:8}}>
                  Tag expenses as COGS in the <Link href="/dashboard/expenses" style={{color:'#0055FF',fontWeight:600,textDecoration:'none'}}>Expenses page</Link> to populate the COGS line.
                </p>
              </div>
            )}

            <table className="rpt-table">
              <thead><tr><th style={{paddingTop:16}}>Item</th><th style={{paddingTop:16}}>Amount</th></tr></thead>
              <tbody>
                <tr><td style={{fontWeight:700,color:'#0A0A0A'}}>Revenue</td><td/></tr>
                <tr><td style={{paddingLeft:40,color:'#6B7280'}}>Invoice payments received</td><td style={{color:'#0A0A0A',fontWeight:600}}>{fmtC(filtered.invoiceRevenue)}</td></tr>
                <tr><td style={{paddingLeft:40,color:'#6B7280'}}>Direct payments</td><td style={{color:'#0A0A0A',fontWeight:600}}>{fmtC(filtered.paymentRevenue)}</td></tr>
                <tr style={{borderTop:'1px solid #E2E8F0'}}><td style={{fontWeight:800,color:'#0055FF',paddingLeft:40}}>Total Revenue</td><td style={{fontWeight:800,color:'#0055FF'}}>{fmtC(totalRevenue)}</td></tr>
                <tr><td style={{paddingTop:8,color:'#fff'}}>–</td><td/></tr>
                <tr><td style={{fontWeight:700,color:'#0A0A0A'}}>Expenses</td><td/></tr>
                {cogsExp>0&&<tr><td style={{paddingLeft:40,color:'#6B7280'}}>Cost of goods sold (COGS)</td><td style={{color:'#FF6B35',fontWeight:600}}>({fmtC(cogsExp)})</td></tr>}
                {opexExp>0&&<tr><td style={{paddingLeft:40,color:'#6B7280'}}>Operating expenses (OpEx)</td><td style={{color:'#FF6B35',fontWeight:600}}>({fmtC(opexExp)})</td></tr>}
                {expByCategory.length===0
                  ? <tr><td style={{paddingLeft:40,color:'#94A3B8',fontStyle:'italic'}}>No expenses recorded</td><td style={{color:'#94A3B8'}}>{fmtC(0)}</td></tr>
                  : expByCategory.map(c=><tr key={c.name}><td style={{paddingLeft:56,color:'#94A3B8',fontSize:'.77rem',textTransform:'capitalize'}}>↳ {c.name}</td><td style={{color:'#94A3B8',fontSize:'.75rem'}}>({fmtC(c.amount)})</td></tr>)
                }
                <tr style={{borderTop:'1px solid #E2E8F0'}}><td style={{fontWeight:800,color:'#FF6B35',paddingLeft:40}}>Total Expenses</td><td style={{fontWeight:800,color:'#FF6B35'}}>({fmtC(totalExpenses)})</td></tr>
                <tr><td style={{paddingTop:4,color:'#fff'}}>–</td><td/></tr>
                {annualDep>0&&<tr><td style={{paddingLeft:40,color:'#6B7280'}}>Depreciation (asset register)</td><td style={{color:'#00C4A0',fontWeight:600}}>+{fmtC(annualDep)}</td></tr>}
              </tbody>
              <tfoot>
                <tr className="rpt-total-row">
                  <td style={{color:ebit>=0?'#16A34A':'#DC2626',fontSize:'.9rem'}}>NET {ebit>=0?'PROFIT':'LOSS'} (EBIT) — {range.label}</td>
                  <td style={{color:ebit>=0?'#16A34A':'#DC2626',fontSize:'.9rem'}}>{fmtC(ebit)}</td>
                </tr>
                <tr>
                  <td style={{paddingLeft:40,color:'#00C4A0',fontWeight:700,fontSize:'.83rem',paddingBottom:14}}>EBITDA</td>
                  <td style={{textAlign:'right',paddingRight:24,color:'#00C4A0',fontWeight:800,fontFamily:"'DM Mono',monospace",fontSize:'.83rem',paddingBottom:14}}>{fmtC(ebitda)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Category breakdowns */}
          <div className="cat-cols" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div className="rpt-section">
              <div className="rpt-section-head"><p style={{fontSize:'.68rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#94A3B8',marginBottom:4}}>Revenue breakdown</p><p style={{fontWeight:800,fontSize:'.9rem',color:'#0A0A0A',letterSpacing:'-.01em'}}>By income category</p></div>
              {revByCategory.length===0
                ? <div style={{padding:'28px 24px',textAlign:'center'}}><p style={{fontSize:'.825rem',color:'#94A3B8'}}>No revenue in this period</p></div>
                : <div style={{padding:'8px 0'}}>
                    {revByCategory.map(c=><CatRow key={c.name} name={c.name} amount={c.amount} total={totalRevenue} color={c.color}/>)}
                    <div style={{padding:'12px 24px',borderTop:'1px solid #F1F5F9',display:'flex',justifyContent:'space-between'}}><span style={{fontSize:'.75rem',fontWeight:700,color:'#374151'}}>Total</span><span className="f-mono" style={{fontSize:'.82rem',fontWeight:800,color:'#0055FF'}}>{fmtC(totalRevenue)}</span></div>
                  </div>
              }
            </div>
            <div className="rpt-section">
              <div className="rpt-section-head"><p style={{fontSize:'.68rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#94A3B8',marginBottom:4}}>Expense breakdown</p><p style={{fontWeight:800,fontSize:'.9rem',color:'#0A0A0A',letterSpacing:'-.01em'}}>By expense category</p></div>
              {expByCategory.length===0
                ? <div style={{padding:'28px 24px',textAlign:'center'}}><p style={{fontSize:'.825rem',color:'#94A3B8'}}>No expenses in this period</p></div>
                : <div style={{padding:'8px 0'}}>
                    {expByCategory.map(c=><CatRow key={c.name} name={c.name} amount={c.amount} total={totalExpenses} color={c.color}/>)}
                    <div style={{padding:'12px 24px',borderTop:'1px solid #F1F5F9',display:'flex',justifyContent:'space-between'}}><span style={{fontSize:'.75rem',fontWeight:700,color:'#374151'}}>Total</span><span className="f-mono" style={{fontSize:'.82rem',fontWeight:800,color:'#FF6B35'}}>{fmtC(totalExpenses)}</span></div>
                  </div>
              }
            </div>
          </div>

          {totalRevenue===0&&totalExpenses===0&&(
            <div style={{background:'#F8FAFF',border:'1px solid rgba(0,85,255,0.1)',borderRadius:12,padding:'16px 20px',display:'flex',alignItems:'center',gap:10}}>
              <Info size={14} color="#0055FF"/>
              <p style={{fontSize:'.82rem',color:'#64748B'}}>No data for <strong>{range.label}</strong>. Try a different period or <Link href="/dashboard/invoices" style={{color:'#0055FF',fontWeight:600,textDecoration:'none'}}>record some invoices</Link>.</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════ TAB: PERIOD ══════════════════════ */}
      {tab==='period' && (
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span className="f-display" style={{fontSize:'1rem',fontWeight:700,color:'#0A0A0A',letterSpacing:'-.01em'}}>Last 12 months</span>
            <span style={{fontSize:'.72rem',color:'#94A3B8',fontWeight:600}}>— Revenue vs Expenses by month</span>
          </div>
          <div className="rpt-section"><div className="rpt-section-head"><p style={{fontWeight:800,fontSize:'.9rem',color:'#0A0A0A',letterSpacing:'-.01em'}}>12-month overview</p></div><PeriodChart rows={periodRows}/></div>
          <div className="rpt-section">
            <div className="rpt-section-head"><p style={{fontSize:'.68rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#94A3B8',marginBottom:4}}>Month by month</p><p style={{fontWeight:800,fontSize:'.9rem',color:'#0A0A0A',letterSpacing:'-.01em'}}>Period statements</p></div>
            <table className="rpt-table">
              <thead><tr><th style={{paddingTop:16}}>Period</th><th style={{paddingTop:16}}>Revenue</th><th style={{paddingTop:16}}>Expenses</th><th style={{paddingTop:16}}>Net Profit</th><th style={{paddingTop:16}}>Margin</th></tr></thead>
              <tbody>
                {[...periodRows].reverse().map((r,i)=>{
                  const margin=r.revenue>0?(r.profit/r.revenue)*100:null
                  const pc=r.profit>0?'#16A34A':r.profit<0?'#DC2626':'#94A3B8'
                  const hasData=r.revenue>0||r.expenses>0
                  return (
                    <tr key={i} style={{opacity:hasData?1:0.4}}>
                      <td style={{fontWeight:600,color:'#0A0A0A'}}>{r.label} {r.y}</td>
                      <td style={{color:'#0055FF',fontWeight:600}}>{r.revenue>0?fmtC(r.revenue):'—'}</td>
                      <td style={{color:'#FF6B35',fontWeight:600}}>{r.expenses>0?`(${fmtC(r.expenses)})`:'—'}</td>
                      <td style={{color:pc,fontWeight:800}}>{hasData?fmtC(r.profit):'—'}</td>
                      <td style={{color:pc}}>{margin!==null?`${margin.toFixed(1)}%`:'—'}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="rpt-total-row">
                  <td>12-month total</td>
                  <td style={{color:'#0055FF'}}>{fmtC(periodRows.reduce((s,r)=>s+r.revenue,0))}</td>
                  <td style={{color:'#FF6B35'}}>({fmtC(periodRows.reduce((s,r)=>s+r.expenses,0))})</td>
                  <td style={{color:periodRows.reduce((s,r)=>s+r.profit,0)>=0?'#16A34A':'#DC2626'}}>{fmtC(periodRows.reduce((s,r)=>s+r.profit,0))}</td>
                  <td>{(()=>{const rv=periodRows.reduce((s,r)=>s+r.revenue,0),pr=periodRows.reduce((s,r)=>s+r.profit,0);return rv>0?`${((pr/rv)*100).toFixed(1)}%`:'—'})()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════ TAB: COMPARISON ══════════════════════ */}
      {tab==='comparison' && (
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span className="f-display" style={{fontSize:'1rem',fontWeight:700,color:'#0A0A0A',letterSpacing:'-.01em'}}>Period Comparison</span>
            <span style={{fontSize:'.72rem',color:'#94A3B8',fontWeight:600}}>— compare any two periods side by side</span>
          </div>

          {/* Period selectors */}
          <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:16,alignItems:'center'}}>
            <div className="rpt-section" style={{padding:'16px 20px'}}>
              <p style={{fontSize:'.66rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.09em',color:'#94A3B8',marginBottom:10}}>Period A</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {RANGE_OPTS.map(o=>(
                  <button key={o.key} className={`rpt-range-btn ${compA===o.key?'rpt-range-btn-active':''}`} onClick={()=>setCompA(o.key)}>{o.label}</button>
                ))}
              </div>
              <p style={{marginTop:10,fontSize:'.78rem',fontWeight:700,color:'#0055FF'}}>{rangeFor(compA).label}</p>
            </div>
            <div style={{textAlign:'center',fontSize:'1.2rem',fontWeight:800,color:'#94A3B8'}}>vs</div>
            <div className="rpt-section" style={{padding:'16px 20px'}}>
              <p style={{fontSize:'.66rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.09em',color:'#94A3B8',marginBottom:10}}>Period B</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {RANGE_OPTS.map(o=>(
                  <button key={o.key} className={`rpt-range-btn ${compB===o.key?'rpt-range-btn-active':''}`} onClick={()=>setCompB(o.key)}>{o.label}</button>
                ))}
              </div>
              <p style={{marginTop:10,fontSize:'.78rem',fontWeight:700,color:'#0055FF'}}>{rangeFor(compB).label}</p>
            </div>
          </div>

          {/* Comparison table */}
          <div className="rpt-section">
            <div className="rpt-section-head">
              <p style={{fontSize:'.68rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#94A3B8',marginBottom:4}}>Side-by-side comparison</p>
              <p className="f-display" style={{fontSize:'1.1rem',fontWeight:800,color:'#0A0A0A',letterSpacing:'-.02em'}}>{compData.labelA} vs {compData.labelB}</p>
            </div>
            <table className="rpt-table">
              <thead>
                <tr>
                  <th style={{paddingTop:16,textAlign:'left'}}>Metric</th>
                  <th style={{paddingTop:16}}>{compData.labelA}</th>
                  <th style={{paddingTop:16}}>{compData.labelB}</th>
                  <th style={{paddingTop:16}}>Change</th>
                  <th style={{paddingTop:16}}>% Change</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {label:'Total Revenue',  a:compData.a.revenue,  b:compData.b.revenue,  color:'#0055FF', inv:false},
                  {label:'Gross Profit',   a:compData.a.gross,    b:compData.b.gross,    color:'#374151', inv:false},
                  {label:'Total Expenses', a:compData.a.totalExp, b:compData.b.totalExp, color:'#FF6B35', inv:true},
                  {label:'EBIT (Net Profit)',a:compData.a.ebit,   b:compData.b.ebit,     color:'#374151', inv:false},
                  {label:'EBITDA',         a:compData.a.ebitda,   b:compData.b.ebitda,   color:'#00C4A0', inv:false},
                ].map(row=>{
                  const diff=row.a-row.b
                  const pct=row.b!==0?(diff/Math.abs(row.b))*100:null
                  const isGood=row.inv?diff<0:diff>0
                  const col=diff===0?'#94A3B8':isGood?'#059669':'#DC2626'
                  const arrow=diff>0?'↑':diff<0?'↓':'→'
                  return (
                    <tr key={row.label}>
                      <td style={{fontWeight:600,color:'#0A0A0A',textAlign:'left',fontFamily:"'DM Sans',sans-serif"}}>{row.label}</td>
                      <td style={{color:row.color,fontWeight:700}}>{fmtC(row.a)}</td>
                      <td style={{color:'#64748B'}}>{fmtC(row.b)}</td>
                      <td style={{color:col,fontWeight:700}}>{arrow} {fmtC(Math.abs(diff))}</td>
                      <td style={{color:col,fontWeight:700}}>{pct!==null?`${Math.abs(pct).toFixed(1)}%`:'—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Visual comparison bars */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {[
              {label:'Revenue',  a:compData.a.revenue,  b:compData.b.revenue,  colorA:'#0055FF', colorB:'rgba(0,85,255,0.35)'},
              {label:'Expenses', a:compData.a.totalExp, b:compData.b.totalExp, colorA:'#FF6B35', colorB:'rgba(255,107,53,0.35)'},
              {label:'Net Profit',a:compData.a.ebit,    b:compData.b.ebit,     colorA:'#16A34A', colorB:'rgba(22,163,74,0.35)'},
              {label:'EBITDA',   a:compData.a.ebitda,   b:compData.b.ebitda,   colorA:'#00C4A0', colorB:'rgba(0,196,160,0.35)'},
            ].map(m=>{
              const max=Math.max(Math.abs(m.a),Math.abs(m.b),1)
              return (
                <div key={m.label} className="rpt-section" style={{padding:'18px 20px'}}>
                  <p style={{fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#94A3B8',marginBottom:14}}>{m.label}</p>
                  {[{val:m.a,label:compData.labelA,color:m.colorA},{val:m.b,label:compData.labelB,color:m.colorB}].map((bar,barIdx)=>(
                    <div key={barIdx} style={{marginBottom:10}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                        <span style={{fontSize:'.75rem',color:'#64748B',fontWeight:600}}>{bar.label}</span>
                        <span className="f-mono" style={{fontSize:'.75rem',fontWeight:700,color:'#0A0A0A'}}>{fmtC(bar.val)}</span>
                      </div>
                      <div style={{background:'#F1F5F9',borderRadius:5,height:8,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${(Math.abs(bar.val)/max)*100}%`,background:bar.color,borderRadius:5,transition:'width .4s'}}/>
                      </div>
                    </div>
                  ))}
                  {(()=>{const diff=m.a-m.b,pct=m.b!==0?(diff/Math.abs(m.b))*100:null,up=diff>0;return(
                    <p style={{marginTop:10,fontSize:'.72rem',fontWeight:700,color:diff===0?'#94A3B8':up?'#059669':'#DC2626'}}>
                      {diff===0?'No change':`${up?'↑':'↓'} ${fmtC(Math.abs(diff))}${pct!==null?` (${Math.abs(pct).toFixed(1)}%)`:''} vs ${compData.labelB}`}
                    </p>
                  )})()}
                </div>
              )
            })}
          </div>

          {/* YoY growth note */}
          {(()=>{
            const now=new Date(),y=now.getFullYear()
            const thisYearStart=new Date(y,0,1),thisYearEnd=new Date(y,11,31)
            const lastYearStart=new Date(y-1,0,1),lastYearEnd=new Date(y-1,11,31)
            const tyRev=compCalc(invoices,directPayments,expenses,thisYearStart,thisYearEnd).revenue
            const lyRev=compCalc(invoices,directPayments,expenses,lastYearStart,lastYearEnd).revenue
            if(lyRev===0) return null
            const yoyGrowth=((tyRev-lyRev)/lyRev)*100
            return (
              <div style={{background:yoyGrowth>=0?'rgba(5,150,105,0.05)':'rgba(220,38,38,0.04)',border:`1px solid ${yoyGrowth>=0?'rgba(5,150,105,0.2)':'rgba(220,38,38,0.15)'}`,borderRadius:12,padding:'14px 18px',display:'flex',alignItems:'center',gap:10}}>
                <TrendingUp size={16} color={yoyGrowth>=0?'#059669':'#DC2626'}/>
                <p style={{fontSize:'.83rem',color:'#374151'}}>
                  <strong>Year-on-year growth:</strong> Revenue is <strong style={{color:yoyGrowth>=0?'#059669':'#DC2626'}}>{yoyGrowth>=0?'+':''}{yoyGrowth.toFixed(1)}%</strong> vs the same period last year ({fmtC(lyRev)} → {fmtC(tyRev)})
                </p>
              </div>
            )
          })()}
        </div>
      )}

      {/* ══════════════════════ TAB: ASSET REGISTER ══════════════════════ */}
      {tab==='assets' && (
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span className="f-display" style={{fontSize:'1rem',fontWeight:700,color:'#0A0A0A',letterSpacing:'-.01em'}}>Asset Register</span>
              <span style={{fontSize:'.72rem',color:'#94A3B8',fontWeight:600}}>— Fixed asset summary & depreciation schedule</span>
            </div>
            {assets.filter(a=>a.workflow_status==='pending_review').length>0&&(
              <div style={{display:'flex',alignItems:'center',gap:7,padding:'6px 12px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:8}}>
                <Clock size={12} color="#D97706"/>
                <span style={{fontSize:'.75rem',fontWeight:700,color:'#D97706'}}>{assets.filter(a=>a.workflow_status==='pending_review').length} pending review</span>
              </div>
            )}
          </div>

          {/* Summary cards — approved assets only */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
            {[
              {label:'Total at Cost',              value:fmtC(assetSummary.totalCost),      sub:`${assetSummary.activeCount} approved assets`,  color:'#0055FF'},
              {label:'Accumulated Depreciation',   value:fmtC(assetSummary.totalAccumDep),  sub:'Straight-line to date',                        color:'#FF6B35'},
              {label:'Net Book Value',              value:fmtC(assetSummary.totalNetBV),     sub:'Current carrying value',                       color:'#16A34A'},
            ].map(c=>(
              <div key={c.label} className="rpt-stat">
                <p style={{fontSize:'.68rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#94A3B8',marginBottom:12}}>{c.label}</p>
                <p className="f-display" style={{fontSize:'1.55rem',fontWeight:800,color:c.color,letterSpacing:'-.02em',marginBottom:5}}>{c.value}</p>
                <p style={{fontSize:'.72rem',color:'#94A3B8'}}>{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Assets table */}
          <div className="rpt-section">
            <div className="rpt-section-head" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <p style={{fontSize:'.68rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#94A3B8',marginBottom:4}}>Fixed assets</p>
                <p style={{fontWeight:800,fontSize:'.9rem',color:'#0A0A0A',letterSpacing:'-.01em'}}>{assets.length} assets registered</p>
              </div>
            </div>
            {assets.length===0 ? (
              <div style={{padding:'40px 24px',textAlign:'center'}}>
                <p style={{fontSize:'.875rem',color:'#94A3B8',marginBottom:6}}>No assets registered yet.</p>
                <p style={{fontSize:'.8rem',color:'#C4CBDA'}}>Add your first asset below — computers, equipment, vehicles, furniture, software licences.</p>
              </div>
            ) : (
              <table className="rpt-table">
                <thead>
                  <tr>
                    <th style={{paddingTop:16,textAlign:'left'}}>Asset</th>
                    <th style={{paddingTop:16,textAlign:'left'}}>Serial No.</th>
                    <th style={{paddingTop:16}}>Status</th>
                    <th style={{paddingTop:16}}>Purchased</th>
                    <th style={{paddingTop:16}}>Cost</th>
                    <th style={{paddingTop:16}}>Book Value</th>
                    <th style={{paddingTop:16}}>Annual Dep.</th>
                    <th style={{paddingTop:16}}/>
                  </tr>
                </thead>
                <tbody>
                  {assets.map(a=>{
                    const {annualDep,accumulated,bookValue}=calcDep(a)
                    const fullyDep=accumulated>=(Number(a.purchase_cost)-Number(a.salvage_value||0))-0.01
                    const wfStatus=a.workflow_status||'approved'
                    const isApproved=wfStatus==='approved'
                    return (
                      <tr key={a.id} style={{opacity:wfStatus==='rejected'?0.5:1}}>
                        <td style={{textAlign:'left'}}>
                          <div style={{display:'flex',flexDirection:'column',gap:2}}>
                            <span style={{fontWeight:700,color:'#0A0A0A',fontFamily:"'DM Sans',sans-serif"}}>{a.name}</span>
                            <span style={{fontSize:'.72rem',color:'#94A3B8',textTransform:'capitalize'}}>{a.category} · {a.useful_life_years}yr life</span>
                            {a.rejection_note&&<span style={{fontSize:'.68rem',color:'#DC2626',fontStyle:'italic'}}>Rejected: {a.rejection_note}</span>}
                          </div>
                        </td>
                        <td style={{textAlign:'left',fontFamily:"'DM Mono',monospace",fontSize:'.77rem',color:a.serial_number?'#374151':'#C4CBDA'}}>
                          {a.has_serial_number===false ? <span style={{color:'#C4CBDA',fontFamily:"'DM Sans',sans-serif",fontStyle:'italic',fontSize:'.72rem'}}>No S/N</span> : (a.serial_number||<span style={{color:'#C4CBDA',fontStyle:'italic',fontFamily:"'DM Sans',sans-serif",fontSize:'.72rem'}}>Not set</span>)}
                        </td>
                        <td><WFBadge status={wfStatus}/></td>
                        <td className="f-mono" style={{color:'#6B7280',fontSize:'.77rem'}}>{new Date(a.purchase_date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td>
                        <td style={{fontWeight:600,color:'#0A0A0A'}}>{fmtC(Number(a.purchase_cost))}</td>
                        <td style={{fontWeight:800,color:!isApproved?'#94A3B8':fullyDep?'#94A3B8':'#16A34A'}}>{isApproved?fmtC(bookValue):'—'}</td>
                        <td style={{color:'#6B7280'}}>{isApproved?`${fmtC(annualDep)}/yr`:'—'}</td>
                        <td style={{textAlign:'right',paddingRight:16}}>
                          <button className="del-btn" onClick={()=>deleteAsset(a.id)} title="Remove asset"><Trash2 size={13}/></button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="rpt-total-row">
                    <td colSpan={4}>Total (approved only)</td>
                    <td style={{color:'#0055FF'}}>{fmtC(assetSummary.totalCost)}</td>
                    <td style={{color:'#16A34A'}}>{fmtC(assetSummary.totalNetBV)}</td>
                    <td colSpan={2}/>
                  </tr>
                </tfoot>
              </table>
            )}
            <AddAssetForm onAdd={a=>setAssets(p=>[a,...p])}/>
          </div>

          {/* Liabilities */}
          <div className="rpt-section">
            <div className="rpt-section-head" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <p style={{fontSize:'.68rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#94A3B8',marginBottom:4}}>Liabilities</p>
                <p style={{fontWeight:800,fontSize:'.9rem',color:'#0A0A0A',letterSpacing:'-.01em'}}>Outstanding obligations</p>
              </div>
              <span className="f-display" style={{fontSize:'1.2rem',fontWeight:800,color:'#FF6B35'}}>
                {fmtC(liabilities.reduce((s,l)=>s+Number(l.amount||0),0))}
              </span>
            </div>
            {liabilities.length===0 ? (
              <div style={{padding:'32px 24px',textAlign:'center'}}>
                <p style={{fontSize:'.875rem',color:'#94A3B8',marginBottom:6}}>No liabilities logged.</p>
                <p style={{fontSize:'.8rem',color:'#C4CBDA'}}>Add loans, credit card balances, or any outstanding obligations below.</p>
              </div>
            ) : (
              <table className="rpt-table">
                <thead><tr><th style={{paddingTop:16,textAlign:'left'}}>Name</th><th style={{paddingTop:16,textAlign:'left'}}>Type</th><th style={{paddingTop:16}}>Amount</th><th style={{paddingTop:16}}/></tr></thead>
                <tbody>
                  {liabilities.map(l=>(
                    <tr key={l.id}>
                      <td style={{textAlign:'left'}}>
                        <div style={{display:'flex',flexDirection:'column',gap:2}}>
                          <span style={{fontWeight:600,color:'#0A0A0A',fontFamily:"'DM Sans',sans-serif"}}>{l.name}</span>
                          {l.notes&&<span style={{fontSize:'.72rem',color:'#94A3B8'}}>{l.notes}</span>}
                        </div>
                      </td>
                      <td style={{color:'#6B7280',textAlign:'left',textTransform:'capitalize',fontFamily:"'DM Sans',sans-serif"}}>{l.liability_type.replace('_',' ')}</td>
                      <td style={{fontWeight:800,color:'#FF6B35'}}>{fmtC(Number(l.amount))}</td>
                      <td style={{textAlign:'right',paddingRight:16}}><button className="del-btn" onClick={()=>deleteLiability(l.id)} title="Remove"><Trash2 size={13}/></button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="rpt-total-row">
                    <td colSpan={2}>Total liabilities</td>
                    <td style={{color:'#FF6B35'}}>{fmtC(liabilities.reduce((s,l)=>s+Number(l.amount||0),0))}</td>
                    <td/>
                  </tr>
                </tfoot>
              </table>
            )}
            <AddLiabilityForm onAdd={l=>setLiabilities(p=>[l,...p])}/>
          </div>
        </div>
      )}

      {/* ══════════════════════ TAB: BALANCE SHEET ══════════════════════ */}
      {tab==='balance' && (
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span className="f-display" style={{fontSize:'1rem',fontWeight:700,color:'#0A0A0A',letterSpacing:'-.01em'}}>Balance Sheet</span>
            <span style={{fontSize:'.72rem',color:'#94A3B8',fontWeight:600}}>— as at {new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</span>
          </div>
          <div className="bs-hero" style={{background:'linear-gradient(135deg,#002ECC 0%,#0044EE 40%,#0055FF 70%,#003DCC 100%)',borderRadius:16,padding:'28px 32px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 60% 80% at 110% 50%,rgba(0,196,160,0.2) 0%,transparent 60%)',pointerEvents:'none'}}/>
            {[
              {label:'Total Assets',      value:fmtC(balanceSheet.totalAssets)      },
              {label:'Total Liabilities', value:fmtC(balanceSheet.totalLiabilities) },
              {label:'Net Equity',        value:fmtC(balanceSheet.netEquity)        },
            ].map(c=>(
              <div key={c.label} style={{padding:'0 24px',borderRight:c.label!=='Net Equity'?'1px solid rgba(255,255,255,0.1)':'none',position:'relative'}}>
                <p style={{fontSize:'.68rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'rgba(255,255,255,0.4)',marginBottom:8}}>{c.label}</p>
                <p className="f-display" style={{fontSize:'1.55rem',fontWeight:800,letterSpacing:'-.02em',color:'#fff'}}>{c.value}</p>
              </div>
            ))}
          </div>
          <div className="rpt-section">
            <div className="rpt-section-head">
              <p style={{fontSize:'.68rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#94A3B8',marginBottom:4}}>Statement of Financial Position</p>
              <p className="f-display" style={{fontSize:'1.1rem',fontWeight:800,color:'#0A0A0A',letterSpacing:'-.02em'}}>Balance Sheet — {new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'})}</p>
            </div>
            <table className="rpt-table">
              <thead><tr><th style={{paddingTop:16,textAlign:'left'}}>Item</th><th style={{paddingTop:16}}>Amount</th></tr></thead>
              <tbody>
                <tr><td style={{fontWeight:800,color:'#0A0A0A',paddingTop:16,textAlign:'left'}}>ASSETS</td><td/></tr>
                <tr><td style={{paddingLeft:32,fontWeight:700,color:'#374151',paddingTop:12,textAlign:'left'}}>Current Assets</td><td/></tr>
                <BSRow label="Cash on hand" amount={balanceSheet.cashBalance} indent color="#0055FF"/>
                <BSRow label="Accounts receivable (unpaid invoices)" amount={balanceSheet.ar} indent color="#0055FF"/>
                <BSRow label="Total Current Assets" amount={balanceSheet.totalCurrentAssets} bold color="#0055FF"/>
                <tr><td style={{paddingLeft:32,fontWeight:700,color:'#374151',paddingTop:12,borderTop:'1px solid #F1F5F9',textAlign:'left'}}>Fixed Assets</td><td/></tr>
                <BSRow label="Assets at cost" amount={assetSummary.totalCost} indent/>
                <BSRow label="Less: accumulated depreciation" amount={-assetSummary.totalAccumDep} indent color="#FF6B35"/>
                <BSRow label="Net book value of fixed assets" amount={assetSummary.totalNetBV} bold color="#16A34A"/>
              </tbody>
              <tfoot>
                <tr className="rpt-total-row">
                  <td style={{fontSize:'.88rem',textAlign:'left'}}>TOTAL ASSETS</td>
                  <td style={{color:'#0055FF',fontSize:'.88rem'}}>{fmtC(balanceSheet.totalAssets)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="rpt-section">
            <table className="rpt-table">
              <thead><tr><th style={{paddingTop:16,textAlign:'left'}}>Item</th><th style={{paddingTop:16}}>Amount</th></tr></thead>
              <tbody>
                <tr><td style={{fontWeight:800,color:'#0A0A0A',paddingTop:16,textAlign:'left'}}>LIABILITIES</td><td/></tr>
                {liabilities.length===0
                  ? <BSRow label="No liabilities recorded" amount={0} indent/>
                  : liabilities.map(l=><BSRow key={l.id} label={l.name} amount={Number(l.amount)} indent color="#FF6B35"/>)
                }
                <BSRow label="Total Liabilities" amount={balanceSheet.totalLiabilities} bold color="#FF6B35"/>
                <tr><td style={{paddingTop:4,color:'#fff'}}>–</td><td/></tr>
                <tr><td style={{fontWeight:800,color:'#0A0A0A',paddingTop:12,textAlign:'left'}}>EQUITY</td><td/></tr>
                <BSRow label="Net equity (assets minus liabilities)" amount={balanceSheet.netEquity} indent color={balanceSheet.netEquity>=0?'#16A34A':'#DC2626'}/>
              </tbody>
              <tfoot>
                <tr className="rpt-total-row">
                  <td style={{fontSize:'.88rem',textAlign:'left'}}>TOTAL LIABILITIES + EQUITY</td>
                  <td style={{color:balanceSheet.netEquity>=0?'#16A34A':'#DC2626',fontSize:'.88rem'}}>{fmtC(balanceSheet.totalLiabilities+balanceSheet.netEquity)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {balanceSheet.cashBalance===null && (
            <div style={{background:'#FFF8F5',border:'1px solid rgba(255,107,53,0.15)',borderRadius:12,padding:'14px 18px',display:'flex',alignItems:'center',gap:10}}>
              <Info size={14} color="#FF6B35"/>
              <p style={{fontSize:'.8rem',color:'#64748B'}}>No cash snapshot on record. <Link href="/dashboard/cash" style={{color:'#0055FF',fontWeight:600,textDecoration:'none'}}>Add a cash balance</Link> on the Cash Flow page to populate the current assets section.</p>
            </div>
          )}
          {assets.length===0 && (
            <div style={{background:'#F8FAFF',border:'1px solid rgba(0,85,255,0.1)',borderRadius:12,padding:'14px 18px',display:'flex',alignItems:'center',gap:10}}>
              <Info size={14} color="#0055FF"/>
              <p style={{fontSize:'.8rem',color:'#64748B'}}>Fixed assets section is empty. <button onClick={()=>setTab('assets')} style={{color:'#0055FF',fontWeight:600,background:'none',border:'none',cursor:'pointer',padding:0,fontSize:'.8rem',fontFamily:"'DM Sans',sans-serif"}}>Go to Asset Register →</button></p>
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
