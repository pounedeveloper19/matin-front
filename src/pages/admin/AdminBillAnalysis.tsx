import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, User, Building2, Zap, FlaskConical, BarChart3,
  ChevronRight, ChevronDown, ChevronUp, Activity, ShoppingCart, CheckCircle2, FileDown,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { lookupApi, type IdTitle } from '../../api/lookup'
import type { AdminRealCustomer, AdminLegalCustomer, AdvancedBillAnalysisResult, OptimalPurchaseCurveResult, PortfolioOptimizationResult } from '../../types'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import BillAnalysisPrintModal from '../../components/ui/BillAnalysisPrintModal'
import { constraintLabel } from '../../utils'

// ─── helpers ────────────────────────────────────────────────────────────────

const MONTHS = ['', 'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']

function jalaliYear(): number {
  const d = new Date(), m = d.getMonth() + 1, day = d.getDate()
  return (m > 3 || (m === 3 && day >= 20)) ? d.getFullYear() - 621 : d.getFullYear() - 622
}

const YEAR_OPTIONS = Array.from({ length: 3 }, (_, i) => jalaliYear() - 2 + i)
const rial = (n: number) => n.toLocaleString('fa-IR') + ' ریال'
const fmt  = (n: number) => n.toLocaleString('fa-IR', { maximumFractionDigits: 0 })
const smartRial = (n: number): string => {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' میلیارد ریال'
  if (n >= 1e6) return Math.round(n / 1e6).toLocaleString('fa-IR') + ' میلیون ریال'
  return n.toLocaleString('fa-IR', { maximumFractionDigits: 0 }) + ' ریال'
}

const INIT = {
  year: String(jalaliYear()), month: '1',
  consumptionMode: 'total' as 'split' | 'total',
  totalKwh: '', peakKwh: '', midKwh: '', lowKwh: '',
  contractDemandKw: '', actualDemandKw: '',
  bilateralKwh: '0', bilateralRate: '0',
  exchangeKwh: '0', exchangeRate: '0',
  greenLawKwh: '0', greenRate: '0',
}

// ─── Optimal Purchase Chart ──────────────────────────────────────────────────

function OptimalPurchaseLineChart({ data }: { data: OptimalPurchaseCurveResult }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [hoverIdx, setHoverIdx]       = useState<number | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  const { points, optimalContractCapacityKw: optKw, currentContractCapacityKw: curKw } = data
  if (!points.length) return null

  const minKw     = points[0].contractCapacityKw
  const maxKw     = points[points.length - 1].contractCapacityKw
  const maxSaving = Math.max(...points.map(p => p.savingRial), 1)
  const kwToPct   = (kw: number) => maxKw === minKw ? 50 : ((kw - minKw) / (maxKw - minKw)) * 100
  const optPct    = kwToPct(optKw)
  const curPct    = kwToPct(curKw)
  const hovered   = hoverIdx !== null ? points[hoverIdx] : null
  const hovPct    = hovered ? kwToPct(hovered.contractCapacityKw) : null
  const selected  = selectedIdx !== null ? points[selectedIdx] : null
  const selPct    = selected ? kwToPct(selected.contractCapacityKw) : null

  const segColor = (s: number) => {
    if (s <= 0) return '#ef4444'
    const r = s / maxSaving
    if (r < 0.35) return '#f97316'
    if (r < 0.65) return '#f59e0b'
    if (r < 0.88) return '#84cc16'
    return '#10b981'
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setHoverIdx(Math.round(pct * (points.length - 1)))
  }

  return (
    <div className="select-none space-y-4" dir="ltr">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-red-400">← کمترین سود</span>
        <span className="text-emerald-600">بیشترین سود →</span>
      </div>

      <div ref={trackRef} className="relative cursor-pointer" style={{ height: 64 }}
        onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIdx(null)}
        onClick={() => { if (hoverIdx !== null) setSelectedIdx(hoverIdx) }}>

        <div className="absolute inset-x-0 flex overflow-hidden"
          style={{ top: '50%', transform: 'translateY(-50%)', height: 22, borderRadius: 11 }}>
          {points.map((pt, i) => (
            <div key={i} style={{ flex: 1, background: segColor(pt.savingRial), opacity: hoverIdx === i ? 1 : 0.82 }} />
          ))}
        </div>

        <div className="absolute" style={{ left: `${optPct}%`, top: '50%', transform: 'translate(-50%,-50%)', zIndex: 20 }}>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-lg">
            <span className="text-base leading-none text-white">★</span>
          </div>
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700 shadow-sm">
            بهینه {optKw.toFixed(0)} kWh
          </div>
        </div>

        {Math.abs(curPct - optPct) > 4 && (
          <div className="absolute" style={{ left: `${curPct}%`, top: '50%', transform: 'translate(-50%,-50%)', zIndex: 15 }}>
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-500 shadow">
              <div className="h-2.5 w-2.5 rounded-full bg-white" />
            </div>
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold text-blue-500">فعلی</div>
          </div>
        )}

        {hovPct !== null && (
          <div className="pointer-events-none absolute inset-y-0 w-px bg-gray-700/40" style={{ left: `${hovPct}%` }} />
        )}
        {selPct !== null && (
          <div className="pointer-events-none absolute"
            style={{ left: `${selPct}%`, top: '50%', transform: 'translate(-50%,-50%)', zIndex: 30 }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-violet-600 shadow-lg ring-2 ring-violet-300">
              <span className="text-xs font-bold text-white">✓</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between text-[10px] text-gray-300">
        <span>{minKw.toFixed(0)} kW</span>
        <span>{maxKw.toFixed(0)} kW</span>
      </div>

      <div className="min-h-[60px] rounded-xl px-4 py-3" style={{ background: 'rgba(248,250,252,0.95)', border: '1px solid rgba(209,250,229,0.5)' }}>
        {hovered ? (
          <div className="flex flex-wrap items-start gap-x-6 gap-y-2 text-xs">
            <div>
              <p className="text-gray-400">خرید از بورس</p>
              <p className="text-sm font-bold text-gray-900">{hovered.contractCapacityKw.toFixed(0)} kWh</p>
            </div>
            <div>
              <p className="text-gray-400">هزینه با متین</p>
              <p className="font-bold text-blue-700">{hovered.withMatinBillRial.toLocaleString('fa-IR')} ریال</p>
            </div>
            <div>
              <p className={hovered.savingRial >= 0 ? 'text-emerald-500' : 'text-red-400'}>صرفه‌جویی</p>
              <p className={`text-sm font-bold ${hovered.savingRial >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {hovered.savingRial >= 0 ? '+' : ''}{hovered.savingRial.toLocaleString('fa-IR')} ریال
              </p>
            </div>
          </div>
        ) : (
          <p className="py-2 text-center text-xs text-gray-400">نشانگر را روی خط بکشید</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-right" dir="rtl">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
          <p className="text-[10px] font-semibold text-emerald-500">بهینه‌ترین خرید</p>
          <p className="mt-0.5 text-sm font-bold text-emerald-700">{optKw.toFixed(0)} kWh</p>
          <p className="text-[10px] text-emerald-400">صرفه: {data.optimalSavingRial.toLocaleString('fa-IR')} ر</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
          <p className="text-[10px] font-semibold text-blue-500">خرید فعلی از بورس</p>
          <p className="mt-0.5 text-sm font-bold text-blue-700">{curKw.toFixed(0)} kWh</p>
          <p className="text-[10px] text-blue-400">صرفه: {data.savingAtCurrentContractRial.toLocaleString('fa-IR')} ر</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
          <p className="text-[10px] font-semibold text-amber-500">پتانسیل بهبود</p>
          <p className="mt-0.5 text-sm font-bold text-amber-700">
            {(data.optimalSavingRial - data.savingAtCurrentContractRial) > 0
              ? `+${(data.optimalSavingRial - data.savingAtCurrentContractRial).toLocaleString('fa-IR')} ر`
              : 'در نقطه بهینه!'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Recommendation Card ─────────────────────────────────────────────────────

const ENERGY_LABEL: Record<string, string> = {
  exchange:  'بورس برق',
  green:     'برق سبز',
  bilateral: 'دوجانبه',
  grid:      'شبکه',
}

const ENERGY_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  exchange:  { bg: 'bg-violet-100', text: 'text-violet-700', dot: '#7c3aed' },
  green:     { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: '#059669' },
  bilateral: { bg: 'bg-blue-100', text: 'text-blue-700', dot: '#2563eb' },
  grid:      { bg: 'bg-gray-100', text: 'text-gray-600', dot: '#6b7280' },
}

function RecommendationCard({ rec, loading }: { rec: PortfolioOptimizationResult | null; loading: boolean }) {
  if (loading) return (
    <div className="glass-card overflow-hidden rounded-2xl">
      <div className="flex items-center gap-3 px-5 py-4" style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
        <span className="text-base">🤖</span>
        <h3 className="font-semibold text-gray-900">پیشنهاد بهینه‌سازی</h3>
      </div>
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
      </div>
    </div>
  )

  if (!rec) return null

  const mix = rec.optimalMix
  const total = mix.gridKwh + mix.exchangeKwh + mix.greenKwh + mix.bilateralKwh
  const mixItems = [
    { type: 'exchange',  kwh: mix.exchangeKwh  },
    { type: 'green',     kwh: mix.greenKwh     },
    { type: 'bilateral', kwh: mix.bilateralKwh },
    { type: 'grid',      kwh: mix.gridKwh      },
  ].filter(m => m.kwh > 0)

  return (
    <div className="glass-card overflow-hidden rounded-2xl" style={{ border: '2px solid #8b5cf6' }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
        style={{ background: 'linear-gradient(135deg,#4c1d95 0%,#6d28d9 100%)' }}>
        <div className="flex items-center gap-3">
          <span className="text-xl">🤖</span>
          <div>
            <h3 className="font-bold text-white">پیشنهاد بهینه‌سازی</h3>
          </div>
        </div>
        {rec.saving > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2">
            <span className="text-xs text-violet-200">صرفه‌جویی تخمینی</span>
            <span className="text-base font-black text-emerald-300">
              {rec.savingPercent.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}٪
            </span>
            <span className="text-xs font-bold text-white">
              ({(rec.saving / 1e6).toLocaleString('fa-IR', { maximumFractionDigits: 0 })} M ریال)
            </span>
          </div>
        )}
      </div>

      <div className="space-y-5 p-5">
        {/* Mix bar */}
        {total > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold text-gray-500">ترکیب پیشنهادی تامین انرژی</p>
            <div className="flex h-5 overflow-hidden rounded-full" style={{ gap: 2 }}>
              {mixItems.map(m => {
                const pct = (m.kwh / total) * 100
                const col = ENERGY_COLOR[m.type]
                return (
                  <div key={m.type} style={{ width: `${pct}%`, background: col.dot, minWidth: 4 }}
                    title={`${ENERGY_LABEL[m.type]}: ${pct.toFixed(1)}٪`} />
                )
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-3">
              {mixItems.map(m => {
                const pct = ((m.kwh / total) * 100).toFixed(1)
                const col = ENERGY_COLOR[m.type]
                return (
                  <div key={m.type} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${col.bg} ${col.text}`}>
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: col.dot }} />
                    {ENERGY_LABEL[m.type]}
                    <span className="font-mono">{m.kwh.toLocaleString('fa-IR', { maximumFractionDigits: 0 })} kWh ({pct}٪)</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Cost comparison */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl border border-red-100 bg-red-50 p-3">
            <p className="text-gray-400">بدون قرارداد</p>
            <p className="mt-0.5 font-bold text-red-700">{smartRial(rec.baselineCost)}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-gray-400">با قرارداد متین</p>
            <p className="mt-0.5 font-bold text-emerald-700">{smartRial(rec.totalCost)}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
            <p className="text-gray-400">صرفه‌جویی</p>
            <p className="mt-0.5 font-bold text-blue-700">{smartRial(rec.saving)}</p>
          </div>
        </div>

        {/* Reasoning list */}
        <div>
          <p className="mb-2 text-xs font-bold text-gray-500">دلایل تصمیم‌گیری</p>
          <div className="space-y-2">
            {rec.reasoning.map((r, i) => (
              <div key={i} className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${
                r.isActive
                  ? 'border border-emerald-200 bg-emerald-50'
                  : 'border border-gray-100 bg-gray-50'
              }`}>
                <span className="mt-0.5 shrink-0 text-base leading-none">
                  {r.isActive ? '✅' : '⏭️'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      ENERGY_COLOR[r.channel]?.bg ?? 'bg-gray-100'
                    } ${ENERGY_COLOR[r.channel]?.text ?? 'text-gray-600'}`}>
                      {ENERGY_LABEL[r.channel] ?? r.channel}
                    </span>
                  </div>
                  <p className={`mt-1 leading-relaxed ${r.isActive ? 'text-emerald-800' : 'text-gray-600'}`}>
                    {r.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Constraint hits */}
        {rec.constraintHits.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="mb-1.5 text-xs font-bold text-amber-700">محدودیت‌های اعمال‌شده</p>
            <ul className="space-y-1">
              {rec.constraintHits.map((c, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-amber-800">
                  <span>⚠️</span> {constraintLabel(c)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Stepper ─────────────────────────────────────────────────────────────────

function Stepper({ step }: { step: number }) {
  const steps = ['انتخاب مشتری', 'انتخاب شناسه', 'تحلیل و سفارش']
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const n = i + 1
        const done    = n < step
        const current = n === step
        return (
          <div key={n} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                done    ? 'bg-emerald-500 text-white' :
                current ? 'bg-[#1a4a2a] text-white shadow-lg ring-4 ring-[#1a4a2a]/20' :
                          'bg-gray-100 text-gray-400'
              }`}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : n}
              </div>
              <span className={`text-sm font-semibold ${current ? 'text-[#1a4a2a]' : done ? 'text-emerald-600' : 'text-gray-400'}`}>
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className="mx-3 h-4 w-4 text-gray-300" />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function AdminBillAnalysis() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1: Customer
  const [customerType, setCustomerType]       = useState<'real' | 'legal'>('real')
  const [searchTerm, setSearchTerm]           = useState('')
  const [customers, setCustomers]             = useState<any[]>([])
  const [customerLoading, setCustomerLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: number; name: string } | null>(null)

  // Step 2: Subscription
  const [subscriptions, setSubscriptions]   = useState<any[]>([])
  const [subLoading, setSubLoading]         = useState(false)
  const [selectedSubId, setSelectedSubId]   = useState<number | ''>('')
  const [selectedSub, setSelectedSub]       = useState<any>(null)

  // Step 3: Analysis
  const [form, setForm]             = useState(INIT)
  const [result, setResult]         = useState<AdvancedBillAnalysisResult | null>(null)
  const [loading, setLoading]       = useState(false)
  const [curveData, setCurveData]   = useState<OptimalPurchaseCurveResult | null>(null)
  const [curveLoading, setCurveLoading] = useState(false)
  const [showDetails, setShowDetails]   = useState(false)
  const [recommendation, setRecommendation]     = useState<PortfolioOptimizationResult | null>(null)
  const [recLoading, setRecLoading]             = useState(false)
  const [showPrint, setShowPrint]               = useState(false)

  // Order modal
  const [energyTypes, setEnergyTypes]   = useState<IdTitle[]>([])
  const [showOrderModal, setShowOM]     = useState(false)
  const [orderKwh, setOrderKwh]         = useState('')
  const [orderETypeId, setOrderETypeId] = useState<number | ''>('')
  const [orderPR, setOrderPR]           = useState(false)
  const [orderCreating, setOrderCreating] = useState(false)

  useEffect(() => {
    lookupApi.getEnergyTypes().then(r => { if (r.code === 200 && Array.isArray(r.result)) setEnergyTypes(r.result) })
  }, [])

  // ── Step 1: search customers ────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!searchTerm.trim()) { toast.error('عبارت جستجو را وارد کنید'); return }
    setCustomerLoading(true)
    try {
      if (customerType === 'real') {
        const r = await adminApi.getRealCustomers({ pageSize: 20, Search_Name: searchTerm, Search_IsActive: 'true' })
        const res = r.result as any
        setCustomers(res?.data ?? [])
      } else {
        const r = await adminApi.getLegalCustomers({ pageSize: 20, Search_CompanyName: searchTerm, Search_IsActive: 'true' })
        const res = r.result as any
        setCustomers(res?.data ?? [])
      }
    } catch { toast.error('خطا در جستجو') }
    finally { setCustomerLoading(false) }
  }

  const selectCustomer = (c: any) => {
    const name = customerType === 'real'
      ? `${c.firstName} ${c.lastName}`
      : c.companyName
    setSelectedCustomer({ id: c.id, name })
    setSubscriptions([]); setSelectedSubId(''); setSelectedSub(null)
    setStep(2)
    // Load subscriptions
    setSubLoading(true)
    adminApi.getBillAnalysisSubscriptions(c.id).then(r => {
      if (r.code === 200 && Array.isArray(r.result)) setSubscriptions(r.result)
    }).catch(() => toast.error('خطا در بارگذاری شناسه‌ها'))
      .finally(() => setSubLoading(false))
  }

  // ── Step 2: select subscription ─────────────────────────────────────────────
  const selectSub = (sub: any) => {
    setSelectedSubId(sub.id); setSelectedSub(sub)
    setResult(null); setCurveData(null); setForm(INIT)
    setStep(3)
  }

  // ── Step 3: run analysis ────────────────────────────────────────────────────
  const set = (k: keyof typeof INIT) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (form.consumptionMode === 'split' && (!form.peakKwh || !form.midKwh || !form.lowKwh))
      { toast.error('مصارف اوج/میان/کم‌بار را وارد کنید'); return }
    if (form.consumptionMode === 'total' && !form.totalKwh)
      { toast.error('مصرف کل را وارد کنید'); return }

    const req = {
      subscriptionId: selectedSubId as number,
      year: +form.year, month: +form.month,
      consumptionMode: form.consumptionMode,
      ...(form.consumptionMode === 'total'
        ? { totalKwh: +form.totalKwh }
        : { peakKwh: +form.peakKwh, midKwh: +form.midKwh, lowKwh: +form.lowKwh }),
      contractDemandKw: +form.contractDemandKw || 0,
      actualDemandKw:   +form.actualDemandKw   || 0,
      bilateralKwh: +form.bilateralKwh, bilateralRate: +form.bilateralRate,
      exchangeKwh:  +form.exchangeKwh,  exchangeRate:  +form.exchangeRate,
      greenLawKwh:  +form.greenLawKwh,  greenRate:     +form.greenRate,
      saveReport: true,
    }

    setLoading(true); setResult(null); setCurveData(null); setShowDetails(false)
    setRecommendation(null); setRecLoading(false)
    try {
      const res = await adminApi.adminAdvancedBillAnalysis(req)
      if (res.code === 200 && res.result) {
        const r = res.result as AdvancedBillAnalysisResult
        setResult(r)
        toast.success('تحلیل انجام شد')

        // Fetch recommendation and curve in parallel
        setRecLoading(true)
        adminApi.adminGetOptimalPortfolio({
          ...req,
          maxExchangeKwh: 0,
          greenAvailabilityKwh: 0,
          maxBilateralKwh: 0,
          operationalReserveKwh: 0,
        })
          .then(rr => { if (rr.code === 200 && rr.result) setRecommendation(rr.result) })
          .finally(() => setRecLoading(false))

        setCurveLoading(true)
        adminApi.adminAdvancedOptimalPurchaseCurve({
          subscriptionId: selectedSubId as number,
          year: +form.year, month: +form.month,
          consumptionMode: form.consumptionMode,
          ...(form.consumptionMode === 'total'
            ? { totalKwh: +form.totalKwh }
            : { peakKwh: +form.peakKwh, midKwh: +form.midKwh, lowKwh: +form.lowKwh }),
          contractDemandKw: +form.contractDemandKw || 0,
          actualDemandKw:   +form.actualDemandKw   || 0,
          bilateralKwh: +form.bilateralKwh, bilateralRate: +form.bilateralRate,
          exchangeKwh:  +form.exchangeKwh,  exchangeRate:  +form.exchangeRate,
          greenLawKwh:  +form.greenLawKwh,  greenRate:     +form.greenRate,
          saveReport: false,
        }).then(cr => {
          if (cr.code === 200 && cr.result) setCurveData(cr.result as OptimalPurchaseCurveResult)
        }).finally(() => setCurveLoading(false))
      } else { toast.error(res.message ?? res.caption ?? 'خطا در تحلیل') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setLoading(false) }
  }

  // ── Create order for customer ───────────────────────────────────────────────
  const handleCreateOrder = async () => {
    if (!orderETypeId || !orderKwh) { toast.error('نوع انرژی و مقدار را وارد کنید'); return }
    setOrderCreating(true)
    try {
      const r = await adminApi.createOrderForCustomer({
        subscriptionId: selectedSubId as number,
        requestedKwh: +orderKwh,
        energyTypeId: orderETypeId as number,
        isPriceRequest: orderPR,
      })
      if (r.code === 200) {
        toast.success('سفارش با موفقیت برای مشتری ثبت شد')
        setShowOM(false)
        navigate('/admin/orders')
      } else { toast.error(r.message ?? r.caption ?? 'خطا در ثبت سفارش') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setOrderCreating(false) }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">محاسبه تعرفه و سفارش</h2>
          <p className="mt-0.5 text-sm text-gray-500">آنالیز هزینه برق و ثبت سفارش برای مشتری</p>
        </div>
        <Stepper step={step} />
      </div>

      {/* ═══════════════ STEP 1: Customer ═══════════════ */}
      {step === 1 && (
        <div className="glass-card rounded-2xl p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e6f4ec]">
              <User className="h-4 w-4 text-[#1a4a2a]" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">انتخاب مشتری</h3>
              <p className="text-xs text-gray-500">مشتری را جستجو و انتخاب کنید</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4 flex gap-2">
            {(['real', 'legal'] as const).map(t => (
              <button key={t}
                onClick={() => { setCustomerType(t); setCustomers([]) }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  customerType === t
                    ? 'bg-[#1a4a2a] text-white shadow-sm'
                    : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}>
                {t === 'real' ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                {t === 'real' ? 'مشتری حقیقی' : 'مشتری حقوقی'}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex gap-3">
            <Input
              className="flex-1"
              placeholder={customerType === 'real' ? 'نام و نام خانوادگی...' : 'نام شرکت...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <Button loading={customerLoading} onClick={handleSearch}>
              <Search className="h-4 w-4" /> جستجو
            </Button>
          </div>

          {/* Results */}
          {customers.length > 0 && (
            <div className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
              {customers.map((c: AdminRealCustomer & AdminLegalCustomer) => {
                const name = customerType === 'real'
                  ? `${c.firstName} ${c.lastName}`
                  : c.companyName
                const sub = customerType === 'real' ? c.nationalCode : c.nationalId
                return (
                  <div key={c.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e6f4ec] text-sm font-bold text-[#1a4a2a]">
                        {name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{name}</p>
                        <p className="text-xs font-mono text-gray-400">{sub}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => selectCustomer(c)}>انتخاب</Button>
                  </div>
                )
              })}
            </div>
          )}

          {customers.length === 0 && !customerLoading && searchTerm && (
            <p className="mt-6 text-center text-sm text-gray-400">نتیجه‌ای یافت نشد</p>
          )}
        </div>
      )}

      {/* ═══════════════ STEP 2: Subscription ═══════════════ */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Customer banner */}
          {selectedCustomer && (
            <div className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: '#e6f4ec', border: '1px solid #a7f3d0' }}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a4a2a] text-sm font-bold text-white">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs text-emerald-600">مشتری انتخاب‌شده</p>
                  <p className="font-bold text-[#1a4a2a]">{selectedCustomer.name}</p>
                </div>
              </div>
              <button onClick={() => { setStep(1); setSelectedCustomer(null); setCustomers([]) }}
                className="text-xs text-emerald-700 hover:underline">تغییر مشتری</button>
            </div>
          )}

          <div className="glass-card rounded-2xl p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                <Zap className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">انتخاب شناسه</h3>
                <p className="text-xs text-gray-500">شناسه مورد نظر برای تحلیل را انتخاب کنید</p>
              </div>
            </div>

            {subLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1a4a2a] border-t-transparent" />
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center">
                <Zap className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">شناسه‌ای برای این مشتری یافت نشد</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {subscriptions.map((s: any) => (
                  <button key={s.id} onClick={() => selectSub(s)}
                    className={[
                      'rounded-xl border-2 p-4 text-right transition-all',
                      s.hasTariff
                        ? 'border-gray-200 bg-white hover:border-[#1a4a2a] hover:shadow-sm'
                        : 'border-amber-200 bg-amber-50/60 hover:border-amber-400',
                    ].join(' ')}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-sm font-bold text-gray-900">{s.billIdentifier}</p>
                      {!s.hasTariff && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                          بدون تعرفه
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{s.powerEntity}</p>
                    <p className="truncate text-xs text-gray-400">{s.mainAddress}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {s.contractCapacityKw != null && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          {s.contractCapacityKw.toLocaleString('fa-IR')} kW
                        </span>
                      )}
                      {!s.hasTariff && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-600">
                          ابتدا تعرفه را در پروفایل تنظیم کنید
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ STEP 3: Analysis ═══════════════ */}
      {step === 3 && (
        <div className="space-y-5">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-2">
            {selectedCustomer && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-2"
                style={{ background: '#e6f4ec', border: '1px solid #a7f3d0' }}>
                <span className="text-xs text-emerald-600">مشتری:</span>
                <span className="font-bold text-[#1a4a2a] text-sm">{selectedCustomer.name}</span>
                <button onClick={() => { setStep(1); setSelectedCustomer(null); setCustomers([]) }}
                  className="text-xs text-emerald-600 hover:underline mr-1">تغییر</button>
              </div>
            )}
            {selectedSub && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-2"
                style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span className="font-mono text-sm font-bold text-amber-800">{selectedSub.billIdentifier}</span>
                <button onClick={() => setStep(2)} className="text-xs text-amber-600 hover:underline mr-1">تغییر</button>
              </div>
            )}
          </div>

          {/* Analysis form */}
          <div className="glass-card overflow-hidden rounded-2xl">
            <div className="flex items-center gap-3 px-5 py-4" style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
              <FlaskConical className="h-4 w-4 text-[#1a4a2a]" />
              <h3 className="font-semibold text-gray-900">ورودی‌های تحلیل قبض</h3>
            </div>

            <div className="space-y-6 p-5">
              {/* Period */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">سال شمسی *</label>
                  <select value={form.year} onChange={set('year')}
                    className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#1a4a2a] focus:outline-none">
                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">ماه *</label>
                  <select value={form.month} onChange={set('month')}
                    className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#1a4a2a] focus:outline-none">
                    {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* Consumption */}
              <div>
                <p className="mb-2 text-xs font-bold text-gray-500">مصرف برق (kWh)</p>
                <div className="mb-3 flex gap-2">
                  {(['total', 'split'] as const).map(mode => (
                    <button key={mode} onClick={() => setForm(p => ({ ...p, consumptionMode: mode }))}
                      className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                        form.consumptionMode === mode
                          ? 'bg-[#1a4a2a] text-white shadow-sm'
                          : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}>
                      {mode === 'total' ? 'مصرف کل' : 'به تفکیک TOU'}
                    </button>
                  ))}
                </div>
                {form.consumptionMode === 'total' ? (
                  <Input label="مصرف کل *" value={form.totalKwh} onChange={set('totalKwh')} placeholder="kWh" inputMode="numeric" />
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Input label="میان بار *" value={form.midKwh}  onChange={set('midKwh')}  placeholder="kWh" inputMode="numeric" />
                    <Input label="اوج بار *"  value={form.peakKwh} onChange={set('peakKwh')} placeholder="kWh" inputMode="numeric" />
                    <Input label="کم بار *"   value={form.lowKwh}  onChange={set('lowKwh')}  placeholder="kWh" inputMode="numeric" />
                  </div>
                )}
              </div>

              {/* Demand */}
              <div>
                <p className="mb-2 text-xs font-bold text-gray-500">دیماند (kW)</p>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="دیماند قراردادی" value={form.contractDemandKw} onChange={set('contractDemandKw')} placeholder="kW" inputMode="numeric" />
                  <Input label="دیماند مصرفی"    value={form.actualDemandKw}   onChange={set('actualDemandKw')}   placeholder="kW" inputMode="numeric" />
                </div>
              </div>

              {/* Market energy */}
              <div>
                <p className="mb-2 text-xs font-bold text-gray-500">انرژی خریداری‌شده از بازار</p>
                <div className="space-y-3">
                  <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
                    <p className="mb-2 text-xs font-semibold text-blue-700">قرارداد دوجانبه</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="انرژی (kWh)"    value={form.bilateralKwh}  onChange={set('bilateralKwh')}  placeholder="0" inputMode="numeric" />
                      <Input label="نرخ (ریال/kWh)" value={form.bilateralRate} onChange={set('bilateralRate')} placeholder="0" inputMode="numeric" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-green-200 bg-green-50/60 p-3">
                    <p className="mb-2 text-xs font-semibold text-green-700">قانون جهش تولید (برق سبز)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="انرژی (kWh)"    value={form.greenLawKwh} onChange={set('greenLawKwh')} placeholder="0" inputMode="numeric" />
                      <Input label="نرخ (ریال/kWh)" value={form.greenRate}   onChange={set('greenRate')}   placeholder="0" inputMode="numeric" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-3">
                    <p className="mb-2 text-xs font-semibold text-orange-700">بورس برق</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="انرژی (kWh)"    value={form.exchangeKwh}  onChange={set('exchangeKwh')}  placeholder="0" inputMode="numeric" />
                      <Input label="نرخ (ریال/kWh)" value={form.exchangeRate} onChange={set('exchangeRate')} placeholder="0" inputMode="numeric" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button loading={loading} onClick={handleSubmit}>
                  <BarChart3 className="h-4 w-4" /> تحلیل قبض
                </Button>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center py-16">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#1a4a2a]/20 border-t-[#1a4a2a]" />
              <p className="font-semibold text-gray-500">در حال تحلیل قبض...</p>
            </div>
          )}

          {/* Empty state */}
          {!result && !loading && (
            <div className="flex flex-col items-center py-16 text-center">
              <BarChart3 className="mb-3 h-12 w-12 text-gray-300" />
              <p className="font-semibold text-gray-500">فرم را تکمیل کنید تا تحلیل انجام شود</p>
            </div>
          )}

          {/* ── Results ── */}
          {result && (() => {
            const r = result
            const maxB = Math.max(r.costWithoutMatin, r.costWithMatin, 1)
            return (
              <div className="space-y-4">
                {/* Summary header */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4 text-white"
                  style={{ background: 'linear-gradient(135deg,#0f2a18 0%,#1a4a2a 100%)' }}>
                  <div>
                    <p className="text-xs text-emerald-300">دوره مصرف</p>
                    <p className="mt-0.5 text-lg font-bold">{r.monthName} {r.year}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-300">مصرف کل</p>
                    <p className="mt-0.5 font-bold">{fmt(r.totalKwh)} kWh</p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-emerald-200">اوج {r.peakHoursPerDay}h</span>
                    <span className="text-emerald-200">میان {r.midHoursPerDay}h</span>
                    <span className="text-emerald-200">کم {r.lowHoursPerDay}h</span>
                  </div>
                </div>

                {/* Cost table */}
                <div className="overflow-hidden rounded-2xl" style={{ border: '2px solid #fbbf24' }}>
                  <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5">
                    <span className="text-sm font-bold text-amber-900">خروجی نهایی</span>
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr style={{ background: '#fefce8' }}>
                        <td className="px-4 py-3 font-semibold text-gray-700">هزینه بدون قرارداد</td>
                        <td className="px-4 py-3 text-left font-mono text-lg font-bold text-red-700 ltr">{rial(r.costWithoutMatin)}</td>
                      </tr>
                      <tr style={{ background: '#fefce8', borderTop: '1px solid #fde68a' }}>
                        <td className="px-4 py-3 font-semibold text-gray-700">هزینه با قرارداد متین</td>
                        <td className="px-4 py-3 text-left font-mono text-lg font-bold text-emerald-700 ltr">{rial(r.costWithMatin)}</td>
                      </tr>
                      <tr style={{ background: '#fef9c3', borderTop: '1px solid #fde047' }}>
                        <td className="px-4 py-3 font-bold text-gray-900">صرفه‌جویی</td>
                        <td className="px-4 py-3 text-left font-mono text-lg font-bold text-blue-700 ltr">{rial(r.netSaving)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(254,242,242,0.8)', border: '1px solid rgba(252,165,165,0.4)' }}>
                    <p className="text-xs font-semibold text-red-500">بدون قرارداد</p>
                    <p className="mt-1.5 text-xl font-bold text-red-700">{rial(r.costWithoutMatin)}</p>
                    <div className="mt-1.5 h-2 w-full rounded-full bg-red-100">
                      <div className="h-2 rounded-full bg-red-400" style={{ width: `${Math.min((r.costWithoutMatin / maxB) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(236,253,245,0.8)', border: '1px solid rgba(167,243,208,0.4)' }}>
                    <p className="text-xs font-semibold text-emerald-600">با قرارداد متین</p>
                    <p className="mt-1.5 text-xl font-bold text-emerald-700">{rial(r.costWithMatin)}</p>
                    <div className="mt-1.5 h-2 w-full rounded-full bg-emerald-100">
                      <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${Math.min((r.costWithMatin / maxB) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(239,246,255,0.8)', border: '1px solid rgba(147,197,253,0.4)' }}>
                    <p className="text-xs font-semibold text-blue-600">صرفه‌جویی</p>
                    <p className="mt-1.5 text-xl font-bold text-blue-700">{rial(r.netSaving)}</p>
                    <p className="text-sm font-semibold text-blue-600">{r.savingPercent.toLocaleString('fa-IR')}٪ کاهش</p>
                  </div>
                </div>

                {/* Recommendation card */}
                {(recommendation || recLoading) && (
                  <RecommendationCard rec={recommendation} loading={recLoading} />
                )}

                {/* Optimal purchase curve */}
                {(curveData || curveLoading) && (
                  <div className="glass-card overflow-hidden rounded-2xl">
                    <div className="flex items-center gap-3 px-5 py-4" style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                      <Activity className="h-4 w-4 text-violet-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">نمودار بهینه خرید از بورس</h3>
                        <p className="text-xs text-gray-400">بهینه‌ترین مقدار خرید از بورس برق — نشانگر موس را روی خط بکشید</p>
                      </div>
                    </div>
                    <div className="p-5">
                      {curveLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
                        </div>
                      ) : curveData ? (
                        <OptimalPurchaseLineChart data={curveData} />
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Details toggle */}
                <button onClick={() => setShowDetails(p => !p)}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                  <span>جزئیات محاسبه</span>
                  {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showDetails && (
                  <div className="glass-card overflow-hidden rounded-2xl p-5 text-xs">
                    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #e5e7eb' }}>
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 text-gray-500">
                            <th className="px-3 py-2 text-right font-semibold">بازه</th>
                            <th className="px-3 py-2 text-left font-semibold">تعرفه صنعتی</th>
                            <th className="px-3 py-2 text-left font-semibold text-orange-500">حداکثر بازار</th>
                            <th className="px-3 py-2 text-left font-semibold text-blue-500">متوسط بازار</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {[
                            { l: 'میان بار', t: r.tariffMidRial,  m: r.maxWholeMid  },
                            { l: 'اوج بار',  t: r.tariffPeakRial, m: r.maxWholePeak },
                            { l: 'کم بار',   t: r.tariffLowRial,  m: r.maxWholeLow  },
                          ].map(row => (
                            <tr key={row.l} className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-semibold text-gray-700">{row.l}</td>
                              <td className="px-3 py-2 text-left font-mono text-gray-800">{fmt(row.t)}</td>
                              <td className="px-3 py-2 text-left font-mono font-bold text-orange-600">{fmt(row.m)}</td>
                              <td className="px-3 py-2 text-left font-mono text-blue-600">{fmt(r.avgMarket)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPrint(true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-emerald-700 py-3.5 text-base font-bold text-emerald-800 transition hover:bg-emerald-50">
                    <FileDown className="h-5 w-5" />
                    خروجی PDF
                  </button>
                  <button
                    onClick={() => { setOrderKwh(String(Math.round(result.totalKwh))); setOrderETypeId(''); setOrderPR(false); setShowOM(true) }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-bold text-white shadow-md transition hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#0f2a18 0%,#1a4a2a 100%)' }}>
                    <ShoppingCart className="h-5 w-5" />
                    ثبت سفارش برای مشتری
                  </button>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── PDF Print Modal ── */}
      {showPrint && result && (
        <BillAnalysisPrintModal
          open={showPrint}
          onClose={() => setShowPrint(false)}
          result={result}
          recommendation={recommendation}
          customerName={selectedCustomer?.name}
          billIdentifier={selectedSub?.billIdentifier}
        />
      )}

      {/* ── Order Modal ── */}
      {showOrderModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-[#1a4a2a]" />
                <h2 className="font-bold text-gray-900">ثبت سفارش برای مشتری</h2>
              </div>
              <button onClick={() => setShowOM(false)} className="text-gray-400 hover:text-gray-600">
                <span className="text-xl leading-none">×</span>
              </button>
            </div>

            {/* Customer + subscription info */}
            <div className="mx-5 mt-4 space-y-2">
              {selectedCustomer && (
                <div className="flex items-center gap-2 rounded-lg bg-[#e6f4ec] px-3 py-2 text-sm">
                  <User className="h-4 w-4 text-[#1a4a2a]" />
                  <span className="font-semibold text-[#1a4a2a]">{selectedCustomer.name}</span>
                </div>
              )}
              {selectedSub && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold text-amber-800">{selectedSub.billIdentifier}</span>
                </div>
              )}
            </div>

            {/* Analysis summary */}
            <div className="mx-5 mt-3 overflow-hidden rounded-xl" style={{ border: '2px solid #fbbf24' }}>
              <div className="bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800">
                مبنای سفارش — تحلیل {result.monthName} {result.year}
              </div>
              <div className="grid grid-cols-3 divide-x divide-amber-100 text-center text-xs">
                <div className="px-3 py-2.5">
                  <p className="text-gray-400">بدون قرارداد</p>
                  <p className="mt-0.5 font-bold text-red-600">{smartRial(result.costWithoutMatin)}</p>
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-gray-400">با قرارداد متین</p>
                  <p className="mt-0.5 font-bold text-emerald-600">{smartRial(result.costWithMatin)}</p>
                </div>
                <div className="px-3 py-2.5 bg-amber-50/60">
                  <p className="text-gray-400">صرفه‌جویی</p>
                  <p className="mt-0.5 font-bold text-blue-700">{result.savingPercent.toFixed(1)}٪</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">نوع انرژی درخواستی *</label>
                <select className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-[#1a4a2a] focus:outline-none"
                  value={orderETypeId} onChange={e => setOrderETypeId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">انتخاب کنید...</option>
                  {energyTypes.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  مقدار انرژی (kWh) *
                  <span className="mr-2 text-xs font-normal text-gray-400">— از تحلیل: {result.totalKwh.toLocaleString('fa-IR')} kWh</span>
                </label>
                <input type="number" min="0"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-[#1a4a2a] focus:outline-none"
                  value={orderKwh} onChange={e => setOrderKwh(e.target.value)} />
              </div>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-gray-200 p-3 hover:bg-gray-50">
                <input type="checkbox" className="h-4 w-4 rounded accent-[#1a4a2a]"
                  checked={orderPR} onChange={e => setOrderPR(e.target.checked)} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">فقط استعلام قیمت</p>
                  <p className="text-xs text-gray-500">بدون تعهد خرید — برای اطلاع از قیمت</p>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t px-5 py-4">
              <button onClick={() => setShowOM(false)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                انصراف
              </button>
              <button onClick={handleCreateOrder} disabled={orderCreating}
                className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
                style={{ background: '#1a4a2a' }}>
                {orderCreating ? 'در حال ثبت...' : 'تایید و ثبت سفارش'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
