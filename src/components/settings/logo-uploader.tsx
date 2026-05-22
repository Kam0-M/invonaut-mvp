'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Upload, ImageIcon, AlertCircle } from 'lucide-react'

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
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (showLightbox) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [showLightbox])

  const processFile = useCallback(async (file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PNG, JPG, SVG, or WebP file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(`logos/${fileName}`, file, { cacheControl: '3600', upsert: false, contentType: file.type })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(`logos/${fileName}`)
      setPreviewUrl(urlData.publicUrl)
      onLogoUploaded(urlData.publicUrl)
    } catch (err: any) {
      setError(err.message || 'Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }, [userId, supabase, onLogoUploaded])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)

  const handleRemoveLogo = async () => {
    if (!window.confirm('Remove your logo?')) return
    setPreviewUrl(null)
    onLogoUploaded('')
  }

  return (
    <>
      <div className="space-y-3">
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !previewUrl && fileInputRef.current?.click()}
          className={`relative rounded-xl border-dashed border-2 transition-all duration-200 ${
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : previewUrl
              ? 'border-gray-200 bg-white'
              : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer'
          }`}
        >
          {previewUrl ? (
            <div className="p-6 flex items-center gap-5">
              <div
                className="cursor-zoom-in group relative flex-shrink-0"
                onClick={() => setShowLightbox(true)}
              >
                <img src={previewUrl} alt="Logo" className="h-16 w-auto object-contain rounded-lg" />
                <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/10 transition" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">Logo uploaded</p>
                <p className="text-xs text-gray-400 mt-0.5">Click logo to preview full size</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                  disabled={uploading}
                  className="btn-primary px-4 py-2 rounded-xl text-xs disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Replace'}
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemoveLogo() }}
                  disabled={uploading}
                  className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl transition text-xs disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              {uploading ? (
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5 text-blue-600 animate-bounce" />
                  </div>
                  <p className="text-sm font-bold text-gray-700">Uploading...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-colors ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <ImageIcon className={`w-5 h-5 transition-colors ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700">
                      {isDragging ? 'Drop your logo here' : 'Drag & drop your logo'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">or click to browse — PNG, JPG, SVG, WebP up to 10MB</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-xs font-medium">{error}</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {showLightbox && previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-5xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <img src={previewUrl} alt="Logo" className="w-full h-auto object-contain" />
          </div>
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-xs bg-black/40 px-4 py-2 rounded-lg">
            Click outside to close
          </p>
        </div>
      )}
    </>
  )
}
