import Link from 'next/link'
import { Lock, Sparkles, CreditCard, ArrowRight } from 'lucide-react'

export default function SubscriptionRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 border-2 border-blue-200">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                <Lock className="w-10 h-10 text-orange-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center border-2 border-white">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 text-center mb-4 tracking-tight">
            Subscription Required
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-gray-600 text-center mb-8 font-medium">
            You need an active subscription to create or edit invoices and clients.
          </p>

          {/* Features Box */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 p-6 mb-8">
            <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              What You Can Still Do (Free):
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-black text-lg">✓</span>
                <span className="text-sm text-gray-700 font-medium">View all your invoices and clients</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-black text-lg">✓</span>
                <span className="text-sm text-gray-700 font-medium">See dashboard analytics and charts</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-black text-lg">✓</span>
                <span className="text-sm text-gray-700 font-medium">Export your data anytime</span>
              </li>
            </ul>
          </div>

          {/* What's Locked */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border-2 border-orange-200 p-6 mb-8">
            <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-600" />
              Unlock with Subscription:
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-orange-600 font-black text-lg">🔒</span>
                <span className="text-sm text-gray-700 font-medium">Create new invoices</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-600 font-black text-lg">🔒</span>
                <span className="text-sm text-gray-700 font-medium">Add new clients</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-600 font-black text-lg">🔒</span>
                <span className="text-sm text-gray-700 font-medium">Edit existing data</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-600 font-black text-lg">🔒</span>
                <span className="text-sm text-gray-700 font-medium">Automated follow-up emails</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-600 font-black text-lg">🔒</span>
                <span className="text-sm text-gray-700 font-medium">AI payment predictions</span>
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/pricing"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              <Sparkles className="w-5 h-5" />
              Start 14-Day Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/dashboard"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg transition-all duration-200"
            >
              Back to Dashboard
            </Link>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-gray-500 text-center mt-6 font-medium">
            💡 Your data is safe. Subscribe anytime to unlock all features.
          </p>
        </div>

        {/* Trust Badge */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 font-medium">
            ✨ 14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  )
}