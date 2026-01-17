'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LogoUploader from './logo-uploader'
import ColorPicker from './color-picker'
import AccountInfo from './account-info'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface SettingsFormProps {
  userId: string
  currentLogoUrl: string | null
  currentBrandColor: string
  currentSecondaryBrandColor: string
  subscriptionTier: string
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
        // Modern browsers ignore custom messages and show their own
        e.returnValue = ''
        return ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Navigation warning (for internal Next.js navigation)
  useEffect(() => {
    const handleRouteChange = () => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(
          'You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.'
        )
        if (!confirmed) {
          // Prevent navigation
          throw 'Route change aborted by user'
        }
      }
    }

    // Note: This is a workaround for Next.js app router
    // We'll handle this through the beforeunload event primarily
    return () => {}
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
      
      // Reset saved status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)

      // Refresh the page to update the server-side data
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
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Account Information</h2>
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

      {/* White Label Branding */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">White Label Branding</h2>
            <p className="text-sm text-gray-500">Customize invoices with your brand colors and logo</p>
          </div>
        </div>

        {!isProfessionalOrBusiness ? (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Upgrade to Professional
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Logo Upload */}
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

            {/* Color Picker */}
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

            {/* Unsaved Changes Status */}
            {hasUnsavedChanges && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-900">Unsaved Changes</p>
                  <p className="text-xs text-orange-700">You have unsaved changes. Click "Save Changes" below to apply them.</p>
                </div>
              </div>
            )}

            {saveStatus === 'saved' && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-900">Changes Saved</p>
                  <p className="text-xs text-green-700">Your white label settings have been updated successfully.</p>
                </div>
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900">Save Failed</p>
                  <p className="text-xs text-red-700">There was an error saving your changes. Please try again.</p>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t-2 border-gray-100">
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={!hasUnsavedChanges || isSaving}
                className={`
                  px-8 py-3 rounded-xl font-bold shadow-lg transition-all
                  ${hasUnsavedChanges 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-xl' 
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

      {/* Subscription Info */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Current Plan</h2>
            <p className="text-sm text-gray-500">Manage your subscription</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-gray-900 capitalize">{subscriptionTier} Plan</p>
            <p className="text-sm text-gray-600">
              {subscriptionTier === 'starter' && '$29/month • 25 invoices'}
              {subscriptionTier === 'professional' && '$59/month • Unlimited invoices + White label'}
              {subscriptionTier === 'business' && '$79/month • Everything + Team features'}
            </p>
          </div>
          {subscriptionTier === 'starter' && (
            <button
              type="button"
              onClick={() => router.push('/pricing')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg transition-colors"
            >
              Upgrade
            </button>
          )}
        </div>
      </div>
    </div>
  )
}