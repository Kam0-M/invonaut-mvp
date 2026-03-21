import Link from 'next/link'

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
            <div className="flex items-center gap-5">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
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
      <section className="relative pt-32 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-700 to-blue-600" />
        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/20 text-white/90 text-sm font-medium mb-8 tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-300 inline-block" />
                From contract to cash. Automated.
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-[64px] font-black text-white mb-6 leading-[1.08] tracking-tight">
                One platform.<br />
                Your entire<br />
                <span className="text-teal-300">business.</span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-10 leading-relaxed max-w-lg font-normal">
                Contracts, invoices, time tracking, expenses, and cash flow — managed in one place, automated end-to-end, with AI that predicts what comes next.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/signup"
                  className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-base text-center hover:shadow-2xl transition-all hover:scale-[1.02]">
                  Start free trial →
                </Link>
                <Link href="#platform"
                  className="bg-white/10 backdrop-blur-sm text-white border border-white/25 px-8 py-4 rounded-xl font-medium text-base hover:bg-white/15 transition-all text-center">
                  See what's inside
                </Link>
              </div>
              <p className="text-blue-200/70 text-sm mt-6">
                14-day free trial &nbsp;·&nbsp; No credit card required &nbsp;·&nbsp; Cancel anytime
              </p>
            </div>

            {/* Right — workflow card */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Card header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live overview</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block" />
                    All systems active
                  </span>
                </div>
                {/* Workflow steps */}
                <div className="p-6 space-y-3">
                  {[
                    { step: 'Contract signed', detail: 'Acme Corp · NDA + Service Agreement', color: 'bg-teal-500', light: 'bg-teal-50 text-teal-700' },
                    { step: 'Invoice created', detail: 'INV-00042 · $8,400.00 · Net 30', color: 'bg-blue-500', light: 'bg-blue-50 text-blue-700' },
                    { step: 'AI prediction', detail: 'Expected Mar 28 · 91% confidence', color: 'bg-blue-600', light: 'bg-blue-50 text-blue-700' },
                    { step: 'Payment received', detail: '$8,400.00 · 2 days early', color: 'bg-green-500', light: 'bg-green-50 text-green-700' },
                  ].map(({ step, detail, color, light }) => (
                    <div key={step} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900">{step}</div>
                        <div className="text-xs text-gray-500 truncate">{detail}</div>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${light}`}>done</span>
                    </div>
                  ))}
                </div>
                {/* Cash runway bar */}
                <div className="px-6 pb-6">
                  <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Cash runway</span>
                      <span className="text-sm font-black text-blue-700">4.2 months</span>
                    </div>
                    <div className="w-full h-1.5 bg-blue-100 rounded-full">
                      <div className="h-full w-[68%] bg-gradient-to-r from-blue-500 to-teal-400 rounded-full" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">$12,600 in outstanding invoices expected this month</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <section className="bg-white py-14 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
            {[
              { number: '5',    label: 'Tools replaced' },
              { number: '10+',  label: 'Hours saved weekly' },
              { number: '95%',  label: 'AI prediction accuracy' },
              { number: '40%',  label: 'Faster payments' },
              { number: '$0',   label: 'Setup cost' },
            ].map(({ number, label }) => (
              <div key={label}>
                <div className="text-3xl md:text-4xl font-black text-gray-900 mb-1.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {number}
                </div>
                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform modules ───────────────────────────────────────────────── */}
      <section id="platform" className="py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">

          <div className="max-w-2xl mb-20">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">The platform</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-5 tracking-tight leading-tight">
              Everything your business runs on, built into one place.
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              Most businesses run on five or six separate tools that don't talk to each other. Invonaut replaces all of them — and connects them so every part of your workflow feeds the next.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

            {/* Contracts */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight">Contract management</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                Create contracts from professional templates, collect legally binding e-signatures, and link every signed contract directly to an invoice. No DocuSign. No back-and-forth.
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                <span>Replaces</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">DocuSign</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">HelloSign</span>
              </div>
            </div>

            {/* Invoicing */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight">Professional invoicing</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                Create, send, and track invoices with auto-numbering, PDF generation, and branded email delivery. Set payment terms, add line items, and mark payments in one click.
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                <span>Replaces</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">FreshBooks</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">Wave</span>
              </div>
            </div>

            {/* AI Predictions */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight">AI payment predictions</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                Know when you'll actually get paid — not just when you're supposed to. AI analyzes each client's payment behavior and returns a predicted date, confidence score, and risk level.
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-semibold">Unique to Invonaut</span>
              </div>
            </div>

            {/* Time Tracking */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight">Time tracking</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                Track billable hours with a live timer or manual entry. When it's time to invoice, select the entries you want — they become line items automatically. No copy-pasting between tools.
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                <span>Replaces</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">Toggl</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">Harvest</span>
              </div>
            </div>

            {/* Expenses */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight">Expense tracking</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                Log expenses, upload receipts, and let AI suggest categories automatically. Combined with your invoice revenue, Invonaut shows your actual profit — not just what you invoiced.
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                <span>Replaces</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">Expensify</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">spreadsheets</span>
              </div>
            </div>

            {/* Cash Management */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight">Cash management</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                A 90-day cash flow forecast, runway calculator, and revenue vs. expense trends — all powered by your live data. Know how long your money lasts before you need to ask.
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                <span>Replaces</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">Float</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">Pulse</span>
              </div>
            </div>

          </div>

          {/* Client portal callout */}
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <span className="text-white/80 text-sm font-semibold uppercase tracking-wider">Client portal</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Your clients get their own branded portal.</h3>
              <p className="text-blue-100 leading-relaxed">
                Share a link. Clients view their invoices, download PDFs, sign contracts, and make payments — without needing an Invonaut account. Your brand, your portal.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link href="/signup" className="inline-block bg-white text-blue-600 px-7 py-3.5 rounded-xl font-bold text-sm hover:shadow-xl transition-all hover:scale-[1.02] whitespace-nowrap">
                See how it works →
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-20">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">How it works</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-5 tracking-tight leading-tight">
              From first handshake to final payment.
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              Invonaut covers the full lifecycle of a client engagement — every step in sequence, each one feeding the next.
            </p>
          </div>

          <div className="relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-10 left-0 right-0 h-px bg-gray-100 z-0" style={{ left: '10%', right: '10%' }} />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
              {[
                {
                  n: '01', color: 'bg-blue-600', light: 'bg-blue-50 text-blue-700',
                  title: 'Sign the contract',
                  body: 'Send a professional contract from a template. Client signs via their portal with a legally binding e-signature.',
                },
                {
                  n: '02', color: 'bg-teal-500', light: 'bg-teal-50 text-teal-700',
                  title: 'Track your time',
                  body: 'Run the timer as you work. Hours log against the client automatically at your set hourly rate.',
                },
                {
                  n: '03', color: 'bg-blue-600', light: 'bg-blue-50 text-blue-700',
                  title: 'Send the invoice',
                  body: 'Pull your tracked hours into an invoice in one click. Send it with a PDF attachment directly from Invonaut.',
                },
                {
                  n: '04', color: 'bg-teal-500', light: 'bg-teal-50 text-teal-700',
                  title: 'AI predicts payment',
                  body: 'See when you\'ll actually get paid, with a confidence score and risk level. Automated reminders handle the follow-up.',
                },
                {
                  n: '05', color: 'bg-orange-500', light: 'bg-orange-50 text-orange-700',
                  title: 'Manage your cash',
                  body: 'Every payment updates your cash flow forecast in real time. Know your runway. Plan your next move.',
                },
              ].map(({ n, color, light, title, body }) => (
                <div key={n} className="flex flex-col items-center text-center md:items-start md:text-left">
                  <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-5 shadow-md flex-shrink-0`}>
                    <span className="text-white font-black text-sm">{n}</span>
                  </div>
                  <h3 className="text-base font-black text-gray-900 mb-2 tracking-tight">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── White label callout ────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">White label</p>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-5 tracking-tight leading-tight">
                Your brand on everything your clients see.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                Upload your logo and set your brand colors. Every invoice PDF, every email, every client portal page reflects your identity — not ours. Available on Professional and Business plans.
              </p>
              <Link href="/signup" className="inline-block bg-gray-900 text-white px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all">
                Try it free for 14 days →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Invoice PDF', icon: '📄', desc: 'Your logo, your colors' },
                { label: 'Email delivery', icon: '✉️', desc: 'Branded HTML templates' },
                { label: 'Client portal', icon: '🔗', desc: 'Your domain, your identity' },
                { label: 'Contracts', icon: '📝', desc: 'Professional and on-brand' },
              ].map(({ label, icon, desc }) => (
                <div key={label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <div className="text-2xl mb-3">{icon}</div>
                  <div className="text-sm font-bold text-gray-900 mb-1">{label}</div>
                  <div className="text-xs text-gray-500">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-28 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">Pricing</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-5 tracking-tight">
              Simple, transparent pricing.
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Start with a 14-day free trial on any plan. No credit card required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">

            {/* Starter */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all">
              <h3 className="text-xl font-black text-gray-900 mb-1">Starter</h3>
              <p className="text-gray-500 text-sm mb-6">For freelancers getting started.</p>
              <div className="mb-1">
                <span className="text-5xl font-black text-gray-900">$40</span>
                <span className="text-gray-500 text-sm">/month</span>
              </div>
              <p className="text-xs text-teal-600 font-semibold mb-8">14 days free</p>
              <ul className="space-y-3 mb-8 text-sm">
                {[
                  '25 invoices per month',
                  'Unlimited clients',
                  'Basic AI payment predictions',
                  'Invoice email with PDF',
                  'Automated follow-up reminders',
                  'Time tracking (timer + manual)',
                  'Expense logging',
                  'Client portal (view-only)',
                  '3 active contracts',
                ].map(f => (
                  <li key={f} className="flex items-start gap-3">
                    <svg className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-600">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full bg-gray-900 text-white text-center py-3.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all">
                Start free trial
              </Link>
            </div>

            {/* Professional — highlighted */}
            <div className="bg-gradient-to-b from-blue-600 to-blue-700 rounded-2xl p-8 shadow-2xl relative md:scale-[1.03]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-md whitespace-nowrap">
                Most popular
              </div>
              <h3 className="text-xl font-black text-white mb-1">Professional</h3>
              <p className="text-blue-100 text-sm mb-6">For established freelancers.</p>
              <div className="mb-1">
                <span className="text-5xl font-black text-white">$80</span>
                <span className="text-blue-100 text-sm">/month</span>
              </div>
              <p className="text-xs text-teal-200 font-semibold mb-8">14 days free</p>
              <ul className="space-y-3 mb-8 text-sm">
                {[
                  'Everything in Starter, plus:',
                  'Unlimited invoices',
                  'White label branding',
                  'Advanced AI insights',
                  'Full time tracking + weekly summary',
                  'AI expense categorization',
                  'Branded client portal',
                  'Unlimited contracts + e-signatures',
                  'AI contract review',
                  'Cash flow dashboard + runway',
                ].map((f, i) => (
                  <li key={f} className="flex items-start gap-3">
                    <svg className={`w-4 h-4 flex-shrink-0 mt-0.5 ${i === 0 ? 'text-teal-200' : 'text-teal-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className={`${i === 0 ? 'text-white font-bold' : 'text-blue-50'}`}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full bg-white text-blue-600 text-center py-3.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all">
                Start free trial
              </Link>
            </div>

            {/* Business */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all">
              <h3 className="text-xl font-black text-gray-900 mb-1">Business</h3>
              <p className="text-gray-500 text-sm mb-6">For small agencies and studios.</p>
              <div className="mb-1">
                <span className="text-5xl font-black text-gray-900">$120</span>
                <span className="text-gray-500 text-sm">/month</span>
              </div>
              <p className="text-xs text-teal-600 font-semibold mb-8">14 days free</p>
              <ul className="space-y-3 mb-8 text-sm">
                {[
                  'Everything in Professional, plus:',
                  'Multi-user access (3 seats)',
                  'Multi-party contract signing',
                  'Contract version control',
                  'Retainer management',
                  'AI contract drafting',
                  'Budget tracking by category',
                  'Dedicated account manager',
                  'Custom onboarding session',
                ].map((f, i) => (
                  <li key={f} className="flex items-start gap-3">
                    <svg className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className={`${i === 0 ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full bg-gray-900 text-white text-center py-3.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all">
                Start free trial
              </Link>
            </div>

          </div>

          <p className="text-center text-gray-400 mt-10 text-sm">
            All plans include a 14-day free trial &nbsp;·&nbsp; No credit card required &nbsp;·&nbsp; Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-700 to-blue-600" />
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <p className="text-teal-300 text-sm font-bold uppercase tracking-widest mb-6">Get started today</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
            Stop managing your business across five different tabs.
          </h2>
          <p className="text-lg text-blue-100 mb-10 leading-relaxed max-w-xl mx-auto">
            Invonaut brings your contracts, invoices, time, expenses, and cash flow into one place — and automates the work between them.
          </p>
          <Link href="/signup"
            className="inline-block bg-white text-blue-600 px-10 py-4 rounded-xl font-bold text-base hover:shadow-2xl transition-all hover:scale-[1.02]">
            Start your free trial →
          </Link>
          <p className="text-blue-200/70 text-sm mt-5">
            14-day free trial &nbsp;·&nbsp; No credit card required &nbsp;·&nbsp; Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/invonaut-logo.png" alt="Invonaut" className="w-7 h-7 rounded-full" />
                <span className="text-white font-black text-lg tracking-tight">Invonaut</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-500">
                From contract to cash. Automated.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#platform" className="hover:text-white transition-colors">Platform</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Help center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">&copy; 2026 Invonaut. All rights reserved.</p>
            <p className="text-xs text-gray-700">From contract to cash. Automated.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}