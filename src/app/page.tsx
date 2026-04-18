import Link from 'next/link'
import LandingPricingSection from '@/components/landing-pricing-section'

export default function LandingPage() {
  return (
    <div className="bg-gray-50 antialiased">

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3">
              <img src="/invonaut-logo.png" alt="Invonaut" className="w-10 h-10 rounded-full" />
              <span className="text-2xl font-black tracking-tight text-gray-900">Invonaut</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#platform" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">Platform</Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">How It Works</Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">Pricing</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors hidden sm:block">
                Sign in
              </Link>
              <Link href="/signup" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all">
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="pt-40 pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2 mb-8">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Autonomous Finance OS</span>
              </div>
              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-black text-gray-900 tracking-tight leading-[0.95] mb-6">
                From contract<br />
                to cash.<br />
                <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                  Automated.
                </span>
              </h1>
              <p className="text-xl text-gray-500 font-medium leading-relaxed mb-10 max-w-lg">
                Invonaut captures every dollar in — invoices, cash payments, POS, mobile money — then chases late payers, forecasts your cash flow, and runs your collections while you sleep.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-base hover:shadow-2xl hover:scale-105 transition-all">
                  Start free — 14 days
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
                <Link href="#platform" className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-bold text-base hover:border-gray-300 hover:shadow-lg transition-all">
                  See what it does
                </Link>
              </div>
              <p className="text-sm text-gray-400 font-medium mt-4">No credit card required · Cancel anytime</p>
            </div>

            {/* Live activity feed */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl p-8 hidden lg:block">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live activity</span>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>
              <div className="space-y-4">
                {[
                  { icon: '📄', label: 'Invoice sent', detail: 'INV-00089 · $4,200 · Acme Corp', time: 'just now', color: 'bg-blue-50 text-blue-600' },
                  { icon: '💵', label: 'Cash payment logged', detail: '$850 · Airport Transfer · Consulting', time: '4m ago', color: 'bg-teal-50 text-teal-600' },
                  { icon: '🤖', label: 'Follow-up sent automatically', detail: 'INV-00071 overdue 8 days · High risk', time: '1h ago', color: 'bg-amber-50 text-amber-600' },
                  { icon: '✅', label: 'Contract signed', detail: 'Web Design Agreement · Jane Smith', time: '2h ago', color: 'bg-purple-50 text-purple-600' },
                  { icon: '📊', label: 'Cash runway updated', detail: '4.2 months · $12,400 in pipeline', time: '3h ago', color: 'bg-green-50 text-green-600' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${item.color} flex-shrink-0`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-400 font-medium truncate">{item.detail}</p>
                    </div>
                    <span className="text-xs text-gray-300 font-medium flex-shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Revenue this month</span>
                  <span className="text-xs font-bold text-green-600">↑ 23%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-[72%] bg-gradient-to-r from-blue-500 to-teal-400 rounded-full" />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs text-gray-400">$0</span>
                  <span className="text-xs font-bold text-gray-700">$9,450 / $13,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <section className="bg-gray-900 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { number: '8',  label: 'Automated cron jobs', suffix: '' },
            { number: '40', label: 'Faster invoice payment', suffix: '%' },
            { number: '12', label: 'Modules, one platform', suffix: '+' },
            { number: '0',  label: 'Tool switching needed', suffix: '' },
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-4xl font-black text-white tracking-tight">{stat.number}{stat.suffix}</p>
              <p className="text-sm text-gray-400 font-medium mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Platform modules ───────────────────────────────────────────────── */}
      <section id="platform" className="py-28 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">The complete platform</p>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
              Everything in one place.
            </h2>
            <p className="text-xl text-gray-500 font-medium mt-4 max-w-2xl mx-auto">
              No more switching between invoicing, time tracking, and banking apps. Invonaut models how money actually flows through your business.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '📄',
                title: 'Invoice management',
                body: 'Create, send, and track invoices with branded PDFs. AI predicts which clients will pay late — before they do.',
                tag: 'Automated follow-ups',
                color: 'blue',
              },
              {
                icon: '💵',
                title: 'Direct payment logging',
                body: 'Record every cash, POS, mobile money, and bank transfer instantly. Not everything goes through an invoice — now none of it is invisible.',
                tag: 'All income captured',
                color: 'teal',
              },
              {
                icon: '📊',
                title: 'Revenue intelligence',
                body: 'See exactly where your money comes from — by source, category, and payment method. Know which services make you the most.',
                tag: 'Complete income picture',
                color: 'indigo',
              },
              {
                icon: '⏱️',
                title: 'Time tracking',
                body: 'Log hours with a live timer or manually. Convert unbilled time into an invoice with one click. The real automation loop.',
                tag: 'Hours → invoice in 1 click',
                color: 'purple',
              },
              {
                icon: '📝',
                title: 'Contract management',
                body: 'Create from templates, add clauses, send for legally-binding e-signatures. Automatic expiry reminders. Full audit trail.',
                tag: 'E-signatures built in',
                color: 'violet',
              },
              {
                icon: '💰',
                title: 'Cash flow forecast',
                body: '90-day forward view of your bank balance. Runway calculator. Predicted payment dates. Know exactly how long your money lasts.',
                tag: '90-day AI forecast',
                color: 'green',
              },
              {
                icon: '🧾',
                title: 'Expense tracking',
                body: 'Log expenses with AI-suggested categories. Upload receipts. Set budget limits and get automatic alerts at 80% and 100%.',
                tag: 'AI categorisation',
                color: 'orange',
              },
              {
                icon: '🌐',
                title: 'Client portal',
                body: 'A branded portal where clients view invoices, download PDFs, and sign contracts — no account needed. Access by magic link.',
                tag: 'White-label ready',
                color: 'cyan',
              },
              {
                icon: '🤖',
                title: 'Autonomous collections',
                body: 'AI risk-scores every invoice. A daily cron identifies overdue high-risk invoices and sends reminders automatically — while you sleep.',
                tag: 'Runs without you',
                color: 'red',
              },
            ].map(mod => (
              <div key={mod.title} className="bg-gray-50 rounded-2xl p-7 border border-gray-100 hover:border-blue-100 hover:shadow-lg transition-all group">
                <div className="text-3xl mb-4">{mod.icon}</div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 bg-white border border-gray-100 rounded-full px-3 py-1 mb-3">
                  {mod.tag}
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">{mod.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{mod.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Autonomy callout ────────────────────────────────────────────────── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-teal-400 uppercase tracking-widest mb-4">Always on</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              Works while you don't.
            </h2>
            <p className="text-gray-400 font-medium mt-4 max-w-2xl mx-auto text-lg">
              Eight automated processes run every day without you logging in.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { action: 'Invoice follow-up reminders', detail: 'Sent to overdue clients with AI risk ≥60', schedule: 'Daily 9am' },
              { action: 'Contract expiry reminders', detail: 'Sent at 30/15/7/1 days before expiry', schedule: 'Daily 9am' },
              { action: 'Auto-expire contracts', detail: 'Contracts hard-expired when date passes', schedule: 'Daily 9am' },
              { action: 'Budget overspend alerts', detail: 'Email at 80% and 100% of monthly limits', schedule: 'Daily 9am' },
              { action: 'Weekly time summary', detail: 'Hours, billable value, unbilled outstanding', schedule: 'Monday 9am' },
              { action: 'AI invoice risk scoring', detail: 'GPT-4o evaluates payment probability', schedule: 'On send' },
              { action: 'AI expense categorisation', detail: 'Category suggested from description', schedule: 'On entry' },
              { action: '90-day cash forecast', detail: 'Balance projection recalculated live', schedule: 'On open' },
            ].map(item => (
              <div key={item.action} className="flex items-start gap-4 bg-gray-800 rounded-xl p-5 border border-gray-700">
                <div className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0 mt-1.5 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{item.action}</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">{item.detail}</p>
                </div>
                <span className="text-xs font-bold text-gray-500 flex-shrink-0">{item.schedule}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">How it works</p>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
              Your money, fully tracked.
            </h2>
          </div>
          <div className="space-y-8">
            {[
              {
                step: '01',
                title: 'Capture all your income',
                body: 'Send invoices for billed work. Log direct payments for cash, POS, and mobile money. Tag everything with revenue categories. For the first time, your real total income is visible in one place.',
              },
              {
                step: '02',
                title: 'AI handles the chasing',
                body: 'Every invoice gets an AI risk score. The system watches for overdue invoices and sends follow-up reminders automatically — scaling up with urgency the longer a payment is late.',
              },
              {
                step: '03',
                title: 'Contracts protect you',
                body: 'Create professional contracts from templates, get them signed in minutes, and link them to invoices. Automatic expiry reminders mean nothing slips through.',
              },
              {
                step: '04',
                title: 'Know your financial future',
                body: 'Your cash flow forecast combines AI-predicted invoice payments with logged expenses to show a 90-day projection of your bank balance. Runway calculator tells you exactly how long your money lasts.',
              },
            ].map((step, i) => (
              <div key={i} className="flex gap-8 items-start">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-black text-white">{step.step}</span>
                </div>
                <div className="flex-1 pt-3">
                  <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── White label callout ─────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">Professional tier</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-4">
              Your brand. Not ours.
            </h2>
            <p className="text-gray-500 leading-relaxed text-lg">
              Upload your logo and set your brand colors. Every invoice PDF, every email, every client portal page reflects your identity. Available on Professional and Business plans.
            </p>
          </div>
          <div className="flex-shrink-0 flex gap-3">
            {[
              { color: '#2563EB', label: 'Brand blue' },
              { color: '#0D9488', label: 'Teal' },
              { color: '#7C3AED', label: 'Purple' },
              { color: '#DC2626', label: 'Red' },
            ].map(c => (
              <div key={c.color} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full shadow-lg" style={{ backgroundColor: c.color }} />
                <span className="text-xs text-gray-400 font-medium">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-28 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">Pricing</p>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
              Simple, transparent pricing.
            </h2>
            <p className="text-gray-500 font-medium mt-4 max-w-xl mx-auto text-lg">
              Start with a 14-day free trial on any plan. No credit card required.
            </p>
          </div>
          <LandingPricingSection />
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-blue-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-6">
            Stop chasing invoices.<br />Start getting paid.
          </h2>
          <p className="text-blue-100 text-lg font-medium mb-10 max-w-xl mx-auto">
            Join freelancers and small businesses who have moved their entire financial operation into Invonaut.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-10 py-4 rounded-xl font-black text-base hover:shadow-2xl hover:scale-105 transition-all"
          >
            Start free — 14 days
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
          <p className="text-blue-200 text-sm font-medium mt-4">No credit card · Cancel anytime · Free 14-day trial</p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src="/invonaut-logo.png" alt="Invonaut" className="w-8 h-8 rounded-full" />
                <span className="text-lg font-black text-white">Invonaut</span>
              </div>
              <p className="text-sm leading-relaxed">From Contract to Cash. Automated.</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Product</p>
              <ul className="space-y-3 text-sm">
                <li><Link href="#platform" className="hover:text-white transition-colors">Platform</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Account</p>
              <ul className="space-y-3 text-sm">
                <li><Link href="/signup" className="hover:text-white transition-colors">Sign up</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Sign in</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Help</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Legal</p>
              <ul className="space-y-3 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">© {new Date().getFullYear()} Invonaut. All rights reserved.</p>
            <p className="text-sm">Built for freelancers who mean business.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}