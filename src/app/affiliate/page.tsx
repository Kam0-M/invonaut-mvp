'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight, DollarSign, Users, TrendingUp, Check,
  Zap, Globe, BarChart3, ChevronDown, ChevronUp,
  Mail, Briefcase, MessageSquare, ExternalLink
} from 'lucide-react'

const FAQS = [
  {
    q: "How much can I earn?",
    a: "30% recurring commission on every paying customer you refer — for as long as they stay subscribed. A single Professional customer ($99/mo) earns you $29.70/mo indefinitely. Refer 10 and you're earning $297+/mo passively."
  },
  {
    q: "When do I get paid?",
    a: "Commissions are paid out monthly via PayPal or bank transfer, with a 30-day holding period to account for refunds. There's a minimum payout threshold of $50."
  },
  {
    q: "Who should apply?",
    a: "Anyone with an audience of freelancers, solopreneurs, or small business owners. Content creators, newsletter writers, YouTube channels about business/freelance, accountants, coaches, and community managers all tend to convert well."
  },
  {
    q: "Is there a cost to join?",
    a: "No. Applying is free, there's no lock-in, and you can leave at any time. We only make money when you do."
  },
  {
    q: "How does tracking work?",
    a: "You get a unique referral link. Every signup through your link is tracked for 90 days with a cookie, so even if someone signs up a month after clicking your link, you get credit."
  },
  {
    q: "Do I need to be an Invonaut customer?",
    a: "No, but it helps. Affiliates who use the product convert 2–3x better because they can speak authentically about the experience."
  }
]

const STEPS = [
  { icon: Mail,       step: '01', title: 'Apply',       desc: 'Fill out the form below. We review every application within 2–3 business days.' },
  { icon: ExternalLink, step: '02', title: 'Get your link', desc: 'Once approved, you receive a unique referral link and access to your affiliate dashboard.' },
  { icon: DollarSign,  step: '03', title: 'Get paid',   desc: '30% recurring commission deposited monthly. No cap. No expiry.' },
]

const TIERS = [
  { plan: 'Starter',      price: 49, commission: 14.70, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
  { plan: 'Professional', price: 99, commission: 29.70, color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100',  highlight: true },
  { plan: 'Business',     price: 149, commission: 44.70, color: 'text-teal-600',   bg: 'bg-teal-50',   border: 'border-teal-100' },
]

export default function AffiliatePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', email: '', website: '', audience: '', reason: '' })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const handleSubmit = async () => {
    if (!form.name || !form.email) return
    setStatus('submitting')
    try {
      const res = await fetch('/api/affiliate-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      setStatus(data.success ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="h-14 border-b border-gray-100 flex items-center justify-between px-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <img src="/invonaut-logo.png" alt="Invonaut" className="w-7 h-7 rounded-full" />
          <span className="font-black text-gray-900 text-base">Invonaut</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Pricing</Link>
          <Link href="/signup" className="btn-primary px-4 py-2 rounded-xl text-sm">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-950 pt-20 pb-24 px-6">
        {/* Star background */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(60)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${0.5 + Math.random() * 1.2}px`,
                height: `${0.5 + Math.random() * 1.2}px`,
                opacity: 0.08 + Math.random() * 0.5,
              }}
            />
          ))}
        </div>
        {/* Orbs */}
        <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,102,255,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,212,170,0.14) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-300 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border border-blue-500/20">
            <DollarSign className="w-3.5 h-3.5" />
            Affiliate Program
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-6">
            Earn 30% recurring.<br />
            <span className="text-blue-400">Forever.</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Refer freelancers and small business owners to Invonaut. Every month they stay subscribed, you get paid. No cap. No expiry. Just passive income from helping people run their business better.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#apply"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-4 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Apply now — it's free <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold px-8 py-4 rounded-xl transition-all"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-3 divide-x divide-gray-100">
          {[
            { value: '30%', label: 'Recurring commission', icon: TrendingUp },
            { value: '90d', label: 'Cookie window', icon: Globe },
            { value: '$0', label: 'Cost to join', icon: Zap },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="py-8 px-6 text-center">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-3xl font-black text-gray-900">{value}</p>
              <p className="text-sm text-gray-500 mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-4xl font-black text-gray-900">Three steps to passive income</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4.5 h-4.5 text-white" style={{ width: '18px', height: '18px' }} />
                  </div>
                  <span className="text-xs font-black text-gray-300 tracking-widest">{step}</span>
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission breakdown */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">What you earn</p>
            <h2 className="text-4xl font-black text-gray-900">Every plan. Every month.</h2>
            <p className="text-gray-500 mt-3 font-medium">You earn 30% of every subscription payment — including annual plans.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {TIERS.map(({ plan, price, commission, color, bg, border, highlight }) => (
              <div
                key={plan}
                className={`bg-white rounded-2xl border p-6 ${border} ${highlight ? 'ring-2 ring-blue-500/20 shadow-md' : ''} transition-all`}
              >
                {highlight && (
                  <div className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3">Most referred</div>
                )}
                <p className="text-sm font-black text-gray-400 uppercase tracking-wider mb-1">{plan}</p>
                <p className="text-3xl font-black text-gray-900">${price}<span className="text-base font-bold text-gray-400">/mo</span></p>
                <div className={`mt-4 ${bg} rounded-xl p-3`}>
                  <p className="text-xs text-gray-500 font-medium">You earn per customer/mo</p>
                  <p className={`text-2xl font-black ${color} mt-0.5`}>${commission.toFixed(2)}</p>
                </div>
                <div className={`mt-3 ${bg} rounded-xl p-3`}>
                  <p className="text-xs text-gray-500 font-medium">Refer 10 customers → /mo</p>
                  <p className={`text-xl font-black ${color} mt-0.5`}>${(commission * 10).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4.5 h-4.5 text-teal-600" style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <p className="font-black text-gray-900 mb-1">Annual plans pay out more</p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  When a customer you referred upgrades to an annual plan, your commission is paid out on the full annual value upfront. A single Professional annual customer ($990/yr) pays you <strong className="text-gray-900">$297 in one payment</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Who it's for</p>
            <h2 className="text-4xl font-black text-gray-900">You probably qualify</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Content creators', desc: 'YouTube, blogs, newsletters about freelancing, business, or finance.' },
              { title: 'Community managers', desc: 'Run a Discord, Slack, or Facebook group of freelancers or entrepreneurs.' },
              { title: 'Accountants & bookkeepers', desc: 'Refer clients who need better invoicing and cash flow tools.' },
              { title: 'Business coaches', desc: 'Help clients systematise their finances alongside your coaching.' },
              { title: 'Course creators', desc: 'Teach freelancing or business skills? Recommend the tools they need.' },
              { title: 'Anyone with an audience', desc: "If your followers run their own business, they need Invonaut." },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  <p className="font-black text-gray-900 text-sm">{title}</p>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-4xl font-black text-gray-900">Common questions</h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-black text-gray-900 text-sm pr-4">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application form */}
      <section id="apply" className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Apply now</p>
            <h2 className="text-4xl font-black text-gray-900">Join the program</h2>
            <p className="text-gray-500 mt-3">We review every application within 2–3 business days.</p>
          </div>

          {status === 'success' ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-teal-50 border border-teal-100 rounded-2xl p-10 text-center"
            >
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Application received</h3>
              <p className="text-gray-600 font-medium">We'll review your application and get back to you within 2–3 business days. Check your inbox for a confirmation email.</p>
            </motion.div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Website / Social Profile</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400"
                  placeholder="https://yoursite.com or @handle"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Describe your audience</label>
                <input
                  type="text"
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400"
                  placeholder="e.g. 5k newsletter subscribers, freelance designers"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Why do you want to be an affiliate?</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400 resize-none"
                  placeholder="Tell us how you'd promote Invonaut..."
                />
              </div>

              {status === 'error' && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-medium">
                  Something went wrong. Please try again or email kamohelo.thakhisi@gmail.com directly.
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!form.name || !form.email || status === 'submitting'}
                className="w-full btn-primary py-3.5 rounded-xl font-black text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'submitting' ? 'Submitting...' : 'Submit Application'}
              </button>

              <p className="text-xs text-gray-400 text-center">
                By applying you agree to our affiliate terms. Free to join, cancel any time.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <img src="/invonaut-logo.png" alt="Invonaut" className="w-6 h-6 rounded-full" />
            <span className="text-sm font-black text-white">Invonaut</span>
          </Link>
          <p className="text-xs">© {new Date().getFullYear()} Invonaut. All rights reserved.</p>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/help" className="hover:text-white transition-colors">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
