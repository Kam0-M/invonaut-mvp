'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  const [showModal, setShowModal]   = useState(false)
  const [isLoading, setIsLoading]   = useState(false)
  const [mounted,   setMounted]     = useState(false)

  // createPortal requires a mounted DOM
  useEffect(() => { setMounted(true) }, [])

  const handleConfirm = async () => {
    setIsLoading(true)
    const form = document.getElementById('downgrade-form-' + currentTier + '-' + targetTier) as HTMLFormElement
    if (form) form.submit()
  }

  const getFeaturesYouWillLose = (): string[] => {
    if (currentTier === 'business' && targetTier === 'starter') return [
      'Unlimited invoices (limited to 25/month)',
      'Unlimited direct payments (limited to 25/month)',
      'White-label branding (logo, custom colours)',
      'Branded client portal',
      'AI expense categorisation',
      'Cash flow forecast (90-day)',
      'Revenue intelligence dashboard',
      'Unlimited contracts (limited to 3 active)',
      'AI contract review',
      'Weekly time summary emails',
      'Client file storage',
      'Budget tracking & alerts',
    ]
    if (currentTier === 'business' && targetTier === 'professional') return [
      'Budget tracking & per-category monthly limits',
      'Automatic 80% / 100% overspend notifications',
      'Priority email support (24hr response)',
      'Early access to new features',
    ]
    if (currentTier === 'professional' && targetTier === 'starter') return [
      'Unlimited invoices (back to 25/month)',
      'Unlimited direct payments (back to 25/month)',
      'White-label branding (logo, custom colours)',
      'Branded client portal',
      'AI expense categorisation',
      'Cash flow forecast (90-day)',
      'Revenue intelligence dashboard',
      'Unlimited contracts (back to 3 active)',
      'AI contract review',
      'Weekly time summary emails',
      'Client file storage',
    ]
    return []
  }

  const targetName  = targetTier === 'starter' ? 'Starter' : targetTier === 'professional' ? 'Professional' : 'Business'
  const targetPrice = targetTier === 'starter' ? '$19' : targetTier === 'professional' ? '$49' : '$99'
  const lostFeatures = getFeaturesYouWillLose()

  const defaultClassName = className || 'w-full border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-sm transition-all'

  const modal = showModal && mounted ? createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
      onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black">Switch to {targetName}?</h2>
                <p className="text-gray-400 text-sm mt-0.5">Review what changes at {targetPrice}/month</p>
              </div>
            </div>
            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Features lost */}
          {lostFeatures.length > 0 && (
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">You will lose access to</p>
              <ul className="space-y-2">
                {lostFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-2.5 h-2.5 text-red-500" />
                    </div>
                    <span className="text-sm text-gray-600">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What happens */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-black text-blue-700 uppercase tracking-wider mb-2">What happens next</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• You keep full access until your current billing period ends</li>
              <li>• New billing starts at {targetPrice}/month after that date</li>
              <li>• You can upgrade again at any time</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(false)}
              disabled={isLoading}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 bg-gray-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
              ) : (
                <>Confirm switch<ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      <button onClick={() => setShowModal(true)} className={defaultClassName}>
        {buttonText || `Switch to ${targetName}`}
      </button>

      <form
        id={'downgrade-form-' + currentTier + '-' + targetTier}
        action="/api/downgrade-subscription"
        method="POST"
        className="hidden"
      >
        <input type="hidden" name="planId" value={targetTier} />
      </form>

      {modal}
    </>
  )
}
