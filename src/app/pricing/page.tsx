import { createClient } from '@/lib/supabase/server'
import PricingClientWrapper from '@/components/pricing/pricing-client-wrapper'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { isSubscriptionActive } from '@/lib/subscription-status'

export const dynamic = 'force-dynamic'

// ─── Design tokens — local re-declaration, matching the established pattern
// on landing-page-client.tsx and every /vs/[competitor] page. Values pulled
// directly from those live files, not the Business/Context docs (which carry
// superseded numbers — #0066FF/#00D4AA vs the real #0055FF/#00C4A0). ───────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..800&family=Fraunces:ital,opsz,wght@0,9..144,400..800;1,9..144,400..700&family=JetBrains+Mono:wght@400;500;700&display=swap');
  .price-body { font-family:'DM Sans',sans-serif; background:#fff; color:var(--ink); -webkit-font-smoothing:antialiased; }
  .f-display  { font-family:'Fraunces',serif; font-optical-sizing:auto; }
  .f-mono     { font-family:'JetBrains Mono',monospace; font-feature-settings:'tnum'; }
  :root {
    --ink:    #07070F;
    --blue:   #0055FF;
    --teal:   #00C4A0;
    --orange: #FF6B35;
    --mid:    #64748B;
    --faint:  #94A3B8;
    --rule:   #E2E8F0;
    --surf:   #F8FAFF;
  }
  .price-back-link:hover { color:var(--ink) !important; }
  .price-affiliate-cta:hover { transform:translateY(-2px); }
  @media(max-width:860px){
    .price-trust-grid { grid-template-columns:1fr !important; }
  }
`

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let hasEverSubscribed = false
  let isLoggedIn = false
  let hasActiveSubscription = false
  let currentTier = 'starter'

  if (user) {
    isLoggedIn = true
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, stripe_subscription_id, subscription_status, subscription_tier, trial_end_date')
      .eq('id', user.id)
      .single()

    hasEverSubscribed = !!profile?.stripe_customer_id || !!profile?.stripe_subscription_id
    hasActiveSubscription = isSubscriptionActive(profile)
    currentTier = profile?.subscription_tier || 'starter'
  }

  const { billing: billingParam } = await searchParams
  const initialBilling = billingParam === 'monthly' ? 'monthly' : 'annual'

  const starterPriceId             = process.env.STRIPE_PRICE_ID_STARTER || ''
  const professionalPriceId        = process.env.STRIPE_PRICE_ID_PROFESSIONAL || ''
  const businessPriceId            = process.env.STRIPE_PRICE_ID_BUSINESS || ''
  const starterAnnualPriceId       = process.env.STRIPE_PRICE_ID_STARTER_ANNUAL || ''
  const professionalAnnualPriceId  = process.env.STRIPE_PRICE_ID_PROFESSIONAL_ANNUAL || ''
  const businessAnnualPriceId      = process.env.STRIPE_PRICE_ID_BUSINESS_ANNUAL || ''

  const backHref = isLoggedIn ? '/dashboard' : '/'

  return (
    <div className="price-body">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav style={{position:'sticky',top:0,zIndex:50,height:58,background:'rgba(255,255,255,0.95)',borderBottom:'1px solid var(--rule)',backdropFilter:'blur(16px)',display:'flex',alignItems:'center'}}>
        <div style={{maxWidth:1160,margin:'0 auto',width:'100%',padding:'0 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <Link href={backHref} style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:6}}>
            <img src="/naut-blue.svg" alt="" aria-hidden="true" style={{width:38,height:38,objectFit:'contain',flexShrink:0}} />
            <span className="f-display" style={{fontSize:'1.25rem',fontWeight:700,color:'var(--ink)',letterSpacing:'-.02em'}}>Invonaut</span>
          </Link>
          <Link href={backHref} className="price-back-link" style={{display:'inline-flex',alignItems:'center',gap:8,color:'var(--mid)',fontWeight:500,fontSize:'.875rem',textDecoration:'none',transition:'color .15s'}}>
            <ArrowLeft size={16} />
            {isLoggedIn ? 'Back to Dashboard' : 'Back'}
          </Link>
        </div>
      </nav>

      {/* ── HEADER — soft radial wash only, no repeating dot/grid texture ──── */}
      <div style={{position:'relative',overflow:'hidden',padding:'88px 24px 52px',textAlign:'center',background:'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(0,85,255,0.06) 0%, transparent 60%), #ffffff'}}>
        <p className="f-mono" style={{fontSize:'.72rem',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--blue)',marginBottom:16}}>Pricing</p>
        <h1 className="f-display" style={{fontSize:'clamp(2.2rem,5vw,3.4rem)',fontWeight:800,letterSpacing:'-.025em',lineHeight:1.08,color:'var(--ink)',marginBottom:16}}>
          Simple, transparent pricing.
        </h1>
        <p style={{color:'var(--mid)',fontWeight:500,maxWidth:460,margin:'0 auto',fontSize:'.95rem',lineHeight:1.65}}>
          Start with a 14-day free trial on any plan. No credit card required. Cancel anytime.
        </p>
      </div>

      {/* ── PRICING CARDS ────────────────────────────────────────────────── */}
      <div style={{maxWidth:1160,margin:'0 auto',padding:'0 24px 96px'}}>
        <PricingClientWrapper
          isLoggedIn={isLoggedIn}
          hasEverSubscribed={hasEverSubscribed}
          hasActiveSubscription={hasActiveSubscription}
          currentTier={currentTier}
          starterPriceId={starterPriceId}
          professionalPriceId={professionalPriceId}
          businessPriceId={businessPriceId}
          starterAnnualPriceId={starterAnnualPriceId}
          professionalAnnualPriceId={professionalAnnualPriceId}
          businessAnnualPriceId={businessAnnualPriceId}
          initialBilling={initialBilling}
        />

        {/* Trust strip — plain text, no boxed-card grid. Matches the landing
            page's own TRUST section, which deliberately skips the hairline-card
            treatment this session identified as the generic-looking skeleton. */}
        <div className="price-trust-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:40,marginTop:72,paddingTop:52,borderTop:'1px solid var(--rule)'}}>
          {[
            { label: '14-day free trial',   body: 'Full access on any plan. No credit card needed to start.' },
            { label: 'Cancel anytime',      body: 'No contracts. No cancellation fees. Cancel in two clicks.' },
            { label: 'Switch plans freely', body: 'Upgrade or downgrade at any time. Changes take effect immediately.' },
          ].map(item => (
            <div key={item.label}>
              <p style={{fontWeight:700,fontSize:'.875rem',color:'var(--ink)',marginBottom:8,letterSpacing:'-.01em'}}>{item.label}</p>
              <p style={{fontSize:'.8rem',color:'var(--mid)',lineHeight:1.8}}>{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── AFFILIATE STRIP ──────────────────────────────────────────────── */}
      <div style={{borderTop:'1px solid var(--rule)',padding:'32px 24px'}}>
        <div style={{maxWidth:680,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
          <div>
            <p style={{fontWeight:700,fontSize:'.875rem',color:'var(--ink)'}}>Know freelancers or small business owners?</p>
            <p style={{fontSize:'.78rem',color:'var(--mid)',marginTop:2}}>Refer them to Invonaut and earn 30% recurring commission for every month they stay subscribed.</p>
          </div>
          <Link href="/affiliate" className="price-affiliate-cta" style={{flexShrink:0,display:'inline-flex',alignItems:'center',gap:8,padding:'10px 20px',background:'var(--ink)',color:'#fff',fontWeight:700,borderRadius:10,textDecoration:'none',fontSize:'.85rem',whiteSpace:'nowrap',transition:'transform .15s'}}>
            Earn with affiliate →
          </Link>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <div style={{borderTop:'1px solid var(--rule)',padding:'24px',textAlign:'center'}}>
        <p style={{fontSize:'.75rem',color:'var(--faint)'}}>© {new Date().getFullYear()} Invonaut · From Contract to Cash. Automated.</p>
      </div>
    </div>
  )
}
