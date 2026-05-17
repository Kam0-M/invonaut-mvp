import { ReactNode } from 'react'
import Link from 'next/link'
import { Zap, FileCheck, Bot, TrendingUp, Shield } from 'lucide-react'

const PROPS = [
  { Icon: FileCheck, title: 'Contracts & e-signatures',    sub: 'Send, sign, and track — expiry reminders automated' },
  { Icon: Bot,       title: 'AI-powered follow-ups',       sub: 'Overdue invoices chased automatically at 9am daily' },
  { Icon: TrendingUp,title: '90-day cash flow forecast',   sub: 'Know your runway before you run out of it' },
]

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">

      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-5/12 xl:w-[42%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0a0f1e 0%, #0f1a2e 40%, #0d1f3c 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="auth-orb-a absolute top-[12%] right-[8%] w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,102,255,0.55) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="auth-orb-b absolute bottom-[15%] left-[5%] w-60 h-60 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,212,170,0.45) 0%, transparent 70%)', filter: 'blur(36px)' }} />
        <div className="auth-orb-c absolute top-[48%] left-[35%] w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,102,255,0.2) 0%, transparent 70%)', filter: 'blur(32px)' }} />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center"
              style={{ boxShadow: '0 0 20px rgba(0,102,255,0.4)' }}>
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

      {/* Right panel */}
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
