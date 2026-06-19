'use client'
// src/components/landing/landing-page-client.tsx — v5.0
// Design: Framer-quality polish, Replit-level energy, Invonaut calm professionalism
// Gradient mesh hero · Interactive demo · Vibrant CTA · Fraunces editorial headlines

import { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, Zap, TrendingUp, Clock, Shield, X, Menu } from 'lucide-react'
import LandingPricingSection from '@/components/landing-pricing-section'

// ─── Global styles ────────────────────────────────────────────────────────────
const CSS = `
  .f-display { font-family:'Fraunces',serif; font-optical-sizing:auto; }
  .f-mono    { font-family:'JetBrains Mono',monospace; font-feature-settings:'tnum'; }
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
    .auto-header   { grid-template-columns:1fr !important; gap:24px !important; }
    .auto-stats    { grid-template-columns:1fr 1fr !important; }
    .auto-row      { grid-template-columns:1fr !important; gap:4px !important; }
    .auto-sched    { display:none !important; }
    .trust-grid    { grid-template-columns:1fr 1fr !important; }
    .footer-grid   { grid-template-columns:1fr 1fr !important; }
    .cta-grid      { grid-template-columns:1fr !important; }
    .platform-items{ grid-template-columns:1fr 1fr !important; }
    .price-justify-grid { grid-template-columns:1fr !important; }
  }
  @media(max-width:600px){
    .steps-grid    { grid-template-columns:1fr !important; }
    .auto-stats    { grid-template-columns:1fr !important; }
    .trust-grid    { grid-template-columns:1fr !important; }
    .footer-grid   { grid-template-columns:1fr !important; }
    .platform-items{ grid-template-columns:1fr !important; }
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

// ─── Data ─────────────────────────────────────────────────────────────────────
const PAINS = [
  { n:'01', head:'Your invoices are being paid whenever your clients feel like it.',
    body:"Without automated follow-ups, late payment becomes the default. Most businesses have thousands of dollars sitting in outstanding invoices — not because clients won't pay, but because nobody is consistently and professionally asking." },
  { n:'02', head:"Half your income isn't showing up anywhere.",
    body:"Cash from a client. A POS payment. A bank transfer that came in while you were on a job. Most finance tools only see invoices — leaving a big part of your real income invisible, and your numbers wrong." },
  { n:'03', head:"You'll find out your contract expired after it already matters.",
    body:"Contracts expire quietly. The client knows their obligations are over. You find out when the work stops or the disagreement starts. By then, you're already at a disadvantage." },
]
const STEPS = [
  { n:'01', c:'var(--blue)', title:'Capture all income',        body:"Log invoices for billed work. Log direct payments for everything else — cash, card, bank transfer, mobile money. Your complete picture, in one place." },
  { n:'02', c:'var(--teal)', title:'Invonaut handles the chasing', body:"Every invoice is scored for payment risk. Overdue invoices trigger follow-up emails automatically. You stay informed without spending an hour on admin." },
  { n:'03', c:'var(--blue)', title:'Contracts protect you',     body:"Create from templates, collect signatures in minutes. Automatic reminders at 30, 15, 7, and 1 day before expiry. Nothing slips through without you knowing." },
  { n:'04', c:'var(--teal)', title:'Know your financial future',body:"A 90-day cash forecast brings together your expected income and tracked expenses. See exactly what's coming — before it becomes a problem." },
]
const PLATFORM = [
  { group:'Track every dollar', color:'var(--blue)',
    items:[
      { name:'Invoice management',     desc:"Create, send, and track invoices with your branding on them. The system predicts which clients might pay late and follows up on your behalf — without you asking it to." },
      { name:'Direct payment logging', desc:"Not every payment comes with an invoice. Log cash, card, bank transfer, and mobile money in seconds so your real income is always reflected in your numbers." },
      { name:'Time tracking',          desc:"Start a timer or log hours manually. When it's time to bill, convert tracked time to a full invoice in one click — line items already filled in." },
      { name:'Expense tracking',       desc:"Log what you spend, upload receipts, and set monthly limits. Get notified at 80% and 100% of your limit so nothing catches you off guard." },
    ]},
  { group:'Protect your work', color:'var(--teal)',
    items:[
      { name:'Contract management', desc:"Six ready-to-use contract templates, a library of standard clauses, and legally binding digital signatures. Reminders go out at 30, 15, 7, and 1 day before expiry — automatically." },
      { name:'Client portal',       desc:"A branded space where clients view their invoices, download PDFs, and sign contracts. They get a link by email — no account, no password, no friction." },
      { name:'White-label branding',desc:"Your logo and colours appear on every invoice, every email, and every client-facing page. Invonaut works in the background — clients only see your brand." },
    ]},
  { group:'Understand your money', color:'var(--blue)',
    items:[
      { name:'Cash flow forecast',   desc:"See your next 90 days in plain numbers — how much is coming in, how much is going out, and how long your money lasts. Updated every time you open it." },
      { name:'Revenue intelligence', desc:"Every dollar broken down by source, client, and category. See which work earns the most and which clients are worth the most of your time." },
      { name:'Bank connections',     desc:"Link your bank account and transactions come in automatically. Invonaut matches deposits to outstanding invoices and keeps your records current." },
    ]},
]
const AUTOMATIONS = [
  { s:'Daily · 9:00am',   n:'Invoice follow-up reminders',  d:"Sent automatically to every client with an overdue invoice where the AI has flagged a payment risk." },
  { s:'Daily · 9:00am',   n:'Contract expiry warnings',      d:"Sent to you at 30, 15, 7, and 1 day before any contract expires. You always know what's about to lapse." },
  { s:'Daily · 9:00am',   n:'Contract auto-expiry',          d:"Contracts reach their end date and update automatically. No manual status changes needed." },
  { s:'Daily · 9:00am',   n:'Budget overspend alerts',       d:"An email goes out at 80% and again at 100% of any expense category's monthly limit." },
  { s:'Monday · 9:00am',  n:'Weekly time summary',           d:"Total hours logged, billable value outstanding, and any work not yet converted to an invoice." },
  { s:'On send',          n:'Invoice payment risk scoring',  d:"Every invoice is assessed for likelihood of on-time payment based on the client's history." },
  { s:'On entry',         n:'Expense category suggestions',  d:"Invonaut suggests the right category from what you type. Accept it or change it — the system learns either way." },
  { s:'On open',          n:'90-day cash forecast refresh',  d:"Your cash position is recalculated every time you open the cash flow page — always based on current data." },
]

// ─── Persona data ─────────────────────────────────────────────────────────────
const PERSONAS = [
  {
    type:      'The freelancer',
    color:     '#0055FF',
    bg:        'rgba(0,85,255,0.06)',
    headline:  'Invoice sent. Client gone quiet. Follow-up sent — automatically.',
    context:   'Eight active clients. Invoicing per project. No bandwidth to chase.',
    scenario:  'On Tuesday at 9:00am, INV-0015 was 8 days past due with a 52% payment risk score. An automated follow-up went out. Another went out on day 14. No reminder set. No login required.',
    features:  ['AI payment risk scoring', 'Automated follow-up emails', 'Invoice status tracking'],
  },
  {
    type:      'The service business',
    color:     '#00C4A0',
    bg:        'rgba(0,196,160,0.06)',
    headline:  'Three ways clients pay. One place it all shows up.',
    context:   'Six clients. One invoiced monthly. Two pay bank transfer. Two pay cash. One pays via POS.',
    scenario:  'Cash and transfer payments were invisible before — only invoiced revenue was tracked. Now all six income streams appear in one dashboard. Real revenue. Not just invoiced revenue.',
    features:  ['Direct payment logging', 'Revenue categories', 'Unified income view'],
  },
  {
    type:      'The contractor',
    color:     '#FF6B35',
    bg:        'rgba(255,107,53,0.06)',
    headline:  'Contract expiring in 12 days. Already renewed.',
    context:   'Three active service contracts. Government and NGO clients. Terms matter.',
    scenario:  'A 30-day reminder went out. Then a 15-day. Then a 7-day. The contract was renewed three weeks before expiry — not three days after. The system watched it so you didn\'t have to.',
    features:  ['Contract management', 'Auto expiry reminders at 30/15/7/1d', 'Digital signatures'],
  },
]

// ─── Persona section ───────────────────────────────────────────────────────────
function PersonaSection() {
  return (
    <section style={{padding:'100px 24px',background:'#fff',borderTop:'1px solid var(--rule)'}}>
      <div style={{maxWidth:1160,margin:'0 auto'}}>
        <Reveal>
          <motion.div variants={fadeUp} style={{marginBottom:64}}>
            <p style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--faint)',marginBottom:20}}>Who it's built for</p>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:20}}>
              <h2 className="f-display" style={{fontSize:'clamp(1.9rem,4vw,3rem)',fontWeight:800,letterSpacing:'-.022em',lineHeight:1.08,color:'var(--ink)'}}>
                The same problem.<br/>Three different businesses.
              </h2>
              <p style={{fontSize:'.9rem',color:'var(--mid)',maxWidth:340,lineHeight:1.75}}>
                Invonaut is built for any business where money comes in on terms — and where financial admin currently requires too much of your attention.
              </p>
            </div>
          </motion.div>
        </Reveal>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--rule)',borderRadius:16,overflow:'hidden'}} className="persona-grid">
          {PERSONAS.map((p,i)=>(
            <Reveal key={i}>
              <motion.div variants={fadeUp} style={{background:'#fff',padding:'36px 32px',height:'100%',display:'flex',flexDirection:'column',gap:0}}>
                {/* Type badge */}
                <div style={{display:'inline-flex',alignItems:'center',gap:8,marginBottom:24}}>
                  <span style={{width:8,height:8,borderRadius:'50%',background:p.color,flexShrink:0,display:'inline-block'}}/>
                  <span style={{fontSize:'.68rem',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:p.color}}>{p.type}</span>
                </div>

                {/* Headline */}
                <p className="f-display" style={{fontSize:'clamp(1.05rem,1.8vw,1.3rem)',fontWeight:700,color:'var(--ink)',lineHeight:1.3,marginBottom:20,letterSpacing:'-.015em'}}>{p.headline}</p>

                {/* Context */}
                <p style={{fontSize:'.8rem',color:'var(--faint)',lineHeight:1.7,marginBottom:20,fontStyle:'italic'}}>{p.context}</p>

                {/* Scenario */}
                <div style={{padding:'16px 18px',borderRadius:10,background:p.bg,marginBottom:24,flex:1}}>
                  <p style={{fontSize:'.825rem',color:'var(--ink)',lineHeight:1.8}}>{p.scenario}</p>
                </div>

                {/* Features */}
                <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:8}}>
                  {p.features.map(f=>(
                    <li key={f} style={{display:'flex',alignItems:'center',gap:10}}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{flexShrink:0}}>
                        <circle cx="7" cy="7" r="7" fill={p.color} fillOpacity=".12"/>
                        <path d="M4.5 7l1.8 1.8L9.5 5.5" stroke={p.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span style={{fontSize:'.78rem',color:'var(--mid)',fontWeight:500}}>{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
      <style jsx global>{`
        @media(max-width:860px){ .persona-grid{ grid-template-columns:1fr !important; } }
      `}</style>
    </section>
  )
}

// ─── Product gallery ────────────────────────────────────────────────────────
// Real screenshots from the live product, sharpened + upscaled.
// Files: /public/screenshots/{dashboard,intelligence,invoices-pipeline,invoices-risk,cash-forecast,analytics-bhs,analytics-clients}.webp
const GALLERY = [
  { src:'/screenshots/dashboard.webp',         tag:'Dashboard',  title:'Business Health Score',        sub:'Computed live — every page load',         accent:'#0055FF' },
  { src:'/screenshots/intelligence.webp',      tag:'Dashboard',  title:'Intelligence Feed',             sub:'8 signals, ranked by urgency',             accent:'#00C4A0' },
  { src:'/screenshots/invoices-risk.webp',     tag:'Invoices',   title:'AI payment risk, per invoice',  sub:'Recalculated daily, not on request',       accent:'#FF6B35' },
  { src:'/screenshots/invoices-pipeline.webp', tag:'Invoices',   title:'Unbilled time → invoice draft', sub:'One click from hours to invoice',          accent:'#0055FF' },
  { src:'/screenshots/cash-forecast.webp',     tag:'Cash Flow',  title:'90-day forecast',                sub:'Projected from invoices + expense run rate', accent:'#00C4A0' },
  { src:'/screenshots/analytics-bhs.webp',     tag:'Analytics',  title:'Collection rate, margin, growth', sub:'One score, four inputs',                   accent:'#0055FF' },
  { src:'/screenshots/analytics-clients.webp', tag:'Analytics',  title:'Client revenue concentration',   sub:'See who your business depends on',         accent:'#FF6B35' },
  { src:'/screenshots/reports-pnl.webp',       tag:'Reports',    title:'Profit & Loss statement',        sub:'Real financial statements, not a summary', accent:'#00C4A0' },
]

function GalleryCard({ item, size='md', onOpen }: { item: typeof GALLERY[0]; size?: 'lg' | 'md'; onOpen: () => void }) {
  return (
    <div
      className="gallery-card"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e=>{ if(e.key==='Enter'||e.key===' ') onOpen() }}
      style={{
        position:'relative',
        borderRadius:16,
        overflow:'hidden',
        background:'#0A0C12',
        boxShadow:'0 1px 2px rgba(0,0,0,0.04), 0 16px 48px -12px rgba(10,12,18,0.18)',
        border:'1px solid rgba(10,12,18,0.06)',
        height:'100%',
        cursor:'pointer',
        transition:'transform .25s ease, box-shadow .25s ease',
      }}
      onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 1px 2px rgba(0,0,0,0.04), 0 24px 56px -12px rgba(10,12,18,0.26)' }}
      onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 1px 2px rgba(0,0,0,0.04), 0 16px 48px -12px rgba(10,12,18,0.18)' }}
    >
      <img src={item.src} alt={item.title}
        style={{width:'100%',height:'100%',display:'block',objectFit:'cover',objectPosition:'top'}}/>
      {/* Gradient overlay for label legibility */}
      <div style={{
        position:'absolute',inset:0,
        background:'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(5,7,12,0.78) 100%)',
        pointerEvents:'none',
      }}/>
      {/* Accent corner dot */}
      <div style={{
        position:'absolute',top:16,left:16,
        display:'inline-flex',alignItems:'center',gap:7,
        padding:'5px 11px',borderRadius:7,
        background:'rgba(5,7,12,0.55)',backdropFilter:'blur(6px)',
        border:'1px solid rgba(255,255,255,0.1)',
      }}>
        <span style={{width:6,height:6,borderRadius:'50%',background:item.accent,flexShrink:0,display:'inline-block'}}/>
        <span className="f-mono" style={{fontSize:'.66rem',color:'rgba(255,255,255,0.85)',letterSpacing:'.04em',fontWeight:500}}>{item.tag}</span>
      </div>
      {/* Expand hint — top right */}
      <div className="gallery-expand-hint" style={{
        position:'absolute',top:16,right:16,
        width:30,height:30,borderRadius:8,
        background:'rgba(5,7,12,0.55)',backdropFilter:'blur(6px)',
        border:'1px solid rgba(255,255,255,0.1)',
        display:'flex',alignItems:'center',justifyContent:'center',
        opacity:0,transition:'opacity .2s ease',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
      </div>
      {/* Bottom label */}
      <div style={{position:'absolute',bottom:0,left:0,right:0,padding: size==='lg' ? '28px 28px 24px' : '18px 18px 16px'}}>
        <p className="f-display" style={{
          fontSize: size==='lg' ? 'clamp(1.15rem,2vw,1.5rem)' : '.95rem',
          fontWeight:700,color:'#fff',letterSpacing:'-.015em',lineHeight:1.25,marginBottom:5,
        }}>
          {item.title}
        </p>
        <p style={{fontSize: size==='lg' ? '.82rem' : '.74rem',color:'rgba(255,255,255,0.62)',lineHeight:1.5}}>
          {item.sub}
        </p>
      </div>
    </div>
  )
}

// ─── Lightbox ───────────────────────────────────────────────────────────────
function GalleryLightbox({ item, onClose }: { item: typeof GALLERY[0] | null; onClose: () => void }) {
  useEffect(() => {
    if (!item) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [item, onClose])

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          style={{
            position:'fixed',inset:0,zIndex:999,
            background:'rgba(5,7,12,0.92)',backdropFilter:'blur(4px)',
            display:'flex',alignItems:'center',justifyContent:'center',
            padding:'5vh 5vw',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            style={{ position:'relative', maxWidth:'min(1180px, 92vw)', maxHeight:'88vh', width:'100%' }}
          >
            <div style={{
              borderRadius:16,overflow:'hidden',
              boxShadow:'0 24px 80px -16px rgba(0,0,0,0.5)',
              border:'1px solid rgba(255,255,255,0.08)',
              maxHeight:'88vh',
              display:'flex',flexDirection:'column',
              background:'#0A0C12',
            }}>
              <img src={item.src} alt={item.title}
                style={{ width:'100%', height:'auto', maxHeight:'calc(88vh - 72px)', objectFit:'contain', display:'block' }}/>
              {/* Caption bar */}
              <div style={{
                padding:'16px 22px',
                display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,
                borderTop:'1px solid rgba(255,255,255,0.08)',
                background:'#0A0C12',
              }}>
                <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0}}>
                  <span style={{width:7,height:7,borderRadius:'50%',background:item.accent,flexShrink:0}}/>
                  <div style={{minWidth:0}}>
                    <p className="f-display" style={{fontSize:'.95rem',fontWeight:700,color:'#fff',letterSpacing:'-.01em',marginBottom:2}}>{item.title}</p>
                    <p style={{fontSize:'.76rem',color:'rgba(255,255,255,0.5)'}}>{item.sub}</p>
                  </div>
                </div>
                <span className="f-mono" style={{fontSize:'.68rem',color:'rgba(255,255,255,0.3)',flexShrink:0,letterSpacing:'.03em'}}>{item.tag.toUpperCase()}</span>
              </div>
            </div>
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                position:'absolute',top:-44,right:0,
                width:34,height:34,borderRadius:8,
                background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.14)',
                display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
              }}
            >
              <X size={16} style={{color:'#fff'}}/>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ScreenshotShowcase() {
  const [openItem, setOpenItem] = useState<typeof GALLERY[0] | null>(null)
  const [big, ...rest] = GALLERY
  const grid2 = rest.slice(0, 2)
  const gridRest = rest.slice(2)

  return (
    <section style={{padding:'100px 24px',background:'#fff',borderTop:'1px solid var(--rule)'}}>
      <div style={{maxWidth:1160,margin:'0 auto'}}>
        <Reveal>
          <motion.div variants={fadeUp} style={{marginBottom:56}}>
            <p style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--faint)',marginBottom:20}}>
              Inside Invonaut
            </p>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:20}}>
              <h2 className="f-display" style={{fontSize:'clamp(1.9rem,4vw,3rem)',fontWeight:800,letterSpacing:'-.022em',lineHeight:1.08,color:'var(--ink)'}}>
                The actual product.
              </h2>
              <p style={{fontSize:'.9rem',color:'var(--mid)',maxWidth:340,lineHeight:1.75}}>
                Real screens, pulled live from a running account. Click any shot to see it in full.
              </p>
            </div>
          </motion.div>
        </Reveal>

        {/* Gallery grid: 1 large left + 2 stacked right, then a 4-up row below */}
        <div className="gallery-top" style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:14,marginBottom:14}}>
          <Reveal>
            <motion.div variants={fadeUp} style={{height:'100%',minHeight:360}}>
              <GalleryCard item={big} size="lg" onOpen={() => setOpenItem(big)}/>
            </motion.div>
          </Reveal>
          <div style={{display:'grid',gridTemplateRows:'1fr 1fr',gap:14}}>
            {grid2.map((item,i)=>(
              <Reveal key={item.title}>
                <motion.div variants={fadeUp} style={{height:'100%',minHeight:170}}>
                  <GalleryCard item={item} onOpen={() => setOpenItem(item)}/>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="gallery-bottom" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:14}}>
          {gridRest.map(item=>(
            <Reveal key={item.title}>
              <motion.div variants={fadeUp} style={{height:'100%',minHeight:200}}>
                <GalleryCard item={item} onOpen={() => setOpenItem(item)}/>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>

      <GalleryLightbox item={openItem} onClose={() => setOpenItem(null)}/>

      <style jsx global>{`
        @media(max-width:1100px){
          .gallery-bottom{ grid-template-columns:repeat(3,1fr) !important; }
        }
        @media(max-width:900px){
          .gallery-top{ grid-template-columns:1fr !important; }
          .gallery-bottom{ grid-template-columns:1fr 1fr !important; }
        }
        @media(max-width:560px){
          .gallery-bottom{ grid-template-columns:1fr !important; }
        }
        .gallery-card:hover .gallery-expand-hint{ opacity:1 !important; }
      `}</style>
    </section>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandingPageClient() {
  const [scrolled,setScrolled]=useState(false)
  const [mobileNavOpen,setMobileNavOpen]=useState(false)
  useEffect(()=>{
    const fn=()=>setScrolled(window.scrollY>20)
    window.addEventListener('scroll',fn,{passive:true})
    return()=>window.removeEventListener('scroll',fn)
  },[])
  useEffect(()=>{
    document.body.style.overflow = mobileNavOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  },[mobileNavOpen])
  useEffect(()=>{
    if(!mobileNavOpen) return
    const onKey=(e:KeyboardEvent)=>{ if(e.key==='Escape') setMobileNavOpen(false) }
    window.addEventListener('keydown',onKey)
    return()=>window.removeEventListener('keydown',onKey)
  },[mobileNavOpen])

  const NAV_LINKS=[{href:'#screenshots',l:'Screenshots'},{href:'#how-it-works',l:'How it works'},{href:'#platform',l:'Platform'},{href:'#pricing',l:'Pricing'},{href:'/affiliate',l:'Affiliate'}]

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
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(lk=>(
              <Link key={lk.href} href={lk.href} style={{color:'var(--mid)',fontWeight:500,fontSize:'.875rem',padding:'7px 14px',borderRadius:8,textDecoration:'none',transition:'color .15s'}}
                onMouseEnter={e=>(e.currentTarget.style.color='var(--ink)')}
                onMouseLeave={e=>(e.currentTarget.style.color='var(--mid)')}>
                {lk.l}
              </Link>
            ))}
          </div>
          <div style={{display:'flex',alignItems:'center'}} className="gap-2 sm:gap-3">
            <Link href="/login" style={{color:'var(--mid)',fontWeight:500,fontSize:'.875rem',textDecoration:'none'}} className="hidden sm:block">Sign in</Link>
            <Link href="/signup" className="px-3.5 sm:px-5 py-2 sm:py-[10px] text-[.8rem] sm:text-[.875rem]" style={{background:'var(--ink)',color:'#fff',borderRadius:9,fontWeight:700,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:7,lineHeight:1,boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>
              Start free <span className="hidden xs:inline" style={{opacity:.45,fontWeight:400,fontSize:'.75rem'}}>14 days</span>
            </Link>
            <button
              onClick={()=>setMobileNavOpen(o=>!o)}
              aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileNavOpen}
              className="md:hidden inline-flex items-center justify-center flex-shrink-0"
              style={{width:38,height:38,borderRadius:9,border:'1px solid var(--rule)',background:'#fff'}}
            >
              {mobileNavOpen ? <X size={18} style={{color:'var(--ink)'}}/> : <Menu size={18} style={{color:'var(--ink)'}}/>}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile nav drawer ───────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden"
            onClick={()=>setMobileNavOpen(false)}
            style={{ position:'fixed', inset:0, top:58, zIndex:49, background:'rgba(7,7,15,0.4)' }}
          >
            <motion.div
              initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
              transition={{ duration:0.2, ease:[0.16,1,0.3,1] }}
              onClick={e=>e.stopPropagation()}
              style={{ background:'#fff', borderBottom:'1px solid var(--rule)', padding:'8px 24px 20px', boxShadow:'0 12px 32px -8px rgba(0,0,0,0.12)' }}
            >
              {NAV_LINKS.map(lk=>(
                <Link key={lk.href} href={lk.href} onClick={()=>setMobileNavOpen(false)}
                  style={{display:'block',color:'var(--ink)',fontWeight:600,fontSize:'1rem',padding:'13px 4px',borderBottom:'1px solid var(--rule)',textDecoration:'none'}}>
                  {lk.l}
                </Link>
              ))}
              <Link href="/login" onClick={()=>setMobileNavOpen(false)}
                style={{display:'block',color:'var(--mid)',fontWeight:600,fontSize:'1rem',padding:'13px 4px',textDecoration:'none'}}>
                Sign in
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="hero-mesh" style={{padding:'56px 24px 64px'}}>
        <div style={{maxWidth:1160,margin:'0 auto'}}>
          <div className="hero-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:80,alignItems:'center'}}>
            {/* Left */}
            <motion.div variants={stagger(.1)} initial="hidden" animate="show">
              <motion.p variants={fadeUp} style={{fontSize:'.76rem',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--faint)',marginBottom:24}}>
                Autonomous Finance OS
              </motion.p>
              <motion.h1 variants={fadeUp} className="f-display" style={{fontSize:'clamp(2.6rem,5.5vw,4.6rem)',fontWeight:800,lineHeight:1.03,letterSpacing:'-.025em',marginBottom:20}}>
                You built a business,<br/>not an{' '}
                <span className="grad-text">admin<br/>department.</span>
              </motion.h1>
              <motion.p variants={fadeUp} style={{fontSize:'1.1rem',color:'var(--mid)',lineHeight:1.75,marginBottom:28,maxWidth:490}}>
                At 9:00 this morning, Invonaut sent a follow-up to a client 8 days late, flagged a contract expiring in 6 days, and refreshed your 90-day cash position — all without a single login. That's not a setting you configure. That's how it runs every day.
              </motion.p>
              <motion.div variants={fadeUp} style={{display:'flex',gap:14,flexWrap:'wrap',alignItems:'center',marginBottom:20}}>
                <Link href="/signup" style={{background:'linear-gradient(135deg,#0044EE,#0066FF)',color:'#fff',padding:'14px 30px',borderRadius:10,fontWeight:700,fontSize:'.95rem',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8,boxShadow:'0 4px 20px rgba(0,85,255,0.35)'}}>
                  Start free — 14 days <ArrowRight size={16} strokeWidth={2.5}/>
                </Link>
                <Link href="#screenshots" style={{color:'var(--blue)',fontWeight:600,fontSize:'.875rem',textDecoration:'none',display:'flex',alignItems:'center',gap:5}}>
                  See the product <ArrowRight size={14}/>
                </Link>
              </motion.div>
              <motion.p variants={fadeUp} style={{fontSize:'.75rem',color:'var(--faint)'}}>
                No credit card required · Cancel anytime · Plans from $29/mo
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
              The three things quietly costing your business money
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

      {/* ── PERSONA SCENARIOS ────────────────────────────────────────────── */}
      <PersonaSection/>

      {/* ── SCREENSHOT SHOWCASE ──────────────────────────────────────────── */}
      <div id="screenshots"><ScreenshotShowcase/></div>

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
              <div className="platform-items" style={{display:'grid',gridTemplateColumns:`repeat(${g.items.length},1fr)`,gap:1,background:'var(--rule)',borderRadius:12,overflow:'hidden'}}>
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
            <motion.div variants={fadeUp} className="auto-stats" style={{marginTop:32,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
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
              {title:'Free for 14 days',   body:'Every plan, fully featured. No credit card required to start. Try everything before you commit.'},
              {title:'Built on solid security', body:'Your financial data is protected at the row level — only you can see it. Payments handled by Stripe, one of the world\'s most trusted payment processors.'},
              {title:'No outside funding', body:"Built without investors. Pricing reflects what the product is worth — not a growth target. That keeps it honest."},
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
                  position:'absolute',bottom:76,left:'50%',transform:'translateX(-50%)',
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
                <p style={{
                  fontSize:'.78rem',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',
                  color:'#0055FF',marginBottom:24,marginTop:8,display:'block',
                  WebkitFontSmoothing:'antialiased',MozOsxFontSmoothing:'grayscale',
                  textRendering:'geometricPrecision',
                }}>
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
                  Talking to small business owners and service businesses, the same pattern kept surfacing — capable people losing hours every week to things that should never require human attention. Sending payment reminders. Reconciling bank statements. Building financial reports from spreadsheets that were already out of date.
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

          {/* Price justification block */}
          <Reveal>
            <motion.div variants={fadeUp} style={{marginTop:48,padding:'32px 36px',borderRadius:16,background:'#fff',border:'1px solid var(--rule)'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:40,alignItems:'center'}} className="price-justify-grid">
                {/* Piecemeal tools */}
                <div>
                  <p style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--faint)',marginBottom:20}}>
                    What you'd stitch together instead
                  </p>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    {[
                      {name:'FreshBooks',    what:'Invoicing + accounting',    price:'$55/mo'},
                      {name:'DocuSign',      what:'E-signatures',               price:'$25/mo'},
                      {name:'Float',         what:'Cash flow forecasting',      price:'$59/mo'},
                      {name:'Harvest',       what:'Time tracking',              price:'$14/mo'},
                    ].map(t=>(
                      <div key={t.name} style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',paddingBottom:10,borderBottom:'1px solid var(--rule)'}}>
                        <div>
                          <span style={{fontSize:'.85rem',fontWeight:600,color:'var(--ink)'}}>{t.name}</span>
                          <span style={{fontSize:'.78rem',color:'var(--faint)',marginLeft:10}}>{t.what}</span>
                        </div>
                        <span className="f-mono" style={{fontSize:'.85rem',color:'var(--mid)',fontWeight:500}}>{t.price}</span>
                      </div>
                    ))}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',paddingTop:4}}>
                      <span style={{fontSize:'.85rem',fontWeight:700,color:'var(--ink)'}}>Total — 4 logins, no AI</span>
                      <span className="f-mono" style={{fontSize:'1.05rem',fontWeight:700,color:'#EF4444'}}>$153/mo</span>
                    </div>
                  </div>
                </div>

                {/* VS divider */}
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                  <div style={{width:1,height:40,background:'var(--rule)'}}/>
                  <span style={{fontSize:'.75rem',fontWeight:700,letterSpacing:'.08em',color:'var(--faint)',textTransform:'uppercase'}}>vs</span>
                  <div style={{width:1,height:40,background:'var(--rule)'}}/>
                </div>

                {/* Invonaut */}
                <div>
                  <p style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--blue)',marginBottom:20}}>
                    Invonaut Professional
                  </p>
                  <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:20}}>
                    {[
                      'Invoicing + AI risk scoring',
                      'Contracts + e-signatures',
                      '90-day cash forecasting',
                      'Time tracking → invoicing',
                      'Automated follow-ups, daily',
                      'Business Health Score',
                    ].map(f=>(
                      <div key={f} style={{display:'flex',alignItems:'center',gap:10}}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{flexShrink:0}}>
                          <circle cx="7" cy="7" r="7" fill="rgba(0,85,255,0.1)"/>
                          <path d="M4.5 7l1.8 1.8L9.5 5.5" stroke="#0055FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span style={{fontSize:'.82rem',color:'var(--mid)'}}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex',alignItems:'baseline',gap:10}}>
                    <span className="f-mono" style={{fontSize:'1.6rem',fontWeight:700,color:'var(--blue)',letterSpacing:'-.02em'}}>$59<span style={{fontSize:'1rem',fontWeight:500,color:'var(--mid)'}}>/mo</span></span>
                    <span style={{fontSize:'.8rem',color:'var(--faint)'}}>or $49/mo annual</span>
                  </div>
                  <p style={{fontSize:'.75rem',color:'var(--teal)',fontWeight:600,marginTop:8}}>
                    Save $94/mo vs piecemeal tools
                  </p>
                </div>
              </div>
            </motion.div>
          </Reveal>
          <Reveal>
            <motion.p variants={fadeUp} style={{fontSize:'.8rem',color:'var(--faint)',marginTop:20,textAlign:'center'}}>
              A bookkeeper charges $300–500/month. A fractional CFO charges more. Invonaut automates what both do — starting at $29.
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
                Plans from $29/mo · No credit card · Cancel anytime · 14-day free trial
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
          <div className="footer-grid" style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr',gap:48,marginBottom:52}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <img src="/naut-white.svg" alt="" aria-hidden="true" style={{width:28,height:28,objectFit:'contain',flexShrink:0,opacity:.9}} />
                <span className="f-display" style={{fontSize:'1.1rem',fontWeight:700,color:'#fff'}}>Invonaut</span>
              </div>
              <p style={{fontSize:'.85rem',color:'rgba(255,255,255,0.3)',lineHeight:1.75,maxWidth:240}}>From Contract to Cash. Automated.</p>
            </div>
            {[
              {head:'Product',links:[{href:'#screenshots',l:'Screenshots'},{href:'#platform',l:'Platform'},{href:'#how-it-works',l:'How it works'},{href:'#pricing',l:'Pricing'},{href:'/affiliate',l:'Affiliate',earn:true}]},
              {head:'Compare',links:[{href:'/vs/wave',l:'vs Wave'},{href:'/vs/freshbooks',l:'vs FreshBooks'},{href:'/vs/bonsai',l:'vs Bonsai'}]},
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
