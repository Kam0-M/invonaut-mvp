import Link from 'next/link'
import { ArrowLeft, Book, HelpCircle, FileText, Users, Settings, Mail, Sparkles } from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all duration-200 font-bold text-gray-700 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">Help Center</h1>
            <p className="text-base sm:text-lg text-gray-600 mt-2 font-medium">
              Everything you need to know about Flowance
            </p>
          </div>
        </div>
      </div>

      {/* Getting Started Card */}
      <div className="bg-white rounded-2xl p-8 border-2 border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
            <Book className="w-8 h-8 text-blue-600" strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Getting Started</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-black text-sm">1</span>
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Create Invoice</h3>
            </div>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Navigate to Invoices and click Create Invoice. Add client details and line items.
            </p>
            <Link 
              href="/dashboard/invoices/new" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all"
            >
              <FileText className="w-4 h-4" />
              Create Invoice
            </Link>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                <span className="text-white font-black text-sm">2</span>
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Add Clients</h3>
            </div>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Go to Clients to add contact information. Makes invoicing faster.
            </p>
            <Link 
              href="/dashboard/clients/new" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 transition-all"
            >
              <Users className="w-4 h-4" />
              Add Client
            </Link>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-black text-sm">3</span>
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Brand It</h3>
            </div>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Upload logo and colors in Settings. Professional invoices.
            </p>
            <div className="flex items-center gap-2">
              <Link 
                href="/dashboard/settings" 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-all"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Pro
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs Card */}
      <div className="bg-white rounded-2xl p-8 border-2 border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-teal-600" strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Frequently Asked Questions</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <details className="bg-gray-50 rounded-lg p-4 border border-gray-200 group">
            <summary className="font-bold text-gray-900 cursor-pointer text-sm flex items-center justify-between">
              <span>How does AI payment prediction work?</span>
              <HelpCircle className="w-4 h-4 text-gray-400 group-open:text-blue-600 transition-colors flex-shrink-0" />
            </summary>
            <p className="text-gray-600 mt-3 text-sm font-medium leading-relaxed border-t border-gray-200 pt-3">
              Our AI analyzes payment history, industry patterns, and terms to predict when you'll receive payment.
            </p>
          </details>

          <details className="bg-gray-50 rounded-lg p-4 border border-gray-200 group">
            <summary className="font-bold text-gray-900 cursor-pointer text-sm flex items-center justify-between">
              <span>Can I customize invoice branding?</span>
              <HelpCircle className="w-4 h-4 text-gray-400 group-open:text-blue-600 transition-colors flex-shrink-0" />
            </summary>
            <p className="text-gray-600 mt-3 text-sm font-medium leading-relaxed border-t border-gray-200 pt-3">
              Yes! Professional and Business plan users can upload logos and customize colors in Settings.
            </p>
          </details>

          <details className="bg-gray-50 rounded-lg p-4 border border-gray-200 group">
            <summary className="font-bold text-gray-900 cursor-pointer text-sm flex items-center justify-between">
              <span>How do automated follow-ups work?</span>
              <HelpCircle className="w-4 h-4 text-gray-400 group-open:text-blue-600 transition-colors flex-shrink-0" />
            </summary>
            <p className="text-gray-600 mt-3 text-sm font-medium leading-relaxed border-t border-gray-200 pt-3">
              Send professional reminders with one click. Rate-limited to once every 48 hours to prevent spam.
            </p>
          </details>

          <details className="bg-gray-50 rounded-lg p-4 border border-gray-200 group">
            <summary className="font-bold text-gray-900 cursor-pointer text-sm flex items-center justify-between">
              <span>What payment methods can clients use?</span>
              <HelpCircle className="w-4 h-4 text-gray-400 group-open:text-blue-600 transition-colors flex-shrink-0" />
            </summary>
            <p className="text-gray-600 mt-3 text-sm font-medium leading-relaxed border-t border-gray-200 pt-3">
              Include payment instructions in invoice notes. Online payment integration coming in Phase 2.
            </p>
          </details>
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 rounded-2xl border-2 border-blue-300 p-12 sm:p-16 text-center shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-xl">
            <Mail className="w-12 h-12 text-white" strokeWidth={2.5} />
          </div>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 tracking-tight">Need More Help?</h2>
        <p className="text-gray-700 text-base sm:text-lg font-medium mb-8 max-w-2xl mx-auto leading-relaxed">
          Our support team is here to help you succeed with Flowance
        </p>
        <a 
          href="mailto:kamohelo.thakhisi@gmail.com"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:scale-105 transition-all duration-200"
        >
          <Mail className="w-5 h-5" />
          Contact Support
        </a>
      </div>
    </div>
  )
}
