'use client'

import { useState } from 'react'
import { AlertTriangle, X, ArrowRight } from 'lucide-react'

interface DowngradeConfirmButtonProps {
  currentTier: string
  targetTier?: string
  buttonText?: string
  className?: string
}

export default function DowngradeConfirmButton({ 
  currentTier, 
  targetTier = 'starter',
  buttonText,
  className 
}: DowngradeConfirmButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    const form = document.getElementById('downgrade-form-' + currentTier + '-' + targetTier) as HTMLFormElement
    if (form) {
      form.submit()
    }
  }

  // EXACT feature loss based on SPECIFIC downgrade path
  const getFeaturesYouWillLose = () => {
    // Business → Starter: Loses EVERYTHING
    if (currentTier === 'business' && targetTier === 'starter') {
      return [
        'White label branding (custom logo & colors)',
        'Unlimited invoices (back to 25/month)',
        'Advanced AI predictions with confidence scores',
        'Priority email support',
        'Team collaboration features',
        'Multi-user access',
        'API access',
        'Dedicated support',
      ]
    }
    
    // Business → Professional: Loses ONLY team features (4 items)
    if (currentTier === 'business' && targetTier === 'professional') {
      return [
        'Team collaboration features',
        'Multi-user access',
        'API access',
        'Dedicated support',
      ]
    }
    
    // Professional → Starter: Loses white label features
    if (currentTier === 'professional' && targetTier === 'starter') {
      return [
        'White label branding (custom logo & colors)',
        'Unlimited invoices (back to 25/month)',
        'Advanced AI predictions with confidence scores',
        'Priority email support',
      ]
    }

    return []
  }

  const featuresYouWillLose = getFeaturesYouWillLose()

  const getTargetPlanName = () => {
    if (targetTier === 'starter') return 'Starter'
    if (targetTier === 'professional') return 'Professional'
    return targetTier
  }

  const getTargetPlanPrice = () => {
    if (targetTier === 'starter') return '$30'
    if (targetTier === 'professional') return '$60'
    return ''
  }

  const defaultButtonText = buttonText || `Switch to ${getTargetPlanName()}`
  const defaultClassName = className || "w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-2 rounded-xl font-bold text-sm hover:shadow-xl transition-all hover:scale-105"

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={defaultClassName}
      >
        {defaultButtonText}
      </button>

      <form 
        id={'downgrade-form-' + currentTier + '-' + targetTier}
        action="/api/downgrade-subscription" 
        method="POST"
        className="hidden"
      >
        <input type="hidden" name="planId" value={targetTier} />
      </form>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-t-2xl sticky top-0 z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">Downgrade to {getTargetPlanName()}?</h2>
                    <p className="text-orange-100 text-sm mt-1">
                      You're about to lose these features
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  What You'll Lose:
                </h3>
                <ul className="space-y-2">
                  {featuresYouWillLose.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="w-3 h-3 text-red-600" />
                      </div>
                      <span className="text-gray-700 text-sm font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-blue-900 text-sm mb-2">What happens next:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• You'll keep access until your billing period ends</li>
                  <li>• Your billing will switch to {getTargetPlanPrice()}/month after your current period</li>
                  <li>• Your account switches to {getTargetPlanName()} automatically</li>
                  <li>• You can reactivate anytime before the end date</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isLoading}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-3 rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Confirm Downgrade
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}