'use client'

import Link from 'next/link'
import CheckoutButton from '@/components/checkout-button'

type PricingClientWrapperProps = {
  isLoggedIn: boolean
  hasEverSubscribed: boolean
  hasActiveSubscription: boolean
  currentTier: string
  starterPriceId: string
  professionalPriceId: string
}

export default function PricingClientWrapper({
  isLoggedIn,
  hasEverSubscribed,
  hasActiveSubscription,
  currentTier,
  starterPriceId,
  professionalPriceId
}: PricingClientWrapperProps) {
  
  // Helper to get button text for each plan
  const getButtonText = (planId: string) => {
    // If this is the current active plan
    if (hasActiveSubscription && currentTier === planId) {
      return 'Current Plan'
    }
    
    // If user has active subscription but different plan
    if (hasActiveSubscription) {
      if (planId === 'professional' && currentTier === 'starter') {
        return 'Upgrade to Professional'
      }
      if (planId === 'starter' && currentTier === 'professional') {
        return 'Downgrade to Starter'
      }
    }
    
    // If no active subscription
    if (!isLoggedIn) return 'Start Free Trial'
    return hasEverSubscribed ? 'Subscribe Now' : 'Start Free Trial'
  }

  const getTrialText = () => {
    if (!isLoggedIn) return 'First 14 days free'
    return hasEverSubscribed ? 'Subscribe today' : 'First 14 days free'
  }

  const getFooterText = () => {
    if (!isLoggedIn) return 'All plans include 14-day free trial • No credit card required • Cancel anytime'
    return hasEverSubscribed 
      ? 'Flexible billing • Cancel anytime • Instant access'
      : 'All plans include 14-day free trial • No credit card required • Cancel anytime'
  }

  const trialText = getTrialText()
  const footerText = getFooterText()

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">
            {isLoggedIn && hasEverSubscribed 
              ? 'Select a plan to reactivate your subscription'
              : 'Start with a 14-day free trial. No credit card required.'}
          </p>
        </div>

        {/* 2-Column Grid */}
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
            <p className="text-sm text-green-700 font-semibold mb-8">{trialText}</p>
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
            {hasActiveSubscription && currentTier === 'starter' ? (
              <button
                disabled
                className="block w-full bg-gray-300 text-gray-600 text-center py-4 rounded-xl font-bold text-lg cursor-not-allowed"
              >
                Current Plan
              </button>
) : (
    <CheckoutButton
      priceId={starterPriceId}
      planId="starter"
      buttonText={getButtonText('starter')}
      className="block w-full bg-gray-900 text-white text-center py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all"
    />
  )}
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
            <p className="text-sm text-teal-200 font-semibold mb-8">{trialText}</p>
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
            {hasActiveSubscription && currentTier === 'professional' ? (
              <button
                disabled
                className="block w-full bg-gray-300 text-gray-600 text-center py-4 rounded-xl font-bold text-lg cursor-not-allowed"
              >
                Current Plan
              </button>
) : (
    <CheckoutButton
      priceId={professionalPriceId}
      planId="professional"
      buttonText={getButtonText('professional')}
      className="block w-full bg-white text-blue-600 text-center py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all"
    />
  )}
          </div>
        </div>

        <p className="text-center text-gray-600 mt-12 text-sm font-medium">
          {footerText}
        </p>

        {/* Back to Dashboard link for logged-in users */}
        {isLoggedIn && (
          <div className="text-center mt-6">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
              ← Back to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}