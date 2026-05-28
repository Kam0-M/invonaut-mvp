// src/app/affiliate/page.tsx
// Affiliate programme page — editorial design matching landing page v5
// Fraunces headlines, blue gradient accents, clean layout

import Link from 'next/link'
import { Check, ArrowRight, DollarSign, Users, TrendingUp, Zap, Clock, Globe } from 'lucide-react'

export const metadata = { title: 'Affiliate Programme — Invonaut' }

const HOW_IT_WORKS = [
  { n: '01', title: 'Sign up',           body: 'Join the programme for free in under a minute. No approval process, no waiting period.' },
  { n: '02', title: 'Share your link',   body: 'Get a unique referral link. Share it anywhere — your site, social media, email newsletters, client conversations.' },
  { n: '03', title: 'Earn every month',  body: 'Earn 30% of every monthly payment your referrals make, for as long as they stay subscribed. There is no cap.' },
]

const WHO_FOR = [
  { icon: Users,      title: 'Freelance communities',  body: 'Run a Discord, Slack, or forum for freelancers? Your members need exactly what Invonaut solves.' },
  { icon: Globe,      title: 'Content creators',        body: 'Newsletters, YouTube channels, podcasts, blogs. If your audience runs their own business, this converts.' },
  { icon: TrendingUp, title: 'Consultants and coaches', body: 'You work with people who need better financial systems. Recommending Invonaut helps them and pays you.' },
  { icon: Zap,        title: 'Accountants and bookkeepers', body: 'Recommend Invonaut to clients who still chase invoices manually. They save time, you earn recurring income.' },
]

const EARNINGS = [
  { refs: 5,   monthly: '$49',  annual: '$588'  },
  { refs: 20,  monthly: '$196', annual: '$2,352' },
  { refs: 50,  monthly: '$490', annual: '$5,880' },
  { refs: 100, monthly: '$980', annual: '$11,760' },
]

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..800&family=DM+Sans:opsz,wght@9..40,300..700&display=swap');
  .f-display { font-family:'Fraunces',serif; font-optical-sizing:auto; }
  .aff-mesh {
    background:
      radial-gradient(ellipse 80% 60% at 100% 0%,   rgba(0,85,255,0.07) 0%, transparent 55%),
      radial-gradient(ellipse 50% 50% at 0%   110%,  rgba(255,107,53,0.04) 0%, transparent 55%),
      #ffffff;
  }
  @media(max-width:768px){
    .earn-grid  { grid-template-columns:1fr !important; }
    .who-grid   { grid-template-columns:1fr 1fr !important; }
    .steps-grid { grid-template-columns:1fr !important; }
  }
  @media(max-width:480px){
    .who-grid { grid-template-columns:1fr !important; }
  }
`

export default function AffiliatePage() {
  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:'#0A0A0A', background:'#fff', overflowX:'clip' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── NAV ────────────────────────────────────────────────────────────── */}
      <nav style={{ borderBottom:'1px solid #E2E8F0', padding:'0 24px', height:58, display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff' }}>
        <Link href="/" style={{ textDecoration:'none' }}>
          <span className="f-display" style={{ fontSize:'1.2rem', fontWeight:700, color:'#0A0A0A', letterSpacing:'-.02em' }}>Invonaut</span>
        </Link>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <Link href="/login"  style={{ fontSize:'.875rem', fontWeight:500, color:'#64748B', textDecoration:'none' }}>Sign in</Link>
          <Link href="/signup" style={{ background:'linear-gradient(135deg,#0044EE,#0066FF)', color:'#fff', padding:'8px 20px', borderRadius:8, fontWeight:700, fontSize:'.875rem', textDecoration:'none', boxShadow:'0 2px 10px rgba(0,85,255,0.25)' }}>
            Start free
          </Link>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="aff-mesh" style={{ padding:'96px 24px 88px' }}>
        <div style={{ maxWidth:760, margin:'0 auto', textAlign:'center' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, border:'1px solid rgba(255,107,53,0.3)', borderRadius:100, padding:'6px 16px', marginBottom:40, fontSize:'.75rem', fontWeight:700, color:'#FF6B35', background:'rgba(255,107,53,0.04)' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#FF6B35', display:'inline-block', flexShrink:0 }}/>
            Affiliate Programme
          </div>
          <h1 className="f-display" style={{ fontSize:'clamp(2.8rem,6vw,5rem)', fontWeight:800, letterSpacing:'-.025em', lineHeight:1.03, marginBottom:24, color:'#0A0A0A' }}>
            Earn 30% recurring<br/>
            <span style={{ background:'linear-gradient(135deg,#0044EE,#4D8EFF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              for every referral.
            </span>
          </h1>
          <p style={{ fontSize:'1.15rem', color:'#64748B', lineHeight:1.75, marginBottom:48, maxWidth:540, margin:'0 auto 48px' }}>
            Refer freelancers and small businesses to Invonaut. Earn 30% of every payment they make, every month, for as long as they stay subscribed. No cap, no expiry.
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/signup" style={{ background:'linear-gradient(135deg,#0044EE,#0066FF)', color:'#fff', padding:'14px 32px', borderRadius:10, fontWeight:700, fontSize:'.95rem', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8, boxShadow:'0 4px 20px rgba(0,85,255,0.3)' }}>
              Join the programme <ArrowRight size={16} strokeWidth={2.5}/>
            </Link>
            <a href="#earnings" style={{ padding:'14px 24px', borderRadius:10, border:'1px solid #E2E8F0', background:'#fff', fontWeight:600, fontSize:'.9rem', color:'#64748B', textDecoration:'none' }}>
              See earnings calculator
            </a>
          </div>
        </div>
      </section>

      {/* ── HEADLINE STATS ─────────────────────────────────────────────────── */}
      <div style={{ borderTop:'1px solid #E2E8F0', borderBottom:'1px solid #E2E8F0', background:'#F8FAFF', padding:'32px 24px' }}>
        <div style={{ maxWidth:840, margin:'0 auto', display:'flex', flexWrap:'wrap', justifyContent:'center', gap:48 }}>
          {[
            { v:'30%',       l:'Recurring commission on every payment' },
            { v:'Forever',   l:'No expiry on your referral earnings'   },
            { v:'$0',        l:'Cost to join — free, always'           },
            { v:'Monthly',   l:'Payouts sent every 30 days'            },
          ].map(s => (
            <div key={s.l} style={{ textAlign:'center' }}>
              <p className="f-display" style={{ fontSize:'2rem', fontWeight:800, color:'#0055FF', letterSpacing:'-.025em', marginBottom:4 }}>{s.v}</p>
              <p style={{ fontSize:'.8rem', color:'#64748B', fontWeight:500, maxWidth:160 }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section style={{ padding:'96px 24px', background:'#fff' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <div style={{ marginBottom:64 }}>
            <p style={{ fontSize:'.72rem', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'#94A3B8', marginBottom:20 }}>How it works</p>
            <h2 className="f-display" style={{ fontSize:'clamp(1.9rem,4vw,3rem)', fontWeight:800, letterSpacing:'-.022em', lineHeight:1.08, color:'#0A0A0A', maxWidth:480 }}>
              Three steps to passive income.
            </h2>
          </div>
          <div className="steps-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', border:'1px solid #E2E8F0', borderRadius:16, overflow:'hidden' }}>
            {HOW_IT_WORKS.map((s, i) => (
              <div key={i} style={{ padding:'40px 32px', background:'#fff', borderRight:i<2?'1px solid #E2E8F0':'none' }}>
                <div className="f-display" style={{ fontSize:'2.4rem', fontWeight:800, marginBottom:24, lineHeight:1,
                  background:'linear-gradient(135deg,#0055FF,#4D8EFF)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', opacity:.3 }}>
                  {s.n}
                </div>
                <p style={{ fontWeight:700, fontSize:'.9rem', color:'#0A0A0A', marginBottom:10, letterSpacing:'-.01em' }}>{s.title}</p>
                <p style={{ fontSize:'.85rem', color:'#64748B', lineHeight:1.8 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EARNINGS CALCULATOR ────────────────────────────────────────────── */}
      <section id="earnings" style={{ padding:'96px 24px', background:'#F8FAFF', borderTop:'1px solid #E2E8F0' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:24, marginBottom:56 }}>
            <div>
              <p style={{ fontSize:'.72rem', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'#94A3B8', marginBottom:20 }}>Earnings calculator</p>
              <h2 className="f-display" style={{ fontSize:'clamp(1.9rem,4vw,3rem)', fontWeight:800, letterSpacing:'-.022em', lineHeight:1.08, color:'#0A0A0A' }}>
                What 30% actually looks like.
              </h2>
            </div>
            <p style={{ fontSize:'.875rem', color:'#64748B', maxWidth:300, lineHeight:1.75 }}>
              Based on the Professional plan at $49/mo. Business plan referrals earn even more.
            </p>
          </div>

          <div className="earn-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:'#E2E8F0', borderRadius:16, overflow:'hidden' }}>
            {/* Header */}
            {['Referrals', 'Monthly earnings', 'Annual earnings', 'Your ROI'].map((h, i) => (
              <div key={i} style={{ background:'#0A0A0A', padding:'16px 20px' }}>
                <p style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'rgba(255,255,255,0.4)' }}>{h}</p>
              </div>
            ))}
            {EARNINGS.map((row, ri) => {
              const cols = [
                `${row.refs} people`,
                row.monthly + '/mo',
                row.annual + '/yr',
                'Free',
              ]
              return cols.map((val, ci) => (
                <div key={`${ri}-${ci}`} style={{ background: ri%2===0 ? '#fff' : '#F8FAFF', padding:'18px 20px' }}>
                  <p style={{ fontSize: ci === 0 ? '.875rem' : '1rem', fontWeight: ci > 0 ? 800 : 600,
                    color: ci === 1 ? '#0055FF' : ci === 2 ? '#16A34A' : '#0A0A0A',
                    letterSpacing:'-.01em' }}>
                    {val}
                  </p>
                </div>
              ))
            })}
          </div>

          <p style={{ fontSize:'.8rem', color:'#94A3B8', marginTop:16, textAlign:'center' }}>
            Earnings compound as referrals upgrade their plan. Business plan ($99/mo) earns you $29.70/mo per referral.
          </p>
        </div>
      </section>

      {/* ── WHO IT'S FOR ───────────────────────────────────────────────────── */}
      <section style={{ padding:'96px 24px', background:'#fff', borderTop:'1px solid #E2E8F0' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <div style={{ marginBottom:64 }}>
            <p style={{ fontSize:'.72rem', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'#94A3B8', marginBottom:20 }}>Who it's for</p>
            <h2 className="f-display" style={{ fontSize:'clamp(1.9rem,4vw,3rem)', fontWeight:800, letterSpacing:'-.022em', lineHeight:1.08, color:'#0A0A0A', maxWidth:500 }}>
              Built for people with an audience.
            </h2>
          </div>
          <div className="who-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
            {WHO_FOR.map((w, i) => {
              const Icon = w.icon
              return (
                <div key={i} style={{ padding:'28px 24px', border:'1px solid #E2E8F0', borderRadius:16, background:'#fff', transition:'background .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFF')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                  <div style={{ width:40, height:40, borderRadius:10, background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                    <Icon size={18} color="#0055FF" />
                  </div>
                  <p style={{ fontWeight:700, fontSize:'.875rem', color:'#0A0A0A', marginBottom:8, letterSpacing:'-.01em' }}>{w.title}</p>
                  <p style={{ fontSize:'.825rem', color:'#64748B', lineHeight:1.75 }}>{w.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── WHAT YOU GET ───────────────────────────────────────────────────── */}
      <section style={{ padding:'80px 24px', background:'#F8FAFF', borderTop:'1px solid #E2E8F0', borderBottom:'1px solid #E2E8F0' }}>
        <div style={{ maxWidth:760, margin:'0 auto', textAlign:'center' }}>
          <p style={{ fontSize:'.72rem', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'#94A3B8', marginBottom:20 }}>What you get</p>
          <h2 className="f-display" style={{ fontSize:'clamp(1.6rem,3.5vw,2.4rem)', fontWeight:800, letterSpacing:'-.022em', lineHeight:1.1, color:'#0A0A0A', marginBottom:48 }}>
            Everything you need to promote Invonaut.
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, textAlign:'left' }}>
            {[
              'Unique referral link active immediately after signup',
              'Real-time dashboard showing clicks, signups, and earnings',
              'Monthly payouts via PayPal or bank transfer',
              'Pre-written email and social copy you can use directly',
              'Landing page assets and product screenshots',
              '30-day cookie window — credit even if they sign up later',
              'Dedicated affiliate support via email',
              'Access to new features first for genuine reviews',
            ].map((feat, i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 16px', background:'#fff', borderRadius:10, border:'1px solid #E2E8F0' }}>
                <div style={{ width:20, height:20, borderRadius:'50%', background:'#EFF6FF', border:'1px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                  <Check size={11} color="#0055FF" strokeWidth={3}/>
                </div>
                <p style={{ fontSize:'.825rem', color:'#374151', lineHeight:1.6 }}>{feat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section style={{ padding:'88px 24px', background:'#fff' }}>
        <div style={{ maxWidth:680, margin:'0 auto' }}>
          <p style={{ fontSize:'.72rem', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'#94A3B8', marginBottom:20 }}>FAQ</p>
          <h2 className="f-display" style={{ fontSize:'clamp(1.6rem,3.5vw,2.4rem)', fontWeight:800, letterSpacing:'-.022em', color:'#0A0A0A', marginBottom:48 }}>
            Common questions.
          </h2>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {[
              { q: 'When do I get paid?',
                a: 'Payouts go out monthly, within the first 5 business days of each month, for the previous month\'s confirmed earnings.' },
              { q: 'What counts as a confirmed referral?',
                a: 'Someone who signs up through your link and completes at least one paid billing cycle. Trial users are not counted until they pay.' },
              { q: 'What if my referral upgrades their plan?',
                a: 'You earn 30% of whatever they pay. If they start on Starter ($19/mo) and upgrade to Business ($99/mo), your commission increases automatically.' },
              { q: 'Is there a limit to how much I can earn?',
                a: 'None. Refer 1 person or 10,000 — the 30% rate applies to all of them, forever.' },
              { q: 'What if my referral cancels and resubscribes?',
                a: 'If they resubscribe within 90 days using any link, you retain credit. After 90 days, the cookie resets.' },
              { q: 'Can I refer my own account?',
                a: 'Self-referrals are not eligible for commission. The programme is for referring other businesses and individuals.' },
            ].map((faq, i, arr) => (
              <div key={i} style={{ padding:'24px 0', borderBottom: i < arr.length-1 ? '1px solid #E2E8F0' : 'none' }}>
                <p style={{ fontWeight:700, fontSize:'.925rem', color:'#0A0A0A', marginBottom:8, letterSpacing:'-.01em' }}>{faq.q}</p>
                <p style={{ fontSize:'.875rem', color:'#64748B', lineHeight:1.75 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section style={{ background:'linear-gradient(145deg,#002ECC 0%,#0044EE 35%,#0055FF 65%,#003DCC 100%)', padding:'96px 24px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 70% at 110% -10%,rgba(255,107,53,0.12) 0%,transparent 55%)', pointerEvents:'none' }}/>
        <div style={{ maxWidth:640, margin:'0 auto', textAlign:'center', position:'relative' }}>
          <h2 className="f-display" style={{ fontSize:'clamp(2.2rem,5vw,3.8rem)', fontWeight:800, letterSpacing:'-.025em', lineHeight:1.05, color:'#fff', marginBottom:24 }}>
            Turn your audience into income.
          </h2>
          <p style={{ fontSize:'1.05rem', color:'rgba(255,255,255,0.55)', lineHeight:1.8, marginBottom:44, maxWidth:440, margin:'0 auto 44px' }}>
            Join the affiliate programme for free. Start earning 30% recurring commission the moment your first referral subscribes.
          </p>
          <Link href="/signup" style={{ background:'#fff', color:'#0044EE', padding:'15px 40px', borderRadius:10, fontWeight:800, fontSize:'1rem', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:10, boxShadow:'0 4px 24px rgba(0,0,0,0.2)' }}>
            Join free — start earning <ArrowRight size={17} strokeWidth={2.5}/>
          </Link>
          <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'.75rem', marginTop:18 }}>
            Free to join · No approval required · Payouts every month
          </p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{ background:'#030712', padding:'40px 24px', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth:1000, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
          <span className="f-display" style={{ fontSize:'1rem', fontWeight:700, color:'rgba(255,255,255,0.4)' }}>Invonaut</span>
          <div style={{ display:'flex', gap:24 }}>
            {[{href:'/',l:'Home'},{href:'/pricing',l:'Pricing'},{href:'/help',l:'Help'},{href:'/privacy',l:'Privacy'},{href:'/terms',l:'Terms'}].map(lk => (
              <Link key={lk.href} href={lk.href} style={{ fontSize:'.8rem', color:'rgba(255,255,255,0.3)', textDecoration:'none', transition:'color .15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
                {lk.l}
              </Link>
            ))}
          </div>
          <p style={{ fontSize:'.75rem', color:'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} Invonaut</p>
        </div>
      </footer>
    </div>
  )
}
