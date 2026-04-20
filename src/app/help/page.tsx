import Link from 'next/link'
import { ArrowLeft, Book, HelpCircle, FileText, Users, Settings, Mail, Sparkles, DollarSign, TrendingUp, Zap, Shield, Bell, Palette } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function HelpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      <div className="max-w-6xl mx-auto space-y-8 py-8">
      {/* Premium Hero Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-10 shadow-2xl">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'1\' height=\'1\' fill=\'rgba(255,255,255,0.5)\'/%3E%3C/svg%3E")', backgroundSize: '60px 60px'}}></div>
        
        <div className="relative z-10">
          <Link 
            href={isLoggedIn ? '/dashboard' : '/'}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 hover:bg-white/20 transition-all duration-200 font-bold mb-6 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            {isLoggedIn ? 'Back to Dashboard' : 'Back'}
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
              <HelpCircle className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Help Center</h1>
              <p className="text-blue-100 text-lg font-medium mt-1">
                Everything you need to master Invonaut
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="bg-white rounded-2xl p-10 border-2 border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Book className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Quick Start Guide</h2>
            <p className="text-gray-600 font-medium">Get up and running in 5 minutes</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-lg">1</span>
              </div>
              <h3 className="text-xl font-black text-gray-900">Add Clients</h3>
            </div>
            <p className="text-gray-700 text-sm font-medium leading-relaxed mb-4">
              Start by adding your clients with contact information. This makes invoice creation lightning-fast.
            </p>
            <Link 
              href="/dashboard/clients/new" 
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold hover:shadow-xl transition-all hover:scale-105"
            >
              <Users className="w-4 h-4" />
              Add Your First Client
            </Link>
          </div>

          {/* Step 2 */}
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 border-2 border-teal-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-700 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-lg">2</span>
              </div>
              <h3 className="text-xl font-black text-gray-900">Create Invoice</h3>
            </div>
            <p className="text-gray-700 text-sm font-medium leading-relaxed mb-4">
              Generate professional invoices with auto-numbering, line items, and payment terms in seconds.
            </p>
            <Link 
              href="/dashboard/invoices/new" 
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 text-white text-sm font-bold hover:shadow-xl transition-all hover:scale-105"
            >
              <FileText className="w-4 h-4" />
              Create Your First Invoice
            </Link>
          </div>

          {/* Step 3 */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-lg">3</span>
              </div>
              <h3 className="text-xl font-black text-gray-900">Customize Brand</h3>
            </div>
            <p className="text-gray-700 text-sm font-medium leading-relaxed mb-4">
              Upload your logo and set brand colors for professional, white-labeled invoices.
            </p>
            <div className="flex items-center gap-2">
              <Link 
                href="/dashboard/settings" 
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-bold hover:shadow-xl transition-all hover:scale-105"
              >
                <Palette className="w-4 h-4" />
                Customize Branding
              </Link>
              <span className="text-xs font-bold text-purple-600 bg-purple-200 px-2 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Pro
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features Guide */}
      <div className="bg-white rounded-2xl p-10 border-2 border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Key Features</h2>
          <p className="text-gray-600 font-medium">Learn how to use Invonaut's powerful tools</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* AI Predictions */}
          <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-2">AI Payment Predictions</h3>
                <p className="text-gray-600 text-sm font-medium leading-relaxed mb-3">
                  View AI-powered payment date predictions on each invoice. Get confidence scores, risk levels, and insights based on client history.
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1.5 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  95% Accuracy Rate
                </div>
              </div>
            </div>
          </div>

          {/* Automated Follow-ups */}
          <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-teal-300 hover:shadow-lg transition-all">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Automated Follow-ups</h3>
                <p className="text-gray-600 text-sm font-medium leading-relaxed mb-3">
                  Send professional payment reminders with one click. Rate-limited to once every 48 hours to maintain client relationships.
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 bg-teal-100 px-3 py-1.5 rounded-full">
                  <Mail className="w-3 h-3" />
                  Smart Timing
                </div>
              </div>
            </div>
          </div>

          {/* White Label Branding */}
          <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-lg transition-all">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-2">White Label Branding</h3>
                <p className="text-gray-600 text-sm font-medium leading-relaxed mb-3">
                  Upload your logo and customize brand colors in Settings. Professional invoices with your identity, no Invonaut branding.
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-purple-600 bg-purple-100 px-3 py-1.5 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  Professional Only
                </div>
              </div>
            </div>
          </div>

          {/* Analytics */}
          <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-orange-300 hover:shadow-lg transition-all">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Revenue Analytics</h3>
                <p className="text-gray-600 text-sm font-medium leading-relaxed mb-3">
                  Track revenue trends, payment success rates, and cash flow forecasts. See which clients pay on time in your dashboard.
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1.5 rounded-full">
                  <DollarSign className="w-3 h-3" />
                  Real-Time Data
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-2xl p-10 border-2 border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Frequently Asked Questions</h2>
          <p className="text-gray-600 font-medium">Quick answers to common questions</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <details className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-gray-200 group hover:border-blue-300 transition-all">
            <summary className="font-bold text-gray-900 cursor-pointer text-sm flex items-center justify-between">
              <span>How accurate are AI payment predictions?</span>
              <HelpCircle className="w-5 h-5 text-gray-400 group-open:text-blue-600 transition-colors flex-shrink-0" />
            </summary>
            <p className="text-gray-700 mt-4 text-sm font-medium leading-relaxed border-t-2 border-gray-200 pt-4">
              Our AI achieves 95% accuracy by analyzing payment history, industry patterns, client behavior, and invoice terms. Predictions improve as you use Invonaut more.
            </p>
          </details>

          <details className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-gray-200 group hover:border-blue-300 transition-all">
            <summary className="font-bold text-gray-900 cursor-pointer text-sm flex items-center justify-between">
              <span>Can I customize invoice branding?</span>
              <HelpCircle className="w-5 h-5 text-gray-400 group-open:text-blue-600 transition-colors flex-shrink-0" />
            </summary>
            <p className="text-gray-700 mt-4 text-sm font-medium leading-relaxed border-t-2 border-gray-200 pt-4">
              Yes! Professional plan users can upload custom logos and set brand colors in Settings. Your invoices will have zero Invonaut branding.
            </p>
          </details>

          <details className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-gray-200 group hover:border-blue-300 transition-all">
            <summary className="font-bold text-gray-900 cursor-pointer text-sm flex items-center justify-between">
              <span>How do automated follow-ups work?</span>
              <HelpCircle className="w-5 h-5 text-gray-400 group-open:text-blue-600 transition-colors flex-shrink-0" />
            </summary>
            <p className="text-gray-700 mt-4 text-sm font-medium leading-relaxed border-t-2 border-gray-200 pt-4">
              Click "Send Reminder" on any overdue invoice. Professional emails are sent automatically. Rate-limited to once every 48 hours per invoice to maintain client relationships.
            </p>
          </details>

          <details className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-gray-200 group hover:border-blue-300 transition-all">
            <summary className="font-bold text-gray-900 cursor-pointer text-sm flex items-center justify-between">
              <span>What payment methods can clients use?</span>
              <HelpCircle className="w-5 h-5 text-gray-400 group-open:text-blue-600 transition-colors flex-shrink-0" />
            </summary>
            <p className="text-gray-700 mt-4 text-sm font-medium leading-relaxed border-t-2 border-gray-200 pt-4">
              Include payment instructions (bank transfer, PayPal, etc.) in the invoice Notes field. Direct payment integration coming soon.
            </p>
          </details>

          <details className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-gray-200 group hover:border-blue-300 transition-all">
            <summary className="font-bold text-gray-900 cursor-pointer text-sm flex items-center justify-between">
              <span>Can I edit or delete invoices?</span>
              <HelpCircle className="w-5 h-5 text-gray-400 group-open:text-blue-600 transition-colors flex-shrink-0" />
            </summary>
            <p className="text-gray-700 mt-4 text-sm font-medium leading-relaxed border-t-2 border-gray-200 pt-4">
              Yes! Draft invoices can be fully edited. Sent invoices can be marked as paid or cancelled. You can also delete any invoice from the action menu.
            </p>
          </details>

          <details className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-gray-200 group hover:border-blue-300 transition-all">
            <summary className="font-bold text-gray-900 cursor-pointer text-sm flex items-center justify-between">
              <span>Is my data secure and private?</span>
              <HelpCircle className="w-5 h-5 text-gray-400 group-open:text-blue-600 transition-colors flex-shrink-0" />
            </summary>
            <p className="text-gray-700 mt-4 text-sm font-medium leading-relaxed border-t-2 border-gray-200 pt-4">
              Absolutely. We use bank-level encryption and row-level security. Your data is completely isolated from other users and never shared with third parties.
            </p>
          </details>

          <details className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-gray-200 group hover:border-blue-300 transition-all">
            <summary className="font-bold text-gray-900 cursor-pointer text-sm flex items-center justify-between">
              <span>How do I cancel my subscription?</span>
              <HelpCircle className="w-5 h-5 text-gray-400 group-open:text-blue-600 transition-colors flex-shrink-0" />
            </summary>
            <p className="text-gray-700 mt-4 text-sm font-medium leading-relaxed border-t-2 border-gray-200 pt-4">
              Visit Settings → Billing and click "Cancel Subscription". Your data stays safe and you can reactivate anytime. No penalties for canceling.
            </p>
          </details>

          <details className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-gray-200 group hover:border-blue-300 transition-all">
            <summary className="font-bold text-gray-900 cursor-pointer text-sm flex items-center justify-between">
              <span>Can I upgrade or downgrade plans?</span>
              <HelpCircle className="w-5 h-5 text-gray-400 group-open:text-blue-600 transition-colors flex-shrink-0" />
            </summary>
            <p className="text-gray-700 mt-4 text-sm font-medium leading-relaxed border-t-2 border-gray-200 pt-4">
              Yes! Visit Settings → Billing to upgrade (prorated billing) or downgrade (change takes effect at period end). Switch plans anytime.
            </p>
          </details>
        </div>
      </div>

      {/* Security & Privacy */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-10 border-2 border-green-200 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
            <Shield className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Security & Privacy</h2>
            <p className="text-gray-700 font-medium">Your data is protected with industry-leading security</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border-2 border-green-200">
            <h3 className="text-lg font-black text-gray-900 mb-2">Bank-Level Encryption</h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              All data encrypted in transit and at rest using industry-standard AES-256 encryption.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 border-2 border-green-200">
            <h3 className="text-lg font-black text-gray-900 mb-2">Row-Level Security</h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Your data is completely isolated. No user can access another user's information.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 border-2 border-green-200">
            <h3 className="text-lg font-black text-gray-900 mb-2">GDPR Compliant</h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              We comply with GDPR, CCPA, and international data protection standards.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-12 shadow-2xl">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'1\' height=\'1\' fill=\'rgba(255,255,255,0.5)\'/%3E%3C/svg%3E")', backgroundSize: '60px 60px'}}></div>
        
        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30 shadow-2xl">
              <Mail className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Still Need Help?</h2>
          <p className="text-blue-100 text-lg font-medium mb-8 max-w-2xl mx-auto leading-relaxed">
            Our support team typically responds within 24 hours. We're here to help you succeed with Invonaut.
          </p>
          <a 
            href="mailto:kamohelo.thakhisi@gmail.com"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-200"
          >
            <Mail className="w-5 h-5" />
            Contact Support Team
          </a>
          <p className="text-blue-200 text-sm mt-4 font-medium">
            Professional plan users get priority support
          </p>
        </div>
      </div>
    </div>
    </div>
  )
}