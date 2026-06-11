'use client'
// src/components/clients/client-files-tab.tsx
//
// Files tab on the client detail page.
// Shows all files uploaded for a client with download links and delete buttons.
// Any file type accepted, max 25 MB.
//
// TODO: auto-populate signed contract PDFs here (Phase 9)

import { useState, useRef, useCallback } from 'react'
import { Paperclip, Trash2, Upload, FileText, Image, File, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClientFile = {
  id:          string
  file_name:   string
  file_url:    string
  file_size:   number
  file_type:   string
  uploaded_at: string
}

interface Props {
  clientId:    string
  initialFiles: ClientFile[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 25 * 1024 * 1024 // 25 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

// Return a Lucide icon component based on MIME type
function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith('image/'))        return <Image   className={className} />
  if (mimeType === 'application/pdf')       return <FileText className={className} />
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileText className={className} />
  if (mimeType.includes('word') || mimeType.includes('document'))     return <FileText className={className} />
  return <File className={className} />
}

// Background colour for the file icon badge
function iconBg(mimeType: string): string {
  if (mimeType.startsWith('image/'))  return 'bg-blue-100 text-blue-600'
  if (mimeType === 'application/pdf') return 'bg-red-100 text-red-600'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'bg-green-100 text-green-600'
  if (mimeType.includes('word') || mimeType.includes('document'))     return 'bg-blue-100 text-blue-600'
  return 'bg-gray-100 text-gray-500'
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientFilesTab({ clientId, initialFiles }: Props) {
  const [files,      setFiles]      = useState<ClientFile[]>(initialFiles)
  const [uploading,  setUploading]  = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [deleteId,   setDeleteId]   = useState<string | null>(null)
  const [deleting,   setDeleting]   = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Upload ──────────────────────────────────────────────────────────────────

  const uploadFile = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      toast.error(`"${file.name}" exceeds the 25 MB limit.`)
      return
    }

    setUploading(true)
    const toastId = toast.loading(`Uploading ${file.name}…`)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('clientId', clientId)

      const res  = await fetch('/api/client-files/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!data.success) throw new Error(data.error || 'Upload failed')

      setFiles(prev => [data.file, ...prev])
      toast.success('File uploaded', { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Upload failed', { id: toastId })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  // ── Drag-and-drop ───────────────────────────────────────────────────────────

  const handleDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true)  }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }, [])
  const handleDrop      = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }, [clientId])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setDeleting(true)

    try {
      const res  = await fetch('/api/client-files/delete', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fileId: deleteId }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Delete failed')

      setFiles(prev => prev.filter(f => f.id !== deleteId))
      toast.success('File deleted')
    } catch (err: any) {
      toast.error(err.message || 'Delete failed')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const fileToDelete = files.find(f => f.id === deleteId)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0055FF] rounded-xl flex items-center justify-center flex-shrink-0">
            <Paperclip className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Files</h2>
            <p className="text-sm text-gray-500 font-medium">
              {files.length} file{files.length !== 1 ? 's' : ''} · any type, max 25 MB
            </p>
          </div>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0055FF] text-white font-bold text-sm hover:bg-[#0044DD] hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading…' : 'Upload File'}
        </button>
      </div>

      {/* Drag-and-drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`mb-6 rounded-xl border border-dashed p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        } ${uploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <Upload className={`w-6 h-6 ${isDragging ? 'text-[#0055FF]' : 'text-gray-400'}`} />
          </div>
          <p className="text-sm font-bold text-gray-700">
            {isDragging ? 'Drop to upload' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-xs text-gray-400 font-medium">Any file type · Max 25 MB</p>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" onChange={handleFileInput} className="hidden" />

      {/* File list */}
      {files.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Paperclip className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">No files yet</p>
          <p className="text-xs text-gray-400 mt-1">Upload contracts, NDAs, briefs, or any reference document</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {files.map(file => (
            <div key={file.id} className="flex items-center gap-4 py-4 group">
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg(file.file_type)}`}>
                <FileIcon mimeType={file.file_type} className="w-5 h-5" />
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0">
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-gray-900 hover:text-[#0055FF] transition-colors truncate block"
                  title={file.file_name}
                >
                  {file.file_name}
                </a>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  {formatBytes(file.file_size)} · {formatDate(file.uploaded_at)}
                </p>
              </div>

              {/* Download link */}
              <a
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-blue-500 hover:text-blue-700 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Download ↗
              </a>

              {/* Delete button */}
              <button
                onClick={() => setDeleteId(file.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
                title="Delete file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete File"
        description={`Are you sure you want to delete "${fileToDelete?.file_name}"?\n\nThis cannot be undone.`}
        confirmText="Delete"
        isLoading={deleting}
      />
    </div>
  )
}
