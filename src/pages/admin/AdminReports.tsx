import { useEffect, useState, useCallback } from 'react'
import {
  BarChart2, FileText, ShoppingCart, CreditCard,
  RefreshCw, Download, Search,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { uploadApi } from '../../api/upload'
import type {
  ContractReportItem, ContractReportResult,
  OrderReportItem, OrderReportResult,
  PaymentReportItem, PaymentReportResult,
} from '../../types'

const fmt  = (n: number) => n.toLocaleString('fa-IR', { maximumFractionDigits: 0 })
const rial = (n: number) => fmt(n) + ' ریال'

type Tab = 'contracts' | 'orders' | 'payments'

const CONTRACT_STATUS: Record<number, { bg: string; text: string }> = {
  1: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  2: { bg: 'bg-blue-100',   text: 'text-blue-800' },
  3: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  4: { bg: 'bg-red-100',    text: 'text-red-800' },
}
const ORDER_STATUS: Record<number, { bg: string; text: string }> = {
  1: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  2: { bg: 'bg-blue-100',   text: 'text-blue-800' },
  3: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  4: { bg: 'bg-red-100',    text: 'text-red-800' },
}
const PAY_STATUS: Record<number, { bg: string; text: string }> = {
  1: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  2: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  3: { bg: 'bg-red-100',    text: 'text-red-800' },
}

function exportCSV(headers: string[], rows: (string | number | null)[][], filename: string) {
  const bom = '﻿'
  const lines = [headers.join(','), ...rows.map(r => r.map(c => `"${c ?? ''}"`).join(','))]
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function AdminReports() {
  const [tab, setTab]       = useState<Tab>('contracts')
  const [loading, setLoading] = useState(false)

  const [contractData, setContractData] = useState<ContractReportResult | null>(null)
  const [cFilters, setCFilters] = useState({ search: '', statusId: '', fromDate: '', toDate: '' })

  const [orderData, setOrderData] = useState<OrderReportResult | null>(null)
  const [oFilters, setOFilters] = useState({ statusId: '', isPriceRequest: '', fromDate: '', toDate: '' })

  const [payData, setPayData] = useState<PaymentReportResult | null>(null)
  const [pFilters, setPFilters] = useState({ statusId: '', fromDate: '', toDate: '' })

  const loadContracts = useCallback(() => {
    setLoading(true)
    const p: Record<string, unknown> = {}
    if (cFilters.search)    p.search   = cFilters.search
    if (cFilters.statusId)  p.statusId = Number(cFilters.statusId)
    if (cFilters.fromDate)  p.fromDate = cFilters.fromDate
    if (cFilters.toDate)    p.toDate   = cFilters.toDate
    adminApi.getContractReport(p as never)
      .then(r => {
        if (r.code === 200 && r.result) setContractData(r.result)
        else toast.error(r.message ?? r.caption ?? 'خطا در بارگذاری گزارش')
      })
      .catch(() => toast.error('خطا در ارتباط با سرور'))
      .finally(() => setLoading(false))
  }, [cFilters])

  const loadOrders = useCallback(() => {
    setLoading(true)
    const p: Record<string, unknown> = {}
    if (oFilters.statusId)     p.statusId     = Number(oFilters.statusId)
    if (oFilters.isPriceRequest !== '') p.isPriceRequest = oFilters.isPriceRequest === 'true'
    if (oFilters.fromDate)     p.fromDate     = oFilters.fromDate
    if (oFilters.toDate)       p.toDate       = oFilters.toDate
    adminApi.getOrderReport(p as never)
      .then(r => {
        if (r.code === 200 && r.result) setOrderData(r.result)
        else toast.error(r.message ?? r.caption ?? 'خطا در بارگذاری گزارش')
      })
      .catch(() => toast.error('خطا در ارتباط با سرور'))
      .finally(() => setLoading(false))
  }, [oFilters])

  const loadPayments = useCallback(() => {
    setLoading(true)
    const p: Record<string, unknown> = {}
    if (pFilters.statusId)  p.statusId  = Number(pFilters.statusId)
    if (pFilters.fromDate)  p.fromDate  = pFilters.fromDate
    if (pFilters.toDate)    p.toDate    = pFilters.toDate
    adminApi.getPaymentReport(p as never)
      .then(r => {
        if (r.code === 200 && r.result) setPayData(r.result)
        else toast.error(r.message ?? r.caption ?? 'خطا در بارگذاری گزارش')
      })
      .catch(() => toast.error('خطا در ارتباط با سرور'))
      .finally(() => setLoading(false))
  }, [pFilters])

  useEffect(() => { loadContracts() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const switchTab = (t: Tab) => {
    setTab(t)
    if (t === 'orders'   && !orderData)  loadOrders()
    if (t === 'payments' && !payData)    loadPayments()
  }

  const exportContracts = () => {
    if (!contractData) return
    exportCSV(
      ['#', 'شماره قرارداد', 'مشتری', 'اشتراک', 'وضعیت', 'تاریخ شروع', 'تاریخ پایان', 'نرخ (ریال/kWh)', 'توان (kW)', 'حجم (kWh)', 'مبلغ کل (ریال)'],
      contractData.items.map((c, i) => [i + 1, c.contractNumber, c.customerName, c.billIdentifier, c.status, c.startDate, c.endDate, c.contractRate, c.contractPowerKw, c.contractVolumeKwh, c.contractAmountRial]),
      'contracts-report.csv',
    )
  }

  const exportOrders = () => {
    if (!orderData) return
    exportCSV(
      ['#', 'اشتراک', 'مشتری', 'نوع انرژی', 'درخواستی (kWh)', 'قیمت (ریال/kWh)', 'پرداخت تایید شده (ریال)', 'وضعیت', 'تاریخ'],
      orderData.items.map((o, i) => [i + 1, o.billIdentifier, o.customerName, o.energyType, o.requestedKwh, o.priceAtMoment, o.paidAmount, o.status, o.orderDate]),
      'orders-report.csv',
    )
  }

  const exportPayments = () => {
    if (!payData) return
    exportCSV(
      ['#', 'ش.سفارش', 'مشتری', 'اشتراک', 'مبلغ (ریال)', 'روش', 'وضعیت', 'شماره مرجع', 'تاریخ'],
      payData.items.map((p, i) => [i + 1, p.orderId, p.customerName, p.billIdentifier, p.amount, p.method, p.status, p.referenceNumber, p.createdAt]),
      'payments-report.csv',
    )
  }

  return (
    <div className="space-y-5" dir="rtl">

      {/* Header */}
      <div className="glass-card flex items-center gap-3 rounded-2xl px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
          <BarChart2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">گزارشات</h1>
          <p className="text-xs text-gray-400">تحلیل قراردادها، سفارشات و پرداخت‌ها</p>
        </div>
      </div>

      {/* Main card */}
      <div className="glass-card overflow-hidden rounded-2xl">

        {/* Tab bar */}
        <div className="flex border-b border-gray-100" style={{ background: '#f8fafc' }}>
          {([
            { key: 'contracts' as Tab, label: 'قراردادها', Icon: FileText },
            { key: 'orders'    as Tab, label: 'سفارشات',  Icon: ShoppingCart },
            { key: 'payments'  as Tab, label: 'پرداخت‌ها', Icon: CreditCard },
          ]).map(({ key, label, Icon }) => (
            <button key={key} onClick={() => switchTab(key)}
              className={`flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors
                ${tab === key
                  ? 'border-b-2 border-indigo-600 bg-white text-indigo-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-5">

          {/* ══════════════ Contracts ══════════════ */}
          {tab === 'contracts' && (
            <div className="space-y-4">
              <FilterRow loading={loading}>
                <div className="flex-1 min-w-44">
                  <label className="mb-1 block text-xs font-semibold text-gray-600">جستجو</label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input className="w-full rounded-xl border border-gray-200 py-2 pr-8 pl-3 text-sm focus:border-indigo-400 focus:outline-none"
                      placeholder="شماره قرارداد، مشتری، اشتراک..."
                      value={cFilters.search}
                      onChange={e => setCFilters(p => ({ ...p, search: e.target.value }))} />
                  </div>
                </div>
                <FilterSelect label="وضعیت" value={cFilters.statusId} onChange={v => setCFilters(p => ({ ...p, statusId: v }))}>
                  <option value="">همه وضعیت‌ها</option>
                  <option value="1">در انتظار تایید</option>
                  <option value="2">فعال</option>
                  <option value="3">پایان یافته</option>
                  <option value="4">رد شده</option>
                </FilterSelect>
                <FilterDate label="از تاریخ" value={cFilters.fromDate} onChange={v => setCFilters(p => ({ ...p, fromDate: v }))} />
                <FilterDate label="تا تاریخ" value={cFilters.toDate}   onChange={v => setCFilters(p => ({ ...p, toDate: v }))} />
                <ApplyBtn loading={loading} onApply={loadContracts} />
                {contractData && <CsvBtn onExport={exportContracts} />}
              </FilterRow>

              {contractData ? (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCard label="تعداد کل" value={contractData.summary.total} color="indigo" />
                    {contractData.summary.byStatus.map(s => (
                      <StatCard key={s.statusId} label={s.status} value={s.count} color="gray" />
                    ))}
                    <StatCard label="مجموع مبلغ قراردادها" value={rial(contractData.summary.totalAmountRial)} color="emerald" />
                  </div>

                  <TableWrap>
                    <thead>
                      <THead cols={['#','شماره قرارداد','مشتری','اشتراک','وضعیت','تاریخ شروع','تاریخ پایان','نرخ ریال/kWh','توان kW','حجم kWh','مبلغ ریال']} />
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {contractData.items.length === 0
                        ? <EmptyRow cols={11} />
                        : contractData.items.map((c, i) => {
                          const sc = CONTRACT_STATUS[c.statusId] ?? { bg: 'bg-gray-100', text: 'text-gray-700' }
                          return (
                            <tr key={c.id} className="hover:bg-gray-50/60">
                              <Td>{i + 1}</Td>
                              <Td mono bold>{c.contractNumber ?? '—'}</Td>
                              <Td>{c.customerName}</Td>
                              <Td mono>{c.billIdentifier}</Td>
                              <Td><Badge bg={sc.bg} text={sc.text}>{c.status}</Badge></Td>
                              <Td>{c.startDate ?? '—'}</Td>
                              <Td>{c.endDate ?? '—'}</Td>
                              <Td mono>{fmt(c.contractRate)}</Td>
                              <Td mono>{c.contractPowerKw ?? '—'}</Td>
                              <Td mono>{c.contractVolumeKwh ?? '—'}</Td>
                              <Td mono bold>{c.contractAmountRial != null ? fmt(c.contractAmountRial) : '—'}</Td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </TableWrap>
                </>
              ) : <EmptyState loading={loading} onLoad={loadContracts} label="گزارش قراردادها" />}
            </div>
          )}

          {/* ══════════════ Orders ══════════════ */}
          {tab === 'orders' && (
            <div className="space-y-4">
              <FilterRow loading={loading}>
                <FilterSelect label="وضعیت" value={oFilters.statusId} onChange={v => setOFilters(p => ({ ...p, statusId: v }))}>
                  <option value="">همه وضعیت‌ها</option>
                  <option value="1">در انتظار بررسی</option>
                  <option value="2">تایید شده</option>
                  <option value="3">تکمیل شده</option>
                  <option value="4">رد شده</option>
                </FilterSelect>
                <FilterSelect label="نوع" value={oFilters.isPriceRequest} onChange={v => setOFilters(p => ({ ...p, isPriceRequest: v }))}>
                  <option value="">همه</option>
                  <option value="false">خرید برق</option>
                  <option value="true">استعلام قیمت</option>
                </FilterSelect>
                <FilterDate label="از تاریخ" value={oFilters.fromDate} onChange={v => setOFilters(p => ({ ...p, fromDate: v }))} />
                <FilterDate label="تا تاریخ" value={oFilters.toDate}   onChange={v => setOFilters(p => ({ ...p, toDate: v }))} />
                <ApplyBtn loading={loading} onApply={loadOrders} />
                {orderData && <CsvBtn onExport={exportOrders} />}
              </FilterRow>

              {orderData ? (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCard label="تعداد کل" value={orderData.summary.total} color="indigo" />
                    {orderData.summary.byStatus.map(s => (
                      <StatCard key={s.statusId} label={s.status} value={s.count} color="gray" />
                    ))}
                    <StatCard label="مجموع درخواستی" value={`${fmt(orderData.summary.totalRequestedKwh)} kWh`} color="blue" />
                    <StatCard label="پرداخت تایید شده" value={rial(orderData.summary.totalPaidRial)} color="emerald" />
                  </div>

                  <TableWrap>
                    <thead>
                      <THead cols={['#','اشتراک','مشتری','نوع انرژی','درخواستی kWh','قیمت ریال/kWh','پرداخت شده ریال','وضعیت','تاریخ']} />
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {orderData.items.length === 0
                        ? <EmptyRow cols={9} />
                        : orderData.items.map((o, i) => {
                          const sc = ORDER_STATUS[o.statusId] ?? { bg: 'bg-gray-100', text: 'text-gray-700' }
                          return (
                            <tr key={o.id} className="hover:bg-gray-50/60">
                              <Td>{i + 1}</Td>
                              <Td mono>{o.billIdentifier}</Td>
                              <Td>{o.customerName}</Td>
                              <Td>
                                {o.isPriceRequest
                                  ? <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">استعلام</span>
                                  : o.energyType}
                              </Td>
                              <Td mono bold>{fmt(o.requestedKwh)}</Td>
                              <Td mono>{o.priceAtMoment > 0 ? fmt(o.priceAtMoment) : '—'}</Td>
                              <Td mono>{o.paidAmount > 0 ? <span className="font-semibold text-emerald-700">{fmt(o.paidAmount)}</span> : '—'}</Td>
                              <Td><Badge bg={sc.bg} text={sc.text}>{o.status}</Badge></Td>
                              <Td>{o.orderDate ?? '—'}</Td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </TableWrap>
                </>
              ) : <EmptyState loading={loading} onLoad={loadOrders} label="گزارش سفارشات" />}
            </div>
          )}

          {/* ══════════════ Payments ══════════════ */}
          {tab === 'payments' && (
            <div className="space-y-4">
              <FilterRow loading={loading}>
                <FilterSelect label="وضعیت" value={pFilters.statusId} onChange={v => setPFilters(p => ({ ...p, statusId: v }))}>
                  <option value="">همه وضعیت‌ها</option>
                  <option value="1">در انتظار بررسی</option>
                  <option value="2">تایید شده</option>
                  <option value="3">رد شده</option>
                </FilterSelect>
                <FilterDate label="از تاریخ" value={pFilters.fromDate} onChange={v => setPFilters(p => ({ ...p, fromDate: v }))} />
                <FilterDate label="تا تاریخ" value={pFilters.toDate}   onChange={v => setPFilters(p => ({ ...p, toDate: v }))} />
                <ApplyBtn loading={loading} onApply={loadPayments} />
                {payData && <CsvBtn onExport={exportPayments} />}
              </FilterRow>

              {payData ? (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCard label="تعداد کل فیش‌ها" value={payData.summary.total} color="indigo" />
                    {payData.summary.byStatus.map(s => (
                      <StatCard key={s.statusId} label={s.status} value={`${s.count} — ${rial(s.totalAmount)}`} color="gray" />
                    ))}
                    <StatCard label="مجموع ثبت شده" value={rial(payData.summary.totalAmountRial)} color="blue" />
                    <StatCard label="مجموع تایید شده" value={rial(payData.summary.confirmedAmountRial)} color="emerald" />
                  </div>

                  <TableWrap>
                    <thead>
                      <THead cols={['#','ش.سفارش','مشتری','اشتراک','مبلغ ریال','روش','وضعیت','شماره مرجع','تاریخ','فیش']} />
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {payData.items.length === 0
                        ? <EmptyRow cols={10} />
                        : payData.items.map((p, i) => {
                          const sc = PAY_STATUS[p.statusId] ?? { bg: 'bg-gray-100', text: 'text-gray-700' }
                          return (
                            <tr key={p.id} className="hover:bg-gray-50/60">
                              <Td>{i + 1}</Td>
                              <Td mono>#{p.orderId}</Td>
                              <Td>{p.customerName}</Td>
                              <Td mono>{p.billIdentifier}</Td>
                              <Td mono bold>{fmt(p.amount)}</Td>
                              <Td>{p.method}</Td>
                              <Td><Badge bg={sc.bg} text={sc.text}>{p.status}</Badge></Td>
                              <Td mono>{p.referenceNumber ?? '—'}</Td>
                              <Td>{p.createdAt ?? '—'}</Td>
                              <Td>
                                {p.receiptFileId && (
                                  <button
                                    onClick={() => uploadApi.download(p.receiptFileId!).catch(() => toast.error('خطا در دانلود'))}
                                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100">
                                    <Download className="h-3 w-3" />
                                    دانلود
                                  </button>
                                )}
                              </Td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </TableWrap>
                </>
              ) : <EmptyState loading={loading} onLoad={loadPayments} label="گزارش پرداخت‌ها" />}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

/* ── Shared sub-components ── */

function FilterRow({ children, loading }: { children: React.ReactNode; loading: boolean }) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
      {children}
      {loading && <div className="ml-1 h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />}
    </div>
  )
}

function FilterSelect({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-600">{label}</label>
      <select className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        value={value} onChange={e => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  )
}

function FilterDate({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-600">{label}</label>
      <input type="date" className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function ApplyBtn({ loading, onApply }: { loading: boolean; onApply: () => void }) {
  return (
    <button onClick={onApply} disabled={loading}
      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
      اعمال فیلتر
    </button>
  )
}

function CsvBtn({ onExport }: { onExport: () => void }) {
  return (
    <button onClick={onExport}
      className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
      <Download className="h-3.5 w-3.5" />
      خروجی CSV
    </button>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: 'indigo' | 'emerald' | 'blue' | 'gray' }) {
  const palette = {
    indigo:  'border-indigo-100  bg-indigo-50  text-indigo-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    blue:    'border-blue-100    bg-blue-50    text-blue-700',
    gray:    'border-gray-100    bg-gray-50    text-gray-700',
  }
  return (
    <div className={`rounded-xl border p-3 ${palette[color]}`}>
      <p className="text-[10px] font-medium opacity-70">{label}</p>
      <p className="mt-0.5 text-sm font-bold leading-tight">{value}</p>
    </div>
  )
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

function THead({ cols }: { cols: string[] }) {
  return (
    <tr style={{ background: '#f8fafc' }}>
      {cols.map(h => (
        <th key={h} className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold text-gray-500">{h}</th>
      ))}
    </tr>
  )
}

function Td({ children, mono, bold }: { children: React.ReactNode; mono?: boolean; bold?: boolean }) {
  return (
    <td className={`px-3 py-2.5 text-xs text-gray-700 ${mono ? 'font-mono' : ''} ${bold ? 'font-bold text-gray-900' : ''}`}>
      {children}
    </td>
  )
}

function Badge({ bg, text, children }: { bg: string; text: string; children: React.ReactNode }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${bg} ${text}`}>{children}</span>
}

function EmptyRow({ cols }: { cols: number }) {
  return <tr><td colSpan={cols} className="py-10 text-center text-sm text-gray-400">داده‌ای یافت نشد</td></tr>
}

function EmptyState({ loading, onLoad, label }: { loading: boolean; onLoad: () => void; label: string }) {
  return (
    <div className="flex flex-col items-center py-16 text-gray-400">
      <BarChart2 className="mb-3 h-10 w-10 text-gray-300" />
      <p className="font-semibold text-gray-500">{label} بارگذاری نشده</p>
      <p className="mt-1 text-xs">فیلترها را تنظیم کنید و «اعمال فیلتر» را بزنید</p>
      <button onClick={onLoad} disabled={loading}
        className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        بارگذاری
      </button>
    </div>
  )
}
