'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'

interface LogoUploaderProps {
  userId: string
  currentLogoUrl: string | null
  onLogoUploaded: (url: string) => void
}

export default function LogoUploader({ userId, currentLogoUrl, onLogoUploaded }: LogoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl)
  const [showLightbox, setShowLightbox] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (showLightbox) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showLightbox])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PNG, JPG, SVG, or WebP file')
      return
    }

    // Validate file size (10MB max for high-quality images)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      setError('File size must be less than 10MB')
      return
    }

    setError(null)
    setUploading(true)

    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `logos/${fileName}`

      // Upload to Supabase Storage with high quality
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      // Update preview and notify parent
      setPreviewUrl(publicUrl)
      onLogoUploaded(publicUrl)
    } catch (err: any) {
      console.error('Error uploading logo:', err)
      setError(err.message || 'Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!window.confirm('Are you sure you want to remove your logo?')) return

    setUploading(true)
    setError(null)

    try {
      // Clear preview and notify parent
      setPreviewUrl(null)
      onLogoUploaded('')
    } catch (err: any) {
      console.error('Error removing logo:', err)
      setError(err.message || 'Failed to remove logo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Preview Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
          {previewUrl ? (
            <div className="space-y-4">
              <div 
                className="cursor-pointer hover:opacity-90 transition group relative"
                onClick={() => setShowLightbox(true)}
              >
                <img 
                  src={previewUrl} 
                  alt="Business Logo" 
                  className="h-32 mx-auto object-contain"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition rounded-lg">
                  <span className="text-gray-700 text-sm font-semibold opacity-0 group-hover:opacity-100 transition bg-white/90 px-3 py-1 rounded-lg shadow-lg">
                    Click to view full size
                  </span>
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Change Logo'}
                </button>
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={uploading}
                  className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <div>
                <p className="text-gray-700 font-medium mb-1">Upload your logo</p>
                <p className="text-sm text-gray-500">PNG, JPG, SVG, or WebP (max 10MB)</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Choose File'}
              </button>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Info Message */}
        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800">
            <strong>High Quality Upload:</strong> Supports up to 8K resolution (10MB max). For best results, use a transparent PNG or SVG with your logo. WebP format is also supported for optimal quality and file size.
          </p>
        </div>
      </div>

      {/* Lightbox Modal */}
      {showLightbox && previewUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Logo container */}
          <div 
            className="max-w-5xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={previewUrl} 
              alt="Business Logo Full Size" 
              className="w-full h-auto object-contain"
            />
          </div>

          {/* Instructions */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
            Press ESC or click outside to close
          </div>
        </div>
      )}
    </>
  )
}