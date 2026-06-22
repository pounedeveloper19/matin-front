import { useEffect, useState, useCallback } from 'react'
import { ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../../api/admin'
import type { OrderReportResult } from '../../../types'
import {
  fmt, rial, exportCSV,
  PageHeader, FilterRow, FilterSelect, FilterDate, ApplyBtn, CsvBtn,
  StatCard, TableWrap, THead, Td, Badge, EmptyRow, EmptyState,
} from './_shared'

const STATUS: Record<number, { bg: string; text: string }> = {
  1: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  2: { bg: 'bg-blue-100',   text: 'text-blue-800' },
  3: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  4: { bg: 'bg-red-100',    text: 'text-red-800' },
}

export default function AdminReportOrders() {
  const [data, setData]       = useState<OrderReportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ statusId: '', isPriceRequest: '', fromDate: '', toDate: '' })

  const load = useCallback(() => {
    setLoading(true)
    const p: Record<string, unknown> = {}
    if (filters.statusId)            p.statusId      = Number(filters.statusId)
    if (filters.isPriceRequest !== '') p.isPriceRequest = filters.isPriceRequest === 'true'
    if (filters.fromDate)            p.fromDate      = filters.fromDate
    if (filters.toDate)              p.toDate        = filters.toDate
    adminApi.getOrderReport(p as never)
      .then(r => {
        if (r.code === 200 && r.result) setData(r.result)
        else toast.error(r.message ?? r.caption ?? 'خطا در بارگذاری')
      })
      .catch(() => toast.error('خطا در ارتباط با سرور'))
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const doExport = () => {
    if (!data) return
    exportCSV(
      ['#', 'شناسه', 'مشتری', 'نوع انرژی', 'درخواستی kWh', 'قیمت ریال/kWh', 'پرداخت شده ریال', 'وضعیت', 'تاریخ'],
      data.items.map((o, i) => [i + 1, o.billIdentifier, o.customerName, o.energyType, o.requestedKwh, o.priceAtMoment, o.paidAmount, o.status, o.orderDate]),
      'orders-report.csv',
    )
  }

  return (
    <div className="space-y-5" dir="rtl">
      <PageHeader icon={ShoppingCart} title="گزارش سفارشات" subtitle="لیست و تحلیل سفارشات خرید برق" />

      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="space-y-4 p-5">

          {/* Filters */}
          <FilterRow loading={loading}>
            <FilterSelect label="وضعیت" value={filters.statusId} onChange={v => setFilters(p => ({ ...p, statusId: v }))}>
              <option value="">همه وضعیت‌ها</option>
              <option value="1">در انتظار بررسی</option>
              <option value="2">تایید شده</option>
              <option value="3">تکمیل شده</option>
              <option value="4">رد شده</option>
            </FilterSelect>
            <FilterSelect label="نوع" value={filters.isPriceRequest} onChange={v => setFilters(p => ({ ...p, isPriceRequest: v }))}>
              <option value="">همه</option>
              <option value="false">خرید برق</option>
              <option value="true">استعلام قیمت</option>
            </FilterSelect>
            <FilterDate label="از تاریخ" value={filters.fromDate} onChange={v => setFilters(p => ({ ...p, fromDate: v }))} />
            <FilterDate label="تا تاریخ" value={filters.toDate}   onChange={v => setFilters(p => ({ ...p, toDate: v }))} />
            <ApplyBtn loading={loading} onApply={load} />
            {data && <CsvBtn onExport={doExport} />}
          </FilterRow>

          {data ? (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="تعداد کل"              value={data.summary.total}                           color="indigo" />
                {data.summary.byStatus.map(s => (
                  <StatCard key={s.statusId} label={s.status} value={s.count}                                color="gray" />
                ))}
                <StatCard label="مجموع درخواستی"         value={`${fmt(data.summary.totalRequestedKwh)} kWh`} color="blue" />
                <StatCard label="پرداخت تایید شده"        value={rial(data.summary.totalPaidRial)}             color="emerald" />
              </div>

              {/* Table */}
              <TableWrap>
                <THead cols={['#', 'شناسه', 'مشتری', 'نوع انرژی', 'درخواستی kWh', 'قیمت ریال/kWh', 'پرداخت شده ریال', 'وضعیت', 'تاریخ']} />
                <tbody className="divide-y divide-gray-50">
                  {data.items.length === 0
                    ? <EmptyRow cols={9} />
                    : data.items.map((o, i) => {
                      const sc = STATUS[o.statusId] ?? { bg: 'bg-gray-100', text: 'text-gray-700' }
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
                          <Td mono>
                            {o.paidAmount > 0
                              ? <span className="font-semibold text-emerald-700">{fmt(o.paidAmount)}</span>
                              : '—'}
                          </Td>
                          <Td><Badge bg={sc.bg} text={sc.text}>{o.status}</Badge></Td>
                          <Td>{o.orderDate ?? '—'}</Td>
                        </tr>
                      )
                    })}
                </tbody>
              </TableWrap>
            </>
          ) : (
            <EmptyState loading={loading} onLoad={load} label="گزارش سفارشات" />
          )}
        </div>
      </div>
    </div>
  )
}
