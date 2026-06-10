import Link from 'next/link'
import {
  ArrowLeft, HelpCircle, FileText, Users, Zap,
  Bell, Shield, Mail, TrendingUp, Clock,
  Banknote, Lock, CheckCircle2,
  BookOpen, BarChart3, Database, PieChart,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import HelpFaq from '@/components/help/help-faq'
import HelpQuickNav from '@/components/help/help-quick-nav'

export const dynamic = 'force-dynamic'

export default async function HelpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  const features = [
    {
      icon: Zap,
      color: '#0055FF',
      title: 'AI Payment Intelligence',
      desc: 'Every sent invoice gets a risk score and predicted payment date. The system flags high-risk clients and queues follow-up emails automatically.',
      badge: 'Requires OpenAI credits',
      badgeBg: 'rgba(0,85,255,0.08)', badgeColor: '#0055FF',
    },
    {
      icon: Bell,
      color: '#00C4A0',
      title: 'Automated Follow-ups',
      desc: 'Overdue invoices trigger professional reminder emails on a 48-hour rate limit per invoice. You never send an awkward payment email again.',
      badge: 'Runs daily at 9am',
      badgeBg: 'rgba(0,196,160,0.08)', badgeColor: '#00C4A0',
    },
    {
      icon: TrendingUp,
      color: '#0055FF',
      title: '90-Day Cash Forecast',
      desc: 'Projects your cash position week by week from invoice due dates, AI predictions, and expense history. See shortfalls before they happen.',
      badge: 'Cash Management',
      badgeBg: 'rgba(0,85,255,0.08)', badgeColor: '#0055FF',
    },
    {
      icon: FileText,
      color: '#FF6B35',
      title: 'Contracts & E-signatures',
      desc: 'Build contracts from templates, send for e-signature with one link, and connect them to invoices. Expiry reminders run daily without you.',
      badge: 'No DocuSign needed',
      badgeBg: 'rgba(255,107,53,0.08)', badgeColor: '#FF6B35',
    },
    {
      icon: Banknote,
      color: '#00C4A0',
      title: 'Direct Payments',
      desc: 'Log cash, bank transfers, POS, and mobile money alongside invoiced income. Every income source in one place, unified in analytics.',
      badge: 'Complete income picture',
      badgeBg: 'rgba(0,196,160,0.08)', badgeColor: '#00C4A0',
    },
    {
      icon: Users,
      color: '#0055FF',
      title: 'Client Portal',
      desc: 'A branded portal for each client — view invoices, download PDFs, sign contracts, and pay online with a card. Magic link access, no account needed.',
      badge: 'Online payments included',
      badgeBg: 'rgba(0,85,255,0.08)', badgeColor: '#0055FF',
    },
    {
      icon: Clock,
      color: '#FF6B35',
      title: 'Time Tracking',
      desc: 'Live timer or manual entry. One click converts billable hours directly into invoice line items. Weekly unbilled summary every Monday.',
      badge: 'Timer syncs across tabs',
      badgeBg: 'rgba(255,107,53,0.08)', badgeColor: '#FF6B35',
    },
    {
      icon: BarChart3,
      color: '#00C4A0',
      title: 'Business Analytics',
      desc: 'Business Health Score (A–F), revenue by source, client intelligence, expense breakdown, and 12-month trends — all live and always current.',
      badge: 'AI-powered insights',
      badgeBg: 'rgba(0,196,160,0.08)', badgeColor: '#00C4A0',
    },
    {
      icon: PieChart,
      color: '#0055FF',
      title: 'Financial Reports Hub',
      desc: 'Full P&L with EBITDA waterfall, Balance Sheet, Asset Register with depreciation, Period Comparison, and Expense Breakdown — all exportable.',
      badge: 'Accountant-ready',
      badgeBg: 'rgba(0,85,255,0.08)', badgeColor: '#0055FF',
    },
    {
      icon: Database,
      color: '#00C4A0',
      title: 'Bank Connections',
      desc: 'Connect your bank via Plaid, sync transactions automatically, and reconcile them against your invoices. Real balances, real cash flow.',
      badge: 'Plaid-powered',
      badgeBg: 'rgba(0,196,160,0.08)', badgeColor: '#00C4A0',
    },
  ]

  const automations = [
    { label: 'Invoice follow-up',          desc: 'Identifies overdue invoices, sends professional reminders',                           time: 'Daily 9am'  },
    { label: 'AI financial briefing',       desc: 'Daily intelligence report: risk profiles, subscriptions, anomalies',                  time: 'Daily 8am'  },
    { label: 'Contract expiry watch',       desc: 'Alerts 30 / 15 / 7 / 1 days before contract expiry',                                 time: 'Daily 9am'  },
    { label: 'Budget overspend alerts',     desc: '80% and 100% overspend warnings by category (Business tier)',                         time: 'Daily 9am'  },
    { label: 'Weekly time summary',         desc: 'Monday email: hours logged, billable value, unbilled balance',                        time: 'Monday 9am' },
    { label: 'AI invoice risk scoring',     desc: 'Scores payment probability and flags risk the moment an invoice is sent',             time: 'On send'    },
    { label: 'AI expense categorisation',   desc: 'Suggests the right category from the expense description',                            time: 'On entry'   },
    { label: 'Cash forecast recalculation', desc: 'Rebuilds your 90-day projected balance from live invoice and expense data',           time: 'On open'    },
    { label: 'Dashboard live refresh',      desc: 'Keeps activity feed, invoice status, and metrics current without a page reload',      time: 'Every 30s'  },
  ]

  return (
    <div style={{minHeight:'100vh',background:'#F8FAFF'}}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{background:'#070C1A'}}>
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',backgroundSize:'28px 28px'}}/>
        {/* Blue orb */}
        <div className="absolute top-0 left-1/3 w-96 h-96 pointer-events-none"
          style={{background:'radial-gradient(circle, rgba(0,85,255,0.12) 0%, transparent 70%)'}}/>
        {/* Teal orb */}
        <div className="absolute bottom-0 right-1/4 w-72 h-72 pointer-events-none"
          style={{background:'radial-gradient(circle, rgba(0,196,160,0.08) 0%, transparent 70%)'}}/>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-14 sm:py-20">
          <Link
            href={isLoggedIn ? '/dashboard' : '/'}
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors mb-10"
            style={{color:'rgba(255,255,255,0.4)'}}
          >
            <ArrowLeft className="w-4 h-4" />
            {isLoggedIn ? 'Back to Dashboard' : 'Back to home'}
          </Link>

          <div className="flex items-start gap-5 mb-8">
            {/* Naut logo */}
            <div className="flex-shrink-0 mt-1">
              <img src="/naut-icon.svg" alt="Invonaut" style={{width:48,height:48,borderRadius:12}}/>
            </div>
            <div>
              <p className="inv-overline" style={{color:'rgba(0,85,255,0.7)',marginBottom:8}}>Help Center</p>
              <h1 style={{
                fontFamily:"'Fraunces',serif",fontSize:'clamp(28px,5vw,52px)',
                fontWeight:800,color:'#fff',letterSpacing:'-.03em',
                lineHeight:1.05,marginBottom:12,
              }}>
                Everything you need<br/>
                <span style={{color:'#0055FF'}}>to run your business.</span>
              </h1>
              <p style={{color:'rgba(255,255,255,0.45)',fontSize:'clamp(13px,1.4vw,16px)',fontWeight:400,maxWidth:480,lineHeight:1.6}}>
                From your first contract to your latest financial report — here's how Invonaut works.
              </p>
            </div>
          </div>

          {/* Quick nav */}
          <HelpQuickNav />
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-14">

        {/* ── Quick Start ──────────────────────────────────────────── */}
        <section id="quick-start">
          <p className="inv-overline mb-1">
            <BookOpen className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5"/>Quick Start
          </p>
          <h2 style={{fontSize:'clamp(18px,2vw,24px)',fontWeight:800,color:'#0A0A0A',marginBottom:20,letterSpacing:'-.02em'}}>
            Up and running in 5 minutes
          </h2>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                step:'1', title:'Add your first client', icon:Users,
                accent:'#0055FF',
                desc:'Every invoice, contract, and payment connects to a client. Start here — it takes 30 seconds.',
                cta: isLoggedIn ? {label:'Add client',href:'/dashboard/clients/new'} : {label:'Get started',href:'/pricing'},
              },
              {
                step:'2', title:'Create and send an invoice', icon:FileText,
                accent:'#00C4A0',
                desc:'Auto-numbered, branded, sent with a PDF and a Pay Now link. AI scores it for payment risk on send.',
                cta: isLoggedIn ? {label:'New invoice',href:'/dashboard/invoices/new'} : null,
              },
              {
                step:'3', title:'Let the system take over', icon:Zap,
                accent:'#FF6B35',
                desc:'Invonaut monitors status, sends reminders, updates your cash forecast, and keeps your reports current — automatically.',
                cta: isLoggedIn ? {label:'View dashboard',href:'/dashboard'} : null,
              },
            ].map(card => (
              <div
                key={card.step}
                className="bg-white rounded-2xl border border-gray-100 p-6 transition-all duration-200 hover:-translate-y-0.5"
                style={{boxShadow:`0 0 0 1px rgba(0,0,0,0.03), 0 4px 16px rgba(0,85,255,0.06)`}}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{background:card.accent}}>
                    <span className="text-white font-black text-sm">{card.step}</span>
                  </div>
                  <card.icon className="w-4 h-4 text-gray-300"/>
                </div>
                <h3 className="text-sm font-black text-gray-900 mb-2">{card.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{card.desc}</p>
                {card.cta && (
                  <Link href={card.cta.href}
                    className="text-xs font-bold transition-colors"
                    style={{color:'#0055FF'}}
                  >
                    {card.cta.label} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── The Platform ─────────────────────────────────────────── */}
        <section id="features">
          <p className="inv-overline mb-1">
            <Zap className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5"/>The Platform
          </p>
          <h2 style={{fontSize:'clamp(18px,2vw,24px)',fontWeight:800,color:'#0A0A0A',marginBottom:4,letterSpacing:'-.02em'}}>
            Everything in one place
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-xl leading-relaxed">
            Invonaut isn't a better invoicing tool. It's a complete business operations layer — from time tracking to financial reports, contracts to bank reconciliation.
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            {features.map(f => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-gray-100 p-5 transition-all duration-200 hover:-translate-y-0.5 flex items-start gap-4"
                style={{boxShadow:'0 0 0 1px rgba(0,0,0,0.02), 0 4px 16px rgba(0,85,255,0.05)'}}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:f.color}}>
                  <f.icon className="w-4 h-4 text-white"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <p className="text-sm font-black text-gray-900">{f.title}</p>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{background:f.badgeBg,color:f.badgeColor}}
                    >
                      {f.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Automations ──────────────────────────────────────────── */}
        <section id="automations">
          <p className="inv-overline mb-1">
            <Bell className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5"/>Automations
          </p>
          <h2 style={{fontSize:'clamp(18px,2vw,24px)',fontWeight:800,color:'#0A0A0A',marginBottom:4,letterSpacing:'-.02em'}}>
            9 processes that run without you
          </h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            These run on a fixed schedule whether or not you're logged in. Invoices followed up, contracts watched, bank data synced, reports current.
          </p>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            style={{boxShadow:'0 0 0 1px rgba(0,0,0,0.02), 0 4px 16px rgba(0,85,255,0.05)'}}>
            {automations.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[#F8FAFF] ${
                  i < automations.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0 inv-pulse-dot"
                  style={{background:'#00C4A0'}}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg flex-shrink-0 whitespace-nowrap">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <section id="faq">
          <p className="inv-overline mb-1">
            <HelpCircle className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5"/>FAQ
          </p>
          <h2 style={{fontSize:'clamp(18px,2vw,24px)',fontWeight:800,color:'#0A0A0A',marginBottom:20,letterSpacing:'-.02em'}}>
            Common questions, answered
          </h2>
          <HelpFaq />
        </section>

        {/* ── Security ─────────────────────────────────────────────── */}
        <section id="security">
          <div
            className="bg-white rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-0.5"
            style={{borderColor:'rgba(0,196,160,0.2)',boxShadow:'0 0 32px rgba(0,196,160,0.06)'}}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'#00C4A0'}}>
                <Shield className="w-4 h-4 text-white"/>
              </div>
              <div>
                <p className="inv-overline" style={{marginBottom:2}}>Security &amp; Privacy</p>
                <h2 className="text-sm font-black text-gray-900">Your financial data is protected</h2>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                {icon:Lock,         title:'AES-256 encryption',   desc:'All data encrypted in transit (TLS) and at rest'},
                {icon:Shield,       title:'Row Level Security',    desc:'Your data is fully isolated — no other user can access it'},
                {icon:CheckCircle2, title:'Never sold or shared',  desc:'Your data is yours, always. Not sold, not shared.'},
              ].map(item => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{background:'rgba(0,196,160,0.05)',border:'1px solid rgba(0,196,160,0.15)'}}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{color:'#00C4A0'}}/>
                  <div>
                    <p className="text-xs font-black text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Contact CTA ──────────────────────────────────────────── */}
        <section>
          <div className="relative overflow-hidden rounded-2xl p-8 sm:p-10"
            style={{background:'#070C1A'}}>
            <div className="absolute inset-0 pointer-events-none"
              style={{backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',backgroundSize:'24px 24px'}}/>
            <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
              style={{background:'radial-gradient(circle, rgba(0,196,160,0.10) 0%, transparent 70%)'}}/>

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <p className="inv-overline" style={{color:'rgba(0,196,160,0.7)',marginBottom:8}}>Still need help?</p>
                <h2 style={{fontFamily:"'Fraunces',serif",fontSize:'clamp(20px,2.5vw,30px)',fontWeight:800,color:'#fff',letterSpacing:'-.02em',marginBottom:8}}>
                  We're here for you.
                </h2>
                <p style={{fontSize:14,color:'rgba(255,255,255,0.4)',maxWidth:400,lineHeight:1.7}}>
                  We respond within 24 hours. Professional and Business plan users get priority.
                </p>
              </div>
              <div className="flex flex-col gap-3 flex-shrink-0">
                <a
                  href="mailto:kamohelo.thakhisi@gmail.com"
                  className="inline-flex items-center gap-2 btn-primary px-5 py-2.5 rounded-xl text-sm"
                >
                  <Mail className="w-4 h-4"/>Email support
                </a>
                {!isLoggedIn && (
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{color:'rgba(255,255,255,0.4)',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}}
                  >
                    View plans →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Affiliate strip ──────────────────────────────────────── */}
        <section className="pb-8">
          <div
            className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col sm:flex-row items-center gap-5"
            style={{boxShadow:'0 0 0 1px rgba(0,0,0,0.02)'}}
          >
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-sm font-black text-gray-900">Earn by sharing Invonaut</p>
              <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
                Refer any business owner — earn 30% recurring commission for every paying customer you bring in.
              </p>
            </div>
            <Link
              href="/affiliate"
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:-translate-y-0.5 whitespace-nowrap"
              style={{background:'#0A0A0A'}}
            >
              Join affiliate program →
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}
