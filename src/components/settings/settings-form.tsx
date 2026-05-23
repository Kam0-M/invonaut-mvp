'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LogoUploader from './logo-uploader'
import ColorPicker from './color-picker'
import AccountInfo from './account-info'
import { AlertCircle, CheckCircle2, CreditCard, Lock, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface SettingsFormProps {
  userId: string
  currentLogoUrl: string | null
  currentBrandColor: string
  currentSecondaryBrandColor: string
  subscriptionTier: string
  hasActiveSubscription: boolean
  hasEverSubscribed: boolean
  subscriptionStatus: string
  userProfile: {
    full_name: string | null
    email: string
    business_name: string | null
    address: string | null
  }
}

export default function SettingsForm({
  userId,
  currentLogoUrl,
  currentBrandColor,
  currentSecondaryBrandColor,
  subscriptionTier,
  hasActiveSubscription,
  hasEverSubscribed,
  subscriptionStatus,
  userProfile
}: SettingsFormProps) {
  const router = useRouter()
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl)
  const [brandColor, setBrandColor] = useState(currentBrandColor)
  const [secondaryBrandColor, setSecondaryBrandColor] = useState(currentSecondaryBrandColor)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [hasAccountChanges, setHasAccountChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const isProfessionalOrBusiness = subscriptionTier === 'professional' || subscriptionTier === 'business'

  // Track changes (white label OR account info)
  useEffect(() => {
    const hasWhiteLabelChanges = 
      logoUrl !== currentLogoUrl ||
      brandColor !== currentBrandColor ||
      secondaryBrandColor !== currentSecondaryBrandColor

    setHasUnsavedChanges(hasWhiteLabelChanges || hasAccountChanges)
  }, [logoUrl, brandColor, secondaryBrandColor, currentLogoUrl, currentBrandColor, currentSecondaryBrandColor, hasAccountChanges])

  // Browser beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleColorsChanged = (primary: string, secondary: string) => {
    setBrandColor(primary)
    setSecondaryBrandColor(secondary)
  }

  const handleSaveChanges = async () => {
    if (!hasUnsavedChanges) return

    setIsSaving(true)
    setSaveStatus('saving')

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          logo_url: logoUrl,
          brand_color: brandColor,
          secondary_brand_color: secondaryBrandColor
        })
        .eq('id', userId)

      if (error) throw error

      setSaveStatus('saved')
      setHasUnsavedChanges(false)
      
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)

      router.refresh()
    } catch (error) {
      console.error('Save error:', error)
      setSaveStatus('error')
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Account Information */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Account Information</h2>
            <p className="text-sm text-gray-500">Manage your personal and business details</p>
          </div>
        </div>

        <AccountInfo
          userId={userId}
          email={userProfile.email}
          fullName={userProfile.full_name}
          businessName={userProfile.business_name}
          address={userProfile.address}
          onUnsavedChanges={setHasAccountChanges}
        />
      </div>

      {/* Current Plan Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Current Plan</h2>
            <p className="text-sm text-gray-500">Manage your subscription</p>
          </div>
        </div>

        {hasActiveSubscription ? (
          <div className="space-y-6">
            {/* ACTIVE SUBSCRIPTION */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-black text-gray-900 capitalize">{subscriptionTier}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      subscriptionStatus === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : subscriptionStatus === 'trialing'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {subscriptionStatus === 'active' && '✓ Active'}
                      {subscriptionStatus === 'trialing' && '⏱ Trial'}
                      {subscriptionStatus === 'past_due' && '⚠ Past Due'}
                    </span>
                  </div>
                  <p className="text-gray-700 font-medium">
                    {subscriptionTier === 'starter' && '$19/month · 25 invoices · Basic AI predictions'}
                    {subscriptionTier === 'professional' && '$49/month · Unlimited invoices · White-label branding'}
                    {subscriptionTier === 'business' && '$99/month · Everything in Pro · Budget alerts · Priority support'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/dashboard/billing"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  Manage Subscription
                </Link>
                
                {subscriptionTier === 'starter' && (
                  <Link
                    href="/pricing"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    Upgrade to Professional
                  </Link>
                )}
              </div>
            </div>

            {/* Feature List */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">
                    {subscriptionTier === 'starter' ? '25 invoices/month' : 'Unlimited invoices'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {subscriptionTier === 'starter' ? 'Upgrade for unlimited' : 'No monthly limits'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">AI Payment Predictions</p>
                  <p className="text-xs text-gray-600">95% accuracy rate</p>
                </div>
              </div>
              
              {isProfessionalOrBusiness && (
                <>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900 text-sm">White Label Branding</p>
                      <p className="text-xs text-gray-600">Custom logo & colors</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Priority Support</p>
                      <p className="text-xs text-gray-600">Faster response times</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : hasEverSubscribed ? (
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-5 border border-orange-100 text-center">
            {/* CANCELED / INACTIVE (had subscription before) */}
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">No Active Subscription</h3>
            <p className="text-gray-700 font-medium mb-6 max-w-md mx-auto">
              Your subscription has been canceled. Reactivate to unlock all features and access your data again.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Reactivate Subscription
            </Link>
            <p className="text-sm text-gray-600 mt-6">
              Your data is safe and will be restored when you resubscribe
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-5 border border-blue-100 text-center">
            {/* NEW USER (never subscribed) */}
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Start Your Free Trial</h3>
            <p className="text-gray-700 font-medium mb-6 max-w-md mx-auto">
              Get 14 days free on any plan. No credit card required. Unlock AI predictions, automated follow-ups, and professional invoicing.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all text-lg"
            >
              <Sparkles className="w-5 h-5" />
              Start 14-Day Free Trial
            </Link>
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                No credit card
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Cancel anytime
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Full access
              </span>
            </div>
          </div>
        )}
      </div>

      {/* White Label Branding */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">White Label Branding</h2>
            <p className="text-sm text-gray-500">Customize invoices with your brand colors and logo</p>
          </div>
        </div>

        {!isProfessionalOrBusiness ? (
          <div className="bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-100 rounded-xl p-5 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Professional Feature</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Upgrade to Professional or Business plan to customize your invoices with your own logo and brand colors.
            </p>
            <button
              type="button"
              onClick={() => router.push('/pricing')}
              className="btn-primary px-6 py-2.5 rounded-xl text-sm"
            >
              Upgrade to Professional
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Company Logo
              </label>
              <LogoUploader
                userId={userId}
                currentLogoUrl={logoUrl}
                onLogoUploaded={setLogoUrl}
              />
              <p className="text-xs text-gray-500 mt-2">
                Upload your logo (PNG, JPG, SVG, WebP) • Max 10MB • Up to 8K resolution
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Brand Colors
              </label>
              <ColorPicker
                userId={userId}
                currentPrimaryColor={brandColor}
                currentSecondaryColor={secondaryBrandColor}
                onColorsChanged={handleColorsChanged}
              />
              <p className="text-xs text-gray-500 mt-2">
                Choose your primary and secondary brand colors for invoices and emails
              </p>
            </div>

            {hasUnsavedChanges && (
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-900">Unsaved Changes</p>
                  <p className="text-xs text-orange-700">You have unsaved changes. Click "Save Changes" below to apply them.</p>
                </div>
              </div>
            )}

            {saveStatus === 'saved' && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-900">Changes Saved</p>
                  <p className="text-xs text-green-700">Your white label settings have been updated successfully.</p>
                </div>
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900">Save Failed</p>
                  <p className="text-xs text-red-700">There was an error saving your changes. Please try again.</p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={!hasUnsavedChanges || isSaving}
                className={`
                  px-6 py-2.5 rounded-xl font-bold transition-all
                  ${hasUnsavedChanges 
                    ? 'btn-primary' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {isSaving ? 'Saving...' : saveStatus === 'saved' ? 'Changes Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}