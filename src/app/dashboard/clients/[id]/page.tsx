import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link             from 'next/link'
import {
  Pencil, Mail, Phone, Building2, MapPin,
  Calendar, FileText, Banknote, Clock, Plus,
} from 'lucide-react'
import ClientFilesTab, { type ClientFile } from '@/components/clients/client-files-tab'
import { getInvoiceDisplayStatus } from '@/lib/utils/invoice-status'

const fmt = (n: number) => {
  if (n >= 999_500) return `$${(n/1_000_000).toFixed(1)}M`
  if (n >= 10_000)  return `$${(n/1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n)
}
const fmtFull = (n: number) =>
  new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n)
const fmtDate = (s: string) =>
  new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})

type Tab = 'overview'|'invoices'|'files'|'payments'
const VALID: Tab[] = ['overview','invoices','files','payments']

const STATUS_CFG: Record<string,{pill:string;dot:string;label:string}> = {
  draft:   {pill:'bg-gray-100 text-gray-600 border border-gray-200',  dot:'bg-gray-400',  label:'Draft'},
  sent:    {pill:'bg-blue-50 text-blue-700 border border-blue-200',   dot:'bg-blue-500',  label:'Sent'},
  paid:    {pill:'bg-teal-50 text-teal-700 border border-teal-200',   dot:'bg-teal-500',  label:'Paid'},
  overdue: {pill:'bg-red-50 text-red-700 border border-red-200',      dot:'bg-red-500',   label:'Overdue'},
}
const METHOD: Record<string,string> = {cash:'Cash',bank:'Bank Transfer',mobile:'Mobile Money',pos:'POS'}

function avatarColor(name: string) {
  const p=['bg-blue-100 text-blue-700','bg-teal-100 text-teal-700','bg-indigo-100 text-indigo-700','bg-amber-100 text-amber-700']
  let h=0; for(let i=0;i<name.length;i++) h=name.charCodeAt(i)+((h<<5)-h)
  return p[Math.abs(h)%p.length]
}

export default async function ClientDetailPage({
  params, searchParams,
}: {
  params: Promise<{id:string}>
  searchParams: Promise<{tab?:string}>
}) {
  const {id}          = await params
  const {tab:tabRaw}  = await searchParams
  const tab: Tab      = VALID.includes(tabRaw as Tab) ? (tabRaw as Tab) : 'overview'
  const supabase      = await createClient()
  const {data:{user}} = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const {data:client,error} = await supabase.from('clients')
    .select('*').eq('id',id).eq('user_id',user.id).single()
  if (error||!client) redirect('/dashboard/clients')

  const {data:invoicesRaw} = await supabase.from('invoices')
    .select('id,invoice_number,total_amount,status,due_date,created_at')
    .eq('client_id',id).order('created_at',{ascending:false})
  const invoices = (invoicesRaw??[]).map((inv:any)=>({
    ...inv, displayStatus: getInvoiceDisplayStatus({status:inv.status,due_date:inv.due_date})
  }))

  const {data:filesRaw} = await supabase.from('client_files')
    .select('id,file_name,file_url,file_size,file_type,uploaded_at')
    .eq('client_id',id).eq('user_id',user.id).order('uploaded_at',{ascending:false})
  const files = (filesRaw||[]) as ClientFile[]

  const {data:paymentsRaw} = await supabase.from('direct_payments')
    .select('id,amount,payment_type,payment_method,description,payment_date,revenue_categories(id,name,color)')
    .eq('client_id',id).eq('user_id',user.id).order('payment_date',{ascending:false})
  const payments = (paymentsRaw||[]).map((p:any)=>({
    ...p, revenue_categories: Array.isArray(p.revenue_categories)?(p.revenue_categories[0]??null):p.revenue_categories
  }))

  // ── Client risk profile — computed inline, no cron dependency ──────────────
  const riskProfile = (() => {
    const allInv  = invoicesRaw ?? []
    if (allInv.length === 0) return null

    const now     = new Date()
    const paidInv = allInv.filter((i:any) => i.status === 'paid')

    // Paid invoices whose due_date has passed are counted as late
    const lateCount  = allInv.filter((i:any) =>
      i.status === 'paid' && new Date(i.due_date + 'T12:00:00') < now
    ).length

    const onTimeRate      = allInv.length > 0 ? Math.max(0, (allInv.length - lateCount)) / allInv.length : 1
    const riskLevel       = onTimeRate >= 0.85 ? 'low' : onTimeRate >= 0.60 ? 'medium' : 'high'
    const riskReason      = riskLevel === 'high'   ? `Paid late on ${Math.round((1 - onTimeRate) * 100)}% of invoices`
                          : riskLevel === 'medium' ? 'Some late payment history — worth monitoring'
                          : 'Consistently pays on time'
    const paymentTermsRec = riskLevel === 'high'   ? 'Consider requiring a 50% upfront deposit'
                          : riskLevel === 'medium' ? 'Consider switching to Net 15 terms'
                          : null
    const totalRev   = paidInv.reduce((s:number,i:any) => s + Number(i.total_amount||0), 0)
    const largestInv = paidInv.length > 0 ? Math.max(...paidInv.map((i:any) => Number(i.total_amount||0))) : 0

    // Write back to table so cron + intelligence feed stay in sync (fire-and-forget)
    supabase.from('client_risk_profiles').upsert({
      user_id:           user.id,
      client_id:         id,
      total_invoices:    allInv.length,
      paid_invoices:     paidInv.length,
      on_time_rate:      Math.round(onTimeRate * 1000) / 1000,
      late_invoices:     lateCount,
      largest_invoice:   largestInv,
      total_revenue:     totalRev,
      risk_level:        riskLevel,
      risk_reason:       riskReason,
      payment_terms_rec: paymentTermsRec,
      last_computed_at:  now.toISOString(),
    }, { onConflict: 'user_id,client_id' })

    return { risk_level: riskLevel, risk_reason: riskReason, on_time_rate: onTimeRate,
             payment_terms_rec: paymentTermsRec, late_invoices: lateCount, total_invoices: allInv.length }
  })()

  const totalRevenue    = invoices.filter(i=>i.displayStatus==='paid').reduce((s:number,i:any)=>s+Number(i.total_amount||0),0)
  const overdueCount    = invoices.filter(i=>i.displayStatus==='overdue').length
  const directTotal     = payments.reduce((s:number,p:any)=>s+Number(p.amount||0),0)
  const initials        = client.name.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()
  const av              = avatarColor(client.name)
  const tabHref         = (t:Tab) => `/dashboard/clients/${id}?tab=${t}`
  const tabCls          = (t:Tab) => `px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab===t?'bg-white text-blue-600 shadow-sm':'text-gray-500 hover:text-gray-700'}`

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/dashboard/clients"
            className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors mb-2 block">
            ← Clients
          </Link>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base flex-shrink-0 ${av}`}>
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">{client.name}</h1>
              {client.company && (
                <p className="text-sm text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3 h-3"/>{client.company}
                </p>
              )}
            </div>
          </div>
        </div>
        <Link href={`/dashboard/clients/${id}/edit`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition-all flex-shrink-0">
          <Pencil className="w-3.5 h-3.5"/>Edit
        </Link>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          {t:'overview',label:'Overview'},
          {t:'invoices',label:`Invoices${invoices.length>0?` (${invoices.length})`:''}` },
          {t:'payments',label:`Payments${payments.length>0?` (${payments.length})`:''}` },
          {t:'files',   label:`Files${files.length>0?` (${files.length})`:''}` },
        ] as {t:Tab;label:string}[]).map(item=>(
          <Link key={item.t} href={tabHref(item.t)} className={tabCls(item.t)}>{item.label}</Link>
        ))}
      </div>

      {/* ── Overview ────────────────────────────────────────────────────────── */}
      {tab==='overview' && (
        <div className="space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {label:'Invoices',     value:String(invoices.length),     color:'text-blue-600',  bg:'bg-blue-50',  border:'border-blue-100' },
              {label:'Revenue',      value:fmt(totalRevenue),            color:'text-teal-700',  bg:'bg-teal-50',  border:'border-teal-100' },
              {label:'Overdue',      value:String(overdueCount),         color:overdueCount>0?'text-red-600':'text-gray-400', bg:overdueCount>0?'bg-red-50':'bg-gray-50', border:overdueCount>0?'border-red-100':'border-gray-100' },
              {label:'Direct pays',  value:String(payments.length),     color:'text-gray-700',  bg:'bg-gray-50',  border:'border-gray-100' },
            ].map(s=>(
              <div key={s.label} className={`rounded-2xl border p-4 hover:-translate-y-0.5 hover:shadow-sm transition-all ${s.bg} ${s.border}`}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Contact info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-sm transition-all">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Contact Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {icon:Mail,     label:'Email',          value:client.email||'Not provided',  color:'text-blue-600'},
                {icon:Phone,    label:'Phone',          value:client.phone||'Not provided',  color:'text-teal-600'},
                {icon:Building2,label:'Company',        value:client.company||'Not provided',color:'text-gray-500'},
                {icon:Clock,    label:'Payment Terms',  value:`Net ${client.payment_terms||30}`,color:'text-orange-500'},
              ].map(r=>(
                <div key={r.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <r.icon className={`w-4 h-4 ${r.color}`}/>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{r.label}</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5 break-all">{r.value}</p>
                  </div>
                </div>
              ))}
              {client.address && (
                <div className="col-span-2 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-gray-500"/>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Address</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5 whitespace-pre-wrap">{client.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI insight if overdue */}
          {overdueCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
              <p className="text-sm font-bold text-red-700">
                {overdueCount} overdue invoice{overdueCount>1?'s':''} from this client
              </p>
              <Link href={`/dashboard/invoices?status=overdue`}
                className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors flex-shrink-0">
                Review →
              </Link>
            </div>
          )}

          {/* Risk profile card — shown when intelligence cron has computed it */}
          {riskProfile && riskProfile.risk_level !== 'unknown' && (
            <div className={`rounded-2xl border px-5 py-4 ${
              riskProfile.risk_level === 'high'   ? 'bg-red-50 border-red-100'    :
              riskProfile.risk_level === 'medium' ? 'bg-amber-50 border-amber-100' :
                                                    'bg-teal-50 border-teal-100'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${
                      riskProfile.risk_level === 'high'   ? 'bg-red-100 text-red-700'    :
                      riskProfile.risk_level === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-teal-100 text-teal-700'
                    }`}>
                      {riskProfile.risk_level} payment risk
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {Math.round((riskProfile.on_time_rate ?? 1) * 100)}% on-time rate
                      {riskProfile.late_invoices > 0 && ` · ${riskProfile.late_invoices} late of ${riskProfile.total_invoices}`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{riskProfile.risk_reason}</p>
                  {riskProfile.payment_terms_rec && (
                    <p className="text-xs font-bold text-gray-700 mt-1">
                      Recommendation: {riskProfile.payment_terms_rec}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Invoices ─────────────────────────────────────────────────────────── */}
      {tab==='invoices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-gray-900">
              {invoices.length} invoice{invoices.length!==1?'s':''} · {fmt(totalRevenue)} revenue
            </p>
            <Link href={`/dashboard/invoices/new?client=${id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 btn-primary rounded-xl text-xs">
              <Plus className="w-3.5 h-3.5"/>New Invoice
            </Link>
          </div>
          {invoices.length===0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-blue-400"/>
              </div>
              <p className="text-sm font-bold text-gray-400 mb-3">No invoices yet</p>
              <Link href={`/dashboard/invoices/new?client=${id}`}
                className="inline-flex items-center gap-1.5 btn-primary px-4 py-2 rounded-xl text-xs">
                Create first invoice
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv:any,i:number)=>{
                const cfg = STATUS_CFG[inv.displayStatus]??STATUS_CFG.draft
                return (
                  <Link key={inv.id} href={`/dashboard/invoices/${inv.id}`}
                    className="inv-row-in flex items-center gap-4 bg-white rounded-2xl border border-gray-100 px-5 py-4 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                    style={{animationDelay:`${i*25}ms`}}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900 font-mono">{inv.invoice_number}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cfg.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">Due {fmtDate(inv.due_date)}</p>
                    </div>
                    <span className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                      {fmt(Number(inv.total_amount))}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Payments ─────────────────────────────────────────────────────────── */}
      {tab==='payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-gray-900">
              {payments.length} payment{payments.length!==1?'s':''} · {fmt(directTotal)} total
            </p>
            <Link href="/dashboard/payments/new"
              className="inline-flex items-center gap-1.5 px-3 py-2 btn-secondary rounded-xl text-xs">
              <Plus className="w-3.5 h-3.5"/>Log Payment
            </Link>
          </div>
          {payments.length===0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Banknote className="w-6 h-6 text-teal-500"/>
              </div>
              <p className="text-sm font-bold text-gray-400 mb-1">No direct payments yet</p>
              <p className="text-xs text-gray-300 font-medium">Cash, bank, mobile money, and POS payments appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((p:any,i:number)=>(
                <Link key={p.id} href={`/dashboard/payments/${p.id}`}
                  className="inv-row-in flex items-center gap-4 bg-white rounded-2xl border border-gray-100 px-5 py-4 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                  style={{animationDelay:`${i*25}ms`}}>
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <Banknote className="w-4 h-4 text-teal-600"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{p.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 font-medium">{fmtDate(p.payment_date)}</span>
                      <span className="text-gray-200">·</span>
                      <span className="text-xs text-gray-400 font-medium">{METHOD[p.payment_method]??p.payment_method}</span>
                      {p.revenue_categories && (
                        <>
                          <span className="text-gray-200">·</span>
                          <span className="text-xs font-bold" style={{color:p.revenue_categories.color}}>{p.revenue_categories.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-black text-gray-900 group-hover:text-teal-600 transition-colors">
                    {fmt(Number(p.amount))}
                  </span>
                </Link>
              ))}
              <div className="flex justify-end pt-2">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</p>
                  <p className="text-lg font-black text-gray-900">{fmtFull(directTotal)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Files ─────────────────────────────────────────────────────────────── */}
      {tab==='files' && <ClientFilesTab clientId={id} initialFiles={files}/>}
    </div>
  )
}