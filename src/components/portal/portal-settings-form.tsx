'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'

export interface PortalSettingsFormProps {
  userId: string
  businessName: string | null
  logoUrl: string | null
  brandColor: string
  subscriptionTier: string
  hasActiveSubscription: boolean
  portalSettings: {
    id: string
    slug: string
    is_enabled: boolean
    custom_message: string | null
  } | null
}

type ClientRow = { id: string; name: string; email: string | null; company: string | null }

function generateSlugFromBusiness(name: string | null): string {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 40)
}

function getPortalDisplayHost(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL || 'https://invonaut.app'
  try {
    return new URL(u).hostname
  } catch {
    return 'invonaut.app'
  }
}

function getPortalBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://invonaut.app').replace(/\/$/, '')
}

const SLUG_REGEX = /^[a-z0-9-]{3,40}$/

export default function PortalSettingsForm({
  userId,
  businessName,
  logoUrl,
  brandColor,
  subscriptionTier,
  hasActiveSubscription,
  portalSettings
}: PortalSettingsFormProps) {
  const router = useRouter()
  const portalExists = portalSettings !== null

  const initialSlug = useMemo(() => {
    if (portalSettings?.slug) return portalSettings.slug
    const g = generateSlugFromBusiness(businessName)
    return g.length >= 3 ? g : ''
  }, [portalSettings?.slug, businessName])

  const [slug, setSlug] = useState(initialSlug)
  const [isEnabled, setIsEnabled] = useState(portalSettings?.is_enabled ?? true)
  const [customMessage, setCustomMessage] = useState(
    portalSettings?.custom_message ?? ''
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [clients, setClients] = useState<ClientRow[]>([])
  const [sendingClientId, setSendingClientId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('clients')
        .select('id, name, email, company')
        .eq('user_id', userId)
        .order('name', { ascending: true })
      if (!cancelled && data) {
        setClients(data as ClientRow[])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const displayHost = getPortalDisplayHost()
  const urlPrefix = `${displayHost}/portal/`
  const fullPortalPreviewUrl = `${getPortalBaseUrl()}/portal/${slug || 'your-slug'}`

  const slugValid = SLUG_REGEX.test(slug)
  const slugError =
    slug.length > 0 && !slugValid
      ? 'Use 3–40 characters: lowercase letters, numbers, and hyphens only.'
      : ''

  const showBrandingPreview =
    subscriptionTier === 'professional' || subscriptionTier === 'business'

  async function handleSave() {
    if (!slugValid) {
      toast.error('Fix your portal URL before saving.')
      return
    }
    setIsSaving(true)
    setSaveStatus('idle')
    try {
      const res = await fetch('/api/portal/save-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          isEnabled,
          customMessage
        })
      })
      const data = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok || !data.success) {
        setSaveStatus('error')
        toast.error(data.error || 'Could not save settings')
        return
      }
      setSaveStatus('saved')
      toast.success('Portal settings saved')
      router.refresh()
    } catch {
      setSaveStatus('error')
      toast.error('Could not save settings')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSendLink(client: ClientRow) {
    setSendingClientId(client.id)
    try {
      const res = await fetch('/api/portal/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id })
      })
      const data = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Could not send link. Try again.')
        return
      }
      toast.success(`Portal link sent to ${client.name}`)
    } catch {
      toast.error('Could not send link. Try again.')
    } finally {
      setSendingClientId(null)
    }
  }

  return (
    <div className="space-y-8">
      <span className="sr-only">
        {hasActiveSubscription
          ? 'Your subscription is active.'
          : 'Your subscription is not active.'}
      </span>
      {/* Section A */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-8">
        <h2 className="text-xl font-black text-gray-900 tracking-tight mb-4">
          Portal status
        </h2>
        {portalExists ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                Active
              </span>
            </div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Your portal link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={fullPortalPreviewUrl}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 font-mono text-sm text-gray-800"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(fullPortalPreviewUrl)
                  toast.success('Portal link copied!')
                }}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold text-sm text-gray-700 whitespace-nowrap"
              >
                Copy link
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-600">
              Not set up
            </span>
            <p className="text-gray-600 font-medium">
              Save your portal settings below to create your client portal URL and
              share it with clients.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
          </label>
          <div>
            <p className="font-bold text-gray-900">
              {isEnabled ? 'Portal is active' : 'Portal is paused'}
            </p>
            <p className="text-sm text-gray-500">
              When paused, clients will see a &quot;Portal unavailable&quot; message
            </p>
          </div>
        </div>
      </div>

      {/* Section B */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-8">
        <h2 className="text-xl font-black text-gray-900 tracking-tight mb-6">
          Portal settings
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Your portal URL
            </label>
            <div className="flex flex-wrap items-stretch rounded-xl border-2 border-gray-200 overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
              <span className="inline-flex items-center px-3 bg-gray-100 text-gray-500 text-sm font-mono border-r-2 border-gray-200">
                {urlPrefix}
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                }
                maxLength={40}
                className="flex-1 min-w-[8rem] px-4 py-3 text-gray-900 font-mono text-sm outline-none"
                placeholder="your-business-name"
              />
            </div>
            {slugError ? (
              <p className="mt-2 text-sm text-red-600 font-medium">{slugError}</p>
            ) : null}
            <p className="mt-2 text-sm text-gray-500">
              This is the link you share with clients. Choose something recognizable
              like your business name.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Welcome message (optional)
            </label>
            <textarea
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Thanks for working with us. View your invoices and documents below."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
            <p className="mt-2 text-sm text-gray-500">
              Shown at the top of your client&apos;s portal page.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !slugValid}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Portal Settings'
            )}
          </button>
          {saveStatus === 'saved' ? (
            <p className="text-sm font-medium text-green-600 text-center">
              Settings saved successfully.
            </p>
          ) : null}
          {saveStatus === 'error' ? (
            <p className="text-sm font-medium text-red-600 text-center">
              Something went wrong. Try again.
            </p>
          ) : null}
        </div>
      </div>

      {/* Section C */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-8">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">
          Send portal access to clients
        </h2>
        <p className="text-gray-600 font-medium mt-2 mb-6">
          Each client gets a secure magic link valid for 7 days. No account needed.
        </p>
        {clients.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-gray-600 font-medium mb-4">No clients yet.</p>
            <Link
              href="/dashboard/clients/new"
              className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl transition-all"
            >
              Add your first client
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border-2 border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-semibold text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">
                      {c.company || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.email || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSendLink(c)}
                        disabled={sendingClientId === c.id || !c.email}
                        className="inline-flex items-center justify-center gap-2 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
                      >
                        {sendingClientId === c.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        Send access link
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section D */}
      {showBrandingPreview ? (
        <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl border-2 border-blue-100 shadow-lg p-8">
          <h2 className="text-xl font-black text-gray-900 tracking-tight mb-2">
            Portal branding
          </h2>
          <p className="text-gray-700 font-medium mb-6">
            Your clients will see your logo and brand colors in their portal.
          </p>
          <div className="max-w-sm rounded-xl border-2 border-gray-200 shadow-md overflow-hidden bg-white">
            <div
              className="px-4 py-3 flex items-center gap-2"
              style={{ backgroundColor: brandColor }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className="w-8 h-8 rounded object-contain bg-white/10"
                />
              ) : (
                <span className="text-white font-black text-sm truncate">
                  {businessName || 'Your business'}
                </span>
              )}
            </div>
            <div className="p-4 text-sm text-gray-700 font-medium">
              Invoice INV-00042 · $2,400.00 · Due Mar 28
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-lg p-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="rounded-full bg-gray-100 p-3 w-fit">
            <Lock className="w-6 h-6 text-gray-500" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900">
              White label branding is available on Professional and Business plans.
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-gray-300 bg-white font-bold text-gray-800 hover:bg-gray-50 transition-all w-fit"
          >
            View plans
          </Link>
        </div>
      )}
    </div>
  )
}