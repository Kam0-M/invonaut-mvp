'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LogoUploader from './logo-uploader'
import ColorPicker from './color-picker'
import AccountInfo from './account-info'
import { AlertCircle, CheckCircle2, CreditCard, Lock, Sparkles, Globe, Receipt, Eye } from 'lucide-react'
import Link from 'next/link'

// ─── Currency catalogue ───────────────────────────────────────────────────────
const CURRENCIES = [
  { code:'USD', symbol:'$',  label:'US Dollar',        country:'US' },
  { code:'GBP', symbol:'£',  label:'British Pound',    country:'GB' },
  { code:'EUR', symbol:'€',  label:'Euro',             country:'EU' },
  { code:'CAD', symbol:'C$', label:'Canadian Dollar',  country:'CA' },
  { code:'AUD', symbol:'A$', label:'Australian Dollar',country:'AU' },
  { code:'NZD', symbol:'NZ$',label:'New Zealand Dollar',country:'NZ'},
  { code:'SGD', symbol:'S$', label:'Singapore Dollar', country:'SG' },
  { code:'CHF', symbol:'CHF',label:'Swiss Franc',      country:'CH' },
  { code:'ZAR', symbol:'R',  label:'South African Rand',country:'ZA'},
  { code:'NGN', symbol:'₦',  label:'Nigerian Naira',   country:'NG' },
  { code:'KES', symbol:'KSh',label:'Kenyan Shilling',  country:'KE' },
  { code:'INR', symbol:'₹',  label:'Indian Rupee',     country:'IN' },
  { code:'JPY', symbol:'¥',  label:'Japanese Yen',     country:'JP' },
  { code:'BRL', symbol:'R$', label:'Brazilian Real',   country:'BR' },
  { code:'MXN', symbol:'$',  label:'Mexican Peso',     country:'MX' },
]

const TAX_LABEL_OPTIONS = [
  { value:'Tax',  label:'Tax (generic)' },
  { value:'VAT',  label:'VAT (UK/EU)' },
  { value:'GST',  label:'GST (AU/NZ/CA)' },
  { value:'HST',  label:'HST (Canada)' },
  { value:'PST',  label:'PST (Canada)' },
  { value:'Sales Tax', label:'Sales Tax (US)' },
  { value:'None', label:'No tax line' },
]

// ─── Invoice preview ──────────────────────────────────────────────────────────
function InvoicePreview({ logoUrl, brandColor, businessName, currencySymbol, taxLabel }:
  { logoUrl:string|null; brandColor:string; businessName:string; currencySymbol:string; taxLabel:string }) {
  const accent = brandColor || '#0055FF'
  return (
    <div style={{ border:'1px solid #E2E8F0', borderRadius:12, overflow:'hidden', fontFamily:"'DM Sans',sans-serif", fontSize:12, maxWidth:380 }}>
      {/* Header bar */}
      <div style={{ background:accent, padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        {logoUrl
          ? <img src={logoUrl} alt="Logo" style={{ height:28, maxWidth:90, objectFit:'contain' }} />
          : <div style={{ fontWeight:800, fontSize:13, color:'#fff', letterSpacing:'-.01em' }}>{businessName || 'Your Business'}</div>}
        <div style={{ textAlign:'right' }}>
          <div style={{ fontWeight:700, fontSize:14, color:'#fff' }}>INVOICE</div>
          <div style={{ color:'rgba(255,255,255,0.65)', fontSize:10 }}>#INV-0042</div>
        </div>
      </div>
      {/* Body */}
      <div style={{ padding:'14px 18px', background:'#fff' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <div>
            <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#94A3B8', marginBottom:3 }}>Bill To</div>
            <div style={{ fontWeight:600, color:'#0A0A0A' }}>Sample Client Inc.</div>
            <div style={{ color:'#64748B', fontSize:11 }}>client@example.com</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#94A3B8', marginBottom:3 }}>Due Date</div>
            <div style={{ fontWeight:600, color:'#0A0A0A' }}>{new Date(Date.now()+30*864e5).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
          </div>
        </div>
        {/* Line items */}
        <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:8 }}>
          <thead>
            <tr style={{ borderBottom:`2px solid ${accent}` }}>
              <th style={{ textAlign:'left', padding:'4px 0', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:accent }}>Description</th>
              <th style={{ textAlign:'right', padding:'4px 0', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:accent }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom:'1px solid #F1F5F9' }}>
              <td style={{ padding:'6px 0', color:'#374151' }}>Design services · 8 hrs</td>
              <td style={{ padding:'6px 0', textAlign:'right', fontWeight:600, color:'#0A0A0A' }}>{currencySymbol}800.00</td>
            </tr>
            <tr>
              <td style={{ padding:'6px 0', color:'#374151' }}>Strategy consultation</td>
              <td style={{ padding:'6px 0', textAlign:'right', fontWeight:600, color:'#0A0A0A' }}>{currencySymbol}350.00</td>
            </tr>
          </tbody>
        </table>
        {/* Totals */}
        <div style={{ borderTop:'1px solid #E2E8F0', paddingTop:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
            <span style={{ color:'#64748B' }}>Subtotal</span>
            <span style={{ fontWeight:600 }}>{currencySymbol}1,150.00</span>
          </div>
          {taxLabel !== 'None' && (
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ color:'#64748B' }}>{taxLabel} (10%)</span>
              <span style={{ fontWeight:600 }}>{currencySymbol}115.00</span>
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 8px', background:accent, borderRadius:7 }}>
            <span style={{ fontWeight:800, color:'#fff', fontSize:12 }}>Total Due</span>
            <span style={{ fontWeight:800, color:'#fff', fontSize:12 }}>{currencySymbol}{taxLabel !== 'None' ? '1,265.00' : '1,150.00'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface SettingsFormProps {
  userId: string
  currentLogoUrl: string | null
  currentBrandColor: string
  currentSecondaryBrandColor: string
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

// ─── Plan price helper ────────────────────────────────────────────────────────
function planDescription(tier: string) {
  if (tier === 'starter')      return '$29/month · 25 invoices · Core workflow'
  if (tier === 'professional') return '$59/month · Unlimited invoices · White-label branding · AI features'
  if (tier === 'business')     return '$109/month · Everything in Pro · Budget alerts · Full AI intelligence'
  return ''
}

export default function SettingsForm({
  userId, currentLogoUrl, currentBrandColor, currentSecondaryBrandColor,
  subscriptionTier, hasActiveSubscription, hasEverSubscribed, subscriptionStatus,
  userProfile, currency: initCurrency, currencySymbol: initSymbol,
  taxLabel: initTaxLabel, taxNumber: initTaxNumber, country: initCountry,
}: SettingsFormProps) {
  const router  = useRouter()

  // Branding state
  const [logoUrl,             setLogoUrl]            = useState(currentLogoUrl)
  const [brandColor,          setBrandColor]         = useState(currentBrandColor)
  const [secondaryBrandColor, setSecondaryBrandColor]= useState(currentSecondaryBrandColor)
  const [showPreview,         setShowPreview]        = useState(false)

  // Regional state
  const [currency,    setCurrency]    = useState(initCurrency)
  const [taxLabel,    setTaxLabel]    = useState(initTaxLabel)
  const [taxNumber,   setTaxNumber]   = useState(initTaxNumber || '')
  const [country,     setCountry]     = useState(initCountry)

  // Save state
  const [hasUnsavedChanges,  setHasUnsavedChanges]  = useState(false)
  const [hasAccountChanges,  setHasAccountChanges]  = useState(false)
  const [isSaving,           setIsSaving]           = useState(false)
  const [saveStatus,         setSaveStatus]         = useState<'idle'|'saving'|'saved'|'error'>('idle')

  const isPro = subscriptionTier === 'professional' || subscriptionTier === 'business'

  const selectedCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0]

  useEffect(() => {
    const brandingChanged =
      logoUrl !== currentLogoUrl ||
      brandColor !== currentBrandColor ||
      secondaryBrandColor !== currentSecondaryBrandColor
    const regionalChanged =
      currency !== initCurrency ||
      taxLabel !== initTaxLabel ||
      taxNumber !== (initTaxNumber || '') ||
      country !== initCountry
    setHasUnsavedChanges(brandingChanged || regionalChanged || hasAccountChanges)
  }, [logoUrl, brandColor, secondaryBrandColor, currency, taxLabel, taxNumber, country, hasAccountChanges,
      currentLogoUrl, currentBrandColor, currentSecondaryBrandColor, initCurrency, initTaxLabel, initTaxNumber, initCountry])

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
      const sym = CURRENCIES.find(c => c.code === currency)?.symbol || '$'
      const { error } = await supabase.from('user_profiles').update({
        logo_url:              logoUrl,
        brand_color:           brandColor,
        secondary_brand_color: secondaryBrandColor,
        currency,
        currency_symbol:       sym,
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
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">

      {/* ── Account information ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Account Information</h2>
            <p className="text-sm text-gray-500">Your personal and business details</p>
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

      {/* ── Current plan ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Current Plan</h2>
            <p className="text-sm text-gray-500">Manage your subscription</p>
          </div>
        </div>

        {hasActiveSubscription ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-black text-gray-900 capitalize">{subscriptionTier}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      subscriptionStatus === 'active'   ? 'bg-green-100 text-green-800' :
                      subscriptionStatus === 'trialing' ? 'bg-blue-100 text-blue-800'  : 'bg-gray-100 text-gray-800'
                    }`}>
                      {subscriptionStatus === 'active'   && '✓ Active'}
                      {subscriptionStatus === 'trialing' && '⏱ Trial'}
                      {subscriptionStatus === 'past_due' && '⚠ Past Due'}
                    </span>
                  </div>
                  <p className="text-gray-700 font-medium">{planDescription(subscriptionTier)}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/dashboard/billing" className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <CreditCard className="w-4 h-4" />Manage Subscription
                </Link>
                {subscriptionTier === 'starter' && (
                  <Link href="/pricing" className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <Sparkles className="w-4 h-4" />Upgrade to Professional
                  </Link>
                )}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">{subscriptionTier === 'starter' ? '25 invoices/month' : 'Unlimited invoices'}</p>
                  <p className="text-xs text-gray-600">{subscriptionTier === 'starter' ? 'Upgrade for unlimited' : 'No monthly limits'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div><p className="font-bold text-gray-900 text-sm">AI Payment Predictions</p><p className="text-xs text-gray-600">Risk scoring on every invoice</p></div>
              </div>
              {isPro && (
                <>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div><p className="font-bold text-gray-900 text-sm">White Label Branding</p><p className="text-xs text-gray-600">Custom logo & colours</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div><p className="font-bold text-gray-900 text-sm">Bank Connections</p><p className="text-xs text-gray-600">Plaid sync + reconciliation</p></div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : hasEverSubscribed ? (
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-5 border border-orange-100 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4"><Lock className="w-8 h-8 text-orange-600" /></div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">No Active Subscription</h3>
            <p className="text-gray-700 font-medium mb-6 max-w-md mx-auto">Reactivate to unlock all features and access your data.</p>
            <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all">
              <Sparkles className="w-5 h-5" />Reactivate Subscription
            </Link>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-5 border border-blue-100 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"><Sparkles className="w-8 h-8 text-blue-600" /></div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Start Your Free Trial</h3>
            <p className="text-gray-700 font-medium mb-6 max-w-md mx-auto">14 days free on any plan. No credit card required.</p>
            <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all text-lg">
              <Sparkles className="w-5 h-5" />Start 14-Day Free Trial
            </Link>
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-600">
              {['No credit card','Cancel anytime','Full access'].map(t => (
                <span key={t} className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-600" />{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Regional settings (currency + VAT) ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
            <Globe className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Regional &amp; Tax Settings</h2>
            <p className="text-sm text-gray-500">Currency, VAT/GST label, and tax number on invoices</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Currency */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Currency</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 bg-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.symbol} — {c.code} · {c.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1.5">Used on all invoices, reports, and the dashboard</p>
          </div>

          {/* Tax label */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Tax label on invoices</label>
            <select
              value={taxLabel}
              onChange={e => setTaxLabel(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 bg-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              {TAX_LABEL_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1.5">VAT for UK/EU · GST for AU/NZ · Sales Tax for US</p>
          </div>

          {/* Tax / VAT number */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {taxLabel === 'VAT' ? 'VAT number' : taxLabel === 'GST' ? 'GST number' : 'Tax / registration number'}
              <span className="font-normal text-gray-400 ml-1">(optional)</span>
            </label>
            <input
              type="text"
              value={taxNumber}
              onChange={e => setTaxNumber(e.target.value)}
              placeholder={taxLabel === 'VAT' ? 'e.g. GB123456789' : taxLabel === 'GST' ? 'e.g. 12 345 678 912' : 'e.g. EIN 12-3456789'}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-colors font-mono"
            />
            <p className="text-xs text-gray-400 mt-1.5">Printed at the bottom of every invoice</p>
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Country</label>
            <input
              type="text"
              value={country}
              onChange={e => setCountry(e.target.value)}
              placeholder="e.g. US, GB, AU, ZA"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-colors uppercase"
              maxLength={2}
            />
            <p className="text-xs text-gray-400 mt-1.5">2-letter country code</p>
          </div>
        </div>
      </div>

      {/* ── White label branding ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">White Label Branding</h2>
              <p className="text-sm text-gray-500">Custom logo and brand colours on every invoice</p>
            </div>
          </div>
          {isPro && (
            <button
              type="button"
              onClick={() => setShowPreview(p => !p)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all"
            >
              <Eye className="w-4 h-4" />{showPreview ? 'Hide preview' : 'Invoice preview'}
            </button>
          )}
        </div>

        {!isPro ? (
          <div className="bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-100 rounded-xl p-5 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Professional Feature</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">Upgrade to Professional or Business to customise your invoices with your logo and brand colours.</p>
            <button type="button" onClick={() => router.push('/pricing')} className="btn-primary px-6 py-2.5 rounded-xl text-sm">
              Upgrade to Professional — $59/mo
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Live preview */}
            {showPreview && (
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Invoice preview</p>
                <InvoicePreview
                  logoUrl={logoUrl}
                  brandColor={brandColor}
                  businessName={userProfile.business_name || 'Your Business'}
                  currencySymbol={selectedCurrency.symbol}
                  taxLabel={taxLabel}
                />
                <p className="text-xs text-gray-400 mt-3">Preview updates live as you change settings above</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Company Logo</label>
              <LogoUploader userId={userId} currentLogoUrl={logoUrl} onLogoUploaded={setLogoUrl} />
              <p className="text-xs text-gray-500 mt-2">PNG, JPG, SVG, WebP · Max 10MB</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Brand Colours</label>
              <ColorPicker userId={userId} currentPrimaryColor={brandColor} currentSecondaryColor={secondaryBrandColor} onColorsChanged={handleColorsChanged} />
              <p className="text-xs text-gray-500 mt-2">Primary colour used on invoice headers and accent elements</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Save bar ─────────────────────────────────────────────────────── */}
      {hasUnsavedChanges && (
        <div className="sticky bottom-4 z-10">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-gray-900">You have unsaved changes</p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : 'Save all changes'}
            </button>
          </div>
        </div>
      )}

      {saveStatus === 'saved' && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-900">All settings saved successfully.</p>
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-red-900">Save failed — please try again.</p>
        </div>
      )}
    </div>
  )
}
