import { useEffect, useMemo, useState } from 'react'
import { TrendingUp, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { customerApi } from '../../api/customer'
import type { ProfitReportResult, ProfitReportRow } from '../../types'
import { monthName, MONTHS } from '../../utils'

const fmt  = (n: number) => n.toLocaleString('fa-IR', { maximumFractionDigits: 0 })
const rial = (n: number) => fmt(n) + ' ریال'

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`rounded-2xl border p-4 ${color}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="mt-1 text-lg font-black leading-tight">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] opacity-60">{sub}</p>}
    </div>
  )
}

export default function CustomerSavings() {
  const [data, setData]       = useState<ProfitReportResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [fromYear, setFromYear]   = useState('')
  const [fromMonth, setFromMonth] = useState('')
  const [toYear, setToYear]       = useState('')
  const [toMonth, setToMonth]     = useState('')

  const load = () => {
    setLoading(true)
    customerApi.getMyProfitReport()
      .then(r => {
        if (r.code === 200 && r.result) setData(r.result)
        else toast.error(r.message ?? 'خطا در بارگذاری گزارش')
      })
      .catch(() => toast.error('خطا در ارتباط با سرور'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const years = useMemo(() => {
    if (!data) return []
    return [...new Set(data.rows.map(r => r.year))].sort((a, b) => a - b)
  }, [data])

  const rows: (ProfitReportRow & { cumulativeSaving: number })[] = useMemo(() => {
    if (!data) return []
    const fromVal = fromYear && fromMonth ? +fromYear * 12 + +fromMonth : 0
    const toVal   = toYear   && toMonth   ? +toYear   * 12 + +toMonth   : Infinity
    const filtered = data.rows.filter(r => {
      const v = r.year * 12 + r.month
      return v >= fromVal && v <= toVal
    })
    let cumulative = 0
    return filtered.map(r => {
      cumulative += r.netSaving ?? 0
      return { ...r, cumulativeSaving: cumulative }
    })
  }, [data, fromYear, fromMonth, toYear, toMonth])

  const summary = useMemo(() => ({
    totalNetSaving:        rows.reduce((s, r) => s + (r.netSaving ?? 0), 0),
    totalCostWithMatin:    rows.reduce((s, r) => s + (r.costWithMatin ?? 0), 0),
    totalCostWithoutMatin: rows.reduce((s, r) => s + (r.costWithoutMatin ?? 0), 0),
    monthCount:            rows.length,
    savingPercent: (() => {
      const wo = rows.reduce((s, r) => s + (r.costWithoutMatin ?? 0), 0)
      const net = rows.reduce((s, r) => s + (r.netSaving ?? 0), 0)
      return wo > 0 ? Math.round(net / wo * 1000) / 10 : 0
    })(),
  }), [rows])

  const yearSelect = (value: string, onChange: (v: string) => void) => (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="rounded-xl border border-gray-200 px-2 py-1.5 text-sm focus:border-emerald-400 focus:outline-none">
      <option value="">سال</option>
      {years.map(y => <option key={y} value={y}>{y}</option>)}
    </select>
  )
  const monthSelect = (value: string, onChange: (v: string) => void) => (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="rounded-xl border border-gray-200 px-2 py-1.5 text-sm focus:border-emerald-400 focus:outline-none">
      <option value="">ماه</option>
      {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
    </select>
  )

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">سود انباشته</h1>
            <p className="text-xs text-gray-400">میزان صرفه‌جویی شما با متین در مقایسه با شبکه عمومی</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          بروزرسانی
        </button>
      </div>

      {/* Date range filter */}
      {data && years.length > 0 && (
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3">
          <div>
            <p className="mb-1 text-xs font-semibold text-gray-500">از ماه</p>
            <div className="flex gap-1">{yearSelect(fromYear, setFromYear)}{monthSelect(fromMonth, setFromMonth)}</div>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-gray-500">تا ماه</p>
            <div className="flex gap-1">{yearSelect(toYear, setToYear)}{monthSelect(toMonth, setToMonth)}</div>
          </div>
          {(fromYear || toYear) && (
            <button
              onClick={() => { setFromYear(''); setFromMonth(''); setToYear(''); setToMonth('') }}
              className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50"
            >
              پاک کردن فیلتر
            </button>
          )}
          <span className="text-xs text-gray-400">{rows.length} ماه نمایش داده می‌شود</span>
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
        </div>
      )}

      {!loading && !data && (
        <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white py-16 text-gray-400">
          <TrendingUp className="mb-3 h-10 w-10 text-gray-300" />
          <p className="font-semibold text-gray-500">داده‌ای برای نمایش وجود ندارد</p>
          <p className="mt-1 text-xs">پس از ثبت اولین قبض، گزارش سود انباشته نمایش داده می‌شود</p>
        </div>
      )}

      {data && (
        <>
          {/* Summary cards — reflect current filter */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SummaryCard
              label="صرفه‌جویی کل"
              value={rial(summary.totalNetSaving)}
              sub={`در ${summary.monthCount} ماه`}
              color="border-emerald-100 bg-emerald-50 text-emerald-800"
            />
            <SummaryCard
              label="درصد صرفه‌جویی"
              value={`${summary.savingPercent}٪`}
              sub="نسبت به شبکه عمومی"
              color="border-indigo-100 bg-indigo-50 text-indigo-800"
            />
            <SummaryCard
              label="هزینه با متین"
              value={rial(summary.totalCostWithMatin)}
              color="border-blue-100 bg-blue-50 text-blue-800"
            />
            <SummaryCard
              label="هزینه بدون متین"
              value={rial(summary.totalCostWithoutMatin)}
              color="border-amber-100 bg-amber-50 text-amber-800"
            />
          </div>

          {/* Monthly breakdown */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="border-b border-gray-100 px-5 py-3">
              <h2 className="text-sm font-bold text-gray-700">جزئیات ماهانه</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['سال', 'ماه', 'شناسه اشتراک', 'اوج (kWh)', 'میانه (kWh)', 'کم‌بار (kWh)', 'هزینه با متین', 'هزینه بدون متین', 'صرفه‌جویی ماه', 'صرفه‌جویی انباشته'].map(h => (
                      <th key={h} className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.length === 0 ? (
                    <tr><td colSpan={10} className="py-10 text-center text-sm text-gray-400">داده‌ای یافت نشد</td></tr>
                  ) : rows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50/60">
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-700">{r.year}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-700">{monthName(r.month)}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-700">{r.billIdentifier}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-700">{fmt(r.peakCons)}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-700">{fmt(r.midCons)}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-700">{fmt(r.lowCons)}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-700">{fmt(r.costWithMatin)}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-700">{fmt(r.costWithoutMatin)}</td>
                      <td className="px-3 py-2.5 font-mono text-xs font-bold text-emerald-700">{fmt(r.netSaving)}</td>
                      <td className="px-3 py-2.5 font-mono text-xs font-bold text-indigo-700">{fmt(r.cumulativeSaving)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
