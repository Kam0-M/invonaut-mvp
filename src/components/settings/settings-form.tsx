'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LogoUploader  from './logo-uploader'
import ColorPicker   from './color-picker'
import AccountInfo   from './account-info'
import Link          from 'next/link'
import { AlertCircle, CheckCircle2, CreditCard, Lock, Sparkles, Globe, Receipt, Check, Palette } from 'lucide-react'

// ─── Color scheme presets ─────────────────────────────────────────────────────
export type ColorScheme = 'classic' | 'two-tone' | 'minimal' | 'bold'

interface SchemeConfig {
  id: ColorScheme
  label: string
  desc: string
  headerStyle: 'full' | 'border' | 'none'
  headerTextColor: 'white' | 'primary'
  labelColor: 'primary' | 'secondary'
  totalBarColor: 'primary' | 'secondary' | 'gradient'
}

const SCHEMES: SchemeConfig[] = [
  {
    id: 'classic', label: 'Classic', desc: 'Primary colour everywhere',
    headerStyle: 'full', headerTextColor: 'white', labelColor: 'primary', totalBarColor: 'primary',
  },
  {
    id: 'two-tone', label: 'Two-tone', desc: 'Primary header, secondary accents',
    headerStyle: 'full', headerTextColor: 'white', labelColor: 'secondary', totalBarColor: 'secondary',
  },
  {
    id: 'minimal', label: 'Minimal', desc: 'White header, subtle accents',
    headerStyle: 'border', headerTextColor: 'primary', labelColor: 'primary', totalBarColor: 'primary',
  },
  {
    id: 'bold', label: 'Bold', desc: 'Primary header, gradient total',
    headerStyle: 'full', headerTextColor: 'white', labelColor: 'primary', totalBarColor: 'gradient',
  },
]

// ─── Invoice preview ──────────────────────────────────────────────────────────
function InvoicePreview({
  logoUrl, primaryColor, secondaryColor, businessName, scheme
}: {
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  businessName: string
  scheme: ColorScheme
}) {
  const cfg = SCHEMES.find(s => s.id === scheme) || SCHEMES[0]

  const labelColor  = cfg.labelColor === 'primary' ? primaryColor : secondaryColor
  const totalBg     = cfg.totalBarColor === 'gradient'
    ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
    : cfg.totalBarColor === 'primary' ? primaryColor : secondaryColor

  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', fontFamily: "'DM Sans',sans-serif", fontSize: 12, maxWidth: 360, background: '#fff' }}>
      {/* Header */}
      {cfg.headerStyle === 'full' && (
        <div style={{ background: primaryColor, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {logoUrl
            ? <img src={logoUrl} alt="" style={{ height: 26, maxWidth: 80, objectFit: 'contain' }} />
            : <span style={{ fontWeight: 800, fontSize: 13, color: '#fff', letterSpacing: '-.01em' }}>{businessName || 'Your Business'}</span>}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>INVOICE</div>
            <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 10 }}>#INV-0042</div>
          </div>
        </div>
      )}
      {cfg.headerStyle === 'border' && (
        <div style={{ borderBottom: `3px solid ${primaryColor}`, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          {logoUrl
            ? <img src={logoUrl} alt="" style={{ height: 26, maxWidth: 80, objectFit: 'contain' }} />
            : <span style={{ fontWeight: 800, fontSize: 13, color: '#0A0A0A' }}>{businessName || 'Your Business'}</span>}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: primaryColor }}>INVOICE</div>
            <div style={{ color: '#94A3B8', fontSize: 10 }}>#INV-0042</div>
          </div>
        </div>
      )}

      {/* Body */}
      <div style={{ padding: '14px 18px' }}>
        {/* Bill to row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8', marginBottom: 3 }}>Bill To</div>
            <div style={{ fontWeight: 600, color: '#0A0A0A', fontSize: 11 }}>Sample Client Inc.</div>
            <div style={{ color: '#64748B', fontSize: 10 }}>client@example.com</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8', marginBottom: 3 }}>Due Date</div>
            <div style={{ fontWeight: 600, color: '#0A0A0A', fontSize: 11 }}>
              {new Date(Date.now() + 30 * 864e5).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
          <thead>
            <tr style={{ borderBottom: `1.5px solid ${labelColor}` }}>
              <th style={{ textAlign: 'left', padding: '4px 0', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: labelColor }}>Description</th>
              <th style={{ textAlign: 'right', padding: '4px 0', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: labelColor }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ padding: '5px 0', color: '#374151', fontSize: 11 }}>Design services · 8 hrs</td>
              <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600, color: '#0A0A0A', fontSize: 11 }}>$800.00</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 0', color: '#374151', fontSize: 11 }}>Strategy consultation</td>
              <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600, color: '#0A0A0A', fontSize: 11 }}>$350.00</td>
            </tr>
          </tbody>
        </table>

        {/* Subtotal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#64748B', fontSize: 11 }}>Subtotal</span>
          <span style={{ fontWeight: 600, fontSize: 11 }}>$1,150.00</span>
        </div>

        {/* Total bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: totalBg, borderRadius: 7 }}>
          <span style={{ fontWeight: 800, color: '#fff', fontSize: 12 }}>Total Due</span>
          <span style={{ fontWeight: 800, color: '#fff', fontSize: 12 }}>$1,150.00</span>
        </div>
      </div>
    </div>
  )
}

// ─── Scheme swatch ────────────────────────────────────────────────────────────
function SchemeSwatch({ cfg, primary, secondary, active, onClick }: {
  cfg: SchemeConfig; primary: string; secondary: string; active: boolean; onClick: () => void
}) {
  const labelColor = cfg.labelColor === 'primary' ? primary : secondary
  const totalBg    = cfg.totalBarColor === 'gradient'
    ? `linear-gradient(135deg, ${primary}, ${secondary})`
    : cfg.totalBarColor === 'primary' ? primary : secondary

  return (
    <button type="button" onClick={onClick} className={`text-left transition-all rounded-xl overflow-hidden ${active ? 'ring-2 ring-[#0055FF] ring-offset-2' : 'hover:ring-1 hover:ring-gray-200 hover:ring-offset-1'}`}>
      {/* Mini invoice preview */}
      <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', background: '#fff', fontSize: 10 }}>
        {cfg.headerStyle === 'full' ? (
          <div style={{ background: primary, padding: '6px 8px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, color: '#fff', fontSize: 9 }}>Your Business</span>
            <span style={{ fontWeight: 700, color: 'rgba(255,255,255,.7)', fontSize: 9 }}>INV</span>
          </div>
        ) : (
          <div style={{ borderBottom: `2px solid ${primary}`, padding: '6px 8px', display: 'flex', justifyContent: 'space-between', background: '#fff' }}>
            <span style={{ fontWeight: 700, color: '#0A0A0A', fontSize: 9 }}>Your Business</span>
            <span style={{ fontWeight: 700, color: primary, fontSize: 9 }}>INV</span>
          </div>
        )}
        <div style={{ padding: '6px 8px' }}>
          <div style={{ height: 1, background: labelColor, opacity: 0.8, marginBottom: 4 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: '#94A3B8' }}>Services</span><span style={{ fontWeight: 600, color: '#374151' }}>$800</span>
          </div>
          <div style={{ background: totalBg, borderRadius: 4, padding: '3px 5px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, color: '#fff' }}>Total</span>
            <span style={{ fontWeight: 700, color: '#fff' }}>$800</span>
          </div>
        </div>
      </div>
      <div className="pt-2 px-0.5">
        <p className={`text-xs font-bold ${active ? 'text-[#0055FF]' : 'text-gray-700'}`}>{cfg.label}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{cfg.desc}</p>
      </div>
    </button>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface SettingsFormProps {
  userId: string
  currentLogoUrl: string | null
  currentBrandColor: string
  currentSecondaryBrandColor: string
  invoiceColorScheme: ColorScheme
  subscriptionTier: string
  hasActiveSubscription: boolean
  hasEverSubscribed: boolean
  subscriptionStatus: string
  userProfile: { full_name: string | null; email: string; business_name: string | null; address: string | null }
  currency: string
  currencySymbol: string
  taxLabel: string
  taxNumber: string | null
  country: string
}

export default function SettingsForm({
  userId, currentLogoUrl, currentBrandColor, currentSecondaryBrandColor,
  invoiceColorScheme: initScheme,
  subscriptionTier, hasActiveSubscription, hasEverSubscribed, subscriptionStatus,
  userProfile, currency: initCurrency,
  taxLabel: initTaxLabel, taxNumber: initTaxNumber, country: initCountry,
}: SettingsFormProps) {
  const router = useRouter()

  // Branding state
  const [logoUrl,             setLogoUrl]            = useState(currentLogoUrl)
  const [brandColor,          setBrandColor]         = useState(currentBrandColor)
  const [secondaryBrandColor, setSecondaryBrandColor]= useState(currentSecondaryBrandColor)
  const [colorScheme,         setColorScheme]        = useState<ColorScheme>(initScheme)

  // Regional state
  const [currency,  setCurrency]  = useState(initCurrency)
  const [taxLabel,  setTaxLabel]  = useState(initTaxLabel)
  const [taxNumber, setTaxNumber] = useState(initTaxNumber || '')
  const [country,   setCountry]   = useState(initCountry)

  // Save state
  const [hasUnsavedChanges, setHasUnsavedChanges]  = useState(false)
  const [hasAccountChanges, setHasAccountChanges]  = useState(false)
  const [isSaving,          setIsSaving]           = useState(false)
  const [saveStatus,        setSaveStatus]         = useState<'idle'|'saving'|'saved'|'error'>('idle')

  const isPro = subscriptionTier === 'professional' || subscriptionTier === 'business'

  useEffect(() => {
    const changed =
      logoUrl !== currentLogoUrl ||
      brandColor !== currentBrandColor ||
      secondaryBrandColor !== currentSecondaryBrandColor ||
      colorScheme !== initScheme ||
      currency !== initCurrency ||
      taxLabel !== initTaxLabel ||
      taxNumber !== (initTaxNumber || '') ||
      country !== initCountry ||
      hasAccountChanges
    setHasUnsavedChanges(changed)
  }, [logoUrl, brandColor, secondaryBrandColor, colorScheme, currency, taxLabel, taxNumber, country,
      hasAccountChanges, currentLogoUrl, currentBrandColor, currentSecondaryBrandColor, initScheme,
      initCurrency, initTaxLabel, initTaxNumber, initCountry])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])

  const handleColorsChanged = (primary: string, secondary: string) => {
    setBrandColor(primary); setSecondaryBrandColor(secondary)
  }

  const handleSave = async () => {
    if (!hasUnsavedChanges) return
    setIsSaving(true); setSaveStatus('saving')
    try {
      const supabase = createClient()
      const { error } = await supabase.from('user_profiles').update({
        logo_url:              logoUrl,
        brand_color:           brandColor,
        secondary_brand_color: secondaryBrandColor,
        invoice_color_scheme:  colorScheme,
        currency,
        tax_label:             taxLabel,
        tax_number:            taxNumber.trim() || null,
        country,
      }).eq('id', userId)
      if (error) throw error
      setSaveStatus('saved')
      setHasUnsavedChanges(false)
      setTimeout(() => setSaveStatus('idle'), 3000)
      router.refresh()
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally { setIsSaving(false) }
  }

  return (
    <div className="space-y-5">

      {/* ── Account information ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-[#F8FAFF] rounded-xl flex items-center justify-center border border-gray-100">
            <svg className="w-4 h-4 text-[#0055FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-[#0055FF] uppercase tracking-widest mb-0.5">Profile</p>
            <h2 className="text-base font-black text-gray-900">Account information</h2>
          </div>
        </div>
        <AccountInfo
          userId={userId}
          email={userProfile.email}
          fullName={userProfile.full_name}
          businessName={userProfile.business_name}
          address={userProfile.address}
          onUnsavedChanges={setHasAccountChanges}
        />
      </div>

      {/* ── Current plan ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-[#F8FAFF] rounded-xl flex items-center justify-center border border-gray-100">
            <CreditCard className="w-4 h-4 text-[#0055FF]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#0055FF] uppercase tracking-widest mb-0.5">Subscription</p>
            <h2 className="text-base font-black text-gray-900">Current plan</h2>
          </div>
        </div>

        {hasActiveSubscription ? (
          <div className="space-y-4">
            {/* Plan summary row */}
            <div className="flex items-center justify-between p-4 bg-[#F8FAFF] rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                  background: subscriptionTier === 'business' ? 'var(--inv-teal)' : subscriptionTier === 'professional' ? 'var(--inv-blue)' : 'var(--inv-orange)'
                }}>
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 capitalize">{subscriptionTier}</p>
                  <p className="text-xs text-gray-500 font-medium">
                    {subscriptionStatus === 'trialing' ? 'Free trial active' : 'Active subscription'}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                subscriptionStatus === 'active'   ? 'bg-[#00C4A0]/10 text-[#00a889] border border-[#00C4A0]/25' :
                subscriptionStatus === 'trialing' ? 'bg-blue-50 text-blue-700 border border-blue-200'           :
                'bg-gray-100 text-gray-500'
              }`}>
                {subscriptionStatus === 'active' ? '✓ Active' : subscriptionStatus === 'trialing' ? 'Trial' : subscriptionStatus}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Link href="/dashboard/billing"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl btn-primary text-sm">
                <CreditCard className="w-4 h-4" />Manage subscription
              </Link>
              {subscriptionTier !== 'business' && (
                <Link href="/pricing"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                  <Sparkles className="w-4 h-4 text-[#0055FF]" />Upgrade plan
                </Link>
              )}
            </div>
          </div>
        ) : hasEverSubscribed ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-black text-gray-900 mb-1">No active subscription</p>
            <p className="text-xs text-gray-500 font-medium mb-4">Your data is safe. Resubscribe to pick up where you left off.</p>
            <Link href="/pricing" className="inline-flex items-center gap-2 btn-primary px-5 py-2.5 rounded-xl text-sm">
              <Sparkles className="w-4 h-4" />Reactivate subscription
            </Link>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-5 h-5 text-[#0055FF]" />
            </div>
            <p className="text-sm font-black text-gray-900 mb-1">Start your free trial</p>
            <p className="text-xs text-gray-500 font-medium mb-4">14 days free on any plan. No credit card required.</p>
            <Link href="/pricing" className="inline-flex items-center gap-2 btn-primary px-5 py-2.5 rounded-xl text-sm">
              Start free trial
            </Link>
          </div>
        )}
      </div>

      {/* ── Regional — coming later ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 opacity-55 pointer-events-none select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#F8FAFF] rounded-xl flex items-center justify-center border border-gray-100">
              <Globe className="w-4 h-4 text-[#00C4A0]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#00C4A0] uppercase tracking-widest mb-0.5">Coming later</p>
              <h2 className="text-base font-black text-gray-900">Regional & Tax Settings</h2>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-[#F8FAFF] text-[#0055FF] rounded-full border border-blue-100 flex-shrink-0">In progress</span>
        </div>
        <p className="text-xs text-gray-400 font-medium mt-3 ml-[48px] leading-relaxed">
          Multi-currency support and regional tax configuration are in progress. All invoices currently issue in USD.
        </p>
      </div>

      {/* ── White-label branding ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-[#F8FAFF] rounded-xl flex items-center justify-center border border-gray-100">
            <Receipt className="w-4 h-4 text-[#0055FF]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#0055FF] uppercase tracking-widest mb-0.5">Branding</p>
            <h2 className="text-base font-black text-gray-900">White-label branding</h2>
          </div>
        </div>

        {!isPro ? (
          <div className="bg-[#F8FAFF] border border-blue-100 rounded-xl p-6 text-center">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Lock className="w-5 h-5 text-[#0055FF]" />
            </div>
            <p className="text-sm font-black text-gray-900 mb-1">Professional feature</p>
            <p className="text-xs text-gray-500 font-medium mb-4 max-w-xs mx-auto">
              Upgrade to Professional or Business to put your logo and brand colours on every invoice and client-facing page.
            </p>
            <button type="button" onClick={() => window.location.href = '/pricing'}
              className="btn-primary px-5 py-2.5 rounded-xl text-sm">
              Upgrade to Professional — $59/mo
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Logo */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Company logo</p>
              <LogoUploader userId={userId} currentLogoUrl={logoUrl} onLogoUploaded={setLogoUrl} />
              <p className="text-xs text-gray-400 mt-2">PNG, JPG, SVG, WebP · Max 10MB</p>
            </div>

            {/* Colors */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Brand colours</p>
              <ColorPicker
                userId={userId}
                currentPrimaryColor={brandColor}
                currentSecondaryColor={secondaryBrandColor}
                onColorsChanged={handleColorsChanged}
              />
            </div>

            {/* ── Invoice color scheme ──────────────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-[#0055FF]" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice colour scheme</p>
              </div>
              <p className="text-xs text-gray-400 font-medium mb-4 leading-relaxed">
                Choose how your primary and secondary colours are applied across your invoices.
              </p>

              {/* Scheme picker grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {SCHEMES.map(cfg => (
                  <SchemeSwatch
                    key={cfg.id}
                    cfg={cfg}
                    primary={brandColor}
                    secondary={secondaryBrandColor}
                    active={colorScheme === cfg.id}
                    onClick={() => setColorScheme(cfg.id)}
                  />
                ))}
              </div>

              {/* Full invoice preview */}
              <div className="p-4 bg-[#F8FAFF] border border-gray-100 rounded-2xl">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Full preview — {SCHEMES.find(s => s.id === colorScheme)?.label}
                </p>
                <InvoicePreview
                  logoUrl={logoUrl}
                  primaryColor={brandColor}
                  secondaryColor={secondaryBrandColor}
                  businessName={userProfile.business_name || 'Your Business'}
                  scheme={colorScheme}
                />
                <p className="text-xs text-gray-400 mt-3">Updates live as you adjust colours and scheme above.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Save bar ──────────────────────────────────────────────────────── */}
      {hasUnsavedChanges && (
        <div className="sticky bottom-4 z-10">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-4" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <p className="text-sm font-bold text-gray-900">Unsaved changes</p>
            </div>
            <button type="button" onClick={handleSave} disabled={isSaving}
              className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60">
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {saveStatus === 'saved' && (
        <div className="bg-[#00C4A0]/10 border border-[#00C4A0]/30 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#00C4A0] flex-shrink-0" />
          <p className="text-sm font-bold text-gray-900">Settings saved.</p>
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm font-bold text-gray-900">Save failed — please try again.</p>
        </div>
      )}

    </div>
  )
}
