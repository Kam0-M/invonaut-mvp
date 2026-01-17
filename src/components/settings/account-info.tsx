'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AccountInfoProps {
  userId: string
  email: string
  fullName: string | null
  businessName: string | null
  address: string | null
  onUnsavedChanges?: (hasChanges: boolean) => void
}

export default function AccountInfo({ 
  userId, 
  email, 
  fullName, 
  businessName, 
  address,
  onUnsavedChanges 
}: AccountInfoProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    full_name: fullName || '',
    business_name: businessName || '',
    address: address || ''
  })

  const supabase = createClient()

  // Track if form data has changed
  useEffect(() => {
    if (isEditing) {
      const hasChanges = 
        formData.full_name !== (fullName || '') ||
        formData.business_name !== (businessName || '') ||
        formData.address !== (address || '')
      
      onUnsavedChanges?.(hasChanges)
    } else {
      onUnsavedChanges?.(false)
    }
  }, [formData, isEditing, fullName, businessName, address, onUnsavedChanges])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccessMessage('')

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.full_name,
          business_name: formData.business_name,
          address: formData.address
        })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      setSuccessMessage('Account information updated successfully!')
      setIsEditing(false)
      onUnsavedChanges?.(false)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err: any) {
      console.error('Error updating account:', err)
      setError(err.message || 'Failed to update account information')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Check if there are unsaved changes
    const hasChanges = 
      formData.full_name !== (fullName || '') ||
      formData.business_name !== (businessName || '') ||
      formData.address !== (address || '')

    if (hasChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes to your account information. Are you sure you want to discard these changes?'
      )
      if (!confirmed) return
    }

    setFormData({
      full_name: fullName || '',
      business_name: businessName || '',
      address: address || ''
    })
    setIsEditing(false)
    setError(null)
    onUnsavedChanges?.(false)
  }

  return (
    <div>
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          <p className="text-green-800 font-semibold">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          <p className="text-red-800 text-sm font-semibold">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Email (Non-editable) */}
        <div>
          <label className="text-sm font-bold text-gray-700 block mb-2">Email</label>
          <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-xl border-2 border-gray-200">{email}</p>
          <p className="text-xs text-gray-500 mt-2">Email cannot be changed</p>
        </div>

        {/* Full Name */}
        <div>
          <label className="text-sm font-bold text-gray-700 block mb-2">Full Name</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
              placeholder="Enter your full name"
            />
          ) : (
            <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200">{fullName || 'Not set'}</p>
          )}
        </div>

        {/* Business Name */}
        <div>
          <label className="text-sm font-bold text-gray-700 block mb-2">Business Name</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
              placeholder="Enter your business name"
            />
          ) : (
            <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200">{businessName || 'Not set'}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="text-sm font-bold text-gray-700 block mb-2">Business Address</label>
          {isEditing ? (
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
              placeholder="Enter your business address"
            />
          ) : (
            <p className="text-gray-900 whitespace-pre-line px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200">{address || 'Not set'}</p>
          )}
        </div>

        {/* Action Buttons */}
        {isEditing ? (
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-6 py-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold rounded-xl transition border-2 border-blue-200"
          >
            Edit Information
          </button>
        )}
      </div>
    </div>
  )
}