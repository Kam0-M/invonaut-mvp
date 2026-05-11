'use client'
// src/app/dashboard/payments/new/page.tsx

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter }     from 'next/navigation'
import { pushHrefThenRefreshServer } from '@/lib/router-refresh'
import { createClient }  from '@/lib/supabase/client'
import { toast }         from 'sonner'
import Link              from 'next/link'
import { Input }         from '@/components/ui/input'
import {
  ArrowLeft, Save, Loader2, Search, Check, X,
  Paperclip, Plus, Banknote,
} from 'lucide-react'
import SubscriptionRequired from '@/components/subscription-required'

type Client   = { id: string; name: string; company: string | null }
type Category = { id: string; name: string; color: string }

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
const ACCEPTED_ATTACHMENT_EXT = '.pdf,.docx,.xlsx,.png,.jpg,.jpeg'

const PAYMENT_TYPES   = [
  { value: 'cash',   label: 'Cash',    desc: 'Serve now, pay now' },
  { value: 'prepay', label: 'Prepay',  desc: 'Pay now, serve later' },
]
const PAYMENT_METHODS = [
  { value: 'cash',   label: 'Cash'         },
  { value: 'bank',   label: 'Bank Transfer' },
  { value: 'mobile', label: 'Mobile Money'  },
  { value: 'pos',    label: 'POS'           },
]

export default function NewPaymentPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isLoading,             setIsLoading]             = useState(true)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [isSaving,              setIsSaving]              = useState(false)

  // Data
  const [clients,    setClients]    = useState<Client[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  // Form fields
  const [amount,         setAmount]         = useState('')
  const [paymentDate,    setPaymentDate]     = useState('')
  const [paymentType,    setPaymentType]     = useState<'cash' | 'prepay'>('cash')
  const [paymentMethod,  setPaymentMethod]   = useState<'cash' | 'bank' | 'mobile' | 'pos'>('cash')
  const [categoryId,     setCategoryId]      = useState('')
  const [description,    setDescription]     = useState('')
  const [notes,          setNotes]           = useState('')
  const [attachmentFile, setAttachmentFile]  = useState<File | null>(null)
  const [attachmentError,setAttachmentError] = useState<string | null>(null)

  // Client search (optional)
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [clientId,          setClientId]          = useState('')

  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return clients
    const q = clientSearchQuery.toLowerCase()
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) || (c.company && c.company.toLowerCase().includes(q))
    )
  }, [clients, clientSearchQuery])
  const selectedClient      = clients.find(c => c.id === clientId)
  const shouldShowDropdown  = clientSearchQuery.trim().length > 0 && filteredClients.length > 0

  // ── Load ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('stripe_subscription_id, subscription_status')
        .eq('id', user.id)
        .single()

      setHasActiveSubscription(
        !!profile?.stripe_subscription_id &&
        (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')
      )

      const [{ data: clientData }, { data: catData }] = await Promise.all([
        supabase.from('clients').select('id, name, company').eq('user_id', user.id).order('name'),
        supabase.from('revenue_categories').select('id, name, color').eq('user_id', user.id).order('name'),
      ])
      setClients(clientData || [])
      setCategories(catData || [])

      // Default date to today
      setPaymentDate(new Date().toISOString().split('T')[0])
      setIsLoading(false)
    }
    load()
  }, [router])

  // ── Attachment ────────────────────────────────────────────────────────────────

  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachmentError('File must be under 10MB.')
      e.target.value = ''
      return
    }
    setAttachmentError(null)
    setAttachmentFile(file)
  }

  const removeAttachment = () => {
    setAttachmentFile(null)
    setAttachmentError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) { toast.error('Amount must be greater than 0'); return }
    if (!categoryId) { toast.error('Please select a revenue category'); return }
    if (!description.trim()) { toast.error('Description is required'); return }
    if (!paymentDate) { toast.error('Payment date is required'); return }

    setIsSaving(true)
    const tid = toast.loading('Saving payment…')

    try {
      const fd = new FormData()
      fd.append('amount',              amount)
      fd.append('payment_type',        paymentType)
      fd.append('payment_method',      paymentMethod)
      fd.append('revenue_category_id', categoryId)
      fd.append('description',         description.trim())
      fd.append('notes',               notes.trim())
      fd.append('payment_date',        paymentDate)
      if (clientId) fd.append('client_id', clientId)
      if (attachmentFile) fd.append('attachment', attachmentFile)

      const res  = await fetch('/api/direct-payments/create', { method: 'POST', body: fd })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      toast.success('Payment logged!', { id: tid })
      pushHrefThenRefreshServer(router, '/dashboard/payments')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save payment', { id: tid })
    } finally {
      setIsSaving(false)
    }
  }

  // ── UI helpers ────────────────────────────────────────────────────────────────

  const toggleBtn = (active: boolean) =>
    `flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
      active
        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
    }`

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  )

  if (!hasActiveSubscription) return <SubscriptionRequired />

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Link href="/dashboard/payments" className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors mb-2 block">
          ← Payments
        </Link>
        <h1 className="text-2xl font-black text-gray-900">Log Payment</h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="space-y-8">

          {/* Amount + Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                <Input
                  type="number" min="0.01" step="0.01" placeholder="0.00"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  disabled={isSaving}
                  className="h-12 text-base pl-8 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
                disabled={isSaving}
                className="h-12 text-base border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
              />
            </div>
          </div>

          {/* Payment Type toggle */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">
              Payment Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {PAYMENT_TYPES.map(t => (
                <button key={t.value} type="button"
                  onClick={() => setPaymentType(t.value as 'cash' | 'prepay')}
                  disabled={isSaving}
                  className={toggleBtn(paymentType === t.value)}>
                  <div>{t.label}</div>
                  <div className={`text-xs font-medium mt-0.5 ${paymentType === t.value ? 'text-blue-100' : 'text-gray-400'}`}>
                    {t.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method toggle */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {PAYMENT_METHODS.map(m => (
                <button key={m.value} type="button"
                  onClick={() => setPaymentMethod(m.value as 'cash' | 'bank' | 'mobile' | 'pos')}
                  disabled={isSaving}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                    paymentMethod === m.value
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Revenue Category */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">
              Revenue Category <span className="text-red-500">*</span>
            </label>
            {categories.length === 0 ? (
              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-sm text-amber-800 font-medium flex-1">
                  You need at least one revenue category before logging a payment.
                </p>
                <a href="/dashboard/settings" target="_blank" rel="noopener noreferrer"
                  className="text-sm font-bold text-blue-600 hover:underline flex-shrink-0 inline-flex items-center gap-1">
                  <Plus className="w-3 h-3" />Create one
                </a>
              </div>
            ) : (
              <div className="relative">
                {categoryId && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none z-10"
                    style={{ backgroundColor: categories.find(c => c.id === categoryId)?.color || '#6366F1' }} />
                )}
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  disabled={isSaving}
                  className={`w-full h-12 text-base border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl bg-white text-gray-900 focus:outline-none ${categoryId ? 'pl-8 pr-4' : 'px-4'}`}>
                  <option value="">Select a category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">
              Description <span className="text-red-500">*</span>
            </label>
            <Input
              type="text" placeholder="What was sold or provided?"
              value={description} onChange={e => setDescription(e.target.value)}
              disabled={isSaving}
              className="h-12 text-base border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
            />
          </div>

          {/* Client (optional) */}
          <div className="relative">
            <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">
              Client <span className="text-xs font-medium text-gray-400 normal-case">(Optional)</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                type="text" autoComplete="off"
                placeholder={selectedClient
                  ? `${selectedClient.name}${selectedClient.company ? ` (${selectedClient.company})` : ''}`
                  : 'Search clients…'}
                value={clientSearchQuery}
                onChange={e => setClientSearchQuery(e.target.value)}
                disabled={isSaving}
                className={`h-12 pl-10 pr-10 text-base border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl ${selectedClient && !clientSearchQuery ? 'font-medium text-green-700' : ''}`}
              />
              {/* Show Check when client selected and not actively searching */}
              {selectedClient && !clientSearchQuery && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600 pointer-events-none" />
              )}
              {/* Show X only when user is actively typing a search query */}
              {clientSearchQuery && (
                <button type="button" onClick={() => { setClientSearchQuery(''); setClientId('') }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {shouldShowDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-md max-h-52 overflow-y-auto">
                {filteredClients.map(c => (
                  <button key={c.id} type="button"
                    onClick={() => { setClientId(c.id); setClientSearchQuery('') }}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0">
                    <p className="text-sm font-bold text-gray-900">{c.name}</p>
                    {c.company && <p className="text-xs text-gray-500">{c.company}</p>}
                  </button>
                ))}
              </div>
            )}
            {selectedClient && !clientSearchQuery && (
              <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" />Client: {selectedClient.name}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">
              Notes <span className="text-xs font-medium text-gray-400 normal-case">(Optional)</span>
            </label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              disabled={isSaving}
              className="w-full text-base text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl resize-none p-3 focus:outline-none bg-white"
              placeholder="Any additional context…"
            />
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">
              Attachment <span className="text-xs font-medium text-gray-400 normal-case">(Optional — receipt or proof of payment)</span>
            </label>
            {attachmentFile ? (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Paperclip className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{attachmentFile.name}</p>
                  <p className="text-xs text-gray-500">{(attachmentFile.size / 1024).toFixed(0)} KB</p>
                </div>
                <button type="button" onClick={removeAttachment} disabled={isSaving}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div onClick={() => !isSaving && fileInputRef.current?.click()}
                className="flex items-center gap-4 p-5 rounded-xl border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Paperclip className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700">Attach a file</p>
                  <p className="text-xs text-gray-400">PDF, DOCX, XLSX, PNG, JPG — max 10MB</p>
                </div>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept={ACCEPTED_ATTACHMENT_EXT}
              onChange={handleAttachmentSelect} className="hidden" />
            {attachmentError && <p className="mt-2 text-xs font-bold text-red-600">{attachmentError}</p>}
          </div>

          {/* Prepay notice */}
          {paymentType === 'prepay' && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm font-bold text-blue-800">Prepaid — service pending</p>
              <p className="text-xs text-blue-600 font-medium mt-1">
                This payment will be recorded as revenue today. Remember to deliver the service or product your client has paid for.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
            <Link href="/dashboard/payments"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-400 transition-all">
              Cancel
            </Link>
            <button type="button" onClick={handleSave} disabled={isSaving || categories.length === 0}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving
                ? <><Loader2 className="w-5 h-5 animate-spin" />Saving…</>
                : <><Save className="w-5 h-5" />Log Payment</>}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
