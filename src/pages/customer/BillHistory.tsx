import { useEffect, useState } from 'react'
import { Zap, History, RefreshCw } from 'lucide-react'
import { customerApi } from '../../api/customer'
import type { SubscriptionResult } from '../../types'
import { toArr } from '../../utils'

const MONTHS = ['', 'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']

export default function BillHistory() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionResult[]>([])
  const [selectedSubId, setSelectedSubId] = useState<number | ''>('')
  const [history, setHistory]       = useState<any[]>([])
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    customerApi.getSubscriptions().then(r => {
      if (r.code === 200) {
        const arr = toArr(r.result)
        setSubscriptions(arr)
        if (arr.length === 1) setSelectedSubId(arr[0].id)
      }
    })
  }, [])

  useEffect(() => {
    if (!selectedSubId) return
    loadHistory(selectedSubId as number)
  }, [selectedSubId])

  const loadHistory = (subId: number) => {
    setLoading(true)
    customerApi.getBillHistory(subId)
      .then(r => { if (r.code === 200) setHistory(toArr(r.result)); else setHistory([]) })
      .finally(() => setLoading(false))
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
                  onClick={() => setSelectedSubId(s.id)}
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
            <div className="flex items-center justify-between px-5 py-4"
              style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
              <div className="flex items-center gap-3">
                <History className="h-4 w-4 text-emerald-700" />
                <h3 className="font-semibold text-gray-900">تاریخچه تحلیل‌های قبض</h3>
                {history.length > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                    {history.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => loadHistory(selectedSubId as number)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-emerald-100 hover:text-emerald-600">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="p-5">
              {loading ? (
                <div className="flex h-24 items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
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
                        const saving = h.netSaving ?? ((h.costWithoutMatin ?? 0) - (h.costWithMatin ?? 0))
                        const base   = h.costWithoutMatin ?? 0
                        const pct    = base > 0 ? (saving / base * 100).toFixed(1) : '0'
                        return (
                          <tr key={i} className="transition-colors hover:bg-emerald-50/30">
                            <td className="py-3 font-semibold text-gray-900">
                              {h.month ? MONTHS[h.month] : '—'} {h.year}
                            </td>
                            <td className="py-3 text-left font-mono font-semibold text-red-600">
                              {h.costWithoutMatin != null ? h.costWithoutMatin.toLocaleString('fa-IR') + ' ر' : '—'}
                            </td>
                            <td className="py-3 text-left font-mono font-semibold text-emerald-600">
                              {h.costWithMatin != null ? h.costWithMatin.toLocaleString('fa-IR') + ' ر' : '—'}
                            </td>
                            <td className="py-3 text-left">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                +pct > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {+pct > 0 ? '+' : ''}{pct}٪
                              </span>
                            </td>
                            <td className="py-3 text-left text-xs text-gray-400">
                              {h.createdAt?.split('T')[0] ?? '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
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
