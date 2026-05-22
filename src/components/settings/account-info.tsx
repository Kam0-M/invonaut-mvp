'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, AlertCircle, Pencil } from 'lucide-react'

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
  const router = useRouter()
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
      if (updateError) throw updateError
      setSuccessMessage('Account information updated successfully.')
      setIsEditing(false)
      onUnsavedChanges?.(false)
      router.refresh()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update account information')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    const hasChanges = 
      formData.full_name !== (fullName || '') ||
      formData.business_name !== (businessName || '') ||
      formData.address !== (address || '')
    if (hasChanges) {
      const confirmed = window.confirm('Discard unsaved changes?')
      if (!confirmed) return
    }
    setFormData({ full_name: fullName || '', business_name: businessName || '', address: address || '' })
    setIsEditing(false)
    setError(null)
    onUnsavedChanges?.(false)
  }

  return (
    <div>
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 font-semibold text-sm">{successMessage}</p>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800 text-sm font-semibold">{error}</p>
        </div>
      )}

      <div className="space-y-5">
        {/* Email */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Email</label>
          <p className="text-gray-700 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 text-sm">{email}</p>
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
        </div>

        {/* Full Name */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Full Name</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400 text-sm"
              placeholder="Enter your full name"
            />
          ) : (
            <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">{fullName || <span className="text-gray-400">Not set</span>}</p>
          )}
        </div>

        {/* Business Name */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Business Name</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400 text-sm"
              placeholder="Enter your business name"
            />
          ) : (
            <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">{businessName || <span className="text-gray-400">Not set</span>}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Business Address</label>
          {isEditing ? (
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400 text-sm resize-none"
              placeholder="Enter your business address"
            />
          ) : (
            <p className="text-gray-900 whitespace-pre-line px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">{address || <span className="text-gray-400">Not set</span>}</p>
          )}
        </div>

        {/* Action Buttons */}
        {isEditing ? (
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary px-5 py-2.5 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition text-sm disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold rounded-xl transition text-sm border border-blue-100"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Information
          </button>
        )}
      </div>
    </div>
  )
}
