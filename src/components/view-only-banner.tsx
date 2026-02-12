import Link from 'next/link'
import { Lock, Sparkles, ArrowRight } from 'lucide-react'

export default function ViewOnlyBanner() {
  return (
    <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300 rounded-2xl p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-200 flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 mb-1">
              View-Only Mode
            </h3>
            <p className="text-sm text-gray-700 font-medium">
              Subscribe to unlock full features. Create invoices, manage clients, and get paid faster.
            </p>
          </div>
        </div>
        <Link 
          href="/pricing"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-105 transition-all duration-200 whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4" />
          Start Free Trial
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}