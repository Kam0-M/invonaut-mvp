import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="bg-gray-50 antialiased">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 cursor-pointer">
              <img 
                src="/invonaut-logo.png" 
                alt="Invonaut Logo" 
                className="w-10 h-10 rounded-full"
              />
              <span className="text-2xl font-black tracking-tight text-gray-900">Invonaut</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-gray-700 hover:text-gray-900 font-semibold text-sm transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-700 hover:text-gray-900 font-semibold text-sm transition-colors">
                Pricing
              </Link>
              <Link href="#how-it-works" className="text-gray-700 hover:text-gray-900 font-semibold text-sm transition-colors">
                How It Works
              </Link>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-gray-700 hover:text-gray-900 font-semibold text-sm transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-700 to-blue-600"></div>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'1\' height=\'1\' fill=\'rgba(255,255,255,0.5)\'/%3E%3C/svg%3E")', backgroundSize: '60px 60px'}}></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white text-sm font-medium mb-6">
                AI-Powered Invoice Intelligence
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
                Know Exactly When<br />
                Clients Will <span className="text-teal-300">Pay</span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed font-medium">
                AI predicts payment dates with 95% accuracy. Automate follow-ups. Stop chasing late payments.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup" className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg text-center hover:shadow-2xl transition-all hover:scale-105">
                  Start Free Trial →
                </Link>
                <Link href="#features" className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all text-center">
                  See How It Works
                </Link>
              </div>
              <p className="text-blue-200 text-sm mt-6 font-medium">
                14-day free trial • No credit card required • Cancel anytime
              </p>
            </div>

            {/* AI Prediction Card */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition-all duration-500">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">AI Payment Prediction</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Low Risk</span>
                </div>
                <div className="mb-6">
                  <div className="text-4xl font-black text-gray-900 mb-2">Jan 28, 2026</div>
                  <div className="text-sm text-gray-600 font-medium">Predicted Payment Date</div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Confidence</span>
                    <span className="text-lg font-bold text-blue-600">92%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-teal-500" style={{width: '92%'}}></div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Client has paid 94% of invoices on time. Expected payment in 12 days based on historical patterns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white py-16 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-gray-900 mb-2" style={{fontVariantNumeric: 'tabular-nums'}}>10+</div>
              <div className="text-xs md:text-sm text-gray-600 font-semibold uppercase tracking-wider">Hours Saved Weekly</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-gray-900 mb-2" style={{fontVariantNumeric: 'tabular-nums'}}>95%</div>
              <div className="text-xs md:text-sm text-gray-600 font-semibold uppercase tracking-wider">Prediction Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-gray-900 mb-2" style={{fontVariantNumeric: 'tabular-nums'}}>40%</div>
              <div className="text-xs md:text-sm text-gray-600 font-semibold uppercase tracking-wider">Faster Payments</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-gray-900 mb-2" style={{fontVariantNumeric: 'tabular-nums'}}>$0</div>
              <div className="text-xs md:text-sm text-gray-600 font-semibold uppercase tracking-wider">Setup Cost</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
              Everything You Need to<br />
              Get Paid On Time
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
              Professional invoicing powered by AI. Built for freelancers who value their time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 - AI Predictions */}
            <div className="bg-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-blue-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">AI Payment Predictions</h3>
              <p className="text-gray-600 leading-relaxed text-base">
                Know exactly when clients will pay with AI-powered predictions. Get confidence scores, risk levels, and natural language insights for every invoice.
              </p>
            </div>

            {/* Feature 2 - Automation */}
            <div className="bg-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-blue-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Automated Follow-Ups</h3>
              <p className="text-gray-600 leading-relaxed text-base">
                Never chase late payments manually again. Smart reminders sent automatically at optimal times. Professional emails that maintain client relationships.
              </p>
            </div>

            {/* Feature 3 - White Label */}
            <div className="bg-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-blue-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
                </svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">White Label Branding</h3>
              <p className="text-gray-600 leading-relaxed text-base">
                Upload your logo and customize brand colors. Professional invoices and emails that match your business identity. Look enterprise-ready instantly.
              </p>
            </div>

            {/* Feature 4 - Analytics */}
            <div className="bg-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-blue-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Real-Time Analytics</h3>
              <p className="text-gray-600 leading-relaxed text-base">
                Track revenue trends, payment success rates, and cash flow forecasts. See which clients pay on time. Make smarter business decisions with data.
              </p>
            </div>

            {/* Feature 5 - Email/PDF */}
            <div className="bg-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-blue-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Professional Invoicing</h3>
              <p className="text-gray-600 leading-relaxed text-base">
                Create beautiful invoices with auto-numbering and line items. Send via email with PDF attachments. Look professional from day one.
              </p>
            </div>

            {/* Feature 6 - Security */}
            <div className="bg-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-blue-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Secure & Private</h3>
              <p className="text-gray-600 leading-relaxed text-base">
                Bank-level security with row-level access control. Your data is encrypted and completely isolated. We take your privacy seriously.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
              How Invonaut Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
              Get started in minutes. No setup complexity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-black text-blue-600">1</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4">Create Your Invoice</h3>
              <p className="text-gray-600 leading-relaxed">
                Add client details, line items, and payment terms. Your invoice is automatically numbered and formatted professionally.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-black text-teal-600">2</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4">AI Predicts Payment</h3>
              <p className="text-gray-600 leading-relaxed">
                Our AI analyzes client payment history and predicts when you'll get paid with 95% accuracy, complete with confidence scores.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-black text-orange-600">3</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4">Sit Back & Relax</h3>
              <p className="text-gray-600 leading-relaxed">
                Invonaut automatically sends follow-ups for overdue invoices. You focus on your work while we handle payment admin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - UPDATED */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium mb-6">
              Start with a 14-day free trial. Upgrade or cancel anytime.
            </p>
            {/* Trial Badge */}
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-full font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              14-Day Free Trial on All Plans
            </div>
          </div>

          {/* 2-Column Grid (Business removed) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:border-blue-300 transition-all">
              <div className="mb-6">
                <h3 className="text-2xl font-black text-gray-900 mb-2">Starter</h3>
                <p className="text-gray-600 font-medium">Perfect for new freelancers</p>
              </div>
              <div className="mb-2">
                <span className="text-5xl font-black text-gray-900">$30</span>
                <span className="text-gray-600 font-medium">/month</span>
              </div>
              <p className="text-sm text-green-700 font-semibold mb-8">First 14 days free</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-teal-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700 font-medium">25 invoices per month</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-teal-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700 font-medium">Unlimited clients</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-teal-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700 font-medium">Basic AI payment predictions</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-teal-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700 font-medium">Email invoicing with PDF</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-teal-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700 font-medium">Dashboard analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-500 font-medium">Invonaut branding on invoices</span>
                </li>
              </ul>
              <Link href="/signup" className="block w-full bg-gray-900 text-white text-center py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all">
                Start Free Trial
              </Link>
            </div>

            {/* Professional Plan - HIGHLIGHTED */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-2xl p-8 border-2 border-blue-500 relative transform md:scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                MOST POPULAR
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-black text-white mb-2">Professional</h3>
                <p className="text-blue-100 font-medium">For established freelancers</p>
              </div>
              <div className="mb-2">
                <span className="text-5xl font-black text-white">$60</span>
                <span className="text-blue-100 font-medium">/month</span>
              </div>
              <p className="text-sm text-teal-200 font-semibold mb-8">First 14 days free</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-teal-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-white font-bold">Everything in Starter, plus:</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-teal-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-white font-medium">Unlimited invoices</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-teal-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-white font-bold">🎨 White label branding (logo & colors)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-teal-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-white font-medium">Advanced AI insights</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-teal-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-white font-medium">Priority email support</span>
                </li>
              </ul>
              <Link href="/signup" className="block w-full bg-white text-blue-600 text-center py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all">
                Start Free Trial
              </Link>
            </div>
          </div>

          <p className="text-center text-gray-600 mt-12 text-sm font-medium">
            All plans include 14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-700 to-blue-600"></div>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'1\' height=\'1\' fill=\'rgba(255,255,255,0.5)\'/%3E%3C/svg%3E")', backgroundSize: '60px 60px'}}></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight">
            Ready to Predict<br />
            Your Next Payment?
          </h2>
          <p className="text-xl text-blue-100 mb-10 font-medium max-w-2xl mx-auto">
            Join freelancers using AI to eliminate payment uncertainty and save 10+ hours weekly.
          </p>
          <Link href="/signup" className="inline-block bg-white text-blue-600 px-10 py-5 rounded-xl font-bold text-xl hover:shadow-2xl transition-all hover:scale-105">
            Start Free Trial →
          </Link>
          <p className="text-blue-200 text-sm mt-6 font-medium">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="text-white font-black text-xl mb-4 tracking-tight">Invonaut</h3>
              <p className="text-sm leading-relaxed">
                AI-powered invoice intelligence for freelancers who value their time.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-sm">&copy; 2026 Invonaut. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}