'use client'
// src/components/landing/landing-page-client.tsx — v5.0
// Design: Framer-quality polish, Replit-level energy, Invonaut calm professionalism
// Gradient mesh hero · Interactive demo · Vibrant CTA · Fraunces editorial headlines

import { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, Zap, FileText, TrendingUp, Users, Clock, Shield } from 'lucide-react'
import LandingPricingSection from '@/components/landing-pricing-section'

// ─── Global styles ────────────────────────────────────────────────────────────
const CSS = `
  .f-display { font-family:'Fraunces',serif; font-optical-sizing:auto; }
  .f-mono    { font-family:'DM Mono',monospace; }
  :root {
    --ink:   #07070F;
    --blue:  #0055FF;
    --teal:  #00C4A0;
    --orange:#FF6B35;
    --mid:   #64748B;
    --faint: #94A3B8;
    --rule:  #E2E8F0;
    --surf:  #F8FAFF;
    --surf2: #EFF4FF;
  }
  .grad-text {
    background: linear-gradient(135deg, var(--blue) 0%, #3B82F6 50%, var(--teal) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .hero-mesh {
    background:
      radial-gradient(ellipse 90% 70% at 105% -5%,  rgba(0,85,255,0.09) 0%, transparent 55%),
      radial-gradient(ellipse 60% 50% at -5%  110%,  rgba(0,196,160,0.07) 0%, transparent 55%),
      radial-gradient(ellipse 40% 40% at 50%  -10%,  rgba(99,102,241,0.04) 0%, transparent 50%),
      #ffffff;
  }
  @keyframes cursor-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
  .log-cursor::after { content:'▋'; animation:cursor-blink 1.1s step-end infinite; margin-left:3px; color:var(--teal); font-size:.85em; }

  @keyframes float-up { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .demo-tab-content > * { animation:float-up .3s ease both; }

  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0   rgba(0,85,255,0.35); }
    70%  { box-shadow: 0 0 0 8px rgba(0,85,255,0);    }
    100% { box-shadow: 0 0 0 0   rgba(0,85,255,0);    }
  }
  .live-dot { animation: pulse-ring 2s ease-out infinite; }

  @media(max-width:900px){
    .hero-grid     { grid-template-columns:1fr !important; }
    .steps-grid    { grid-template-columns:1fr 1fr !important; }
    .auto-row      { grid-template-columns:1fr !important; gap:4px !important; }
    .auto-sched    { display:none !important; }
    .trust-grid    { grid-template-columns:1fr 1fr !important; }
    .footer-grid   { grid-template-columns:1fr 1fr !important; }
    .cta-grid      { grid-template-columns:1fr !important; }
    .demo-tabs     { overflow-x:auto; }
  }
  @media(max-width:600px){
    .steps-grid  { grid-template-columns:1fr !important; }
    .trust-grid  { grid-template-columns:1fr !important; }
    .footer-grid { grid-template-columns:1fr !important; }
  }
`

// ─── Animations ───────────────────────────────────────────────────────────────
const E = [0.16, 1, 0.3, 1] as const
const fadeUp = { hidden:{opacity:0,y:20}, show:{opacity:1,y:0,transition:{duration:.6,ease:E}} }
const stagger = (d=.09) => ({ hidden:{}, show:{transition:{staggerChildren:d,delayChildren:.04}} })

function Reveal({ children, className='' }: { children:React.ReactNode; className?:string }) {
  const ref=useRef(null)
  const ok=useInView(ref,{once:true,margin:'-60px'})
  return (
    <motion.div ref={ref} variants={stagger()} initial="hidden" animate={ok?'show':'hidden'} className={className}>
      {children}
    </motion.div>
  )
}

// ─── System log ───────────────────────────────────────────────────────────────
const LOG=[
  {t:'09:00:12',a:'Invoice follow-up sent',      d:'INV-00089 · Acme Corp · $4,200 · 8 days overdue'},
  {t:'09:00:13',a:'Contract reminder sent',       d:'Consulting Agreement · 6 days remaining'},
  {t:'09:00:14',a:'Budget alert dispatched',      d:'Marketing · $410 of $500 limit reached'},
  {t:'09:00:51',a:'AI risk score updated',        d:'INV-00094 · payment confidence 88%'},
  {t:'09:01:03',a:'Cash forecast recalculated',   d:'4.2 months runway · $12,400 in pipeline'},
  {t:'09:01:44',a:'Contract auto-signed',         d:'Web Design Agreement · Northside Media'},
  {t:'09:02:11',a:'Weekly time summary sent',     d:'23.5h billable · $2,820 outstanding'},
]
function SystemLog() {
  const [n,setN]=useState(1)
  const [off,setOff]=useState(0)
  const SHOW=5
  useEffect(()=>{
    if(n<LOG.length){ const t=setTimeout(()=>setN(v=>v+1),620); return()=>clearTimeout(t) }
    const t=setInterval(()=>setOff(o=>(o+1)%LOG.length),3800); return()=>clearInterval(t)
  },[n])
  const items=Array.from({length:Math.min(n,SHOW)},(_,i)=>LOG[(off+i)%LOG.length])
  return (
    <div className="f-mono" style={{fontSize:'.7rem',lineHeight:1.9}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20}}>
        <span className="live-dot" style={{width:7,height:7,borderRadius:'50%',background:'var(--teal)',flexShrink:0,display:'inline-block'}}/>
        <span style={{fontSize:'.62rem',letterSpacing:'.1em',textTransform:'uppercase',color:'var(--faint)'}}>
          invonaut · system log · live
        </span>
      </div>
      <AnimatePresence mode="popLayout">
        {items.map((l,i)=>(
          <motion.div key={`${off}-${i}`} layout initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.3,ease:E}} style={{marginBottom:7}}>
            <span style={{color:'var(--faint)'}}>{l.t}  </span>
            <span style={{color:'var(--ink)',fontWeight:500}}>{l.a}</span><br/>
            <span style={{color:'var(--faint)',paddingLeft:'5.8em'}}>{l.d}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      <div className="log-cursor" style={{color:'var(--teal)',fontSize:'.65rem',marginTop:8}}>
        running again tomorrow at 09:00
      </div>
    </div>
  )
}

// ─── Product Demo ─────────────────────────────────────────────────────────────
const INVOICE_ROWS = [
  { id:'INV-00089', client:'Acme Corp',       amount:'$4,200', status:'overdue',  days:'8 days late', risk:91 },
  { id:'INV-00088', client:'Northside Media', amount:'$2,800', status:'sent',     days:'Due Jun 28',  risk:34 },
  { id:'INV-00087', client:'Riverstone Inc',  amount:'$6,500', status:'paid',     days:'Paid Jun 14', risk:null },
  { id:'INV-00086', client:'Blue Studios',    amount:'$1,400', status:'draft',    days:'Not sent',    risk:null },
  { id:'INV-00085', client:'TechStart LLC',   amount:'$3,900', status:'sent',     days:'Due Jul 5',   risk:58 },
]
const STATUS_STYLE: Record<string,{bg:string,color:string,label:string}> = {
  overdue: {bg:'#FEF2F2',color:'#DC2626',label:'Overdue'},
  sent:    {bg:'#EFF6FF',color:'#2563EB',label:'Sent'},
  paid:    {bg:'#F0FDF4',color:'#16A34A',label:'Paid'},
  draft:   {bg:'#F9FAFB',color:'#6B7280',label:'Draft'},
}

function InvoiceDemo() {
  return (
    <div style={{padding:'0 4px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <p style={{fontWeight:800,fontSize:'.9rem',color:'var(--ink)'}}>Invoices</p>
        <div style={{display:'flex',gap:8}}>
          <span style={{padding:'5px 12px',borderRadius:6,background:'var(--surf)',border:'1px solid var(--rule)',fontSize:'.72rem',fontWeight:600,color:'var(--mid)'}}>Filter</span>
          <span style={{padding:'5px 14px',borderRadius:6,background:'var(--blue)',fontSize:'.72rem',fontWeight:700,color:'#fff'}}>+ New</span>
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {INVOICE_ROWS.map(r=>{
          const s=STATUS_STYLE[r.status]
          return (
            <div key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'#fff',borderRadius:10,border:'1px solid var(--rule)',fontSize:'.78rem'}}>
              <span style={{fontWeight:700,color:'var(--mid)',minWidth:68,flexShrink:0}} className="f-mono">{r.id}</span>
              <span style={{flex:1,fontWeight:600,color:'var(--ink)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.client}</span>
              <span style={{fontWeight:800,color:'var(--ink)',minWidth:52,textAlign:'right'}}>{r.amount}</span>
              <span style={{padding:'3px 9px',borderRadius:100,fontSize:'.67rem',fontWeight:700,background:s.bg,color:s.color,flexShrink:0}}>{s.label}</span>
              <span style={{color:'var(--faint)',fontSize:'.7rem',minWidth:76,textAlign:'right',flexShrink:0}}>{r.days}</span>
              {r.risk !== null && (
                <span style={{padding:'3px 8px',borderRadius:6,fontSize:'.67rem',fontWeight:700,background:r.risk>70?'#FEF2F2':'#EFF6FF',color:r.risk>70?'#DC2626':'#2563EB',flexShrink:0}}>
                  {r.risk}% risk
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div style={{marginTop:12,padding:'10px 14px',background:'var(--surf2)',borderRadius:10,fontSize:'.75rem',color:'var(--mid)',display:'flex',alignItems:'center',gap:8}}>
        <Zap size={13} style={{color:'var(--blue)',flexShrink:0}}/>
        2 invoices flagged for follow-up · AI running automatically tonight at 9:00am
      </div>
    </div>
  )
}

const CONTRACT_ROWS = [
  { name:'Web Design Agreement',  client:'Acme Corp',       status:'active',   note:'Expires Aug 30',  signed:true  },
  { name:'Brand Retainer',        client:'Northside Media', status:'active',   note:'Expires Sep 15',  signed:true  },
  { name:'Dev Contract',          client:'Blue Studios',    status:'expiring', note:'Expires in 7 days', signed:true },
  { name:'NDA',                   client:'TechStart LLC',   status:'draft',    note:'Awaiting signature',signed:false},
]
function ContractsDemo() {
  return (
    <div style={{padding:'0 4px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <p style={{fontWeight:800,fontSize:'.9rem',color:'var(--ink)'}}>Contracts</p>
        <span style={{padding:'5px 14px',borderRadius:6,background:'var(--blue)',fontSize:'.72rem',fontWeight:700,color:'#fff'}}>+ New</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {CONTRACT_ROWS.map(r=>{
          const colors = r.status==='active'?{bg:'#F0FDF4',c:'#16A34A'} : r.status==='expiring'?{bg:'#FFFBEB',c:'#D97706'} : {bg:'#F9FAFB',c:'#6B7280'}
          return (
            <div key={r.name} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'#fff',borderRadius:10,border:`1px solid ${r.status==='expiring'?'#FDE68A':'var(--rule)'}`,fontSize:'.78rem'}}>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontWeight:700,color:'var(--ink)',marginBottom:2}}>{r.name}</p>
                <p style={{color:'var(--faint)',fontSize:'.7rem'}}>{r.client}</p>
              </div>
              <span style={{padding:'3px 9px',borderRadius:100,fontSize:'.67rem',fontWeight:700,background:colors.bg,color:colors.c,flexShrink:0,textTransform:'capitalize'}}>{r.status}</span>
              <span style={{color:'var(--mid)',fontSize:'.7rem',minWidth:100,textAlign:'right',flexShrink:0}}>{r.note}</span>
              {!r.signed && (
                <span style={{padding:'3px 10px',borderRadius:6,background:'var(--blue)',color:'#fff',fontSize:'.67rem',fontWeight:700,flexShrink:0,cursor:'pointer'}}>Sign</span>
              )}
            </div>
          )
        })}
      </div>
      <div style={{marginTop:12,padding:'10px 14px',background:'#FFFBEB',borderRadius:10,fontSize:'.75rem',color:'#92400E',display:'flex',alignItems:'center',gap:8,border:'1px solid #FDE68A'}}>
        <Shield size={13} style={{flexShrink:0}}/>
        Dev Contract with Blue Studios expires in 7 days — reminder sent automatically
      </div>
    </div>
  )
}

function CashFlowDemo() {
  const BAR_DATA = [
    {m:'Feb',v:6200,proj:false},{m:'Mar',v:8400,proj:false},{m:'Apr',v:5100,proj:false},
    {m:'May',v:9200,proj:true}, {m:'Jun',v:7800,proj:true}, {m:'Jul',v:11400,proj:true},
  ]
  const MAX=12000
  return (
    <div style={{padding:'0 4px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div>
          <p style={{fontWeight:800,fontSize:'.9rem',color:'var(--ink)',marginBottom:4}}>Cash Flow — 90-Day Forecast</p>
          <p style={{fontSize:'.75rem',color:'var(--mid)'}}>AI-projected based on outstanding invoices and expense patterns</p>
        </div>
        <div style={{textAlign:'right'}}>
          <p style={{fontWeight:800,fontSize:'1.4rem',color:'var(--ink)',letterSpacing:'-.02em',lineHeight:1}}>$12,400</p>
          <p style={{fontSize:'.7rem',color:'var(--teal)',fontWeight:700}}>in pipeline</p>
        </div>
      </div>
      {/* Bar chart */}
      <div style={{display:'flex',alignItems:'flex-end',gap:8,height:110,padding:'0 4px',marginBottom:10}}>
        {BAR_DATA.map(b=>(
          <div key={b.m} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
            <div style={{
              width:'100%',
              height:Math.round((b.v/MAX)*100),
              background:b.proj ? 'repeating-linear-gradient(135deg,rgba(0,85,255,.12) 0,rgba(0,85,255,.12) 4px,transparent 4px,transparent 8px)' : 'linear-gradient(180deg,#0066FF,#0044CC)',
              borderRadius:'4px 4px 0 0',
              border:b.proj ? '1.5px dashed rgba(0,85,255,.4)' : 'none',
              position:'relative',
            }}>
              {!b.proj && <div style={{position:'absolute',bottom:'100%',left:'50%',transform:'translateX(-50%)',fontSize:'.62rem',fontWeight:700,color:'var(--blue)',whiteSpace:'nowrap',paddingBottom:3}}>${(b.v/1000).toFixed(1)}k</div>}
            </div>
            <span style={{fontSize:'.67rem',color:'var(--mid)',fontWeight:500}}>{b.m}</span>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div style={{display:'flex',gap:16,fontSize:'.7rem',color:'var(--mid)',marginBottom:14}}>
        <span style={{display:'flex',alignItems:'center',gap:5}}>
          <span style={{width:12,height:8,borderRadius:2,background:'linear-gradient(#0066FF,#0044CC)',flexShrink:0}}/>Actual
        </span>
        <span style={{display:'flex',alignItems:'center',gap:5}}>
          <span style={{width:12,height:8,borderRadius:2,border:'1.5px dashed rgba(0,85,255,.5)',flexShrink:0}}/>Projected
        </span>
      </div>
      {/* Key stats */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
        {[{l:'Runway',v:'4.2 months',c:'var(--teal)'},{l:'Avg monthly',v:'$7,483',c:'var(--ink)'},{l:'Risk exposure',v:'$6,000',c:'#DC2626'}].map(s=>(
          <div key={s.l} style={{padding:'10px 12px',background:'var(--surf)',borderRadius:8,border:'1px solid var(--rule)'}}>
            <p style={{fontSize:'.65rem',color:'var(--faint)',marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em',fontWeight:700}}>{s.l}</p>
            <p style={{fontSize:'.88rem',fontWeight:800,color:s.c,letterSpacing:'-.01em'}}>{s.v}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PortalDemo() {
  return (
    <div style={{padding:'0 4px'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,padding:'10px 14px',background:'#EFF4FF',borderRadius:10,border:'1px solid #C7D9FF'}}>
        <div style={{width:28,height:28,borderRadius:6,background:'linear-gradient(135deg,var(--blue),var(--teal))',flexShrink:0}}/>
        <div>
          <p style={{fontWeight:800,fontSize:'.8rem',color:'var(--ink)'}}>Acme Corp Client Portal</p>
          <p style={{fontSize:'.68rem',color:'var(--mid)'}}>Accessed via magic link · acme@acmecorp.com</p>
        </div>
        <span style={{marginLeft:'auto',padding:'3px 9px',borderRadius:100,background:'#F0FDF4',color:'#16A34A',fontSize:'.67rem',fontWeight:700,flexShrink:0}}>Active</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        <div style={{padding:'14px 16px',background:'#fff',borderRadius:10,border:'1px solid var(--rule)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
            <div>
              <p style={{fontWeight:700,fontSize:'.82rem',color:'var(--ink)'}}>Invoice INV-00089</p>
              <p style={{fontSize:'.7rem',color:'var(--mid)'}}>Web Design Project — Phase 2</p>
            </div>
            <span style={{padding:'4px 10px',borderRadius:100,background:'#FEF2F2',color:'#DC2626',fontSize:'.67rem',fontWeight:700}}>Overdue</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:8,borderTop:'1px solid var(--rule)'}}>
            <p style={{fontSize:'1.2rem',fontWeight:900,color:'var(--ink)',letterSpacing:'-.02em'}}>$4,200.00</p>
            <span style={{padding:'8px 20px',borderRadius:8,background:'var(--blue)',color:'#fff',fontSize:'.78rem',fontWeight:700,cursor:'pointer'}}>
              View & Download PDF
            </span>
          </div>
        </div>
        <div style={{padding:'12px 16px',background:'var(--surf)',borderRadius:10,border:'1px solid var(--rule)',fontSize:'.75rem',color:'var(--mid)',display:'flex',alignItems:'center',gap:8}}>
          <Shield size={13} style={{color:'var(--blue)',flexShrink:0}}/>
          Your branding appears here. Clients never see Invonaut.
        </div>
      </div>
    </div>
  )
}

const DEMO_TABS = [
  { id:'invoices',   label:'Invoices',       icon:FileText   },
  { id:'contracts',  label:'Contracts',      icon:Shield     },
  { id:'cashflow',   label:'Cash Flow',      icon:TrendingUp },
  { id:'portal',     label:'Client Portal',  icon:Users      },
]

function ProductDemo() {
  const [active, setActive] = useState('invoices')
  const CONTENT: Record<string,React.ReactNode> = {
    invoices:  <InvoiceDemo/>,
    contracts: <ContractsDemo/>,
    cashflow:  <CashFlowDemo/>,
    portal:    <PortalDemo/>,
  }
  return (
    <div>
      {/* Tabs */}
      <div className="demo-tabs" style={{display:'flex',gap:4,marginBottom:20,padding:'4px',background:'var(--surf)',borderRadius:12,width:'fit-content',flexShrink:0}}>
        {DEMO_TABS.map(t=>{
          const on=active===t.id
          const Icon=t.icon
          return (
            <button key={t.id} onClick={()=>setActive(t.id)} style={{
              display:'flex',alignItems:'center',gap:7,padding:'8px 16px',borderRadius:9,border:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",
              fontSize:'.8rem',fontWeight:on?700:500,
              background:on?'#fff':'transparent',
              color:on?'var(--blue)':'var(--mid)',
              boxShadow:on?'0 1px 4px rgba(0,0,0,0.1)':'none',
              transition:'all .15s',whiteSpace:'nowrap',flexShrink:0,
            }}>
              <Icon size={13}/>{t.label}
            </button>
          )
        })}
      </div>
      {/* Content */}
      <div className="demo-tab-content" style={{background:'var(--surf)',borderRadius:16,padding:'24px',border:'1px solid var(--rule)',minHeight:280}}>
        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:.2,ease:E}}>
            {CONTENT[active]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const PAINS = [
  { n:'01', head:'Your invoices are being paid whenever your clients feel like it.',
    body:"Without automated follow-ups, late payment is the default. Most freelancers have thousands of dollars in outstanding invoices — not because clients won't pay, but because nobody is consistently asking." },
  { n:'02', head:"Half your income isn't in your accounting tool.",
    body:"Cash from a client. A POS payment. A bank transfer that arrived while you were on a job. Most finance tools only track invoices — giving you a partial, misleading picture of your real revenue." },
  { n:'03', head:"You'll find out your contract expired after the fact.",
    body:"Contracts expire quietly. The client knows their obligations are over. You find out when the work stops or the dispute starts." },
]
const STEPS = [
  { n:'01', c:'var(--blue)', title:'Capture all income',        body:"Log invoices for billed work. Log direct payments for everything else — cash, POS, mobile money, bank transfer. Your real total income, visible in one place." },
  { n:'02', c:'var(--teal)', title:'AI handles the chasing',    body:"Every invoice gets an AI risk score. Overdue invoices trigger automatic follow-up emails. You're informed. You don't have to act." },
  { n:'03', c:'var(--blue)', title:'Contracts protect you',     body:"Create from templates, collect e-signatures in minutes. Automatic reminders at 30, 15, 7, and 1 day before expiry mean nothing slips." },
  { n:'04', c:'var(--teal)', title:'Know your financial future',body:"A 90-day cash flow forecast combines AI-predicted invoice payments and logged expenses. Know exactly how long your money lasts." },
]
const PLATFORM = [
  { group:'Track every dollar', color:'var(--blue)',
    items:[
      { name:'Invoice management',     desc:"Create, send, and track invoices with branded PDFs. AI predicts which clients will pay late before they do. Automated follow-ups fire without you touching anything." },
      { name:'Direct payment logging', desc:"Log cash, POS, bank transfer, and mobile money in seconds. Not everything goes through an invoice — now none of it is invisible." },
      { name:'Time tracking',          desc:"Live timer or manual entry. Convert any client's unbilled hours into a full draft invoice in one click, with all line items pre-filled." },
      { name:'Expense tracking',       desc:"AI-suggested categories on every entry. Upload receipts. Set monthly limits — automatic alerts at 80% and 100% spend." },
    ]},
  { group:'Protect your work', color:'var(--teal)',
    items:[
      { name:'Contract management', desc:"Six template types, a 19-clause library, and legally-binding e-signatures. Automatic reminders at 30/15/7/1 days before expiry." },
      { name:'Client portal',       desc:"A branded portal where clients view invoices, download PDFs, and sign contracts. Access by magic link — no account needed." },
      { name:'White-label branding',desc:"Your logo, your colours, everywhere your clients see — invoices, emails, the portal, and contract PDFs. Invonaut is invisible." },
    ]},
  { group:'Understand your money', color:'#8B5CF6',
    items:[
      { name:'Cash flow forecast',   desc:"90-day projection of your bank balance. Runway calculator. Predicted payment dates. Know before it becomes a crisis." },
      { name:'Revenue intelligence', desc:"Every dollar by source, category, and payment method. Know which services earn the most and which clients deserve the most of your time." },
      { name:'Bank connections',     desc:"Connect via Plaid. Transactions sync automatically. Invonaut matches incoming deposits to outstanding invoices and marks them paid." },
    ]},
]
const AUTOMATIONS = [
  { s:'Daily · 9:00am',   n:'Invoice follow-up reminders',  d:"Sent to every client with an overdue invoice and an AI risk score of 60% or higher." },
  { s:'Daily · 9:00am',   n:'Contract expiry warnings',      d:"Dispatched at 30, 15, 7, and 1 day before a contract expires. Sent to you." },
  { s:'Daily · 9:00am',   n:'Contract auto-expiry',          d:"Contracts hard-expire at their end date. Status updates automatically." },
  { s:'Daily · 9:00am',   n:'Budget overspend alerts',       d:"Email at 80% and again at 100% of any expense category's monthly limit." },
  { s:'Monday · 9:00am',  n:'Weekly time summary',           d:"Total hours tracked, billable value, and any unbilled work not yet invoiced." },
  { s:'On send',          n:'AI invoice risk scoring',       d:"GPT-4o-mini evaluates every invoice for payment probability based on client history." },
  { s:'On entry',         n:'AI expense categorisation',     d:"Category suggested from the description. Accept, correct, or change — it learns." },
  { s:'On open',          n:'90-day cash forecast',          d:"Balance projection recalculated live every time you open the cash flow page." },
]

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandingPageClient() {
  const [scrolled,setScrolled]=useState(false)
  useEffect(()=>{
    const fn=()=>setScrolled(window.scrollY>20)
    window.addEventListener('scroll',fn,{passive:true})
    return()=>window.removeEventListener('scroll',fn)
  },[])

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",color:'var(--ink)',background:'#fff',overflowX:'clip'}}>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..800;1,9..144,400..700&family=DM+Sans:ital,opsz,wght@0,9..40,300..700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:50,height:58,
        background:scrolled?'rgba(255,255,255,0.95)':'transparent',
        borderBottom:scrolled?'1px solid var(--rule)':'1px solid transparent',
        backdropFilter:'blur(16px)',transition:'all .25s',
        display:'flex',alignItems:'center'}}>
        <div style={{maxWidth:1160,margin:'0 auto',width:'100%',padding:'0 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <Link href="/" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:6}}>
            <img src="/naut-blue.svg" alt="" aria-hidden="true" style={{width:38,height:38,objectFit:'contain',flexShrink:0}} />
            <span className="f-display" style={{fontSize:'1.25rem',fontWeight:700,color:'var(--ink)',letterSpacing:'-.02em'}}>Invonaut</span>
          </Link>
          <div style={{display:'flex',gap:2,alignItems:'center'}} className="hidden md:flex">
            {[{href:'#demo',l:'Demo'},{href:'#how-it-works',l:'How it works'},{href:'#platform',l:'Platform'},{href:'#pricing',l:'Pricing'},{href:'/affiliate',l:'Affiliate'}].map(lk=>(
              <Link key={lk.href} href={lk.href} style={{color:'var(--mid)',fontWeight:500,fontSize:'.875rem',padding:'7px 14px',borderRadius:8,textDecoration:'none',transition:'color .15s'}}
                onMouseEnter={e=>(e.currentTarget.style.color='var(--ink)')}
                onMouseLeave={e=>(e.currentTarget.style.color='var(--mid)')}>
                {lk.l}
              </Link>
            ))}
          </div>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <Link href="/login" style={{color:'var(--mid)',fontWeight:500,fontSize:'.875rem',textDecoration:'none'}} className="hidden sm:block">Sign in</Link>
            <Link href="/signup" style={{background:'var(--ink)',color:'#fff',padding:'9px 20px',borderRadius:9,fontWeight:700,fontSize:'.875rem',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:7,lineHeight:1,boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>
              Start free <span style={{opacity:.45,fontWeight:400,fontSize:'.75rem'}}>14 days</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="hero-mesh" style={{padding:'56px 24px 64px'}}>
        <div style={{maxWidth:1160,margin:'0 auto'}}>
          <div className="hero-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:80,alignItems:'center'}}>
            {/* Left */}
            <motion.div variants={stagger(.1)} initial="hidden" animate="show">
              <motion.p variants={fadeUp} style={{fontSize:'.76rem',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--faint)',marginBottom:24}}>
                For freelancers and independent businesses
              </motion.p>
              <motion.h1 variants={fadeUp} className="f-display" style={{fontSize:'clamp(2.6rem,5.5vw,4.6rem)',fontWeight:800,lineHeight:1.03,letterSpacing:'-.025em',marginBottom:20}}>
                You built a business,<br/>not an{' '}
                <span className="grad-text">admin<br/>department.</span>
              </motion.h1>
              <motion.p variants={fadeUp} style={{fontSize:'1.1rem',color:'var(--mid)',lineHeight:1.75,marginBottom:28,maxWidth:490}}>
                Invonaut tracks every dollar, follows up every invoice, manages every contract, and forecasts your cash — automatically. Eight processes run every day without you logging in.
              </motion.p>
              <motion.div variants={fadeUp} style={{display:'flex',gap:14,flexWrap:'wrap',alignItems:'center',marginBottom:20}}>
                <Link href="/signup" style={{background:'linear-gradient(135deg,#0044EE,#0066FF)',color:'#fff',padding:'14px 30px',borderRadius:10,fontWeight:700,fontSize:'.95rem',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8,boxShadow:'0 4px 20px rgba(0,85,255,0.35)'}}>
                  Start free — 14 days <ArrowRight size={16} strokeWidth={2.5}/>
                </Link>
                <Link href="#demo" style={{color:'var(--blue)',fontWeight:600,fontSize:'.875rem',textDecoration:'none',display:'flex',alignItems:'center',gap:5}}>
                  See the product <ArrowRight size={14}/>
                </Link>
              </motion.div>
              <motion.p variants={fadeUp} style={{fontSize:'.75rem',color:'var(--faint)'}}>
                No credit card required · Cancel anytime · Plans from $19/mo
              </motion.p>
            </motion.div>

            {/* Right — frosted glass system log card */}
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.65,duration:.9}}
              className="hidden lg:block">
              <motion.div style={{background:'rgba(255,255,255,0.88)',backdropFilter:'blur(12px)',border:'1px solid rgba(0,85,255,0.12)',borderRadius:16,padding:28,boxShadow:'0 8px 40px rgba(0,85,255,0.1)'}}>
                <SystemLog/>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF STRIP ───────────────────────────────────────────── */}
      <div style={{background:'var(--surf)',borderTop:'1px solid var(--rule)',borderBottom:'1px solid var(--rule)',padding:'16px 24px'}}>
        <div style={{maxWidth:900,margin:'0 auto',display:'flex',flexWrap:'wrap',gap:32,justifyContent:'center',alignItems:'center'}}>
          {[
            {v:'8',      l:'automations running daily'},
            {v:'14 days',l:'full trial, no card'},
            {v:'$0',     l:'in extra tools needed'},
            {v:'24/7',   l:'working while you sleep'},
          ].map(s=>(
            <div key={s.l} style={{display:'flex',alignItems:'center',gap:10}}>
              <span className="f-display" style={{fontSize:'1.3rem',fontWeight:800,color:'var(--blue)',letterSpacing:'-.02em'}}>{s.v}</span>
              <span style={{fontSize:'.8rem',color:'var(--mid)',fontWeight:500}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PAIN ─────────────────────────────────────────────────────────── */}
      <section style={{background:'linear-gradient(160deg,#060620 0%,#07071a 50%,#060618 100%)',padding:'96px 24px'}}>
        <div style={{maxWidth:920,margin:'0 auto'}}>
          <Reveal>
            <motion.p variants={fadeUp} style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',marginBottom:72}}>
              The three things that quietly cost freelancers money
            </motion.p>
          </Reveal>
          {PAINS.map((p,i)=>(
            <Reveal key={i}>
              <motion.div variants={fadeUp} style={{display:'grid',gridTemplateColumns:'72px 1fr',gap:44,paddingBottom:i<2?60:0,marginBottom:i<2?60:0,borderBottom:i<2?'1px solid rgba(255,255,255,0.07)':'none'}}>
                <div className="f-display" style={{fontSize:'2.8rem',fontWeight:800,lineHeight:1,paddingTop:2,
                  background:'linear-gradient(135deg,var(--blue),var(--teal))',
                  WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',
                  opacity:.35}}>
                  {p.n}
                </div>
                <div>
                  <p className="f-display" style={{fontSize:'clamp(1.3rem,2.5vw,1.85rem)',fontWeight:700,color:'#EEF2FF',lineHeight:1.25,marginBottom:16}}>{p.head}</p>
                  <p style={{fontSize:'1rem',color:'rgba(180,193,255,0.52)',lineHeight:1.8}}>{p.body}</p>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── DEMO ─────────────────────────────────────────────────────────── */}
      <section id="demo" style={{padding:'100px 24px',background:'#fff',borderBottom:'1px solid var(--rule)'}}>
        <div style={{maxWidth:1000,margin:'0 auto'}}>
          <Reveal>
            <motion.div variants={fadeUp} style={{marginBottom:52}}>
              <p style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--faint)',marginBottom:20}}>Product demo</p>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:20}}>
                <h2 className="f-display" style={{fontSize:'clamp(1.9rem,4vw,3rem)',fontWeight:800,letterSpacing:'-.022em',lineHeight:1.08,color:'var(--ink)'}}>
                  This is what it<br/>looks like inside.
                </h2>
                <p style={{fontSize:'.9rem',color:'var(--mid)',maxWidth:320,lineHeight:1.75}}>
                  Real UI. Real data structure. Every feature you see is live in the product right now.
                </p>
              </div>
            </motion.div>
          </Reveal>
          <Reveal>
            <motion.div variants={fadeUp}>
              <ProductDemo/>
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{padding:'100px 24px',background:'var(--surf)'}}>
        <div style={{maxWidth:1160,margin:'0 auto'}}>
          <Reveal>
            <motion.div variants={fadeUp} style={{marginBottom:64}}>
              <p style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--faint)',marginBottom:20}}>How it works</p>
              <h2 className="f-display" style={{fontSize:'clamp(1.9rem,4vw,3rem)',fontWeight:800,letterSpacing:'-.022em',lineHeight:1.08,color:'var(--ink)',maxWidth:520}}>
                Four steps. Everything else is handled.
              </h2>
            </motion.div>
          </Reveal>
          <div className="steps-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',border:'1px solid var(--rule)',borderRadius:16,overflow:'hidden'}}>
            {STEPS.map((s,i)=>(
              <Reveal key={i}>
                <motion.div variants={fadeUp} style={{padding:'36px 28px',background:'#fff',borderRight:i<3?'1px solid var(--rule)':'none',height:'100%'}}>
                  <div className="f-display" style={{fontSize:'2.4rem',fontWeight:800,marginBottom:24,lineHeight:1,
                    background:`linear-gradient(135deg,${s.c},${s.c === 'var(--blue)' ? 'var(--teal)' : 'var(--blue)'})`,
                    WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',
                    opacity:.25}}>
                    {s.n}
                  </div>
                  <p style={{fontWeight:700,fontSize:'.875rem',color:'var(--ink)',marginBottom:10,letterSpacing:'-.01em'}}>{s.title}</p>
                  <p style={{fontSize:'.825rem',color:'var(--mid)',lineHeight:1.8}}>{s.body}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM ─────────────────────────────────────────────────────── */}
      <section id="platform" style={{padding:'100px 24px',background:'#fff',borderTop:'1px solid var(--rule)'}}>
        <div style={{maxWidth:1160,margin:'0 auto'}}>
          <Reveal>
            <motion.div variants={fadeUp} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:24,marginBottom:72}}>
              <div>
                <p style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--faint)',marginBottom:20}}>Platform</p>
                <h2 className="f-display" style={{fontSize:'clamp(1.9rem,4vw,3rem)',fontWeight:800,letterSpacing:'-.022em',lineHeight:1.08,color:'var(--ink)'}}>
                  One system.<br/>Ten capabilities.
                </h2>
              </div>
              <p style={{fontSize:'.9rem',color:'var(--mid)',maxWidth:340,lineHeight:1.75}}>
                Everything under one login. No integrations required. No tool-switching. No duct-taped stack.
              </p>
            </motion.div>
          </Reveal>
          {PLATFORM.map((g,gi)=>(
            <div key={gi} style={{marginBottom:gi<PLATFORM.length-1?56:0}}>
              <Reveal>
                <motion.div variants={fadeUp} style={{display:'flex',alignItems:'center',gap:10,marginBottom:20,paddingBottom:14,borderBottom:'1px solid var(--rule)'}}>
                  <span style={{width:10,height:10,borderRadius:'50%',background:g.color,flexShrink:0,display:'inline-block'}}/>
                  <p style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:g.color}}>{g.group}</p>
                </motion.div>
              </Reveal>
              <div style={{display:'grid',gridTemplateColumns:`repeat(${g.items.length},1fr)`,gap:1,background:'var(--rule)',borderRadius:12,overflow:'hidden'}}>
                {g.items.map((f,fi)=>(
                  <Reveal key={fi}>
                    <motion.div variants={fadeUp} style={{background:'#fff',padding:'26px 28px',transition:'background .15s'}}
                      onMouseEnter={e=>(e.currentTarget.style.background='var(--surf)')}
                      onMouseLeave={e=>(e.currentTarget.style.background='#fff')}>
                      <p style={{fontWeight:700,fontSize:'.875rem',color:'var(--ink)',marginBottom:10,letterSpacing:'-.01em'}}>{f.name}</p>
                      <p style={{fontSize:'.825rem',color:'var(--mid)',lineHeight:1.8}}>{f.desc}</p>
                    </motion.div>
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AUTOMATION ───────────────────────────────────────────────────── */}
      <section style={{padding:'100px 24px',background:'var(--surf)',borderTop:'1px solid var(--rule)'}}>
        <div style={{maxWidth:1000,margin:'0 auto'}}>
          <Reveal>
            <motion.div variants={fadeUp} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:80,alignItems:'flex-end',marginBottom:64}} className="auto-header">
              <div>
                <p style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--faint)',marginBottom:20}}>Automation</p>
                <h2 className="f-display" style={{fontSize:'clamp(1.9rem,4vw,3rem)',fontWeight:800,letterSpacing:'-.022em',lineHeight:1.08,color:'var(--ink)'}}>
                  Works while<br/>you don't.
                </h2>
              </div>
              <p style={{fontSize:'.975rem',color:'var(--mid)',lineHeight:1.8}}>
                Eight processes run automatically every day. Chasing late payments, warning about expiring contracts, keeping your forecast current — without you logging in.
              </p>
            </motion.div>
          </Reveal>
          <div style={{background:'#fff',borderRadius:16,border:'1px solid var(--rule)',overflow:'hidden'}}>
            {AUTOMATIONS.map((a,i)=>(
              <Reveal key={i}>
                <motion.div variants={fadeUp} className="auto-row" style={{display:'grid',gridTemplateColumns:'160px 1fr 2fr',gap:32,padding:'18px 24px',borderBottom:i<AUTOMATIONS.length-1?'1px solid var(--rule)':'none',alignItems:'baseline'}}>
                  <p className="f-mono auto-sched" style={{fontSize:'.68rem',color:'var(--blue)',fontWeight:500,paddingTop:1}}>{a.s}</p>
                  <p style={{fontWeight:700,fontSize:'.85rem',color:'var(--ink)',letterSpacing:'-.01em'}}>{a.n}</p>
                  <p style={{fontSize:'.8rem',color:'var(--mid)',lineHeight:1.75}}>{a.d}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <motion.div variants={fadeUp} style={{marginTop:32,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
              {[{v:'8',l:'Automated processes'},{v:'24/7',l:'Runs while you sleep'},{v:'0',l:'Manual triggers needed'}].map((s,i)=>(
                <div key={i} style={{padding:'24px',background:'#fff',borderRadius:12,border:'1px solid var(--rule)',textAlign:'center'}}>
                  <p className="f-display" style={{fontSize:'2.2rem',fontWeight:800,letterSpacing:'-.03em',marginBottom:6,
                    background:'linear-gradient(135deg,var(--blue),var(--teal))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                    {s.v}
                  </p>
                  <p style={{fontSize:'.78rem',color:'var(--mid)',fontWeight:500}}>{s.l}</p>
                </div>
              ))}
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* ── TRUST ────────────────────────────────────────────────────────── */}
      <section style={{padding:'64px 24px',background:'#fff',borderTop:'1px solid var(--rule)',borderBottom:'1px solid var(--rule)'}}>
        <div style={{maxWidth:1060,margin:'0 auto'}}>
          <div className="trust-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:40}}>
            {[
              {title:'No lock-in',         body:'Cancel any time. Your data exports in full. No contracts. No exit fees.'},
              {title:'Free for 14 days',   body:'Every plan, fully featured. No credit card required to start.'},
              {title:'Finance-grade auth', body:'Row-level security on every table. Auth by Supabase. Payments by Stripe.'},
              {title:'No outside funding', body:"Built without investors. Pricing reflects what the product is worth — not a growth target."},
            ].map(({title,body})=>(
              <Reveal key={title}>
                <motion.div variants={fadeUp}>
                  <p style={{fontWeight:700,fontSize:'.875rem',color:'var(--ink)',marginBottom:8,letterSpacing:'-.01em'}}>{title}</p>
                  <p style={{fontSize:'.8rem',color:'var(--mid)',lineHeight:1.8}}>{body}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      {/* ── FOUNDER ──────────────────────────────────────────────────────── */}
      <section style={{padding:'120px 24px 100px',background:'#fff',borderTop:'1px solid var(--rule)'}}>
        <div style={{maxWidth:1060,margin:'0 auto'}}>
          <Reveal>
            <motion.div
              variants={fadeUp}
              className="founder-grid"
              style={{display:'grid',gridTemplateColumns:'400px 1fr',gap:80,alignItems:'center'}}
            >
              {/* Photo — Next.js Image for crisp rendering on all screens */}
              <div style={{position:'relative'}}>
                {/* Subtle blue accent shadow behind photo */}
                <div style={{
                  position:'absolute',inset:0,
                  background:'linear-gradient(145deg,rgba(0,85,255,0.08) 0%,transparent 60%)',
                  borderRadius:24,
                  transform:'translate(10px,10px)',
                }}/>
                <div style={{position:'relative',borderRadius:20,overflow:'hidden',boxShadow:'0 24px 64px rgba(0,0,0,0.12)'}}>
                  <Image
                    src="/founder-kamo.jpg"
                    alt="Kamo Motelle — Founder, Invonaut"
                    width={400}
                    height={533}
                    quality={95}
                    priority
                    style={{
                      width:'100%',
                      height:'auto',
                      display:'block',
                      objectFit:'cover',
                      objectPosition:'center top',
                    }}
                  />
                </div>
                {/* Floating stat pill */}
                <div style={{
                  position:'absolute',bottom:28,left:'50%',transform:'translateX(-50%)',
                  background:'rgba(255,255,255,0.92)',backdropFilter:'blur(12px)',
                  borderRadius:40,padding:'10px 20px',
                  boxShadow:'0 8px 32px rgba(0,0,0,0.1)',
                  border:'1px solid rgba(0,85,255,0.1)',
                  display:'flex',alignItems:'center',gap:10,
                  whiteSpace:'nowrap',
                }}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:'#00C4A0',flexShrink:0}}/>
                  <span style={{fontSize:'.8rem',fontWeight:700,color:'#0A0A0A',letterSpacing:'-.01em'}}>
                    Building since age 18
                  </span>
                </div>
              </div>

              {/* Text */}
              <div>
                <p style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--blue)',marginBottom:24}}>
                  The Founder
                </p>
                <h2 className="f-display" style={{fontSize:'clamp(1.9rem,3.5vw,2.8rem)',fontWeight:800,letterSpacing:'-.022em',lineHeight:1.1,color:'var(--ink)',marginBottom:28}}>
                  I saw the gap.<br/>I spent a year closing it.
                </h2>

                {/* Pull quote */}
                <div style={{
                  borderLeft:'3px solid var(--blue)',
                  paddingLeft:20,
                  marginBottom:28,
                }}>
                  <p style={{fontSize:'1.05rem',color:'var(--blue)',fontWeight:700,lineHeight:1.65,fontStyle:'italic'}}>
                    "Running a business shouldn't feel like two full-time jobs. One of them should handle itself."
                  </p>
                </div>

                <p style={{fontSize:'.97rem',color:'var(--muted)',lineHeight:1.85,marginBottom:20}}>
                  Talking to freelancers and small business owners, the same pattern kept surfacing — talented people losing hours every week to things that should never require human attention. Sending payment reminders. Reconciling bank statements. Building financial reports from spreadsheets that were already out of date.
                </p>
                <p style={{fontSize:'.97rem',color:'var(--muted)',lineHeight:1.85,marginBottom:20}}>
                  The overhead isn't the work. It's just the tax on doing good work. So I spent a year building a system that eliminates it entirely — contracts that track themselves, invoices that follow up automatically, cash flow that updates without you touching it, and financial statements that generate in one click.
                </p>
                <p style={{fontSize:'.97rem',color:'var(--muted)',lineHeight:1.85,marginBottom:36}}>
                  Invonaut is that system. Built solo. Designed to run quietly in the background while you focus on the part that actually matters.
                </p>

                {/* Signature block */}
                <div style={{display:'flex',alignItems:'center',gap:16,paddingTop:28,borderTop:'1px solid var(--rule)'}}>
                  <div style={{width:48,height:48,borderRadius:'50%',overflow:'hidden',flexShrink:0}}>
                    <Image
                      src="/founder-kamo.jpg"
                      alt="Kamo Motelle"
                      width={48}
                      height={48}
                      quality={90}
                      style={{objectFit:'cover',objectPosition:'center top',width:'100%',height:'100%'}}
                    />
                  </div>
                  <div>
                    <p style={{fontWeight:800,fontSize:'.95rem',color:'var(--ink)',letterSpacing:'-.01em',marginBottom:2}}>
                      Kamo Motelle
                    </p>
                    <p style={{fontSize:'.8rem',color:'var(--faint)',fontWeight:500}}>
                      Founder &amp; CEO, Invonaut
                    </p>
                  </div>
                  <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8,padding:'8px 16px',borderRadius:8,background:'var(--surf)',border:'1px solid var(--rule)'}}>
                    <img src="/naut-blue.svg" alt="" aria-hidden="true" style={{width:18,height:18,objectFit:'contain',opacity:.7}}/>
                    <span style={{fontSize:'.75rem',fontWeight:700,color:'var(--faint)',letterSpacing:'.05em',textTransform:'uppercase'}}>Invonaut</span>
                  </div>
                </div>
              </div>

            </motion.div>
          </Reveal>
        </div>
      </section>

      <style jsx global>{`
        @media (max-width: 860px) {
          .founder-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
          .founder-grid > div:first-child {
            max-width: 340px;
            margin: 0 auto;
          }
        }
      `}</style>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" style={{padding:'100px 24px',background:'var(--surf)'}}>
        <div style={{maxWidth:1160,margin:'0 auto'}}>
          <Reveal>
            <motion.div variants={fadeUp} style={{marginBottom:56,display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:24}}>
              <div>
                <p style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--faint)',marginBottom:20}}>Pricing</p>
                <h2 className="f-display" style={{fontSize:'clamp(1.9rem,4vw,3rem)',fontWeight:800,letterSpacing:'-.022em',lineHeight:1.08,color:'var(--ink)'}}>
                  Pick a plan.<br/>Cancel anytime.
                </h2>
              </div>
              <div style={{padding:'12px 20px',border:'1px solid rgba(0,85,255,0.25)',borderRadius:10,fontSize:'.8rem',color:'var(--blue)',fontWeight:600,maxWidth:360,lineHeight:1.65,background:'rgba(0,85,255,0.03)'}}>
                Founding member pricing locks in permanently. You pay this price forever — it never increases as the product evolves. Ends at public launch.
              </div>
            </motion.div>
          </Reveal>
          <Reveal><motion.div variants={fadeUp}><LandingPricingSection/></motion.div></Reveal>
          <Reveal>
            <motion.p variants={fadeUp} style={{fontSize:'.825rem',color:'var(--faint)',marginTop:36,textAlign:'center'}}>
              A bookkeeper charges $300–500/month. A fractional CFO charges more. Invonaut does what both do — automatically — starting at $29.
            </motion.p>
          </Reveal>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section style={{background:'linear-gradient(145deg,#002ECC 0%,#0044EE 35%,#0055FF 65%,#003DCC 100%)',padding:'110px 24px',position:'relative',overflow:'hidden'}}>
        {/* Subtle mesh on CTA */}
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 70% 70% at 100% 0%,rgba(0,196,160,0.15) 0%,transparent 60%), radial-gradient(ellipse 50% 50% at 0% 100%,rgba(255,255,255,0.05) 0%,transparent 60%)',pointerEvents:'none'}}/>
        <div style={{maxWidth:1060,margin:'0 auto',position:'relative'}}>
          <div className="cta-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:80,alignItems:'center'}}>
            {/* Left */}
            <div>
              <p style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'rgba(255,255,255,0.45)',marginBottom:24}}>
                Ready when you are
              </p>
              <h2 className="f-display" style={{fontSize:'clamp(2.4rem,5vw,4rem)',fontWeight:800,letterSpacing:'-.025em',lineHeight:1.05,color:'#fff',marginBottom:28}}>
                Run a calmer,<br/>more organised<br/>business.
              </h2>
              <p style={{fontSize:'1.05rem',color:'rgba(255,255,255,0.55)',lineHeight:1.8,marginBottom:44,maxWidth:420}}>
                The admin weight doesn't come back. That's the part most people don't expect.
              </p>
              <div style={{display:'flex',gap:14,flexWrap:'wrap',alignItems:'center',marginBottom:18}}>
                <Link href="/signup" style={{background:'#fff',color:'#0044EE',padding:'15px 36px',borderRadius:10,fontWeight:800,fontSize:'1rem',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:10,boxShadow:'0 4px 24px rgba(0,0,0,0.2)'}}>
                  Start free — 14 days <ArrowRight size={17} strokeWidth={2.5}/>
                </Link>
                <Link href="#pricing" style={{color:'rgba(255,255,255,0.55)',fontWeight:600,fontSize:'.9rem',textDecoration:'none'}}>
                  See pricing →
                </Link>
              </div>
              <p style={{color:'rgba(255,255,255,0.3)',fontSize:'.75rem'}}>
                Plans from $19/mo · No credit card · Cancel anytime · 14-day free trial
              </p>
            </div>

            {/* Right — stat cards */}
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {[
                  {icon:Zap,    color:'#60A5FA', bg:'rgba(96,165,250,0.12)', v:'8 processes',   l:'fire every day without you logging in'},
                  {icon:Clock,  color:'#34D399', bg:'rgba(52,211,153,0.12)', v:'Zero chasing',  l:'invoices are followed up automatically'},
                  {icon:Shield, color:'#A78BFA', bg:'rgba(167,139,250,0.12)',v:'All contracts', l:'have automatic expiry reminders active'},
                  {icon:TrendingUp,color:'#FCD34D',bg:'rgba(252,211,77,0.12)',v:'90-day view',  l:'of your cash position, always current'},
                ].map((card,i)=>{
                  const Icon=card.icon
                  return (
                    <div key={i} style={{display:'flex',alignItems:'center',gap:16,padding:'16px 20px',borderRadius:14,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(8px)'}}>
                      <div style={{width:38,height:38,borderRadius:10,background:card.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <Icon size={17} style={{color:card.color}}/>
                      </div>
                      <div>
                        <p style={{fontWeight:800,fontSize:'.9rem',color:'#fff',letterSpacing:'-.01em',marginBottom:2}}>{card.v}</p>
                        <p style={{fontSize:'.78rem',color:'rgba(255,255,255,0.5)',lineHeight:1.5}}>{card.l}</p>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{background:'#030712',padding:'64px 24px 40px'}}>
        <div style={{maxWidth:1160,margin:'0 auto'}}>
          <div className="footer-grid" style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:48,marginBottom:52}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <img src="/naut-white.svg" alt="" aria-hidden="true" style={{width:28,height:28,objectFit:'contain',flexShrink:0,opacity:.9}} />
                <span className="f-display" style={{fontSize:'1.1rem',fontWeight:700,color:'#fff'}}>Invonaut</span>
              </div>
              <p style={{fontSize:'.85rem',color:'rgba(255,255,255,0.3)',lineHeight:1.75,maxWidth:240}}>From Contract to Cash. Automated.</p>
            </div>
            {[
              {head:'Product',links:[{href:'#demo',l:'Demo'},{href:'#platform',l:'Platform'},{href:'#how-it-works',l:'How it works'},{href:'#pricing',l:'Pricing'},{href:'/affiliate',l:'Affiliate',earn:true}]},
              {head:'Account',links:[{href:'/signup',l:'Sign up'},{href:'/login',l:'Sign in'},{href:'/help',l:'Help'}]},
              {head:'Legal',  links:[{href:'/privacy',l:'Privacy Policy'},{href:'/terms',l:'Terms of Service'}]},
            ].map(col=>(
              <div key={col.head}>
                <p style={{fontSize:'.67rem',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.22)',marginBottom:22}}>{col.head}</p>
                <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:14}}>
                  {col.links.map(lk=>(
                    <li key={lk.href}>
                      <Link href={lk.href} style={{color:'rgba(255,255,255,0.4)',fontSize:'.85rem',textDecoration:'none',transition:'color .15s',display:'inline-flex',alignItems:'center',gap:7}}
                        onMouseEnter={e=>(e.currentTarget.style.color='#fff')}
                        onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.4)')}>
                        {lk.l}
                        {(lk as any).earn && (
                          <span style={{color:'#FF6B35',fontWeight:700}}> — Earn 30%</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:24,display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
            <p style={{fontSize:'.75rem',color:'rgba(255,255,255,0.2)'}}>© {new Date().getFullYear()} Invonaut. All rights reserved.</p>
            <p style={{fontSize:'.75rem',color:'rgba(255,255,255,0.2)'}}>Built for people who run their own business.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
