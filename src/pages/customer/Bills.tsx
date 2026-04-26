import { useEffect, useState } from 'react'
import {
  Zap, TrendingDown, AlertTriangle, BarChart3,
  ChevronDown, ChevronUp, History, RefreshCw,
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

const rial = (n: number) => n.toLocaleString('fa-IR') + ' ریال'
const kwh  = (n: number) => n.toLocaleString('fa-IR') + ' kWh'

const glassCard = {
  background: 'rgba(255,255,255,0.88)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(209,250,229,0.6)',
  boxShadow: '0 4px 20px rgba(6,78,59,0.06)',
}

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

export default function CustomerBills() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionResult[]>([])
  const [selectedSubId, setSelectedSubId] = useState<number | ''>('')
  const [form, setForm] = useState({
    year: '1404', month: '1',
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
    <div className="space-y-5">

      {/* انتخاب اشتراک */}
      <div className="overflow-hidden rounded-2xl" style={glassCard}>
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: 'rgba(236,253,245,0.5)', borderBottom: '1px solid rgba(209,250,229,0.5)' }}>
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
                      ? 'border-2 border-primary-500 bg-primary-50 shadow-sm'
                      : 'border-2 border-transparent hover:border-emerald-200 hover:bg-emerald-50/30'
                  }`}
                  style={selectedSubId !== s.id ? { background: 'rgba(236,253,245,0.3)', border: '2px solid rgba(167,243,208,0.4)' } : undefined}
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
        <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(0,0,0,0.05)' }}>
          <button onClick={() => setActiveTab('analyze')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all ${
              activeTab === 'analyze' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <BarChart3 className="h-4 w-4" /> تحلیل قبض
          </button>
          <button onClick={() => setActiveTab('history')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all ${
              activeTab === 'history' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <History className="h-4 w-4" /> تاریخچه قبض‌ها
            {history.length > 0 && (
              <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-xs text-primary-700">{history.length}</span>
            )}
          </button>
        </div>
      )}

      {/* تب تحلیل */}
      {activeTab === 'analyze' && selectedSubId !== '' && (
        <>
          <div className="overflow-hidden rounded-2xl" style={glassCard}>
            {selectedSub && (
              <div className="flex items-center gap-3 px-5 py-3"
                style={{ background: 'rgba(254,243,199,0.6)', borderBottom: '1px solid rgba(252,211,77,0.3)' }}>
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
                  <input type="number" value={form.year} onChange={set('year')}
                    className="block w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">ماه مصرف *</label>
                  <select value={form.month} onChange={set('month')}
                    className="block w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100">
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
                style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)' }}
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
              <div className="overflow-hidden rounded-2xl" style={glassCard}>
                <div className="flex items-center gap-3 px-5 py-4"
                  style={{ background: 'rgba(236,253,245,0.5)', borderBottom: '1px solid rgba(209,250,229,0.5)' }}>
                  <BarChart3 className="h-4 w-4 text-primary-600" />
                  <h3 className="font-semibold text-gray-900">تحلیل مصرف به تفکیک TOU</h3>
                </div>
                <div className="space-y-3 p-5">
                  {result.bands.map((b, i) => <BandRow key={i} band={b} />)}
                </div>
              </div>

              {/* جزئیات محاسبه */}
              <div className="overflow-hidden rounded-2xl" style={glassCard}>
                <div className="flex items-center gap-3 px-5 py-4"
                  style={{ background: 'rgba(236,253,245,0.5)', borderBottom: '1px solid rgba(209,250,229,0.5)' }}>
                  <Zap className="h-4 w-4 text-primary-600" />
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
                      <tr style={{ background: 'rgba(236,253,245,0.5)' }} className="font-bold">
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
        <div className="overflow-hidden rounded-2xl" style={glassCard}>
          <div className="flex items-center justify-between px-5 py-4"
            style={{ background: 'rgba(236,253,245,0.5)', borderBottom: '1px solid rgba(209,250,229,0.5)' }}>
            <div className="flex items-center gap-3">
              <History className="h-4 w-4 text-primary-600" />
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
