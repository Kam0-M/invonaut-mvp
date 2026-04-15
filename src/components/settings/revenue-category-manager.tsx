'use client'
// src/components/settings/revenue-category-manager.tsx
//
// Full CRUD UI for revenue categories, rendered as a section inside the Settings page.
// Extracted as its own client component so the already-large SettingsForm stays clean.
//
// Features:
//   - List of existing categories with color swatch, name, description
//   - Add category form: name (required), color (preset palette), description (optional)
//   - Inline edit: same fields
//   - Delete with ConfirmDialog — blocked with helpful message if category has invoices

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Check, X, Loader2, Tag } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RevenueCategory = {
  id:          string
  name:        string
  description: string | null
  color:       string
  created_at:  string
}

interface Props {
  initialCategories: RevenueCategory[]
}

// ─── Colour palette ───────────────────────────────────────────────────────────
// 12 preset swatches — enough variety without needing a full colour picker.
// Colors chosen to be visually distinct and work well in charts.

const PRESET_COLORS = [
  { hex: '#6366F1', label: 'Indigo'  },
  { hex: '#3B82F6', label: 'Blue'    },
  { hex: '#0D9488', label: 'Teal'    },
  { hex: '#10B981', label: 'Green'   },
  { hex: '#F59E0B', label: 'Amber'   },
  { hex: '#F97316', label: 'Orange'  },
  { hex: '#EF4444', label: 'Red'     },
  { hex: '#EC4899', label: 'Pink'    },
  { hex: '#8B5CF6', label: 'Purple'  },
  { hex: '#06B6D4', label: 'Cyan'    },
  { hex: '#84CC16', label: 'Lime'    },
  { hex: '#6B7280', label: 'Gray'    },
]

const DEFAULT_COLOR = '#6366F1'

// ─── Component ────────────────────────────────────────────────────────────────

export default function RevenueCategoryManager({ initialCategories }: Props) {
  const [categories, setCategories] = useState<RevenueCategory[]>(initialCategories)

  // Add form state
  const [showAddForm, setShowAddForm]     = useState(false)
  const [addName, setAddName]             = useState('')
  const [addDescription, setAddDescription] = useState('')
  const [addColor, setAddColor]           = useState(DEFAULT_COLOR)
  const [addLoading, setAddLoading]       = useState(false)

  // Edit state — which row is being edited
  const [editingId, setEditingId]         = useState<string | null>(null)
  const [editName, setEditName]           = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editColor, setEditColor]         = useState(DEFAULT_COLOR)
  const [editLoading, setEditLoading]     = useState(false)

  // Delete state
  const [deleteId, setDeleteId]           = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteBlockMsg, setDeleteBlockMsg] = useState<string | null>(null)

  // ── Add ──────────────────────────────────────────────────────────────────────

  const handleAdd = async () => {
    const name = addName.trim()
    if (!name) { toast.error('Category name is required'); return }

    setAddLoading(true)
    try {
      const res  = await fetch('/api/revenue-categories', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, description: addDescription.trim() || null, color: addColor }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      setCategories(prev => [...prev, data.category].sort((a, b) => a.name.localeCompare(b.name)))
      setAddName(''); setAddDescription(''); setAddColor(DEFAULT_COLOR); setShowAddForm(false)
      toast.success(`Category "${data.category.name}" created`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to create category')
    } finally {
      setAddLoading(false)
    }
  }

  // ── Edit ─────────────────────────────────────────────────────────────────────

  const startEdit = (cat: RevenueCategory) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditDescription(cat.description || '')
    setEditColor(cat.color)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName(''); setEditDescription(''); setEditColor(DEFAULT_COLOR)
  }

  const handleEdit = async (id: string) => {
    const name = editName.trim()
    if (!name) { toast.error('Category name is required'); return }

    setEditLoading(true)
    try {
      const res  = await fetch('/api/revenue-categories', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, name, description: editDescription.trim() || null, color: editColor }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      setCategories(prev =>
        prev.map(c => c.id === id ? data.category : c)
            .sort((a, b) => a.name.localeCompare(b.name))
      )
      cancelEdit()
      toast.success(`Category updated`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update category')
    } finally {
      setEditLoading(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      const res  = await fetch('/api/revenue-categories', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: deleteId }),
      })
      const data = await res.json()

      if (!data.success) {
        if (data.blocked) {
          // Show the block message inline rather than a generic error
          setDeleteBlockMsg(data.error)
          setDeleteId(null)
          return
        }
        throw new Error(data.error)
      }

      setCategories(prev => prev.filter(c => c.id !== deleteId))
      toast.success('Category deleted')
      setDeleteId(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category')
    } finally {
      setDeleteLoading(false)
    }
  }

  // ── Colour picker sub-component ───────────────────────────────────────────────

  const ColorPicker = ({
    value,
    onChange,
  }: {
    value: string
    onChange: (hex: string) => void
  }) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {PRESET_COLORS.map(c => (
        <button
          key={c.hex}
          type="button"
          title={c.label}
          onClick={() => onChange(c.hex)}
          className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center flex-shrink-0 ${
            value === c.hex ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-110'
          }`}
          style={{ backgroundColor: c.hex }}
        >
          {value === c.hex && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
        </button>
      ))}
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────────

  const categoryToDelete = categories.find(c => c.id === deleteId)

  return (
    <div className="space-y-4">

      {/* Block message banner — shown when deletion is rejected */}
      {deleteBlockMsg && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
          <div className="flex-1 text-sm font-medium text-amber-800">{deleteBlockMsg}</div>
          <button
            onClick={() => setDeleteBlockMsg(null)}
            className="text-amber-500 hover:text-amber-700 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Category list */}
      {categories.length === 0 && !showAddForm ? (
        <div className="text-center py-10 rounded-xl border-2 border-dashed border-gray-200">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Tag className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">No revenue categories yet</p>
          <p className="text-xs text-gray-400">Add categories to tag your income by source</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 border-2 border-gray-100 rounded-xl overflow-hidden">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white">
              {editingId === cat.id ? (
                /* Edit row */
                <div className="p-4 space-y-3">
                  <div className="flex gap-3 items-start">
                    {/* Color preview */}
                    <div className="w-9 h-9 rounded-lg flex-shrink-0 mt-0.5" style={{ backgroundColor: editColor }} />
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="Category name"
                        maxLength={60}
                        className="w-full px-3 py-2 text-sm font-bold text-gray-900 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl focus:outline-none"
                        onKeyDown={e => { if (e.key === 'Enter') handleEdit(cat.id); if (e.key === 'Escape') cancelEdit() }}
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editDescription}
                        onChange={e => setEditDescription(e.target.value)}
                        placeholder="Description (optional)"
                        maxLength={120}
                        className="w-full px-3 py-2 text-sm text-gray-600 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl focus:outline-none"
                      />
                      <ColorPicker value={editColor} onChange={setEditColor} />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={editLoading}
                      className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(cat.id)}
                      disabled={editLoading || !editName.trim()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {editLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                /* Display row */
                <div className="flex items-center gap-3 px-4 py-3.5 group hover:bg-gray-50 transition-colors">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{cat.name}</p>
                    {cat.description && (
                      <p className="text-xs text-gray-400 font-medium truncate mt-0.5">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(cat)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDeleteBlockMsg(null); setDeleteId(cat.id) }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showAddForm ? (
        <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-xl space-y-3">
          <p className="text-sm font-black text-gray-900">New Category</p>
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-lg flex-shrink-0 mt-0.5" style={{ backgroundColor: addColor }} />
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={addName}
                onChange={e => setAddName(e.target.value)}
                placeholder="Category name (e.g. Consulting, Delivery, Subscriptions)"
                maxLength={60}
                className="w-full px-3 py-2 text-sm font-bold text-gray-900 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl focus:outline-none bg-white"
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setShowAddForm(false); setAddName(''); setAddDescription(''); setAddColor(DEFAULT_COLOR) } }}
                autoFocus
              />
              <input
                type="text"
                value={addDescription}
                onChange={e => setAddDescription(e.target.value)}
                placeholder="Description (optional)"
                maxLength={120}
                className="w-full px-3 py-2 text-sm text-gray-600 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl focus:outline-none bg-white"
              />
              <ColorPicker value={addColor} onChange={setAddColor} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setAddName(''); setAddDescription(''); setAddColor(DEFAULT_COLOR) }}
              disabled={addLoading}
              className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={addLoading || !addName.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {addLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Add Category
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 text-sm font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all w-full justify-center"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      )}

      {/* Delete confirm dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        description={`Are you sure you want to delete "${categoryToDelete?.name}"? This cannot be undone.`}
        confirmText="Delete"
        isLoading={deleteLoading}
      />
    </div>
  )
}
