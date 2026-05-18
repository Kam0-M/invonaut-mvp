import { ReactNode } from 'react'
import Link from 'next/link'
import { Zap, FileCheck, Bot, TrendingUp, Shield } from 'lucide-react'

const PROPS = [
  { Icon: FileCheck, title: 'Contracts & e-signatures',  sub: 'Send, sign, and track — expiry reminders automated' },
  { Icon: Bot,       title: 'AI-powered follow-ups',     sub: 'Overdue invoices chased automatically at 9am daily' },
  { Icon: TrendingUp,title: '90-day cash flow forecast', sub: 'Know your runway before you run out of it' },
]

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex relative">

      {/* ── Left panel — brand ────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-5/12 xl:w-[42%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0a0f1e 0%, #0f1a2e 40%, #0d1f3c 100%)' }}
      >
        {/* Starfield */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: [
            'radial-gradient(circle, rgba(255,255,255,0.60) 0.5px, transparent 0.5px)',
            'radial-gradient(circle, rgba(255,255,255,0.20) 0.8px, transparent 0.8px)',
            'radial-gradient(circle, rgba(255,255,255,0.07) 0.4px, transparent 0.4px)',
            'radial-gradient(circle, rgba(255,255,255,0.45) 1px, transparent 1px)',
            'radial-gradient(circle, rgba(255,255,255,0.75) 0.6px, transparent 0.6px)',
          ].join(', '),
          backgroundSize: '90px 90px, 130px 130px, 22px 22px, 170px 170px, 220px 220px',
          backgroundPosition: '0 0, 20px 44px, 0 0, 60px 80px, 110px 30px',
        }} />

        {/* Orbs — no opacity prop, colour transparency in gradient only */}
        <div className="auth-orb-a absolute top-[12%] right-[8%] w-72 h-72 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,102,255,0.55) 0%, transparent 65%)', filter: 'blur(44px)' }} />
        <div className="auth-orb-b absolute bottom-[15%] left-[3%] w-60 h-60 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,212,170,0.45) 0%, transparent 65%)', filter: 'blur(40px)' }} />
        <div className="auth-orb-c absolute top-[45%] left-[30%] w-52 h-52 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,102,255,0.22) 0%, transparent 60%)', filter: 'blur(52px)' }} />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center"
              style={{ boxShadow: '0 0 20px rgba(0,102,255,0.5)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">Invonaut</span>
          </Link>
        </div>

        {/* Value props */}
        <div className="relative z-10 space-y-10">
          <div>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Autonomous Finance OS</p>
            <h2 className="text-3xl font-black text-white leading-[1.15] tracking-tight">
              From contract<br />to cash.<br />
              <span className="text-blue-400">Automated.</span>
            </h2>
            <p className="text-gray-400 font-medium mt-4 leading-relaxed text-sm max-w-xs">
              The only platform that captures all your income, chases late payments, and forecasts your cash flow without you lifting a finger.
            </p>
          </div>
          <div className="space-y-4">
            {PROPS.map((p, i) => (
              <div key={i} className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: 'rgba(0,102,255,0.18)', border: '1px solid rgba(0,102,255,0.25)' }}>
                  <p.Icon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{p.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{p.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-6">
            {[['9','automations'],['$0','setup cost'],['3','plan tiers']].map(([n,l]) => (
              <div key={l}>
                <p className="text-xl font-black text-white">{n}</p>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-3.5 h-3.5 text-gray-600" />
            <p className="text-xs text-gray-600 font-medium">Free tier available · No credit card required</p>
          </div>
          <div className="flex gap-3">
            {['Supabase','Stripe','OpenAI'].map(t => (
              <span key={t} className="text-[10px] font-bold text-gray-700 bg-white/[0.05] px-2 py-1 rounded-md border border-white/[0.07]">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Vertical wave art — seam between dark and white ──────────────────── */}
      <div className="hidden lg:block absolute top-0 bottom-0 z-20 pointer-events-none"
        style={{ left: 'calc(42% - 28px)', width: '56px' }}>
        <svg viewBox="0 0 56 1000" xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          {/* Main wave — white fill coming from the right */}
          <path fill="white"
            d="M56,0 L56,1000 L28,1000
               C22,870  38,750  26,620
               C14,490  36,370  22,240
               C8,110   34,55   28,0 Z" />
          {/* Mid shimmer layer */}
          <path fill="rgba(255,255,255,0.25)"
            d="M56,0 L56,1000 L38,1000
               C32,880  48,730  36,590
               C24,450  44,320  32,180
               C20,80   44,30   38,0 Z" />
          {/* Faint leading edge */}
          <path fill="rgba(255,255,255,0.08)"
            d="M56,0 L56,1000 L20,1000
               C10,900  30,760  16,620
               C2,480   26,340  12,200
               C-2,90   22,40   20,0 Z" />
        </svg>
      </div>

      {/* ── Right panel — form ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 min-h-screen">
        <div className="lg:hidden mb-10 w-full max-w-sm">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-black text-gray-900">Invonaut</span>
          </Link>
        </div>
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
