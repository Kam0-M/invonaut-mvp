import Link from 'next/link'
import {
  ArrowLeft, HelpCircle, FileText, Users, Zap,
  Bell, Shield, Mail, TrendingUp, Clock,
  Banknote, ExternalLink, Lock, CheckCircle2,
  BookOpen, BarChart3,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import HelpFaq from '@/components/help/help-faq'

export default async function HelpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  const features = [
    {
      icon: Zap, color: 'bg-blue-600',
      glow: '0 0 24px rgba(0,102,255,0.12)',
      title: 'AI Payment Predictions',
      desc: 'Every sent invoice gets a risk score and predicted payment date. The system flags high-risk invoices and queues follow-ups automatically.',
      badge: 'Activates with OpenAI credits', badgeCls: 'bg-blue-50 text-blue-700',
    },
    {
      icon: Bell, color: 'bg-teal-500',
      glow: '0 0 24px rgba(0,212,170,0.12)',
      title: 'Automated Follow-ups',
      desc: 'Overdue invoices trigger professional reminder emails daily. Rate-limited to 48h per invoice to protect client relationships.',
      badge: 'Runs daily at 9am', badgeCls: 'bg-teal-50 text-teal-700',
    },
    {
      icon: TrendingUp, color: 'bg-blue-500',
      glow: '0 0 24px rgba(0,102,255,0.10)',
      title: '90-Day Cash Forecast',
      desc: "See your projected cash position week by week based on invoice due dates, AI predictions, and expense history. Shortfalls show up before they happen.",
      badge: 'Cash Management', badgeCls: 'bg-blue-50 text-blue-700',
    },
    {
      icon: FileText, color: 'bg-orange-500',
      glow: '0 0 24px rgba(255,107,53,0.12)',
      title: 'Contracts & E-signatures',
      desc: 'Create contracts from 6 templates, send for e-signature with one link, and link them to invoices. Expiry reminders run daily.',
      badge: 'No DocuSign needed', badgeCls: 'bg-orange-50 text-orange-700',
    },
    {
      icon: Banknote, color: 'bg-teal-600',
      glow: '0 0 24px rgba(0,212,170,0.10)',
      title: 'Direct Payments',
      desc: 'Log cash, POS, bank transfers, and mobile money alongside invoiced income. Every dollar in one place, unified in analytics.',
      badge: 'Complete income picture', badgeCls: 'bg-teal-50 text-teal-700',
    },
    {
      icon: ExternalLink, color: 'bg-blue-600',
      glow: '0 0 24px rgba(0,102,255,0.10)',
      title: 'Client Portal',
      desc: 'A branded link for each client — they view invoices, download PDFs, and sign contracts. Magic link auth, no account needed.',
      badge: 'Pro/Business: your branding', badgeCls: 'bg-blue-50 text-blue-700',
    },
    {
      icon: Clock, color: 'bg-orange-500',
      glow: '0 0 24px rgba(255,107,53,0.10)',
      title: 'Time Tracking',
      desc: 'Live timer or manual entry. One click converts billable hours to invoice line items. Weekly summary email every Monday.',
      badge: 'Timer syncs across tabs', badgeCls: 'bg-orange-50 text-orange-700',
    },
    {
      icon: BarChart3, color: 'bg-teal-500',
      glow: '0 0 24px rgba(0,212,170,0.10)',
      title: 'Business Analytics',
      desc: 'Business Health Score (A–F), revenue by source, client intelligence, expense breakdown, and 12-month trend — all live.',
      badge: 'AI-powered insights', badgeCls: 'bg-teal-50 text-teal-700',
    },
  ]

  const automations = [
    { label: 'Invoice follow-up cron',    desc: 'Identifies overdue invoices, sends reminders',             time: 'Daily 9am'  },
    { label: 'Contract expiry reminders', desc: 'Alerts at 30 / 15 / 7 / 1 days before expiry',             time: 'Daily 9am'  },
    { label: 'Budget alerts',             desc: '80% and 100% overspend alerts (Business tier)',              time: 'Daily 9am'  },
    { label: 'Weekly time summary',       desc: 'Monday email: hours, billable value, unbilled outstanding',  time: 'Monday 9am' },
    { label: 'AI invoice risk scoring',   desc: 'Scores payment probability when invoice is sent',            time: 'On send'    },
    { label: 'AI expense categorisation', desc: 'Suggests category from expense description',                 time: 'On entry'   },
    { label: '90-day cash forecast',      desc: 'Recalculates projected balance from live data',              time: 'On open'    },
    { label: 'Dashboard auto-refresh',    desc: 'Keeps activity feed and metrics current',                    time: 'Every 30s'  },
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Dark hero ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gray-900">
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-0 left-1/3 w-80 h-80 opacity-[0.07] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #0066FF 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-56 h-56 opacity-[0.07] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #00D4AA 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-14 sm:py-20">
          <Link href={isLoggedIn ? '/dashboard' : '/'}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm font-medium transition-colors mb-10">
            <ArrowLeft className="w-4 h-4" />
            {isLoggedIn ? 'Back to Dashboard' : 'Back to home'}
          </Link>

          <div className="flex items-start gap-5 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <HelpCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">Help Center</h1>
              <p className="text-gray-400 text-base font-medium max-w-lg leading-relaxed">
                Everything you need to get the most out of Invonaut — from first invoice to full autonomy.
              </p>
            </div>
          </div>

          {/* Quick nav */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Quick Start', href: '#quick-start' },
              { label: 'Features',   href: '#features'    },
              { label: 'Automations',href: '#automations' },
              { label: 'FAQ',        href: '#faq'         },
              { label: 'Security',   href: '#security'    },
            ].map(item => (
              <a key={item.label} href={item.href}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-gray-400 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10 transition-all">
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">

        {/* Quick Start */}
        <section id="quick-start">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Quick Start</p>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-5">Up and running in 5 minutes</h2>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                step: '1', title: 'Add your first client', icon: Users,
                desc: 'Every invoice, payment, and contract links to a client. Start here.',
                color: 'bg-blue-600', border: 'border-blue-100',
                glow: '0 0 24px rgba(0,102,255,0.10)',
                cta: isLoggedIn ? { label: 'Add client', href: '/dashboard/clients/new' } : { label: 'Get started', href: '/pricing' },
              },
              {
                step: '2', title: 'Create and send an invoice', icon: FileText,
                desc: 'Auto-numbered, branded, delivered with a PDF attachment. AI scores it on send.',
                color: 'bg-teal-500', border: 'border-teal-100',
                glow: '0 0 24px rgba(0,212,170,0.10)',
                cta: isLoggedIn ? { label: 'New invoice', href: '/dashboard/invoices/new' } : null,
              },
              {
                step: '3', title: 'Let the system watch it', icon: Zap,
                desc: 'Invonaut tracks payment status, sends reminders, and updates your cash forecast — automatically.',
                color: 'bg-orange-500', border: 'border-orange-100',
                glow: '0 0 24px rgba(255,107,53,0.10)',
                cta: isLoggedIn ? { label: 'View dashboard', href: '/dashboard' } : null,
              },
            ].map(card => (
              <div key={card.step}
                className={`bg-white rounded-2xl border p-6 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ${card.border}`}
                style={{ boxShadow: card.glow }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${card.color}`}>
                    <span className="text-white font-black text-sm">{card.step}</span>
                  </div>
                  <card.icon className="w-4 h-4 text-gray-400" />
                </div>
                <h3 className="text-sm font-black text-gray-900 mb-2">{card.title}</h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">{card.desc}</p>
                {card.cta && (
                  <Link href={card.cta.href}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    {card.cta.label} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-teal-500" />
            <p className="text-xs font-bold text-teal-600 uppercase tracking-widest">Features</p>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-5">What Invonaut does for you</h2>

          <div className="grid sm:grid-cols-2 gap-3">
            {features.map(f => (
              <div key={f.title}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex items-start gap-4"
                style={{ boxShadow: f.glow }}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${f.color}`}>
                  <f.icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <p className="text-sm font-black text-gray-900">{f.title}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${f.badgeCls}`}>{f.badge}</span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Automations */}
        <section id="automations">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Automations</p>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-1">8 processes that run without you</h2>
          <p className="text-sm text-gray-500 font-medium mb-5">
            These run daily in the background — invoices followed up, contracts watched, budgets monitored — whether you log in or not.
          </p>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {automations.map((item, i) => (
              <div key={i}
                className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors ${
                  i < automations.length - 1 ? 'border-b border-gray-50' : ''
                }`}>
                <span className="w-2 h-2 rounded-full bg-teal-400 inv-pulse-dot flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-400 font-medium">{item.desc}</p>
                </div>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg flex-shrink-0 whitespace-nowrap">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq">
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">FAQ</p>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-5">Common questions, answered</h2>
          <HelpFaq />
        </section>

        {/* Security */}
        <section id="security">
          <div className="bg-white rounded-2xl border border-teal-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            style={{ boxShadow: '0 0 32px rgba(0,212,170,0.08)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">Security & Privacy</p>
                <h2 className="text-sm font-black text-gray-900 mt-0.5">Your financial data is protected</h2>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: Lock,          title: 'AES-256 encryption',  desc: 'All data encrypted in transit and at rest' },
                { icon: Shield,        title: 'Row Level Security',   desc: 'Your data is completely isolated from other users' },
                { icon: CheckCircle2,  title: 'Never sold or shared', desc: 'Your data is yours — never shared with third parties' },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl bg-teal-50 border border-teal-100">
                  <item.icon className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section>
          <div className="relative overflow-hidden rounded-2xl bg-gray-900 p-8 sm:p-10">
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.08] pointer-events-none"
              style={{ background: 'radial-gradient(circle, #00D4AA 0%, transparent 70%)' }} />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <p className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-2">Still need help?</p>
                <h2 className="text-2xl font-black text-white mb-2">We're here for you.</h2>
                <p className="text-sm text-gray-400 font-medium max-w-md leading-relaxed">
                  Typically respond within 24 hours. Professional and Business plan users get priority response.
                </p>
              </div>
              <div className="flex flex-col gap-3 flex-shrink-0">
                <a href="mailto:kamohelo.thakhisi@gmail.com"
                  className="inline-flex items-center gap-2 btn-primary px-5 py-2.5 rounded-xl text-sm">
                  <Mail className="w-4 h-4" />Email support
                </a>
                {!isLoggedIn && (
                  <Link href="/pricing"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-400 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all">
                    View plans →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Affiliate strip */}
        <section className="py-10 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col sm:flex-row items-center gap-5">
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-sm font-black text-gray-900">Love using Invonaut?</p>
                <p className="text-sm text-gray-500 mt-0.5">Refer freelancers and business owners — earn 30% recurring commission for every paying customer you send our way.</p>
              </div>
              <Link
                href="/affiliate"
                className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-black rounded-xl transition-all hover:-translate-y-0.5 text-sm whitespace-nowrap"
              >
                Join affiliate program →
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
