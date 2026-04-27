import { useEffect, useRef, useState } from 'react'
import {
  Zap, TrendingDown, AlertTriangle, BarChart3,
  ChevronDown, ChevronUp, History, RefreshCw, Target,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { customerApi } from '../../api/customer'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import type { BillAnalysisResult, BillBand, SubscriptionResult } from '../../types'
import { toArr } from '../../utils'

const MONTHS = [
  '', 'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
]

function jalaliYear(): number {
  const d = new Date()
  const m = d.getMonth() + 1
  const day = d.getDate()
  return (m > 3 || (m === 3 && day >= 20)) ? d.getFullYear() - 621 : d.getFullYear() - 622
}

const CURRENT_JALALI_YEAR = jalaliYear()
const YEAR_OPTIONS = Array.from({ length: 3 }, (_, i) => CURRENT_JALALI_YEAR - 2 + i)

const rial = (n: number) => n.toLocaleString('fa-IR') + ' ریال'
const kwh  = (n: number) => n.toLocaleString('fa-IR') + ' kWh'

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="h-2 w-full rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }}>
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function BandRow({ band }: { band: BillBand }) {
  const [open, setOpen] = useState(false)
  const hasExcess  = band.excessKwh > 0
  const hasDeficit = band.deficitKwh > 0

  return (
    <div className="overflow-hidden rounded-xl" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(209,250,229,0.5)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-right transition-colors hover:bg-emerald-50/30"
      >
        <div className="flex items-center gap-3">
          <div className={`h-2 w-2 rounded-full ${hasExcess ? 'bg-red-500' : hasDeficit ? 'bg-amber-400' : 'bg-emerald-500'}`} />
          <span className="text-sm font-semibold text-gray-900">{band.name}</span>
          <span className="text-xs text-gray-400">{kwh(band.actualKwh)}</span>
        </div>
        <div className="flex items-center gap-3">
          {hasExcess  && <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">جریمه: {rial(band.penaltyRial)}</span>}
          {hasDeficit && <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">بستانکاری: {rial(band.creditRial)}</span>}
          {!hasExcess && !hasDeficit && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">در محدوده</span>}
          {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3" style={{ background: 'rgba(236,253,245,0.4)', borderTop: '1px solid rgba(209,250,229,0.4)' }}>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
            <div><p className="text-[10px] text-gray-400">مصرف واقعی</p><p className="font-semibold text-gray-700">{kwh(band.actualKwh)}</p></div>
            <div><p className="text-[10px] text-gray-400">ظرفیت قراردادی</p><p className="font-semibold text-gray-700">{kwh(band.contractedKwh)}</p></div>
            <div><p className="text-[10px] text-gray-400">مازاد</p><p className={`font-semibold ${band.excessKwh > 0 ? 'text-red-600' : 'text-gray-400'}`}>{kwh(band.excessKwh)}</p></div>
            <div><p className="text-[10px] text-gray-400">کسری</p><p className={`font-semibold ${band.deficitKwh > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{kwh(band.deficitKwh)}</p></div>
            <div><p className="text-[10px] text-gray-400">نرخ بازار</p><p className="font-semibold text-gray-700">{band.marketRateRial.toLocaleString('fa-IR')} ر/kWh</p></div>
            <div><p className="text-[10px] text-gray-400">نرخ جریمه (×۱.۳)</p><p className="font-semibold text-gray-700">{(band.marketRateRial * 1.3).toLocaleString('fa-IR', { maximumFractionDigits: 0 })} ر/kWh</p></div>
            <div><p className="text-[10px] text-gray-400">جریمه مازاد</p><p className={`font-semibold ${band.penaltyRial > 0 ? 'text-red-600' : 'text-gray-400'}`}>{rial(band.penaltyRial)}</p></div>
            <div><p className="text-[10px] text-gray-400">بستانکاری (×۰.۷۵)</p><p className={`font-semibold ${band.creditRial > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>{rial(band.creditRial)}</p></div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="w-20">واقعی</span>
              <Bar value={band.actualKwh} max={Math.max(band.actualKwh, band.contractedKwh)} color="bg-blue-400" />
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="w-20">قراردادی</span>
              <Bar value={band.contractedKwh} max={Math.max(band.actualKwh, band.contractedKwh)} color="bg-gray-300" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TouOptimalChart({ bands }: { bands: BillBand[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const W = 520, H = 210
  const ml = 54, mr = 12, mt = 20, mb = 48
  const chartW = W - ml - mr
  const chartH = H - mt - mb
  const n = bands.length
  const bw = chartW / n
  const barHalfW = Math.min(bw * 0.27, 20)

  const maxKwh = Math.max(...bands.flatMap(b => [b.actualKwh, b.contractedKwh]), 1) * 1.18
  const toY = (v: number) => chartH - (v / maxKwh) * chartH

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ v: maxKwh * f, y: toY(maxKwh * f) }))

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const hovered = hoveredIdx !== null ? bands[hoveredIdx] : null

  return (
    <div
      ref={containerRef}
      className="relative select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredIdx(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 210 }}>
        <defs>
          <pattern id="opt-stripe" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.35" />
          </pattern>
        </defs>

        {/* Grid lines + Y labels */}
        {ticks.map(({ v, y }, ti) => (
          <g key={ti}>
            <line
              x1={ml} y1={mt + y} x2={W - mr} y2={mt + y}
              stroke="#e5e7eb" strokeWidth="1"
              strokeDasharray={ti === 0 ? undefined : '3,3'}
            />
            <text x={ml - 5} y={mt + y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">
              {Math.round(v).toLocaleString('fa-IR')}
            </text>
          </g>
        ))}

        {/* Bars per band */}
        {bands.map((band, i) => {
          const hasExcess  = band.excessKwh  > 0
          const hasDeficit = band.deficitKwh > 0
          const isOptimal  = !hasExcess && !hasDeficit

          const cx = ml + (i + 0.5) * bw
          const actualY   = toY(band.actualKwh)
          const contractY = toY(band.contractedKwh)
          const barFill   = hasExcess ? '#ef4444' : hasDeficit ? '#f59e0b' : '#10b981'

          return (
            <g key={i}>
              {/* Hover highlight zone */}
              <rect
                x={ml + i * bw + 2} y={mt}
                width={bw - 4} height={chartH}
                fill={hoveredIdx === i ? 'rgba(99,102,241,0.05)' : 'transparent'}
                rx={4}
                onMouseEnter={() => setHoveredIdx(i)}
              />

              {/* Actual bar */}
              <rect
                x={cx - barHalfW} y={mt + actualY}
                width={barHalfW * 2} height={chartH - actualY}
                fill={barFill} rx={3}
                opacity={hoveredIdx === i ? 1 : 0.82}
              />

              {/* Contracted level — dashed reference line */}
              <line
                x1={ml + i * bw + 5} y1={mt + contractY}
                x2={ml + (i + 1) * bw - 5} y2={mt + contractY}
                stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4,2"
              />

              {/* Optimal point dot */}
              <circle
                cx={cx} cy={mt + contractY}
                r={isOptimal ? 5 : 4}
                fill={isOptimal ? '#10b981' : '#6366f1'}
                stroke="white" strokeWidth={1.5}
              />
              {isOptimal && (
                <circle
                  cx={cx} cy={mt + contractY} r={9}
                  fill="none" stroke="#10b981" strokeWidth={1} opacity={0.35}
                />
              )}

              {/* Deviation label above the shorter of the two */}
              <text
                x={cx} y={mt + Math.min(actualY, contractY) - 6}
                textAnchor="middle" fontSize="9" fill={barFill} fontWeight="bold"
              >
                {hasExcess
                  ? `+${band.excessKwh.toFixed(0)}`
                  : hasDeficit
                  ? `-${band.deficitKwh.toFixed(0)}`
                  : '✓'}
              </text>

              {/* X-axis band label */}
              <text
                x={cx} y={H - mb + 15}
                textAnchor="middle" fontSize="10"
                fill={hoveredIdx === i ? '#1f2937' : '#6b7280'}
                fontWeight={hoveredIdx === i ? 'bold' : 'normal'}
              >
                {band.name}
              </text>
            </g>
          )
        })}

        {/* Legend */}
        <g transform={`translate(${ml}, ${H - 10})`}>
          <rect width="8" height="8" fill="#10b981" rx="1" />
          <text x="11" y="7.5" fontSize="8" fill="#6b7280">بهینه</text>
          <rect x="42" width="8" height="8" fill="#ef4444" rx="1" />
          <text x="53" y="7.5" fontSize="8" fill="#6b7280">مازاد</text>
          <rect x="84" width="8" height="8" fill="#f59e0b" rx="1" />
          <text x="95" y="7.5" fontSize="8" fill="#6b7280">کسری</text>
          <line x1="122" y1="4" x2="138" y2="4" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4,2" />
          <circle cx="130" cy="4" r="3" fill="#6366f1" stroke="white" strokeWidth="1" />
          <text x="142" y="7.5" fontSize="8" fill="#6b7280">نقطه بهینه (قراردادی)</text>
        </g>
      </svg>

      {/* Floating tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute z-50 rounded-xl border border-indigo-100 bg-white p-3 shadow-xl"
          style={{
            width: 204,
            left: mousePos.x > (containerRef.current?.offsetWidth ?? 400) * 0.62
              ? mousePos.x - 216
              : mousePos.x + 14,
            top: Math.max(4, mousePos.y - 115),
          }}
        >
          <p className="mb-2 border-b border-gray-100 pb-1.5 text-xs font-bold text-gray-900">{hovered.name}</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">مصرف واقعی</span>
              <span className="font-semibold text-gray-800">{hovered.actualKwh.toLocaleString('fa-IR')} kWh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-500">● نقطه بهینه</span>
              <span className="font-semibold text-indigo-700">{hovered.contractedKwh.toLocaleString('fa-IR')} kWh</span>
            </div>
            {hovered.excessKwh > 0 && (
              <>
                <div className="border-t border-red-50 pt-1" />
                <div className="flex justify-between">
                  <span className="text-red-500">مازاد مصرف</span>
                  <span className="font-semibold text-red-700">+{hovered.excessKwh.toLocaleString('fa-IR')} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-500">جریمه (×۱.۳)</span>
                  <span className="font-semibold text-red-700">{hovered.penaltyRial.toLocaleString('fa-IR')} ریال</span>
                </div>
              </>
            )}
            {hovered.deficitKwh > 0 && (
              <>
                <div className="border-t border-amber-50 pt-1" />
                <div className="flex justify-between">
                  <span className="text-amber-500">کسری</span>
                  <span className="font-semibold text-amber-700">-{hovered.deficitKwh.toLocaleString('fa-IR')} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-500">بستانکاری (×۰.۷۵)</span>
                  <span className="font-semibold text-emerald-700">{hovered.creditRial.toLocaleString('fa-IR')} ریال</span>
                </div>
              </>
            )}
            {hovered.excessKwh === 0 && hovered.deficitKwh === 0 && (
              <p className="mt-1 rounded-lg bg-emerald-50 px-2 py-1 text-center font-semibold text-emerald-600">
                ★ در نقطه بهینه هستید!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CustomerBills() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionResult[]>([])
  const [selectedSubId, setSelectedSubId] = useState<number | ''>('')
  const [form, setForm] = useState({
    year: String(CURRENT_JALALI_YEAR), month: '1',
    peakKwh: '', midKwh: '', lowKwh: '', fridayPeakKwh: '0',
  })
  const [result, setResult]   = useState<BillAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [histLoading, setHistLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'analyze' | 'history'>('analyze')

  useEffect(() => {
    customerApi.getSubscriptions().then((r) => {
      if (r.code === 200) {
        const arr = toArr(r.result)
        setSubscriptions(arr)
        if (arr.length === 1) setSelectedSubId(arr[0].id)
      }
    })
  }, [])

  useEffect(() => {
    if (!selectedSubId) return
    setHistLoading(true)
    customerApi.getBillHistory(selectedSubId as number)
      .then((r) => { if (r.code === 200) setHistory(toArr(r.result)); else setHistory([]) })
      .finally(() => setHistLoading(false))
  }, [selectedSubId])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const handleAnalyze = async () => {
    if (!selectedSubId) { toast.error('ابتدا اشتراک را انتخاب کنید'); return }
    if (!form.peakKwh || !form.midKwh || !form.lowKwh) { toast.error('مصارف TOU را وارد کنید'); return }
    setLoading(true); setResult(null)
    try {
      const res = await customerApi.manualBillAnalysis({
        subscriptionId: selectedSubId as number, year: +form.year, month: +form.month,
        peakKwh: +form.peakKwh, midKwh: +form.midKwh, lowKwh: +form.lowKwh, fridayPeakKwh: +form.fridayPeakKwh,
      })
      if (res.code === 200 && res.result) {
        setResult(res.result as BillAnalysisResult); toast.success('تحلیل قبض انجام شد')
        const h = await customerApi.getBillHistory(selectedSubId as number)
        if (h.code === 200 && Array.isArray(h.result)) setHistory(h.result)
      } else { toast.error(res.message ?? res.caption ?? 'خطا در تحلیل') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setLoading(false) }
  }

  const selectedSub = subscriptions.find(s => s.id === selectedSubId)
  const maxBill = result ? Math.max(result.withoutMatinBillRial, result.withMatinBillRial, 1) : 1

  return (
    <div className="space-y-6">
      {/* انتخاب اشتراک */}
      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Zap className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-gray-900">انتخاب اشتراک</h3>
        </div>

        <div className="p-5">
          {subscriptions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-emerald-200 py-8 text-center">
              <Zap className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">اشتراکی یافت نشد</p>
              <p className="mt-1 text-xs text-gray-400">ابتدا از بخش پروفایل آدرس اضافه کنید تا اشتراک تعریف شود</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subscriptions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedSubId(s.id); setResult(null) }}
                  className={`rounded-xl p-4 text-right transition-all ${
                    selectedSubId === s.id
                      ? 'border-2 border-emerald-500 bg-emerald-50 shadow-sm'
                      : 'border-2 border-transparent hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  style={selectedSubId !== s.id ? { background: '#fff', border: '2px solid #e5e7eb' } : undefined}
                >
                  <p className="font-mono text-sm font-bold text-gray-900">{s.billIdentifier}</p>
                  <p className="mt-1 text-xs text-gray-500">{s.powerEntity}</p>
                  <p className="text-xs text-gray-400 truncate">{s.mainAddress}</p>
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

      {/* تب‌ها */}
      {selectedSubId !== '' && (
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
          <button onClick={() => setActiveTab('analyze')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all ${
              activeTab === 'analyze' ? 'bg-emerald-800 shadow-sm text-white' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <BarChart3 className="h-4 w-4" /> تحلیل قبض
          </button>
          <button onClick={() => setActiveTab('history')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all ${
              activeTab === 'history' ? 'bg-emerald-800 shadow-sm text-white' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <History className="h-4 w-4" /> تاریخچه قبض‌ها
            {history.length > 0 && (
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs text-white">{history.length}</span>
            )}
          </button>
        </div>
      )}

      {/* تب تحلیل */}
      {activeTab === 'analyze' && selectedSubId !== '' && (
        <>
          <div className="glass-card overflow-hidden rounded-2xl">
            {selectedSub && (
              <div className="flex items-center gap-3 px-5 py-3"
                style={{ background: '#fef3c7', borderBottom: '1px solid #fde68a' }}>
                <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-amber-800">اشتراک انتخاب‌شده: {selectedSub.billIdentifier}</span>
                  <span className="mr-3 text-amber-600">{selectedSub.powerEntity} · {selectedSub.mainAddress}</span>
                </div>
              </div>
            )}

            <div className="p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">سال (شمسی) *</label>
                  <select value={form.year} onChange={set('year')}
                    className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100">
                    {YEAR_OPTIONS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">ماه مصرف *</label>
                  <select value={form.month} onChange={set('month')}
                    className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100">
                    {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">مصرف به تفکیک TOU (kWh)</p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Input label="اوج بار *"    value={form.peakKwh}       onChange={set('peakKwh')}       placeholder="kWh" inputMode="numeric" />
                  <Input label="میان بار *"   value={form.midKwh}        onChange={set('midKwh')}        placeholder="kWh" inputMode="numeric" />
                  <Input label="کم بار *"     value={form.lowKwh}        onChange={set('lowKwh')}        placeholder="kWh" inputMode="numeric" />
                  <Input label="اوج جمعه"     value={form.fridayPeakKwh} onChange={set('fridayPeakKwh')} placeholder="kWh" inputMode="numeric" />
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <Button loading={loading} onClick={handleAnalyze}>
                  <BarChart3 className="h-4 w-4" /> تحلیل قبض
                </Button>
              </div>
            </div>
          </div>

          {/* نتایج */}
          {result && (
            <div className="space-y-4">
              {/* سربرگ */}
              <div
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4 text-white"
                style={{ background: 'linear-gradient(135deg, #065f46 0%, #064e3b 100%)' }}
              >
                <div>
                  <p className="text-xs text-emerald-300">دوره مصرف</p>
                  <p className="mt-0.5 text-lg font-bold">{result.monthName} {result.year}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-300">مصرف کل</p>
                  <p className="mt-0.5 font-bold">{kwh(result.totalConsumption)}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-300">قدرت قراردادی</p>
                  <p className="mt-0.5 font-bold">{result.contractCapacityKw.toLocaleString('fa-IR')} kW</p>
                </div>
              </div>

              {/* خلاصه مالی */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl p-4" style={{ background: 'rgba(254,242,242,0.8)', border: '1px solid rgba(252,165,165,0.4)' }}>
                  <p className="text-xs font-semibold text-red-500">بدون قرارداد متین</p>
                  <p className="mt-1.5 text-xl font-bold text-red-700">{rial(result.withoutMatinBillRial)}</p>
                  <Bar value={result.withoutMatinBillRial} max={maxBill} color="bg-red-400" />
                </div>
                <div className="rounded-2xl p-4" style={{ background: 'rgba(239,246,255,0.8)', border: '1px solid rgba(147,197,253,0.4)' }}>
                  <p className="text-xs font-semibold text-blue-500">با قرارداد دوجانبه متین</p>
                  <p className="mt-1.5 text-xl font-bold text-blue-700">{rial(result.withMatinBillRial)}</p>
                  <Bar value={result.withMatinBillRial} max={maxBill} color="bg-blue-400" />
                </div>
                <div className="rounded-2xl p-4" style={{ background: 'rgba(236,253,245,0.8)', border: '1px solid rgba(167,243,208,0.4)' }}>
                  <p className="text-xs font-semibold text-emerald-600">صرفه‌جویی</p>
                  <p className="mt-1.5 text-xl font-bold text-emerald-700">{rial(result.savingRial)}</p>
                  <p className="text-sm font-semibold text-emerald-600">{result.savingPercent.toLocaleString('fa-IR')}٪ کاهش</p>
                </div>
              </div>

              {/* تفکیک باندها */}
              <div className="glass-card overflow-hidden rounded-2xl">
                <div className="flex items-center gap-3 px-5 py-4"
                  style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                  <BarChart3 className="h-4 w-4 text-emerald-700" />
                  <h3 className="font-semibold text-gray-900">تحلیل مصرف به تفکیک TOU</h3>
                </div>
                <div className="space-y-3 p-5">
                  {result.bands.map((b, i) => <BandRow key={i} band={b} />)}
                </div>
              </div>

              {/* نمودار نقطه بهینه */}
              {result.bands.length > 0 && (
                <div className="glass-card overflow-hidden rounded-2xl">
                  <div className="flex items-center gap-3 px-5 py-4"
                    style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                    <Target className="h-4 w-4 text-indigo-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">نمودار نقطه بهینه مصرف</h3>
                      <p className="text-xs text-gray-400">موس را روی هر نوار ببرید تا جزئیات را ببینید</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <TouOptimalChart bands={result.bands} />
                  </div>
                </div>
              )}

              {/* جزئیات محاسبه */}
              <div className="glass-card overflow-hidden rounded-2xl">
                <div className="flex items-center gap-3 px-5 py-4"
                  style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                  <Zap className="h-4 w-4 text-emerald-700" />
                  <h3 className="font-semibold text-gray-900">جزئیات صورتحساب</h3>
                </div>
                <div className="p-5">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-emerald-50">
                      <tr className="hover:bg-emerald-50/30">
                        <td className="py-2.5 text-gray-500">قرارداد متین (نرخ × انرژی)</td>
                        <td className="py-2.5 text-left text-xs text-gray-400">
                          {result.contractRateRialPerKwh.toLocaleString('fa-IR')} ر/kWh × {kwh(result.contractedEnergyKwh)}
                        </td>
                        <td className="py-2.5 text-left font-bold text-blue-700">{rial(result.matinBillRial)}</td>
                      </tr>
                      <tr className="hover:bg-emerald-50/30">
                        <td className="py-2.5 text-gray-500">جریمه مازاد (×۱.۳ نرخ بازار)</td>
                        <td></td>
                        <td className="py-2.5 text-left font-bold text-red-600">+ {rial(result.totalDifferentialRial)}</td>
                      </tr>
                      <tr className="hover:bg-emerald-50/30">
                        <td className="py-2.5 text-gray-500">بستانکاری کسری (×۰.۷۵ پشتیبان)</td>
                        <td></td>
                        <td className="py-2.5 text-left font-bold text-emerald-600">- {rial(result.totalCreditRial)}</td>
                      </tr>
                      {result.article16Rial > 0 && (
                        <tr className="hover:bg-emerald-50/30">
                          <td className="py-2.5 text-gray-500">ماده ۱۶</td><td></td>
                          <td className="py-2.5 text-left font-bold text-gray-700">+ {rial(result.article16Rial)}</td>
                        </tr>
                      )}
                      {result.fuelFeeRial > 0 && (
                        <tr className="hover:bg-emerald-50/30">
                          <td className="py-2.5 text-gray-500">هزینه سوخت</td><td></td>
                          <td className="py-2.5 text-left font-bold text-gray-700">+ {rial(result.fuelFeeRial)}</td>
                        </tr>
                      )}
                      <tr style={{ background: '#f8fafc' }} className="font-bold">
                        <td className="py-3 text-gray-900">جمع کل با متین</td><td></td>
                        <td className="py-3 text-left text-blue-700">{rial(result.withMatinBillRial)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(236,253,245,0.5)', border: '1px solid rgba(167,243,208,0.3)' }}>
                    <p className="mb-1.5 text-xs font-semibold text-gray-500">نرخ‌های بازار {result.monthName} {result.year}</p>
                    <div className="grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-4">
                      <div><span className="text-gray-400">اوج: </span><span className="font-semibold">{result.marketPeakRate.toLocaleString('fa-IR')}</span></div>
                      <div><span className="text-gray-400">میان: </span><span className="font-semibold">{result.marketMidRate.toLocaleString('fa-IR')}</span></div>
                      <div><span className="text-gray-400">کم: </span><span className="font-semibold">{result.marketLowRate.toLocaleString('fa-IR')}</span></div>
                      <div><span className="text-gray-400">پشتیبان: </span><span className="font-semibold">{result.backupRate.toLocaleString('fa-IR')}</span></div>
                    </div>
                    <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-xs">
                      <div><span className="text-gray-400">ساعات اوج: </span><span className="font-semibold">{result.peakHoursPerDay}</span></div>
                      <div><span className="text-gray-400">ساعات میان: </span><span className="font-semibold">{result.midHoursPerDay}</span></div>
                      <div><span className="text-gray-400">ساعات کم: </span><span className="font-semibold">{result.lowHoursPerDay}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* بنر نتیجه */}
              {result.savingRial > 0 && (
                <div className="rounded-2xl px-6 py-5 text-white"
                  style={{ background: 'linear-gradient(135deg, #065f46, #047857)' }}>
                  <div className="flex items-center gap-3">
                    <TrendingDown className="h-6 w-6 shrink-0" />
                    <div>
                      <p className="font-bold text-lg">با برق متین {rial(result.savingRial)} صرفه‌جویی می‌کنید!</p>
                      <p className="mt-0.5 text-emerald-100 text-sm">
                        معادل {result.savingPercent.toLocaleString('fa-IR')}٪ کاهش هزینه نسبت به نرخ پشتیبان دولتی
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {result.savingRial < 0 && (
                <div className="flex items-center gap-3 rounded-2xl px-6 py-4"
                  style={{ background: 'rgba(254,243,199,0.7)', border: '1px solid rgba(252,211,77,0.3)' }}>
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                  <p className="text-sm font-medium text-amber-700">در این ماه هزینه با قرارداد دوجانبه بیشتر از نرخ پشتیبان است. احتمالاً مازاد مصرف زیاد بوده.</p>
                </div>
              )}
            </div>
          )}

          {!result && !loading && (
            <div className="flex flex-col items-center py-16 text-center">
              <BarChart3 className="mb-3 h-12 w-12 text-gray-300" />
              <p className="font-semibold text-gray-500">مصارف TOU را وارد کنید تا تحلیل انجام شود</p>
              <p className="mt-1 text-sm text-gray-400">مقایسه دقیق هزینه با و بدون قرارداد دوجانبه متین</p>
            </div>
          )}
        </>
      )}

      {/* تب تاریخچه */}
      {activeTab === 'history' && selectedSubId !== '' && (
        <div className="glass-card overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between px-5 py-4"
            style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
            <div className="flex items-center gap-3">
              <History className="h-4 w-4 text-emerald-700" />
              <h3 className="font-semibold text-gray-900">تاریخچه تحلیل‌های قبض</h3>
            </div>
            <button
              onClick={() => {
                setHistLoading(true)
                customerApi.getBillHistory(selectedSubId as number)
                  .then((r) => { if (r.code === 200) setHistory(toArr(r.result)) })
                  .finally(() => setHistLoading(false))
              }}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-100 hover:text-emerald-600 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${histLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="p-5">
            {histLoading ? (
              <div className="flex h-24 items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-gray-400">
                <History className="mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm">هنوز تحلیلی برای این اشتراک ثبت نشده است</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-gray-400" style={{ borderColor: 'rgba(209,250,229,0.5)' }}>
                      <th className="pb-3 text-right font-semibold">دوره</th>
                      <th className="pb-3 text-left font-semibold">بدون متین</th>
                      <th className="pb-3 text-left font-semibold">با متین</th>
                      <th className="pb-3 text-left font-semibold">صرفه‌جویی</th>
                      <th className="pb-3 text-left font-semibold">تاریخ ثبت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'rgba(209,250,229,0.3)' }}>
                    {history.map((h: any, i: number) => {
                      const saving = (h.costWithoutMatin ?? 0) - (h.costWithMatin ?? 0)
                      const pct = h.costWithoutMatin > 0 ? (saving / h.costWithoutMatin * 100).toFixed(1) : '0'
                      return (
                        <tr key={i} className="transition-colors hover:bg-emerald-50/30">
                          <td className="py-3 font-semibold text-gray-900">{h.month ? MONTHS[h.month] : '—'} {h.year}</td>
                          <td className="py-3 text-left font-mono text-red-600 font-semibold">
                            {h.costWithoutMatin != null ? h.costWithoutMatin.toLocaleString('fa-IR') + ' ر' : '—'}
                          </td>
                          <td className="py-3 text-left font-mono text-blue-600 font-semibold">
                            {h.costWithMatin != null ? h.costWithMatin.toLocaleString('fa-IR') + ' ر' : '—'}
                          </td>
                          <td className="py-3 text-left">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${+pct > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              {+pct > 0 ? '+' : ''}{pct}٪
                            </span>
                          </td>
                          <td className="py-3 text-left text-xs text-gray-400">{h.createdAt?.split('T')[0] ?? '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedSubId === '' && subscriptions.length > 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <Zap className="mb-3 h-10 w-10 text-gray-300" />
          <p className="font-semibold text-gray-500">یک اشتراک را از بالا انتخاب کنید</p>
        </div>
      )}
    </div>
  )
}
