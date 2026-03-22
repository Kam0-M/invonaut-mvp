'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  Loader2, BookOpen, X, Check
} from 'lucide-react'
import { toast } from 'sonner'
import { CONTRACT_TEMPLATES, type ClauseBlock } from '@/lib/contracts/templates'

type Client = { id: string; name: string; company: string | null }
type SystemClause = { id: string; title: string; category: string; content: string }

// ── Template Selector ─────────────────────────────────────────────────────────
function TemplateSelector({ onSelect }: { onSelect: (type: string) => void }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
          Choose a template
        </h2>
        <p className="text-gray-500">
          Start with a professional template and customise it for your engagement.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {CONTRACT_TEMPLATES.map(t => (
          <button
            key={t.type}
            onClick={() => onSelect(t.type)}
            className="text-left bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-200 group"
          >
            <div className="text-3xl mb-4">{t.icon}</div>
            <h3 className="font-black text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
              {t.name}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">{t.description}</p>
          </button>
        ))}
        {/* Custom / blank */}
        <button
          onClick={() => onSelect('custom')}
          className="text-left bg-white border-2 border-dashed border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-200 group"
        >
          <div className="text-3xl mb-4">✏️</div>
          <h3 className="font-black text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
            Blank Contract
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Start from scratch and build your own contract clause by clause.
          </p>
        </button>
      </div>
    </div>
  )
}

// ── Clause Library Panel ──────────────────────────────────────────────────────
function ClauseLibraryPanel({
  onAdd,
  onClose,
  systemClauses,
}: {
  onAdd: (clause: Omit<ClauseBlock, 'id'>) => void
  onClose: () => void
  systemClauses: SystemClause[]
}) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'payment', label: 'Payment' },
    { value: 'kill_fee', label: 'Kill Fee' },
    { value: 'ip', label: 'IP' },
    { value: 'confidentiality', label: 'Confidentiality' },
    { value: 'revision', label: 'Revisions' },
    { value: 'termination', label: 'Termination' },
    { value: 'liability', label: 'Liability' },
    { value: 'governing_law', label: 'Governing Law' },
  ]

  const filtered = systemClauses.filter(c => {
    const matchesCat = activeCategory === 'all' || c.category === activeCategory
    const matchesSearch = !search.trim() ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.content.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span className="font-black text-gray-900">Clause Library</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 space-y-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clauses..."
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  activeCategory === cat.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No clauses found.</p>
          ) : (
            filtered.map(clause => (
              <div
                key={clause.id}
                className="border border-gray-200 rounded-xl p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="font-bold text-gray-900 text-sm">{clause.title}</p>
                  <button
                    onClick={() => onAdd({ title: clause.title, content: clause.content, category: clause.category })}
                    className="flex-shrink-0 inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                  {clause.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Contract Builder ──────────────────────────────────────────────────────────
function ContractBuilder({
  templateType,
  initialClauses,
  clients,
  systemClauses,
  onBack,
}: {
  templateType: string
  initialClauses: Omit<ClauseBlock, 'id'>[]
  clients: Client[]
  systemClauses: SystemClause[]
  onBack: () => void
}) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [clientId, setClientId] = useState('')
  const [totalValue, setTotalValue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [clauses, setClauses] = useState<ClauseBlock[]>(
    initialClauses.map((c, i) => ({ ...c, id: `clause-${Date.now()}-${i}` }))
  )
  const [showLibrary, setShowLibrary] = useState(false)
  const [expandedClauses, setExpandedClauses] = useState<Set<string>>(
    new Set(initialClauses.map((_, i) => `clause-${Date.now()}-${i}`))
  )
  const [isSaving, setIsSaving] = useState(false)

  // Initialise expanded state properly once on mount
  useEffect(() => {
    setClauses(prev => prev) // no-op triggers rerender
    setExpandedClauses(new Set(clauses.map(c => c.id)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleClause = (id: string) => {
    setExpandedClauses(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const updateClause = (id: string, field: 'title' | 'content', value: string) => {
    setClauses(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  const removeClause = (id: string) => {
    setClauses(prev => prev.filter(c => c.id !== id))
  }

  const addBlankClause = () => {
    const id = `clause-${Date.now()}`
    setClauses(prev => [...prev, { id, title: 'New Clause', content: '', category: 'custom' }])
    setExpandedClauses(prev => new Set([...prev, id]))
  }

  const addFromLibrary = (clause: Omit<ClauseBlock, 'id'>) => {
    const id = `clause-${Date.now()}`
    setClauses(prev => [...prev, { ...clause, id }])
    setExpandedClauses(prev => new Set([...prev, id]))
    toast.success(`"${clause.title}" added`)
  }

  const moveClause = (index: number, direction: 'up' | 'down') => {
    setClauses(prev => {
      const next = [...prev]
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Please enter a contract title.'); return }
    if (!clientId) { toast.error('Please select a client.'); return }
    if (clauses.length === 0) { toast.error('Add at least one clause.'); return }

    setIsSaving(true)
    try {
      const res = await fetch('/api/contracts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          clientId,
          templateType,
          totalValue: totalValue ? parseFloat(totalValue) : null,
          startDate: startDate || null,
          endDate: endDate || null,
          content: clauses.map(({ id: _id, ...rest }) => rest),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Could not save contract.')
        return
      }
      toast.success('Contract saved as draft.')
      router.push(`/dashboard/contracts/${data.contractId}`)
    } catch {
      toast.error('Could not save contract. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const templateLabels: Record<string, string> = {
    service_agreement: 'Service Agreement', nda: 'NDA',
    project_proposal: 'Project Proposal', retainer: 'Retainer',
    work_for_hire: 'Work for Hire', subcontractor: 'Subcontractor', custom: 'Custom',
  }

  return (
    <div className="space-y-6">
      {showLibrary && (
        <ClauseLibraryPanel
          onAdd={addFromLibrary}
          onClose={() => setShowLibrary(false)}
          systemClauses={systemClauses}
        />
      )}

      {/* Builder header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Change template
          </button>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            {templateLabels[templateType] ?? 'Custom Contract'}
          </h2>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {isSaving ? 'Saving...' : 'Save as Draft'}
        </button>
      </div>

      {/* Contract metadata */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-6 space-y-5">
        <h3 className="font-black text-gray-900">Contract details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Contract title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Web Development Agreement — Acme Corp"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Client <span className="text-red-500">*</span>
            </label>
            <select
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white"
            >
              <option value="">Select a client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company ? ` — ${c.company}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Contract value (optional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
              <input
                type="number"
                value={totalValue}
                onChange={e => setTotalValue(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Start date (optional)</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">End date (optional)</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Clauses */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-gray-900">Contract clauses</h3>
          <button
            onClick={() => setShowLibrary(true)}
            className="inline-flex items-center gap-2 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Clause library
          </button>
        </div>

        {clauses.length === 0 && (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-gray-400 text-sm">No clauses yet. Add from the library or create a blank clause.</p>
          </div>
        )}

        {clauses.map((clause, index) => (
          <div key={clause.id} className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">
            {/* Clause header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  onClick={() => moveClause(index, 'up')}
                  disabled={index === 0}
                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                  aria-label="Move up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveClause(index, 'down')}
                  disabled={index === clauses.length - 1}
                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                  aria-label="Move down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <input
                type="text"
                value={clause.title}
                onChange={e => updateClause(clause.id, 'title', e.target.value)}
                className="flex-1 font-bold text-gray-900 bg-transparent border-none outline-none text-sm placeholder:text-gray-400"
                placeholder="Clause title"
              />
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleClause(clause.id)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {expandedClauses.has(clause.id) ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => removeClause(clause.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Clause content */}
            {expandedClauses.has(clause.id) && (
              <div className="p-5">
                <textarea
                  value={clause.content}
                  onChange={e => updateClause(clause.id, 'content', e.target.value)}
                  rows={6}
                  placeholder="Enter clause text..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-y leading-relaxed"
                />
              </div>
            )}
          </div>
        ))}

        <button
          onClick={addBlankClause}
          className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 flex items-center justify-center gap-2 text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/30 transition-all font-semibold text-sm"
        >
          <Plus className="w-4 h-4" />
          Add blank clause
        </button>
      </div>

      {/* Bottom save */}
      <div className="flex justify-end pt-2 pb-8">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          {isSaving ? 'Saving...' : 'Save as Draft'}
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NewContractPage() {
  const router = useRouter()
  const [step, setStep] = useState<'template' | 'builder'>('template')
  const [templateType, setTemplateType] = useState('')
  const [initialClauses, setInitialClauses] = useState<Omit<ClauseBlock, 'id'>[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [systemClauses, setSystemClauses] = useState<SystemClause[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [profileRes, clientsRes, clausesRes] = await Promise.all([
        supabase.from('user_profiles')
          .select('stripe_subscription_id, subscription_status')
          .eq('id', user.id).single(),
        supabase.from('clients')
          .select('id, name, company')
          .eq('user_id', user.id)
          .order('name', { ascending: true }),
        supabase.from('contract_clauses')
          .select('id, title, category, content')
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .order('category', { ascending: true }),
      ])

      const isSubscribed =
        !!profileRes.data?.stripe_subscription_id &&
        (profileRes.data?.subscription_status === 'active' ||
          profileRes.data?.subscription_status === 'trialing')

      setHasActiveSubscription(isSubscribed)
      setClients((clientsRes.data ?? []) as Client[])
      setSystemClauses((clausesRes.data ?? []) as SystemClause[])
      setIsLoading(false)
    }
    init()
  }, [router])

  const handleSelectTemplate = (type: string) => {
    const template = CONTRACT_TEMPLATES.find(t => t.type === type)
    setTemplateType(type)
    setInitialClauses(template?.clauses ?? [])
    setStep('builder')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!hasActiveSubscription) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/contracts"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 font-bold text-gray-700">
            <ArrowLeft className="w-4 h-4" />Back
          </Link>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">New Contract</h1>
        </div>
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-12 text-center">
          <p className="text-gray-600 mb-4">Subscribe to create contracts with e-signatures.</p>
          <Link href="/pricing" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all">
            View Plans
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/contracts"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all duration-200 font-bold text-gray-700 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Contracts</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">New Contract</h1>
      </div>

      {step === 'template' ? (
        <TemplateSelector onSelect={handleSelectTemplate} />
      ) : (
        <ContractBuilder
          templateType={templateType}
          initialClauses={initialClauses}
          clients={clients}
          systemClauses={systemClauses}
          onBack={() => setStep('template')}
        />
      )}
    </div>
  )
}