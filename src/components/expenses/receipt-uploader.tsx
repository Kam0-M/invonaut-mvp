'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileImage, Loader2 } from 'lucide-react'

interface ReceiptUploaderProps {
  onUploaded: (url: string) => void
  currentUrl?: string | null
}

export default function ReceiptUploader({ onUploaded, currentUrl }: ReceiptUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PNG, JPG, WebP, or PDF.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB.')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/expenses/upload-receipt', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Upload failed.')
        return
      }

      setPreview(data.url)
      onUploaded(data.url)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onUploaded('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const isPdf = preview?.toLowerCase().includes('.pdf')

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-gray-700">
        Receipt (optional)
      </label>

      {preview ? (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
          {isPdf ? (
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileImage className="w-5 h-5 text-red-600" />
            </div>
          ) : (
            <img
              src={preview}
              alt="Receipt"
              className="w-10 h-10 object-cover rounded-lg flex-shrink-0 cursor-pointer"
              onClick={() => window.open(preview, '_blank')}
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-700 truncate">
              {isPdf ? 'Receipt PDF' : 'Receipt image'}
            </p>
            <button
              type="button"
              onClick={() => window.open(preview, '_blank')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              View full size
            </button>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-200 text-sm font-bold text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-[#F8FAFF] transition-all disabled:opacity-50"
        >
          {uploading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
            : <><Upload className="w-4 h-4" /> Upload receipt</>
          }
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <p className="text-xs font-medium text-red-600">{error}</p>
      )}
      <p className="text-xs text-gray-400">PNG, JPG, WebP, or PDF · max 10MB</p>
    </div>
  )
}