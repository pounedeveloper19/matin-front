import { useEffect, useRef, useState } from 'react'
import { Zap, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import { customerApi } from '../../api/customer'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import type { SubscriptionResult, OptimalPurchaseCurveResult } from '../../types'
import { toArr } from '../../utils'

const MONTHS = ['', 'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']

function jalaliYear(): number {
  const d = new Date(), m = d.getMonth() + 1, day = d.getDate()
  return (m > 3 || (m === 3 && day >= 20)) ? d.getFullYear() - 621 : d.getFullYear() - 622
}

const YEAR_OPTIONS = Array.from({ length: 3 }, (_, i) => jalaliYear() - 2 + i)

// ─── Optimal Purchase Line Chart ──────────────────────────────────────────────
function OptimalPurchaseLineChart({ data }: { data: OptimalPurchaseCurveResult }) {
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

  const optPct  = kwToPct(optKw)
  const curPct  = kwToPct(curKw)
  const hovered = hoverIdx !== null ? points[hoverIdx] : null
  const hovPct  = hovered ? kwToPct(hovered.contractCapacityKw) : null
  const selected    = selectedIdx !== null ? points[selectedIdx] : null
  const selectedPct = selected ? kwToPct(selected.contractCapacityKw) : null

  const segColor = (s: number) => {
    if (s <= 0)    return '#ef4444'
    const r = s / maxSaving
    if (r < 0.35)  return '#f97316'
    if (r < 0.65)  return '#f59e0b'
    if (r < 0.88)  return '#84cc16'
    return '#10b981'
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setHoverIdx(Math.round(pct * (points.length - 1)))
  }

  const improve     = data.optimalSavingRial - data.savingAtCurrentContractRial
  const stepSize    = points.length > 1 ? (maxKw - minKw) / (points.length - 1) : 1
  const isAtOptimal = Math.abs((hovered?.contractCapacityKw ?? -99) - optKw) < stepSize * 0.6

  return (
    <div className="select-none space-y-4" dir="ltr">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-red-400">← کمترین سود</span>
        <span className="text-emerald-600">بیشترین سود →</span>
      </div>

      <div ref={trackRef} className="relative cursor-pointer" style={{ height: 64 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
        onClick={() => { if (hoverIdx !== null) setSelectedIdx(hoverIdx) }}>

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
            بهینه {optKw.toFixed(0)} kW
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
        <span>{minKw.toFixed(0)} kW</span>
        <span>{maxKw.toFixed(0)} kW</span>
      </div>

      <div className="min-h-[72px] rounded-xl px-4 py-3 transition-all"
        style={{ background: 'rgba(248,250,252,0.95)', border: '1px solid rgba(209,250,229,0.5)' }}>
        {hovered ? (
          <div className="flex flex-wrap items-start gap-x-6 gap-y-2 text-xs">
            <div>
              <p className="text-gray-400">ظرفیت انتخابی</p>
              <p className="text-sm font-bold text-gray-900">{hovered.contractCapacityKw.toFixed(1)} kW</p>
              <p className="text-[10px] text-gray-400">{hovered.contractedEnergyKwh.toFixed(0)} kWh/ماه</p>
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
          <p className="py-3 text-center text-xs text-gray-400">نشانگر موس را روی خط بکشید تا سود هر ظرفیت را ببینید</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-right" dir="rtl">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
          <p className="text-[10px] font-semibold text-emerald-500">بهینه‌ترین ظرفیت</p>
          <p className="mt-0.5 text-sm font-bold text-emerald-700">{optKw.toFixed(1)} kW</p>
          <p className="text-[10px] text-emerald-400">صرفه: {data.optimalSavingRial.toLocaleString('fa-IR')} ر</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
          <p className="text-[10px] font-semibold text-blue-500">قرارداد فعلی شما</p>
          <p className="mt-0.5 text-sm font-bold text-blue-700">{curKw.toFixed(1)} kW</p>
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
              <p className="text-xs font-semibold text-violet-500">ظرفیت انتخاب‌شده</p>
              <p className="mt-0.5 text-lg font-bold text-violet-900">{selected.contractCapacityKw.toFixed(1)} kW</p>
              <p className="text-[10px] text-violet-400">
                {selected.contractedEnergyKwh.toFixed(0)} kWh/ماه · صرفه:{' '}
                {selected.savingRial >= 0 ? '+' : ''}{selected.savingRial.toLocaleString('fa-IR')} ریال
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedIdx(null)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-violet-500 transition-colors hover:bg-violet-100">
                پاک کردن
              </button>
              <button
                className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow transition-colors hover:bg-violet-700"
                onClick={() => toast.success(`درخواست خرید ${selected.contractCapacityKw.toFixed(1)} kW ثبت شد`)}>
                درخواست خرید این ظرفیت
              </button>
            </div>
          </div>
        </div>
      )}
      {!selected && (
        <p className="text-center text-[10px] text-gray-300">روی هر نقطه از خط کلیک کنید تا آن ظرفیت را انتخاب کنید</p>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const INIT = { year: String(jalaliYear()), month: '1', peakKwh: '', midKwh: '', lowKwh: '', fridayPeakKwh: '0' }

export default function BillOptimal() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionResult[]>([])
  const [selectedSubId, setSelectedSubId] = useState<number | ''>('')
  const [form, setForm]         = useState(INIT)
  const [curveData, setCurveData] = useState<OptimalPurchaseCurveResult | null>(null)
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    customerApi.getSubscriptions().then(r => {
      if (r.code === 200) {
        const arr = toArr(r.result)
        setSubscriptions(arr)
        if (arr.length === 1) setSelectedSubId(arr[0].id)
      }
    })
  }, [])

  const set = (k: keyof typeof INIT) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!selectedSubId) { toast.error('ابتدا اشتراک را انتخاب کنید'); return }
    if (!form.peakKwh || !form.midKwh || !form.lowKwh) { toast.error('مصارف TOU را وارد کنید'); return }

    setLoading(true); setCurveData(null)
    try {
      const res = await customerApi.manualOptimalPurchaseCurve({
        subscriptionId: selectedSubId as number,
        year: +form.year, month: +form.month,
        peakKwh: +form.peakKwh, midKwh: +form.midKwh,
        lowKwh: +form.lowKwh, fridayPeakKwh: +form.fridayPeakKwh,
      })
      if (res.code === 200 && res.result) {
        setCurveData(res.result as OptimalPurchaseCurveResult)
        toast.success('نمودار بهینه محاسبه شد')
      } else { toast.error(res.message ?? res.caption ?? 'خطا در محاسبه') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setLoading(false) }
  }

  const selectedSub = subscriptions.find(s => s.id === selectedSubId)

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
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subscriptions.map(s => (
                <button key={s.id}
                  onClick={() => { setSelectedSubId(s.id); setCurveData(null) }}
                  className={`rounded-xl p-4 text-right transition-all ${
                    selectedSubId === s.id
                      ? 'border-2 border-emerald-500 bg-emerald-50 shadow-sm'
                      : 'border-2 border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  <p className="font-mono text-sm font-bold text-gray-900">{s.billIdentifier}</p>
                  <p className="mt-1 text-xs text-gray-500">{s.powerEntity}</p>
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
              <span className="text-xs text-amber-600">{selectedSub.powerEntity}</span>
            </div>
          )}

          <div className="glass-card overflow-hidden rounded-2xl">
            <div className="flex items-center gap-3 px-5 py-4"
              style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
              <Activity className="h-4 w-4 text-violet-600" />
              <div>
                <h3 className="font-semibold text-gray-900">بهینه‌ساز خرید ظرفیت</h3>
                <p className="text-xs text-gray-400">بهترین ظرفیت قرارداد با متین را بر اساس مصرف ماهانه بیابید</p>
              </div>
            </div>
            <div className="space-y-5 p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">سال شمسی *</label>
                  <select value={form.year} onChange={set('year')}
                    className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-violet-400 focus:outline-none">
                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">ماه *</label>
                  <select value={form.month} onChange={set('month')}
                    className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-violet-400 focus:outline-none">
                    {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-600">مصرف به تفکیک TOU (kWh)</p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Input label="اوج بار *"  value={form.peakKwh}       onChange={set('peakKwh')}       placeholder="kWh" inputMode="numeric" />
                  <Input label="میان بار *" value={form.midKwh}        onChange={set('midKwh')}        placeholder="kWh" inputMode="numeric" />
                  <Input label="کم بار *"   value={form.lowKwh}        onChange={set('lowKwh')}        placeholder="kWh" inputMode="numeric" />
                  <Input label="اوج جمعه"   value={form.fridayPeakKwh} onChange={set('fridayPeakKwh')} placeholder="kWh" inputMode="numeric" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button loading={loading} onClick={handleSubmit}
                  className="bg-violet-600 hover:bg-violet-700">
                  <Activity className="h-4 w-4" /> محاسبه بهینه
                </Button>
              </div>
            </div>
          </div>

          {curveData && (
            <div className="glass-card overflow-hidden rounded-2xl">
              <div className="flex items-center gap-3 px-5 py-4"
                style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                <Activity className="h-4 w-4 text-violet-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">نمودار بهینه‌ساز</h3>
                  <p className="text-xs text-gray-400">نشانگر موس را روی خط بکشید — روی هر نقطه کلیک کنید تا انتخاب کنید</p>
                </div>
              </div>
              <div className="p-5">
                <OptimalPurchaseLineChart data={curveData} />
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
              <p className="font-semibold text-gray-500">در حال محاسبه نمودار بهینه...</p>
            </div>
          )}
          {!curveData && !loading && (
            <div className="flex flex-col items-center py-16 text-center">
              <Activity className="mb-3 h-12 w-12 text-gray-300" />
              <p className="font-semibold text-gray-500">مصرف ماهانه را وارد کنید تا بهترین ظرفیت پیدا شود</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
