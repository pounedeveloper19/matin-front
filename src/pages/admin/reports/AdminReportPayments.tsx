import { useEffect, useState, useCallback } from 'react'
import { CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../../api/admin'
import type { PaymentReportResult } from '../../../types'
import {
  fmt, rial, exportCSV,
  PageHeader, FilterRow, FilterSelect, FilterMonth, ApplyBtn, CsvBtn,
  StatCard, TableWrap, THead, Td, Badge, EmptyRow, EmptyState, DownloadReceiptBtn,
} from './_shared'

const STATUS: Record<number, { bg: string; text: string }> = {
  1: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  2: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  3: { bg: 'bg-red-100',    text: 'text-red-800' },
}

export default function AdminReportPayments() {
  const [data, setData]       = useState<PaymentReportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ statusId: '', year: '', month: '' })

  const load = useCallback(() => {
    setLoading(true)
    const p: Record<string, unknown> = {}
    if (filters.statusId) p.statusId = Number(filters.statusId)
    if (filters.year && filters.month) { p.year = Number(filters.year); p.month = Number(filters.month) }
    adminApi.getPaymentReport(p as never)
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
      ['#', 'ش.سفارش', 'مشتری', 'شناسه', 'مبلغ ریال', 'روش', 'وضعیت', 'شماره مرجع', 'تاریخ'],
      data.items.map((p, i) => [i + 1, p.orderId, p.customerName, p.billIdentifier, p.amount, p.method, p.status, p.referenceNumber, p.createdAt]),
      'payments-report.csv',
    )
  }

  return (
    <div className="space-y-5" dir="rtl">
      <PageHeader icon={CreditCard} title="گزارش پرداخت‌ها" subtitle="لیست و تحلیل فیش‌های پرداختی" />

      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="space-y-4 p-5">

          {/* Filters */}
          <FilterRow loading={loading}>
            <FilterSelect label="وضعیت" value={filters.statusId} onChange={v => setFilters(p => ({ ...p, statusId: v }))}>
              <option value="">همه وضعیت‌ها</option>
              <option value="1">در انتظار بررسی</option>
              <option value="2">پرداخت شده</option>
              <option value="3">رد شده</option>
            </FilterSelect>
            <FilterMonth
              label="ماه"
              year={filters.year}
              month={filters.month}
              onYearChange={v => setFilters(p => ({ ...p, year: v }))}
              onMonthChange={v => setFilters(p => ({ ...p, month: v }))}
            />
            <ApplyBtn loading={loading} onApply={load} />
            {data && <CsvBtn onExport={doExport} />}
          </FilterRow>

          {data ? (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="تعداد کل فیش‌ها"  value={data.summary.total}                            color="indigo" />
                {data.summary.byStatus.map(s => (
                  <StatCard key={s.statusId} label={s.status} value={`${s.count} — ${rial(s.totalAmount ?? 0)}`} color="gray" />
                ))}
                <StatCard label="مجموع ثبت شده"    value={rial(data.summary.totalAmountRial)}             color="blue" />
                <StatCard label="مجموع پرداخت شده" value={rial(data.summary.confirmedAmountRial)}         color="emerald" />
              </div>

              {/* Table */}
              <TableWrap>
                <THead cols={['#', 'ش.سفارش', 'مشتری', 'شناسه', 'مبلغ ریال', 'روش پرداخت', 'وضعیت', 'شماره مرجع', 'تاریخ', 'فیش']} />
                <tbody className="divide-y divide-gray-50">
                  {data.items.length === 0
                    ? <EmptyRow cols={10} />
                    : data.items.map((p, i) => {
                      const sc = STATUS[p.statusId] ?? { bg: 'bg-gray-100', text: 'text-gray-700' }
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/60">
                          <Td>{i + 1}</Td>
                          <Td mono>#{p.orderId}</Td>
                          <Td>{p.customerName}</Td>
                          <Td mono>{p.billIdentifier}</Td>
                          <Td mono bold>{fmt(p.amount)}</Td>
                          <Td>{p.method}</Td>
                          <Td><Badge bg={sc.bg} text={sc.text}>{p.status}</Badge></Td>
                          <Td mono className="text-blue-600">{p.referenceNumber ?? '—'}</Td>
                          <Td>{p.createdAt ?? '—'}</Td>
                          <Td><DownloadReceiptBtn fileId={p.receiptFileId} /></Td>
                        </tr>
                      )
                    })}
                </tbody>
              </TableWrap>
            </>
          ) : (
            <EmptyState loading={loading} onLoad={load} label="گزارش پرداخت‌ها" />
          )}
        </div>
      </div>
    </div>
  )
}
