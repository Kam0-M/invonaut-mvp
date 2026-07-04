'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Loader2, Lock, CheckCircle2, Copy, ExternalLink,
  Mail, Globe, Shield, Palette,
} from 'lucide-react'
import { toast } from 'sonner'

export interface PortalSettingsFormProps {
  userId:               string
  businessName:         string | null
  logoUrl:              string | null
  brandColor:           string
  subscriptionTier:     string
  hasActiveSubscription:boolean
  portalSettings: {
    id:             string
    slug:           string
    is_enabled:     boolean
    custom_message: string | null
  } | null
}

type ClientRow = { id: string; name: string; email: string | null; company: string | null }

function generateSlug(name: string | null): string {
  if (!name) return ''
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40)
}

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://invonaut.app').replace(/\/$/, '')
}

const SLUG_REGEX = /^[a-z0-9-]{3,40}$/

function avatarColor(name: string) {
  const palette = ['bg-blue-100 text-blue-700','bg-teal-100 text-teal-700','bg-sky-100 text-sky-700','bg-amber-100 text-amber-700']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

export default function PortalSettingsForm({
  userId, businessName, logoUrl, brandColor, subscriptionTier,
  hasActiveSubscription, portalSettings,
}: PortalSettingsFormProps) {
  const router = useRouter()
  const portalExists = portalSettings !== null
  const isPro = subscriptionTier === 'professional' || subscriptionTier === 'business'

  const initialSlug = useMemo(() => {
    if (portalSettings?.slug) return portalSettings.slug
    const g = generateSlug(businessName)
    return g.length >= 3 ? g : ''
  }, [portalSettings?.slug, businessName])

  const [slug,          setSlug]          = useState(initialSlug)
  const [isEnabled,     setIsEnabled]     = useState(portalSettings?.is_enabled ?? true)
  const [customMessage, setCustomMessage] = useState(portalSettings?.custom_message ?? '')
  const [isSaving,      setIsSaving]      = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [clients,       setClients]       = useState<ClientRow[]>([])
  const [sendingId,     setSendingId]     = useState<string | null>(null)
  const [linksCopied,   setLinksCopied]   = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const sb = createClient()
      const { data } = await sb.from('clients').select('id, name, email, company')
        .eq('user_id', userId).order('name', { ascending: true })
      if (!cancelled && data) setClients(data as ClientRow[])
    })()
    return () => { cancelled = true }
  }, [userId])

  const slugValid = SLUG_REGEX.test(slug)
  const slugError = slug.length > 0 && !slugValid
    ? 'Use 3–40 characters: lowercase letters, numbers, and hyphens only.' : ''
  const portalUrl = `${getBaseUrl()}/portal/${slug || 'your-slug'}`
  const host      = new URL(getBaseUrl()).hostname

  async function handleSave() {
    if (!slugValid) { toast.error('Fix your portal URL before saving.'); return }
    setIsSaving(true); setSaved(false)
    try {
      const res  = await fetch('/api/portal/save-settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, isEnabled, customMessage }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { toast.error(data.error || 'Could not save settings'); return }
      setSaved(true); toast.success('Portal settings saved'); router.refresh()
    } catch { toast.error('Could not save settings')
    } finally { setIsSaving(false) }
  }

  async function handleSendLink(client: ClientRow) {
    setSendingId(client.id)
    try {
      const res  = await fetch('/api/portal/send-magic-link', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { toast.error(data.error || 'Could not send link.'); return }
      toast.success(`Portal link sent to ${client.name}`)
    } catch { toast.error('Could not send link.')
    } finally { setSendingId(null) }
  }

  function copyLink() {
    navigator.clipboard.writeText(portalUrl)
    setLinksCopied(true)
    toast.success('Portal link copied!')
    setTimeout(() => setLinksCopied(false), 2000)
  }

  return (
    <div className="space-y-4">

      {/* ── Status + URL ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-sm transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900">Portal Status</h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Control who can access your portal</p>
            </div>
          </div>
          {/* Toggle */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer"
              checked={isEnabled} onChange={e => setIsEnabled(e.target.checked)} />
            <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer
              peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:start-0.5
              after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
          </label>
        </div>

        {/* URL bar */}
        <div className="flex items-stretch rounded-xl border border-gray-200 overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 mb-2">
          <span className="inline-flex items-center px-3 bg-gray-50 text-gray-400 text-xs font-mono border-r-2 border-gray-200 flex-shrink-0">
            {host}/portal/
          </span>
          <input
            type="text"
            value={slug}
            onChange={e => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setSaved(false) }}
            maxLength={40}
            className="flex-1 min-w-0 px-3 py-2.5 text-sm font-mono text-gray-900 outline-none bg-white"
            placeholder="your-business-name"
          />
          <button onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 border-l-2 border-gray-200 text-xs font-bold text-gray-600 transition-colors flex-shrink-0">
            {linksCopied
              ? <><CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />Copied</>
              : <><Copy className="w-3.5 h-3.5" />Copy</>}
          </button>
        </div>
        {slugError && <p className="text-xs text-red-500 font-medium mb-2">{slugError}</p>}
        <p className="text-xs text-gray-400 font-medium">
          {isEnabled ? 'Portal is live — clients can access their link' : 'Portal is paused — clients will see an unavailable message'}
        </p>
      </div>

      {/* ── Settings ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-sm transition-all">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black text-gray-900">Portal Settings</h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Customize what your clients see</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
              Welcome message <span className="text-gray-400 normal-case font-normal">(optional)</span>
            </label>
            <textarea rows={3} value={customMessage}
              onChange={e => { setCustomMessage(e.target.value); setSaved(false) }}
              placeholder="Thanks for working with us. View your invoices and documents below."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-300
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
            />
            <p className="text-xs text-gray-400 mt-1.5">Shown at the top of your client's portal page.</p>
          </div>

          <button type="button" onClick={handleSave} disabled={isSaving || !slugValid}
            className="w-full inline-flex items-center justify-center gap-2 btn-primary px-6 py-3 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {isSaving
              ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
              : saved
              ? <><CheckCircle2 className="w-4 h-4" />Saved</>
              : 'Save Portal Settings'}
          </button>
        </div>
      </div>

      {/* ── Send access to clients ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-all">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900">Send Portal Access</h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Secure magic link · 7-day access · no account needed</p>
            </div>
          </div>
          {clients.length > 0 && (
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
              {clients.length} client{clients.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {clients.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-400 mb-1">No clients yet</p>
            <p className="text-xs text-gray-300 font-medium mb-4">Add a client first, then send them portal access</p>
            <Link href="/dashboard/clients/new"
              className="inline-flex items-center gap-2 btn-primary px-4 py-2 rounded-xl text-sm">
              Add first client
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {clients.map(client => {
              const av       = avatarColor(client.name)
              const initials = client.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
              const isSending = sendingId === client.id
              return (
                <div key={client.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-xs ${av}`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{client.name}</p>
                    <p className="text-xs text-gray-400 truncate">{client.email || 'No email'}</p>
                  </div>
                  <button
                    onClick={() => handleSendLink(client)}
                    disabled={isSending || !client.email}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600
                               hover:bg-blue-50 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
                  >
                    {isSending
                      ? <><Loader2 className="w-3 h-3 animate-spin" />Sending…</>
                      : <><Mail className="w-3 h-3" />Send link</>}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Branding preview ──────────────────────────────────────────────── */}
      {/* Checklist #41: was tier-only (isPro) — a canceled Pro/Business
          user saw the editable branding preview instead of the
          upgrade-lock screen. hasActiveSubscription was already an
          accepted prop here but never actually used. */}
      {isPro && hasActiveSubscription ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-sm transition-all">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Palette className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900">Portal Branding</h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Your clients see your logo and colors</p>
            </div>
          </div>
          {/* Branded portal preview */}
          <div className="max-w-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: brandColor }}>
              {logoUrl ? (
                <img src={logoUrl} alt="" className="w-7 h-7 rounded object-contain bg-white/10" />
              ) : (
                <span className="text-white font-black text-sm">{businessName || 'Your business'}</span>
              )}
            </div>
            <div className="p-4 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">INV-00042</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">Sent</span>
              </div>
              <p className="text-sm font-black text-gray-900">$2,400.00</p>
              <p className="text-xs text-gray-400">Due Mar 28, 2025</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 font-medium mt-3">
            Update your logo and colors in <Link href="/dashboard/settings" className="text-blue-600 hover:text-blue-700 font-bold">Settings → Branding</Link>
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Lock className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">White label branding — Professional & Business</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Your logo and colors on every client portal page</p>
          </div>
          <Link href="/pricing"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0">
            Upgrade →
          </Link>
        </div>
      )}
    </div>
  )
}
