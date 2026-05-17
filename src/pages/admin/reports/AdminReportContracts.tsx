import { useEffect, useState, useCallback } from 'react'
import { FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../../api/admin'
import type { ContractReportResult } from '../../../types'
import {
  fmt, rial, exportCSV,
  PageHeader, FilterRow, FilterSearch, FilterSelect, FilterDate, ApplyBtn, CsvBtn,
  StatCard, TableWrap, THead, Td, Badge, EmptyRow, EmptyState,
} from './_shared'

const STATUS: Record<number, { bg: string; text: string }> = {
  1: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  2: { bg: 'bg-blue-100',   text: 'text-blue-800' },
  3: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  4: { bg: 'bg-red-100',    text: 'text-red-800' },
}

export default function AdminReportContracts() {
  const [data, setData]       = useState<ContractReportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ search: '', statusId: '', fromDate: '', toDate: '' })

  const load = useCallback(() => {
    setLoading(true)
    const p: Record<string, unknown> = {}
    if (filters.search)   p.search   = filters.search
    if (filters.statusId) p.statusId = Number(filters.statusId)
    if (filters.fromDate) p.fromDate = filters.fromDate
    if (filters.toDate)   p.toDate   = filters.toDate
    adminApi.getContractReport(p as never)
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
      ['#', 'شماره قرارداد', 'مشتری', 'اشتراک', 'وضعیت', 'تاریخ شروع', 'تاریخ پایان', 'نرخ ریال/kWh', 'توان kW', 'حجم kWh', 'مبلغ ریال'],
      data.items.map((c, i) => [i + 1, c.contractNumber, c.customerName, c.billIdentifier, c.status, c.startDate, c.endDate, c.contractRate, c.contractPowerKw, c.contractVolumeKwh, c.contractAmountRial]),
      'contracts-report.csv',
    )
  }

  return (
    <div className="space-y-5" dir="rtl">
      <PageHeader icon={FileText} title="گزارش قراردادها" subtitle="لیست و تحلیل قراردادهای ثبت شده" />

      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="space-y-4 p-5">

          {/* Filters */}
          <FilterRow loading={loading}>
            <FilterSearch
              value={filters.search}
              onChange={v => setFilters(p => ({ ...p, search: v }))}
              placeholder="شماره قرارداد، مشتری، اشتراک..."
            />
            <FilterSelect label="وضعیت" value={filters.statusId} onChange={v => setFilters(p => ({ ...p, statusId: v }))}>
              <option value="">همه وضعیت‌ها</option>
              <option value="1">در انتظار تایید</option>
              <option value="2">فعال</option>
              <option value="3">پایان یافته</option>
              <option value="4">رد شده</option>
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
                <StatCard label="تعداد کل"           value={data.summary.total}                     color="indigo" />
                {data.summary.byStatus.map(s => (
                  <StatCard key={s.statusId} label={s.status} value={s.count}                       color="gray" />
                ))}
                <StatCard label="مجموع مبلغ قراردادها" value={rial(data.summary.totalAmountRial)}   color="emerald" />
              </div>

              {/* Table */}
              <TableWrap>
                <THead cols={['#', 'شماره قرارداد', 'مشتری', 'اشتراک', 'وضعیت', 'تاریخ شروع', 'تاریخ پایان', 'نرخ ریال/kWh', 'توان kW', 'حجم kWh', 'مبلغ ریال']} />
                <tbody className="divide-y divide-gray-50">
                  {data.items.length === 0
                    ? <EmptyRow cols={11} />
                    : data.items.map((c, i) => {
                      const sc = STATUS[c.statusId] ?? { bg: 'bg-gray-100', text: 'text-gray-700' }
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
          ) : (
            <EmptyState loading={loading} onLoad={load} label="گزارش قراردادها" />
          )}
        </div>
      </div>
    </div>
  )
}
