import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, TrendingDown, AlertTriangle, BarChart3, FlaskConical, ChevronDown, ChevronUp, ShoppingCart, Activity, FileDown, Tag, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { customerApi } from '../../api/customer'
import { lookupApi, type IdTitle } from '../../api/lookup'
import Button from '../../components/ui/Button'
import Input, { Select } from '../../components/ui/Input'
import HelpTooltip from '../../components/ui/HelpTooltip'
import BillAnalysisPrintModal from '../../components/ui/BillAnalysisPrintModal'
import type { SubscriptionResult, AdvancedBillAnalysisResult, OptimalPurchaseCurveResult, PortfolioOptimizationResult, CustomerTariffInfo, TariffCode, TariffCodeOption } from '../../types'
import { toArr, constraintLabel, MONTHS } from '../../utils'
import type { LastBillResult } from '../../types'

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

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="mt-1.5 h-2 w-full rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }}>
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ─── Optimal Purchase Line Chart ──────────────────────────────────────────────
function OptimalPurchaseLineChart({ data, onSelect }: { data: OptimalPurchaseCurveResult; onSelect?: (kWh: number | null) => void }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [hoverIdx, setHoverIdx]       = useState<number | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  const { points, optimalContractCapacityKw: optKw, currentContractCapacityKw: curKw } = data
  if (!points.length) return null

  const minKw     = points[0].contractCapacityKw
  const maxKw     = points[points.length - 1].contractCapacityKw
  const maxSaving = Math.max(...points.map(p => p.savingRial), 1)

  const kwToPct = (kw: number) =>
    maxKw === minKw ? 50 : ((kw - minKw) / (maxKw - minKw)) * 100

  const optPct   = kwToPct(optKw)
  const curPct   = kwToPct(curKw)
  const hovered  = hoverIdx !== null ? points[hoverIdx] : null
  const hovPct   = hovered ? kwToPct(hovered.contractCapacityKw) : null
  const selected    = selectedIdx !== null ? points[selectedIdx] : null
  const selectedPct = selected ? kwToPct(selected.contractCapacityKw) : null

  const segColor = (s: number) => {
    if (s <= 0)   return '#ef4444'
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

  const improve  = data.optimalSavingRial - data.savingAtCurrentContractRial
  const stepSize = points.length > 1 ? (maxKw - minKw) / (points.length - 1) : 1
  const isAtOptimal = Math.abs((hovered?.contractCapacityKw ?? -99) - optKw) < stepSize * 0.6

  return (
    <div className="select-none space-y-4 px-3" dir="ltr">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-red-400">← کمترین سود</span>
        <span className="text-emerald-600">بیشترین سود →</span>
      </div>

      <div ref={trackRef} className="relative cursor-pointer" style={{ height: 64 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
        onClick={() => { if (hoverIdx !== null) { setSelectedIdx(hoverIdx); onSelect?.(points[hoverIdx].contractCapacityKw) } }}>

        <div className="absolute inset-x-0 flex overflow-hidden"
          style={{ top: '50%', transform: 'translateY(-50%)', height: 22, borderRadius: 11 }}>
          {points.map((pt, i) => (
            <div key={i} style={{
              flex: 1, background: segColor(pt.savingRial),
              opacity: hoverIdx === i ? 1 : 0.82, transition: 'opacity 0.08s',
            }} />
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
        {hovPct !== null && hovered && (
          <div className="pointer-events-none absolute -translate-x-1/2"
            style={{ top: 3, left: `${hovPct}%`, zIndex: 25 }}>
            <div className="whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-bold text-white shadow-lg"
              style={{ background: hovered.savingRial >= 0 ? '#065f46' : '#991b1b' }}>
              {hovered.contractCapacityKw.toFixed(0)} kWh
            </div>
          </div>
        )}

        {selectedPct !== null && (
          <div className="pointer-events-none absolute"
            style={{ left: `${selectedPct}%`, top: '50%', transform: 'translate(-50%,-50%)', zIndex: 30 }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-violet-600 shadow-lg ring-2 ring-violet-300">
              <span className="text-xs font-bold text-white">✓</span>
            </div>
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold text-violet-500">انتخاب</div>
          </div>
        )}
      </div>

      <div className="flex justify-between text-[10px] text-gray-300">
        <span>{minKw.toFixed(0)} kWh</span>
        <span>{maxKw.toFixed(0)} kWh</span>
      </div>

      <div className="min-h-[72px] rounded-xl px-4 py-3 transition-all"
        style={{ background: 'rgba(248,250,252,0.95)', border: '1px solid rgba(209,250,229,0.5)' }}>
        {hovered ? (
          <div className="flex flex-wrap items-start gap-x-6 gap-y-2 text-xs">
            <div>
              <p className="text-gray-400">خرید از بورس</p>
              <p className="text-sm font-bold text-gray-900">{hovered.contractCapacityKw.toFixed(1)} kWh</p>
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
              {data.withoutMatinBillRial > 0 && (
                <p className="text-[10px] text-gray-400">
                  {((hovered.savingRial / data.withoutMatinBillRial) * 100).toFixed(1)}٪
                </p>
              )}
            </div>
            {isAtOptimal && (
              <div className="flex items-center">
                <span className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">★ بهینه‌ترین انتخاب!</span>
              </div>
            )}
          </div>
        ) : (
          <p className="py-3 text-center text-xs text-gray-400">نشانگر موس را روی خط بکشید تا سود هر سطح خرید از بورس را ببینید</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-right" dir="rtl">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
          <p className="text-[10px] font-semibold text-emerald-500">بهینه‌ترین خرید از بورس</p>
          <p className="mt-0.5 text-sm font-bold text-emerald-700">{optKw.toFixed(1)} kWh</p>
          <p className="text-[10px] text-emerald-400">صرفه: {data.optimalSavingRial.toLocaleString('fa-IR')} ر</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
          <p className="text-[10px] font-semibold text-blue-500">خرید فعلی از بورس</p>
          <p className="mt-0.5 text-sm font-bold text-blue-700">{curKw.toFixed(1)} kWh</p>
          <p className="text-[10px] text-blue-400">صرفه: {data.savingAtCurrentContractRial.toLocaleString('fa-IR')} ر</p>
        </div>
        <div className={`rounded-xl border p-3 ${improve > 0 ? 'border-amber-100 bg-amber-50' : 'border-emerald-100 bg-emerald-50'}`}>
          <p className={`text-[10px] font-semibold ${improve > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>پتانسیل بهبود</p>
          <p className={`mt-0.5 text-sm font-bold ${improve > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {improve > 0 ? `+${improve.toLocaleString('fa-IR')} ر` : 'در نقطه بهینه!'}
          </p>
        </div>
      </div>

      {selected && (
        <div className="rounded-xl border-2 border-violet-200 p-4" style={{ background: 'rgba(245,243,255,0.95)' }} dir="rtl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-violet-500">خرید انتخاب‌شده از بورس</p>
              <p className="mt-0.5 text-lg font-bold text-violet-900">{selected.contractCapacityKw.toFixed(1)} kWh</p>
              <p className="text-[10px] text-violet-400">
                صرفه:{' '}
                {selected.savingRial >= 0 ? '+' : ''}{selected.savingRial.toLocaleString('fa-IR')} ریال
              </p>
            </div>
            <button onClick={() => { setSelectedIdx(null); onSelect?.(null) }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-violet-500 transition-colors hover:bg-violet-100">
              پاک کردن
            </button>
          </div>
        </div>
      )}
      {!selected && (
        <p className="text-center text-[10px] text-gray-300">روی هر نقطه از خط کلیک کنید تا آن سطح خرید را انتخاب کنید</p>
      )}
    </div>
  )
}

// ─── Portfolio Recommendation Card ───────────────────────────────────────────

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

function PortfolioCard({ rec, loading }: { rec: PortfolioOptimizationResult | null; loading: boolean }) {
  if (loading) return (
    <div className="glass-card overflow-hidden rounded-2xl">
      <div className="flex items-center gap-3 px-5 py-4" style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
        <span className="text-base">🤖</span>
        <h3 className="font-semibold text-gray-900">پیشنهاد ترکیب بهینه خرید</h3>
      </div>
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
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
    <div className="glass-card overflow-hidden rounded-2xl" style={{ border: '2px solid #059669' }}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
        style={{ background: 'linear-gradient(135deg,#065f46 0%,#047857 100%)' }}>
        <div className="flex items-center gap-3">
          <span className="text-xl">🤖</span>
          <div>
            <h3 className="font-bold text-white">پیشنهاد ترکیب بهینه خرید</h3>
          </div>
        </div>
        {rec.saving > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2">
            <span className="text-xs text-emerald-200">صرفه‌جویی بیشینه</span>
            <span className="text-base font-black text-yellow-300">
              {rec.savingPercent.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}٪
            </span>
            <span className="text-xs font-bold text-white">
              ({(rec.saving / 1e6).toLocaleString('fa-IR', { maximumFractionDigits: 0 })} M ریال)
            </span>
          </div>
        )}
      </div>

      <div className="space-y-5 p-5">
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

        <div>
          <p className="mb-2 text-xs font-bold text-gray-500">دلایل تصمیم‌گیری</p>
          <div className="space-y-2">
            {rec.reasoning.map((r, i) => (
              <div key={i} className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${
                r.isActive
                  ? 'border border-emerald-200 bg-emerald-50'
                  : 'border border-gray-100 bg-gray-50'
              }`}>
                <span className="mt-0.5 shrink-0 text-base leading-none">{r.isActive ? '✅' : '⏭️'}</span>
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

const INIT = {
  year: String(jalaliYear()), month: '1',
  consumptionMode: 'total' as 'split' | 'total',
  totalKwh: '', peakKwh: '', midKwh: '', lowKwh: '',
  contractDemandKw: '', actualDemandKw: '',
  bilateralKwh: '0', bilateralRate: '0',
  exchangeKwh: '0', exchangeRate: '0',
  greenLawKwh: '0', greenRate: '0',
}

export default function CustomerBills() {
  const navigate = useNavigate()
  const [subscriptions, setSubscriptions] = useState<SubscriptionResult[]>([])
  const [selectedSubId, setSelectedSubId] = useState<number | ''>('')
  const [form, setForm]       = useState(INIT)
  const [result, setResult]   = useState<AdvancedBillAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [curveData, setCurveData]       = useState<OptimalPurchaseCurveResult | null>(null)
  const [curveLoading, setCurveLoading] = useState(false)
  const [energyTypes, setETypes]        = useState<IdTitle[]>([])
  const [showOrderModal, setShowOM]       = useState(false)
  const [orderRegKwh, setOrderRegKwh]   = useState('')
  const [orderGrnKwh, setOrderGrnKwh]   = useState('')
  const [orderIncReg, setOrderIncReg]   = useState(true)
  const [orderIncGrn, setOrderIncGrn]   = useState(false)
  const [orderPR, setOrderPR]           = useState(false)
  const [orderCreating, setOrderCr]     = useState(false)
  const [selectedCurveKwh, setSelectedCurveKwh] = useState<number | null>(null)
  const [portfolio, setPortfolio]     = useState<PortfolioOptimizationResult | null>(null)
  const [portLoading, setPortLoading] = useState(false)
  const [showPrint, setShowPrint]     = useState(false)
  const [lastBill, setLastBill]       = useState<LastBillResult | null>(null)
  const [lastBillLoading, setLBLoad]  = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [tariffInfo, setTariffInfo]         = useState<CustomerTariffInfo | null>(null)
  const [tariffLoading, setTariffLoading]   = useState(false)
  const [editingTariff, setEditingTariff]   = useState(false)
  const [tariffCodes, setTariffCodes]       = useState<TariffCode[]>([])
  const [tariffOptions, setTariffOptions]   = useState<TariffCodeOption[]>([])
  const [selTariffCodeId, setSelTariffCodeId] = useState<number>(0)
  const [selOptionId, setSelOptionId]         = useState<number | null>(null)
  const [savingTariff, setSavingTariff]       = useState(false)

  useEffect(() => {
    customerApi.getCustomer().then(r => {
      if (r.code === 200 && r.result) {
        const c = r.result as any
        setCustomerName(c.companyName ?? (c.firstName ? `${c.firstName} ${c.lastName ?? ''}`.trim() : ''))
      }
    }).catch(() => {})
    lookupApi.getTariffCodes().then(r => { if (r.code === 200) setTariffCodes(toArr(r.result)) })
  }, [])

  useEffect(() => {
    if (!selTariffCodeId) { setTariffOptions([]); return }
    lookupApi.getTariffCodeOptions(selTariffCodeId).then(r => {
      if (r.code === 200) setTariffOptions(toArr(r.result))
    })
  }, [selTariffCodeId])

  // تعرفه‌ی معتبر برای دوره‌ی انتخاب‌شده (سال/ماه) را می‌خواند — ماه به ماه فرق دارد
  useEffect(() => {
    if (selectedSubId === '' || !form.year || !form.month) return
    setEditingTariff(false)
    setTariffLoading(true)
    customerApi.getTariffForMonth(+form.year, +form.month)
      .then(r => {
        if (r.code === 200) {
          const t = r.result ?? null
          setTariffInfo(t)
          setSelTariffCodeId(t?.tariffCodeId ?? 0)
          setSelOptionId(t?.tariffCodeOptionId ?? null)
        }
      })
      .finally(() => setTariffLoading(false))
  }, [selectedSubId, form.year, form.month])

  const handleSaveTariffForMonth = async () => {
    if (!selOptionId) return
    setSavingTariff(true)
    try {
      const res = await customerApi.setTariffForMonth(+form.year, +form.month, selOptionId)
      if (res.code === 200) {
        toast.success('تعرفه این ماه ذخیره شد')
        setEditingTariff(false)
        const option = tariffOptions.find(o => o.id === selOptionId)
        const code = tariffCodes.find(c => c.id === selTariffCodeId)
        setTariffInfo({
          tariffCodeOptionId: selOptionId,
          tariffCodeId: selTariffCodeId,
          tariffCodeTitle: code?.title ?? null,
          tariffCodeOptionTitle: option?.title ?? null,
        })
      } else toast.error(res.message ?? res.caption ?? 'خطا در ذخیره تعرفه')
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSavingTariff(false) }
  }

  useEffect(() => {
    customerApi.getSubscriptions().then(r => {
      if (r.code === 200) {
        const arr = toArr(r.result)
        setSubscriptions(arr)
        if (arr.length === 1) setSelectedSubId(arr[0].id)
      }
    })
    lookupApi.getEnergyTypes().then(r => { if (r.code === 200) setETypes(toArr(r.result)) })
  }, [])

  const set = (k: keyof typeof INIT) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }))

  const handleCreateOrder = async () => {
    const regularEType = energyTypes.find(t => !t.title.includes('سبز'))
    const greenEType   = energyTypes.find(t => t.title.includes('سبز'))
    const tasks: Array<Promise<void>> = []
    if (orderIncReg && +orderRegKwh > 0 && regularEType) {
      tasks.push(customerApi.createOrder({
        subscriptionId: selectedSubId as number,
        requestedKwh: +orderRegKwh,
        energyTypeId: regularEType.id,
        isPriceRequest: orderPR,
      }).then(r => { if (r.code !== 200) throw new Error(r.message ?? 'خطا در ثبت سفارش برق عادی') }))
    }
    if (orderIncGrn && +orderGrnKwh > 0 && greenEType) {
      tasks.push(customerApi.createOrder({
        subscriptionId: selectedSubId as number,
        requestedKwh: +orderGrnKwh,
        energyTypeId: greenEType.id,
        isPriceRequest: orderPR,
      }).then(r => { if (r.code !== 200) throw new Error(r.message ?? 'خطا در ثبت سفارش برق سبز') }))
    }
    if (tasks.length === 0) { toast.error('حداقل یک نوع انرژی را انتخاب کنید'); return }
    setOrderCr(true)
    try {
      await Promise.all(tasks)
      toast.success('سفارش با موفقیت ثبت شد')
      setShowOM(false)
      navigate('/customer/orders', { state: { analysis: result } })
    } catch (err: any) { toast.error(err.message ?? 'خطا در ارتباط با سرور') }
    finally { setOrderCr(false) }
  }

  const handleSubmit = async () => {
    if (!selectedSubId) { toast.error('ابتدا شناسه را انتخاب کنید'); return }
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

    setLoading(true); setResult(null); setShowDetails(false); setCurveData(null); setCurveLoading(false); setSelectedCurveKwh(null); setPortfolio(null); setPortLoading(false)
    try {
      const res = await customerApi.advancedBillAnalysis(req)
      if (res.code === 200 && res.result) {
        const analysisResult = res.result as AdvancedBillAnalysisResult
        setResult(analysisResult)
        toast.success('تحلیل قبض انجام شد')
        // Fetch optimal purchase curve and portfolio recommendation in parallel
        setCurveLoading(true)
        customerApi.advancedOptimalPurchaseCurve(req).then(cr => {
          if (cr.code === 200 && cr.result) setCurveData(cr.result as OptimalPurchaseCurveResult)
        }).finally(() => setCurveLoading(false))

        setPortLoading(true)
        customerApi.getOptimalPortfolio({
          ...req,
          maxExchangeKwh: 0,
          greenAvailabilityKwh: 0,
          maxBilateralKwh: 0,
          operationalReserveKwh: 0,
        }).then(pr => {
          if (pr.code === 200 && pr.result) setPortfolio(pr.result as PortfolioOptimizationResult)
        }).finally(() => setPortLoading(false))
      } else { toast.error(res.message ?? res.caption ?? 'خطا در تحلیل') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setLoading(false) }
  }

  const selectedSub = subscriptions.find(s => s.id === selectedSubId)

  return (
    <div className="space-y-6">
      {/* انتخاب شناسه */}
      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Zap className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-gray-900">انتخاب شناسه</h3>
        </div>
        <div className="p-5">
          {subscriptions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-emerald-200 py-8 text-center">
              <Zap className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">شناسه‌ای یافت نشد</p>
              <p className="mt-1 text-xs text-gray-400">ابتدا از بخش پروفایل آدرس اضافه کنید</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subscriptions.map(s => (
                <button key={s.id}
                  onClick={() => {
                    setSelectedSubId(s.id); setResult(null); setCurveData(null); setSelectedCurveKwh(null); setLastBill(null)
                    setLBLoad(true)
                    customerApi.getLastBill(s.id)
                      .then(r => {
                        if (r.code === 200 && r.result) {
                          const lb = r.result
                          setLastBill(lb)
                          setForm({
                            year:  String(lb.year),
                            month: String(lb.month),
                            consumptionMode: 'split',
                            totalKwh: '',
                            peakKwh: String(lb.peakCons ?? ''),
                            midKwh:  String(lb.midCons  ?? ''),
                            lowKwh:  String(lb.lowCons  ?? ''),
                            contractDemandKw: String(lb.contractDemandKw ?? ''),
                            actualDemandKw:   String(lb.actualDemandKw   ?? ''),
                            bilateralKwh:  String(lb.bilateralKwh  ?? 0),
                            bilateralRate: String(lb.bilateralRate ?? 0),
                            exchangeKwh:   String(lb.exchangeKwh   ?? 0),
                            exchangeRate:  String(lb.exchangeRate  ?? 0),
                            greenLawKwh:   String(lb.greenLawKwh   ?? 0),
                            greenRate:     String(lb.greenRate     ?? 0),
                          })
                          toast.success(`اطلاعات ${MONTHS[(lb.month ?? 1) - 1]} ${lb.year} بارگذاری شد`, { duration: 2500 })
                        }
                      })
                      .finally(() => setLBLoad(false))
                  }}
                  className={`rounded-xl p-4 text-right transition-all ${
                    selectedSubId === s.id
                      ? 'border-2 border-emerald-500 bg-emerald-50 shadow-sm'
                      : 'border-2 border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  <p className="font-mono text-sm font-bold text-gray-900">{s.billIdentifier}</p>
                  <p className="mt-1 text-xs text-gray-500">{s.powerEntity}</p>
                  <p className="truncate text-xs text-gray-400">{s.mainAddress}</p>
                  {s.contractCapacityKw != null && (
                    <span className="mt-2 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      {s.contractCapacityKw.toLocaleString('fa-IR')} kW
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedSubId !== '' && (
        <>
          {selectedSub && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-2.5"
              style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
              <Zap className="h-4 w-4 shrink-0 text-amber-500" />
              <span className="text-xs font-semibold text-amber-800">{selectedSub.billIdentifier}</span>
              <span className="text-xs text-amber-600">{selectedSub.powerEntity} · {selectedSub.mainAddress}</span>
              {lastBillLoading && (
                <span className="mr-auto flex items-center gap-1.5 text-xs text-amber-600">
                  <span className="h-3 w-3 animate-spin rounded-full border border-amber-500 border-t-transparent" />
                  در حال بارگذاری...
                </span>
              )}
              {lastBill && !lastBillLoading && (
                <span className="mr-auto text-xs text-amber-600">
                  ↩ اطلاعات {MONTHS[(lastBill.month ?? 1) - 1]} {lastBill.year} بارگذاری شد
                </span>
              )}
            </div>
          )}

          {/* فرم ورودی */}
          <div className="glass-card overflow-hidden rounded-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
              <div className="flex items-center gap-3">
                <FlaskConical className="h-4 w-4 text-emerald-700" />
                <h3 className="font-semibold text-gray-900">ورودی‌های تحلیل قبض</h3>
              </div>
              {!editingTariff && (
                tariffLoading ? (
                  <span className="text-xs text-gray-400">در حال بارگذاری تعرفه...</span>
                ) : tariffInfo ? (
                  <div className="flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
                    <Tag className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-violet-400">تعرفه {MONTHS[+form.month - 1]}:</span>
                    {tariffInfo.tariffCodeTitle}
                    {tariffInfo.tariffCodeOptionTitle && <span> — {tariffInfo.tariffCodeOptionTitle}</span>}
                    <button onClick={() => setEditingTariff(true)}
                      className="mr-1 flex items-center gap-1 font-bold text-violet-500 hover:text-violet-700">
                      <Pencil className="h-3 w-3" /> تغییر
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditingTariff(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100">
                    تعرفه {MONTHS[+form.month - 1]} تنظیم نشده — تنظیم تعرفه
                  </button>
                )
              )}
            </div>

            {editingTariff && (
              <div className="flex flex-wrap items-end gap-3 border-b border-violet-100 bg-violet-50/50 px-5 py-4">
                <div className="min-w-[180px] flex-1">
                  <Select label={`کد تعرفه — ${MONTHS[+form.month - 1]} ${form.year}`} value={selTariffCodeId || ''}
                    options={tariffCodes.map(c => ({ value: c.id, label: `${c.code} — ${c.title}` }))}
                    onChange={(v) => { setSelTariffCodeId(+v); setSelOptionId(null) }} />
                </div>
                <div className="min-w-[160px] flex-1">
                  <Select label="گزینه تعرفه" value={selOptionId ?? ''}
                    options={tariffOptions.map(o => ({ value: o.id, label: o.title }))}
                    onChange={(v) => setSelOptionId(+v || null)}
                    disabled={!selTariffCodeId || tariffOptions.length === 0} />
                </div>
                <Button variant="secondary" onClick={() => {
                  setEditingTariff(false)
                  setSelTariffCodeId(tariffInfo?.tariffCodeId ?? 0)
                  setSelOptionId(tariffInfo?.tariffCodeOptionId ?? null)
                }}>انصراف</Button>
                <Button loading={savingTariff} onClick={handleSaveTariffForMonth} disabled={!selOptionId}>
                  ذخیره تعرفه این ماه
                </Button>
              </div>
            )}

            <div className="space-y-6 p-5">
              {/* دوره */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">سال شمسی *</label>
                  <select value={form.year} onChange={set('year')}
                    className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none">
                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">ماه *</label>
                  <select value={form.month} onChange={set('month')}
                    className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none">
                    {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* مصرف */}
              <div>
                <p className="mb-2 text-xs font-bold text-gray-500">مصرف برق (kWh)</p>
                <div className="mb-3 flex gap-2">
                  {(['total', 'split'] as const).map(mode => (
                    <button key={mode} onClick={() => setForm(p => ({ ...p, consumptionMode: mode }))}
                      className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                        form.consumptionMode === mode
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}>
                      {mode === 'total' ? 'مصرف کل' : 'به تفکیک TOU'}
                    </button>
                  ))}
                </div>
                {form.consumptionMode === 'total' ? (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">مصرف کل *</span>
                      <HelpTooltip pageKey="bill-optimal" fieldKey="totalKwh" />
                    </div>
                    <Input value={form.totalKwh} onChange={set('totalKwh')}
                      placeholder="kWh — سیستم بر اساس ساعات TOU توزیع می‌کند" inputMode="numeric" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {([
                      { fk: 'midKwh',  lbl: 'میان بار *',  key: 'midKwh'  as const },
                      { fk: 'peakKwh', lbl: 'اوج بار *',   key: 'peakKwh' as const },
                      { fk: 'lowKwh',  lbl: 'کم بار *',    key: 'lowKwh'  as const },
                    ]).map(({ fk, lbl, key }) => (
                      <div key={fk}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">{lbl}</span>
                          <HelpTooltip pageKey="bill-optimal" fieldKey={fk} />
                        </div>
                        <Input value={form[key]} onChange={set(key)} placeholder="kWh" inputMode="numeric" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* دیماند */}
              <div>
                <p className="mb-2 text-xs font-bold text-gray-500">دیماند (kW)</p>
                <div className="grid grid-cols-2 gap-4">
                  {([
                    { fk: 'contractDemandKw', lbl: 'دیماند قراردادی', key: 'contractDemandKw' as const },
                    { fk: 'actualDemandKw',   lbl: 'دیماند مصرفی',    key: 'actualDemandKw'   as const },
                  ]).map(({ fk, lbl, key }) => (
                    <div key={fk}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">{lbl}</span>
                        <HelpTooltip pageKey="bill-optimal" fieldKey={fk} />
                      </div>
                      <Input value={form[key]} onChange={set(key)} placeholder="kW" inputMode="numeric" />
                    </div>
                  ))}
                </div>
              </div>

              {/* انرژی بازار */}
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

          {/* نتایج */}
          {result && (() => {
            const r = result
            const maxB = Math.max(r.costWithoutMatin, r.costWithMatin, 1)
            return (
              <div className="space-y-4">
                {/* هدر */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4 text-white"
                  style={{ background: 'linear-gradient(135deg,#065f46 0%,#064e3b 100%)' }}>
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
                  {r.greenPercent > 0 && (
                    <div className="rounded-lg bg-emerald-800/60 px-3 py-1.5 text-xs">
                      مشمول جهش: {fmt(r.greenSubjectKwh)} kWh ({(r.greenPercent * 100).toFixed(0)}٪)
                    </div>
                  )}
                </div>

                {/* ── خروجی نهایی — مثل تب Excel ── */}
                <div className="overflow-hidden rounded-2xl" style={{ border: '2px solid #fbbf24' }}>
                  <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5">
                    <span className="text-sm font-bold text-amber-900">خروجی نهایی</span>
                    <HelpTooltip pageKey="bill_result" fieldKey="output_summary" />
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr style={{ background: '#fefce8' }}>
                        <td className="px-4 py-3 font-semibold text-gray-700">جمع کل هزینه برق قبل از قرارداد</td>
                        <td className="px-4 py-3 text-right text-lg font-bold text-red-700">{rial(r.costWithoutMatin)}</td>
                      </tr>
                      <tr style={{ background: '#fefce8', borderTop: '1px solid #fde68a' }}>
                        <td className="px-4 py-3 font-semibold text-gray-700">جمع کل هزینه برق بعد از قرارداد</td>
                        <td className="px-4 py-3 text-right text-lg font-bold text-emerald-700">{rial(r.costWithMatin)}</td>
                      </tr>
                      <tr style={{ background: '#fef9c3', borderTop: '1px solid #fde047' }}>
                        <td className="px-4 py-3 font-bold text-gray-900">صرفه‌جویی حاصل از قرارداد</td>
                        <td className="px-4 py-3 text-right text-lg font-bold text-blue-700">{rial(r.netSaving)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* ── نمودار مقایسه هزینه ── */}
                {(() => {
                  const bars = [
                    { label: 'بهای انرژی', before: r.energyBeforeRial, after: r.energyAfterRial },
                    ...(r.article16BeforeRial > 0 || r.article16AfterRial > 0 ? [{ label: 'ماده ۱۶', before: r.article16BeforeRial, after: r.article16AfterRial }] : []),
                    ...((r.bilateralBillRial + r.exchangeBillRial + r.greenBillRial) > 0 ? [{ label: 'صورتحساب‌ها', before: 0, after: r.bilateralBillRial + r.exchangeBillRial + r.greenBillRial }] : []),
                  ]
                  const maxVal = Math.max(...bars.flatMap(b => [b.before, b.after]), 1)
                  const W = 560
                  const barH = 22
                  const gap = 10
                  const rowH = barH * 2 + gap + 20
                  const chartH = bars.length * rowH + 20
                  const labelW = 90
                  const chartUnitLabel = maxVal >= 1e9 ? 'میلیارد ریال' : 'میلیون ریال'
                  const chartFmt = (v: number) => maxVal >= 1e9
                    ? (v / 1e9).toFixed(2)
                    : Math.round(v / 1e6).toLocaleString('fa-IR')

                  return (
                    <div className="glass-card overflow-hidden rounded-2xl">
                      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
                        <BarChart3 className="h-4 w-4 text-emerald-700" />
                        <span className="text-sm font-bold text-gray-700">نمودار مقایسه هزینه</span>
                        <span className="text-xs text-gray-400">({chartUnitLabel})</span>
                        <HelpTooltip pageKey="bill_result" fieldKey="output_compare_chart" />
                        <div className="mr-auto flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-red-400"></span>بدون قرارداد</span>
                          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-emerald-500"></span>با قرارداد</span>
                        </div>
                      </div>
                      <div className="overflow-x-auto p-4">
                        <svg width="100%" viewBox={`0 0 ${W} ${chartH}`} style={{ direction: 'ltr', minWidth: 320 }}>
                          {bars.map((b, i) => {
                            const y = i * rowH + 10
                            const beforeW = (b.before / maxVal) * (W - labelW - 10)
                            const afterW  = (b.after  / maxVal) * (W - labelW - 10)
                            return (
                              <g key={b.label}>
                                <text x={labelW - 6} y={y + barH / 2 + 5} textAnchor="end" fontSize={11} fill="#6b7280">{b.label}</text>
                                {/* before bar */}
                                <rect x={labelW} y={y} width={Math.max(beforeW, 2)} height={barH} rx={4} fill="#f87171" opacity={0.85} />
                                {b.before > 0 && (beforeW > W - labelW - 28
                                  ? <text x={labelW + Math.max(beforeW, 2) - 4} y={y + barH / 2 + 4} textAnchor="end" fontSize={9} fill="#fff" fontWeight="600">{chartFmt(b.before)}</text>
                                  : <text x={labelW + Math.max(beforeW, 2) + 4} y={y + barH / 2 + 4} fontSize={9} fill="#b91c1c">{chartFmt(b.before)}</text>
                                )}
                                {/* after bar */}
                                <rect x={labelW} y={y + barH + 4} width={Math.max(afterW, 2)} height={barH} rx={4} fill="#34d399" opacity={0.85} />
                                {b.after > 0 && (afterW > W - labelW - 28
                                  ? <text x={labelW + Math.max(afterW, 2) - 4} y={y + barH + 4 + barH / 2 + 4} textAnchor="end" fontSize={9} fill="#fff" fontWeight="600">{chartFmt(b.after)}</text>
                                  : <text x={labelW + Math.max(afterW, 2) + 4} y={y + barH + 4 + barH / 2 + 4} fontSize={9} fill="#065f46">{chartFmt(b.after)}</text>
                                )}
                              </g>
                            )
                          })}
                        </svg>
                      </div>
                    </div>
                  )
                })()}

                {/* ── نمودار بهینه خرید ظرفیت ── */}
                {(curveData || curveLoading) && (
                  <div className="overflow-hidden rounded-2xl" style={{ border: '2px solid #7c3aed', boxShadow: '0 4px 24px rgba(124,58,237,0.10)' }}>
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                      style={{ background: 'linear-gradient(135deg,#4c1d95 0%,#6d28d9 60%,#7c3aed 100%)' }}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                          <Activity className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white">نمودار بهینه خرید از بورس برق</h3>
                          <p className="text-xs text-violet-200">روی خط بکشید تا سود هر سطح خرید را ببینید، سپس کلیک کنید تا انتخاب شود</p>
                        </div>
                      </div>
                      <HelpTooltip pageKey="bill_result" fieldKey="output_optimal_chart" />
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-4 border-b border-violet-100 bg-violet-50 px-5 py-2.5 text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-violet-700">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white shadow">★</span>
                        نقطه بهینه — بیشترین سود
                      </span>
                      <span className="flex items-center gap-1.5 font-semibold text-blue-600">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
                          <span className="h-2 w-2 rounded-full bg-white" />
                        </span>
                        سطح فعلی قرارداد
                      </span>
                      <span className="flex items-center gap-1.5 font-semibold text-violet-600">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white shadow ring-2 ring-violet-300">✓</span>
                        انتخاب شما
                      </span>
                      <span className="mr-auto flex items-center gap-1 text-gray-400">
                        <span className="h-2.5 w-8 rounded-full bg-gradient-to-l from-emerald-500 to-red-400 opacity-80" />
                        رنگ = میزان سودآوری
                      </span>
                    </div>

                    {/* Chart */}
                    <div className="bg-white p-5">
                      {curveLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-violet-400">
                          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
                          <p className="mt-3 text-xs">در حال محاسبه نقطه بهینه...</p>
                        </div>
                      ) : curveData ? (
                        <OptimalPurchaseLineChart data={curveData} onSelect={setSelectedCurveKwh} />
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Portfolio recommendation */}
                {(portfolio || portLoading) && (
                  <PortfolioCard rec={portfolio} loading={portLoading} />
                )}

                {/* کارت‌های خلاصه */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-700">خلاصه مالی</span>
                  <HelpTooltip pageKey="bill_result" fieldKey="output_saving_cards" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(254,242,242,0.8)', border: '1px solid rgba(252,165,165,0.4)' }}>
                    <p className="text-xs font-semibold text-red-500">بدون قرارداد متین</p>
                    <p className="mt-1.5 text-xl font-bold text-red-700">{rial(r.costWithoutMatin)}</p>
                    <Bar value={r.costWithoutMatin} max={maxB} color="bg-red-400" />
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(236,253,245,0.8)', border: '1px solid rgba(167,243,208,0.4)' }}>
                    <p className="text-xs font-semibold text-emerald-600">با قرارداد متین</p>
                    <p className="mt-1.5 text-xl font-bold text-emerald-700">{rial(r.costWithMatin)}</p>
                    <Bar value={r.costWithMatin} max={maxB} color="bg-emerald-400" />
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(239,246,255,0.8)', border: '1px solid rgba(147,197,253,0.4)' }}>
                    <p className="text-xs font-semibold text-blue-600">صرفه‌جویی</p>
                    <p className="mt-1.5 text-xl font-bold text-blue-700">{rial(r.netSaving)}</p>
                    <p className="text-sm font-semibold text-blue-600">{r.savingPercent.toLocaleString('fa-IR')}٪ کاهش</p>
                  </div>
                </div>

                {/* صورتحساب دو ستون */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-700">جزئیات صورتحساب</span>
                  <HelpTooltip pageKey="bill_result" fieldKey="output_invoice_detail" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl p-4" style={{ background: 'rgba(254,242,242,0.5)', border: '1px solid rgba(252,165,165,0.3)' }}>
                    <p className="mb-3 text-xs font-bold text-red-600">هزینه بدون قرارداد متین</p>
                    <table className="w-full text-xs">
                      <tbody className="divide-y divide-red-100">
                        <tr>
                          <td className="py-1.5 text-gray-500">بهای انرژی</td>
                          <td className="py-1.5 text-left text-gray-700">{fmt(r.energyBeforeRial)}</td>
                        </tr>
                        {r.article16BeforeRial > 0 && (
                          <tr>
                            <td className="py-1.5 text-gray-500">مابه التفاوت ماده ۱۶</td>
                            <td className="py-1.5 text-left text-purple-600">{fmt(r.article16BeforeRial)}</td>
                          </tr>
                        )}
                        {r.regulatoryBeforeRial > 0 && (
                          <tr>
                            <td className="py-1.5 text-gray-500">مابه التفاوت اجرای مقررات</td>
                            <td className="py-1.5 text-left text-orange-600">{fmt(r.regulatoryBeforeRial)}</td>
                          </tr>
                        )}
                        <tr style={{ background: 'rgba(254,242,242,0.8)' }}>
                          <td className="py-2 font-bold text-red-700">جمع کل</td>
                          <td className="py-2 text-left font-bold text-red-700">{rial(r.costWithoutMatin)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-xl p-4" style={{ background: 'rgba(236,253,245,0.5)', border: '1px solid rgba(167,243,208,0.3)' }}>
                    <p className="mb-3 text-xs font-bold text-emerald-700">هزینه با قرارداد متین</p>
                    <table className="w-full text-xs">
                      <tbody className="divide-y divide-emerald-100">
                        <tr>
                          <td className="py-1.5 text-gray-500">بهای انرژی شبکه</td>
                          <td className="py-1.5 text-left text-gray-700">{fmt(r.energyAfterRial)}</td>
                        </tr>
                        {r.article16AfterRial > 0 && (
                          <tr>
                            <td className="py-1.5 text-gray-500">مابه التفاوت ماده ۱۶</td>
                            <td className="py-1.5 text-left text-purple-600">{fmt(r.article16AfterRial)}</td>
                          </tr>
                        )}
                        {r.regulatoryAfterRial > 0 && (
                          <tr>
                            <td className="py-1.5 text-gray-500">مابه التفاوت اجرای مقررات</td>
                            <td className="py-1.5 text-left text-orange-600">{fmt(r.regulatoryAfterRial)}</td>
                          </tr>
                        )}
                        {r.creditRial < 0 && (
                          <tr>
                            <td className="py-1.5 text-emerald-600">بستانکاری</td>
                            <td className="py-1.5 text-left font-semibold text-emerald-700">{fmt(r.creditRial)}</td>
                          </tr>
                        )}
                        {r.bilateralBillRial > 0 && (
                          <tr>
                            <td className="py-1.5 text-blue-600">صورتحساب دوجانبه</td>
                            <td className="py-1.5 text-left text-blue-700">{fmt(r.bilateralBillRial)}</td>
                          </tr>
                        )}
                        {r.exchangeBillRial > 0 && (
                          <tr>
                            <td className="py-1.5 text-indigo-600">صورتحساب بورس</td>
                            <td className="py-1.5 text-left text-indigo-700">{fmt(r.exchangeBillRial)}</td>
                          </tr>
                        )}
                        {r.greenBillRial > 0 && (
                          <tr>
                            <td className="py-1.5 text-amber-600">صورتحساب برق سبز</td>
                            <td className="py-1.5 text-left text-amber-700">{fmt(r.greenBillRial)}</td>
                          </tr>
                        )}
                        <tr style={{ background: 'rgba(236,253,245,0.8)' }}>
                          <td className="py-2 font-bold text-emerald-700">جمع کل</td>
                          <td className="py-2 text-left font-bold text-emerald-700">{rial(r.costWithMatin)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* بنر نتیجه */}
                {r.netSaving > 0 ? (
                  <div className="flex items-center gap-3 rounded-2xl px-6 py-5 text-white"
                    style={{ background: 'linear-gradient(135deg,#065f46,#047857)' }}>
                    <TrendingDown className="h-6 w-6 shrink-0" />
                    <div>
                      <p className="text-lg font-bold">با برق متین {rial(r.netSaving)} صرفه‌جویی می‌کنید!</p>
                      <p className="mt-0.5 text-sm text-emerald-100">معادل {r.savingPercent.toLocaleString('fa-IR')}٪ کاهش هزینه</p>
                    </div>
                  </div>
                ) : r.netSaving < 0 ? (
                  <div className="flex items-center gap-3 rounded-2xl px-6 py-4"
                    style={{ background: 'rgba(254,243,199,0.7)', border: '1px solid rgba(252,211,77,0.3)' }}>
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                    <p className="text-sm font-medium text-amber-700">در این ماه هزینه با قرارداد بیشتر از بدون قرارداد است.</p>
                  </div>
                ) : null}

                {/* دکمه‌ها */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPrint(true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-emerald-700 py-3.5 text-base font-bold text-emerald-800 transition hover:bg-emerald-50 active:scale-[0.99]">
                    <FileDown className="h-5 w-5" />
                    خروجی PDF
                  </button>
                  <button
                    onClick={() => {
                      const base = Math.round(selectedCurveKwh ?? result.totalKwh)
                      const grnKwh = Math.round(base * 0.04)
                      const regKwh = base - grnKwh
                      setOrderRegKwh(String(regKwh))
                      setOrderGrnKwh(String(grnKwh))
                      setOrderIncReg(true)
                      setOrderIncGrn(true)
                      setOrderPR(false)
                      setShowOM(true)
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-bold text-white shadow-md transition hover:opacity-90 active:scale-[0.99]"
                    style={{ background: 'linear-gradient(135deg,#065f46 0%,#047857 100%)' }}>
                    <ShoppingCart className="h-5 w-5" />
                    ثبت سفارش خرید برق
                  </button>
                </div>

                {/* جزئیات فنی (قابل بسط) */}
                <button onClick={() => setShowDetails(p => !p)}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100">
                  <span>جزئیات محاسبه</span>
                  {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showDetails && (
                  <div className="glass-card overflow-hidden rounded-2xl">
                    <div className="space-y-5 p-5">
                      <div>
                        <p className="mb-2 text-xs font-bold text-gray-500">نرخ‌ها (ریال/kWh)</p>
                        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #e5e7eb' }}>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50 text-gray-500">
                                <th className="px-3 py-2 text-right font-semibold">بازه</th>
                                <th className="px-3 py-2 text-left font-semibold">تعرفه صنعتی</th>
                                <th className="px-3 py-2 text-left font-semibold text-orange-500">حداکثر بازار (×ضریب)</th>
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
                                  <td className="px-3 py-2 text-left text-gray-800">{fmt(row.t)}</td>
                                  <td className="px-3 py-2 text-left font-bold text-orange-600">{fmt(row.m)}</td>
                                  <td className="px-3 py-2 text-left text-blue-600">{fmt(r.avgMarket)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-bold text-gray-500">توزیع انرژی (kWh)</p>
                        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #e5e7eb' }}>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50 text-gray-500">
                                <th className="px-3 py-2 text-right font-semibold">بازه</th>
                                <th className="px-3 py-2 text-left font-semibold">مصرف</th>
                                <th className="px-3 py-2 text-left font-semibold text-blue-500">انرژی بازار</th>
                                <th className="px-3 py-2 text-left font-semibold text-emerald-600">باقیمانده شبکه</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {[
                                { l: 'میان بار', c: r.midKwh,  m: r.marketEnergyMid,  rem: r.remainingMid  },
                                { l: 'اوج بار',  c: r.peakKwh, m: r.marketEnergyPeak, rem: r.remainingPeak },
                                { l: 'کم بار',   c: r.lowKwh,  m: r.marketEnergyLow,  rem: r.remainingLow  },
                              ].map(row => (
                                <tr key={row.l} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 font-semibold text-gray-700">{row.l}</td>
                                  <td className="px-3 py-2 text-left text-gray-600">{fmt(row.c)}</td>
                                  <td className="px-3 py-2 text-left font-semibold text-blue-600">{fmt(row.m)}</td>
                                  <td className="px-3 py-2 text-left font-bold text-emerald-700">{fmt(row.rem)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {loading && (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
              <p className="font-semibold text-gray-500">در حال تحلیل قبض...</p>
            </div>
          )}
          {!result && !loading && (
            <div className="flex flex-col items-center py-16 text-center">
              <BarChart3 className="mb-3 h-12 w-12 text-gray-300" />
              <p className="font-semibold text-gray-500">فرم را تکمیل کنید تا تحلیل انجام شود</p>
              <p className="mt-1 text-sm text-gray-400">مقایسه دقیق هزینه بر اساس نرخ تعرفه و انرژی خریداری‌شده از بازار</p>
            </div>
          )}
        </>
      )}

      {selectedSubId === '' && subscriptions.length > 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <Zap className="mb-3 h-10 w-10 text-gray-300" />
          <p className="font-semibold text-gray-500">یک شناسه را از بالا انتخاب کنید</p>
        </div>
      )}

      {/* ── PDF Print Modal ── */}
      {showPrint && result && (
        <BillAnalysisPrintModal
          open={showPrint}
          onClose={() => setShowPrint(false)}
          result={result}
          recommendation={portfolio}
          billIdentifier={selectedSub?.billIdentifier}
          customerName={customerName || undefined}
        />
      )}

      {/* ── Order Confirmation Modal ── */}
      {showOrderModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
                <h2 className="font-bold text-gray-900">تایید و ثبت سفارش</h2>
              </div>
              <button onClick={() => setShowOM(false)} className="text-gray-400 hover:text-gray-600">
                <span className="text-xl leading-none">×</span>
              </button>
            </div>

            {/* Analysis summary */}
            <div className="mx-5 mt-4 overflow-hidden rounded-xl" style={{ border: '2px solid #fbbf24' }}>
              <div className="bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800">
                مبنای سفارش — تحلیل {result.monthName} {result.year}
              </div>
              <div className="grid grid-cols-3 divide-x divide-amber-100 text-center text-xs">
                <div className="px-3 py-2.5" style={{ direction: 'rtl' }}>
                  <p className="text-gray-400">بدون قرارداد</p>
                  <p className="mt-0.5 font-bold text-red-600">{smartRial(result.costWithoutMatin)}</p>
                </div>
                <div className="px-3 py-2.5" style={{ direction: 'rtl' }}>
                  <p className="text-gray-400">با قرارداد متین</p>
                  <p className="mt-0.5 font-bold text-emerald-600">{smartRial(result.costWithMatin)}</p>
                </div>
                <div className="px-3 py-2.5 bg-amber-50/60" style={{ direction: 'rtl' }}>
                  <p className="text-gray-400">صرفه‌جویی</p>
                  <p className="mt-0.5 font-bold text-blue-700">{result.savingPercent.toFixed(1)}٪</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 px-5 py-4">
              {(() => {
                const totalKwh = (+orderRegKwh || 0) + (+orderGrnKwh || 0)
                const regPct = totalKwh > 0 ? Math.round((+orderRegKwh / totalKwh) * 100) : 0
                const grnPct = totalKwh > 0 ? 100 - regPct : 0
                return (
                  <>
                    {/* برق عادی */}
                    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${orderIncReg ? 'border-violet-200 bg-violet-50' : 'border-gray-200 bg-gray-50 opacity-55'}`}>
                      <input type="checkbox" className="h-4 w-4 shrink-0 accent-violet-600"
                        checked={orderIncReg}
                        onChange={e => setOrderIncReg(e.target.checked)} />
                      <div className="flex flex-1 items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-800">برق عادی</p>
                          <p className="text-xs text-gray-500">بورس + دوجانبه</p>
                        </div>
                        <div className="text-left">
                          <p className="text-base font-bold text-violet-700">{(+orderRegKwh).toLocaleString('fa-IR')} kWh</p>
                          <p className="text-xs font-semibold text-violet-400">{regPct}٪ از کل</p>
                        </div>
                      </div>
                    </label>

                    {/* برق سبز */}
                    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${orderIncGrn ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50 opacity-55'}`}>
                      <input type="checkbox" className="h-4 w-4 shrink-0 accent-emerald-600"
                        checked={orderIncGrn}
                        onChange={e => setOrderIncGrn(e.target.checked)} />
                      <div className="flex flex-1 items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-800">برق سبز</p>
                          <p className="text-xs text-gray-500">تجدیدپذیر</p>
                        </div>
                        <div className="text-left">
                          <p className="text-base font-bold text-emerald-700">{(+orderGrnKwh).toLocaleString('fa-IR')} kWh</p>
                          <p className="text-xs font-semibold text-emerald-400">{grnPct}٪ از کل</p>
                        </div>
                      </div>
                    </label>
                  </>
                )
              })()}

              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-gray-200 p-3 hover:bg-gray-50">
                <input type="checkbox" className="h-4 w-4 rounded accent-emerald-600"
                  checked={orderPR}
                  onChange={e => setOrderPR(e.target.checked)} />
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
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
                {orderCreating ? 'در حال ثبت...' : 'تایید و ثبت سفارش'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
