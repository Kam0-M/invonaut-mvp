import Link from 'next/link'
import { ArrowLeft, BarChart3, TrendingUp, DollarSign, Users } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
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
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">Analytics</h1>
            <p className="text-base sm:text-lg text-gray-600 mt-2 font-medium">
              Deep insights into your business performance
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 rounded-2xl border-2 border-blue-300 p-12 sm:p-16 text-center shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-xl">
            <BarChart3 className="w-12 h-12 text-white" strokeWidth={2.5} />
          </div>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 tracking-tight">
          Advanced Analytics Coming Soon
        </h2>
        <p className="text-gray-700 text-base sm:text-lg font-medium mb-8 max-w-2xl mx-auto leading-relaxed">
          We're building powerful analytics features to help you understand your business better. Track revenue trends, client payment patterns, and cash flow forecasts.
        </p>
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:scale-105 transition-all duration-200">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
          </svg>
          Available in Phase 2
        </div>
      </div>

      {/* Feature Preview */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-8 border-2 border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6">
            <TrendingUp className="w-8 h-8 text-blue-600" strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight">
            Revenue Forecasting
          </h3>
          <p className="text-gray-600 text-sm font-medium leading-relaxed">
            AI-powered predictions of future revenue based on historical data and payment trends.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 border-2 border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center mb-6">
            <DollarSign className="w-8 h-8 text-teal-600" strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight">
            Cash Flow Analysis
          </h3>
          <p className="text-gray-600 text-sm font-medium leading-relaxed">
            Visualize your cash flow patterns and identify opportunities to improve payment timing.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 border-2 border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-6">
            <Users className="w-8 h-8 text-orange-600" strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight">
            Client Insights
          </h3>
          <p className="text-gray-600 text-sm font-medium leading-relaxed">
            See which clients pay on time, who needs attention, and optimize your client relationships.
          </p>
        </div>
      </div>
    </div>
  )
}