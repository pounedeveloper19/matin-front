import { useCallback, useEffect, useState } from 'react'
import { TrendingUp, ArrowRight, ChevronRight, ChevronLeft, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../../api/admin'
import type { BillProfitRow, PaginationResult, ProfitReportResult } from '../../../types'
import {
  fmt, rial, exportCSV, monthName, MONTHS,
  PageHeader, FilterRow, ApplyBtn, CsvBtn,
  StatCard, TableWrap, THead, Td, EmptyRow, EmptyState,
} from './_shared'

type CustomerSuggestion = { profileId: number; customerName: string }

export default function AdminReportSavings() {
  const [years, setYears]           = useState<number[]>([])
  const [paged, setPaged]           = useState<PaginationResult<BillProfitRow> | null>(null)
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(false)
  const [page, setPage]             = useState(1)

  const [fromYear, setFromYear]     = useState('')
  const [fromMonth, setFromMonth]   = useState('')
  const [toYear, setToYear]         = useState('')
  const [toMonth, setToMonth]       = useState('')

  const [allCustomers, setAllCustomers] = useState<CustomerSuggestion[]>([])

  const [drillId, setDrillId]       = useState<number | null>(null)
  const [drillName, setDrillName]   = useState('')
  const [drillData, setDrillData]   = useState<ProfitReportResult | null>(null)
  const [drillLoading, setDrillLoading] = useState(false)

  useEffect(() => {
    adminApi.getProfitAvailableYears().then(r => {
      if (r.code === 200 && r.result) setYears(r.result)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    adminApi.getCustomerNames()
      .then(r => { if (r.code === 200 && r.result) setAllCustomers(r.result) })
      .catch(() => {})
  }, [])


  const load = useCallback((pg: number, customerName = '') => {
    setLoading(true)
    const params: Record<string, string | number> = { pageNumber: pg, pageSize: 20 }
    if (customerName) params.customerName = customerName
    if (fromYear && fromMonth) { params.fromYear = +fromYear; params.fromMonth = +fromMonth }
    if (toYear   && toMonth)   { params.toYear   = +toYear;   params.toMonth   = +toMonth }
    adminApi.getAllProfitSummary(params)
      .then(r => {
        if (r.code === 200 && r.result) setPaged(r.result)
        else toast.error(r.message ?? r.caption ?? 'خطا در بارگذاری')
      })
      .catch(() => toast.error('خطا در ارتباط با سرور'))
      .finally(() => setLoading(false))
  }, [fromYear, fromMonth, toYear, toMonth])

  const applyFilter = () => { setPage(1); load(1, search.trim()) }

  const goPage = (pg: number) => { setPage(pg); load(pg, search.trim()) }

  const rows = paged?.data ?? []

  const openDrill = (row: BillProfitRow) => {
    setDrillId(row.profileId)
    setDrillName(row.customerName)
    setDrillData(null)
    setDrillLoading(true)
    adminApi.getProfitReport(row.profileId)
      .then(r => {
        if (r.code === 200 && r.result) setDrillData(r.result)
        else toast.error(r.message ?? 'خطا در بارگذاری جزئیات')
      })
      .catch(() => toast.error('خطا در ارتباط با سرور'))
      .finally(() => setDrillLoading(false))
  }

  const closeDrill = () => { setDrillId(null); setDrillData(null) }

  const exportOverview = () => {
    if (!rows.length) return
    exportCSV(
      ['#', 'مشتری', 'سال', 'ماه', 'شناسه اشتراک', 'هزینه با متین (ریال)', 'هزینه بدون متین (ریال)', 'صرفه‌جویی (ریال)'],
      rows.map((x, i) => [i + 1, x.customerName, x.year, monthName(x.month), x.billIdentifier, x.costWithMatin, x.costWithoutMatin, x.netSaving]),
      'savings-overview.csv',
    )
  }

  const exportDrill = () => {
    if (!drillData) return
    exportCSV(
      ['سال', 'ماه', 'شناسه اشتراک', 'مصرف اوج', 'مصرف میانه', 'مصرف کم‌بار', 'هزینه با متین', 'هزینه بدون متین', 'صرفه‌جویی ماه', 'صرفه‌جویی انباشته'],
      drillData.rows.map(r => [r.year, monthName(r.month), r.billIdentifier, r.peakCons, r.midCons, r.lowCons, r.costWithMatin, r.costWithoutMatin, r.netSaving, r.cumulativeSaving]),
      `savings-${drillId}.csv`,
    )
  }

  // ── Drill-down view ────────────────────────────────────────────────────
  if (drillId !== null) {
    return (
      <div className="space-y-5" dir="rtl">
        <div className="glass-card flex items-center gap-3 rounded-2xl px-5 py-4">
          <button onClick={closeDrill} className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
            <ArrowRight className="h-4 w-4" />
            بازگشت
          </button>
          <span className="text-gray-300">|</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">سود انباشته — {drillName}</h1>
            <p className="text-xs text-gray-400">جزئیات ماهانه صرفه‌جویی</p>
          </div>
        </div>

        <div className="glass-card overflow-hidden rounded-2xl">
          <div className="space-y-4 p-5">
            {drillLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
              </div>
            )}
            {!drillLoading && drillData && (
              <>
                <div className="flex justify-end">
                  <CsvBtn onExport={exportDrill} />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <StatCard label="تعداد ماه"                value={drillData.summary.monthCount}                  color="indigo" />
                  <StatCard label="هزینه با متین (ریال)"    value={rial(drillData.summary.totalCostWithMatin)}    color="blue" />
                  <StatCard label="هزینه بدون متین (ریال)"  value={rial(drillData.summary.totalCostWithoutMatin)} color="amber" />
                  <StatCard label="صرفه‌جویی خالص (ریال)"  value={rial(drillData.summary.totalNetSaving)}        color="emerald" />
                  <StatCard label="درصد صرفه‌جویی"          value={`${drillData.summary.savingPercent}٪`}         color="emerald" />
                </div>
                <TableWrap>
                  <THead cols={['سال', 'ماه', 'شناسه اشتراک', 'اوج (kWh)', 'میانه (kWh)', 'کم‌بار (kWh)', 'هزینه با متین', 'هزینه بدون متین', 'صرفه‌جویی ماه', 'صرفه‌جویی انباشته']} />
                  <tbody className="divide-y divide-gray-50">
                    {drillData.rows.length === 0
                      ? <EmptyRow cols={10} />
                      : drillData.rows.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50/60">
                          <Td mono>{r.year}</Td>
                          <Td>{monthName(r.month)}</Td>
                          <Td mono>{r.billIdentifier}</Td>
                          <Td mono>{fmt(r.peakCons)}</Td>
                          <Td mono>{fmt(r.midCons)}</Td>
                          <Td mono>{fmt(r.lowCons)}</Td>
                          <Td mono>{fmt(r.costWithMatin)}</Td>
                          <Td mono>{fmt(r.costWithoutMatin)}</Td>
                          <Td mono bold className="text-emerald-700">{fmt(r.netSaving)}</Td>
                          <Td mono bold className="text-indigo-700">{fmt(r.cumulativeSaving)}</Td>
                        </tr>
                      ))}
                  </tbody>
                </TableWrap>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Overview ───────────────────────────────────────────────────────────
  const totalPages = paged?.totalPages ?? 1

  const yearSelect = (value: string, onChange: (v: string) => void) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="rounded-xl border border-gray-200 px-2 py-2 text-sm focus:border-indigo-400 focus:outline-none"
    >
      <option value="">سال</option>
      {years.map(y => <option key={y} value={y}>{y}</option>)}
    </select>
  )

  const monthSelect = (value: string, onChange: (v: string) => void) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="rounded-xl border border-gray-200 px-2 py-2 text-sm focus:border-indigo-400 focus:outline-none"
    >
      <option value="">ماه</option>
      {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
    </select>
  )

  return (
    <div className="space-y-5" dir="rtl">
      <PageHeader icon={TrendingUp} title="گزارش سود انباشته" subtitle="مقایسه هزینه مشتریان با و بدون متین" />

      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="space-y-4 p-5">
          <FilterRow loading={loading}>
            {/* Searchable customer selector — native datalist */}
            <div className="flex-1 min-w-44">
              <label className="mb-1 block text-xs font-semibold text-gray-600">جستجو</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <input
                  list="customer-names-list"
                  className="w-full rounded-xl border border-gray-200 py-2 pr-8 pl-7 text-sm focus:border-indigo-400 focus:outline-none"
                  placeholder="نام مشتری..."
                  value={search}
                  onChange={e => {
                    const v = e.target.value
                    setSearch(v)
                    if (allCustomers.some(c => c.customerName === v)) {
                      setPage(1)
                      load(1, v)
                    }
                  }}
                />
                <datalist id="customer-names-list">
                  {allCustomers.map(c => (
                    <option key={c.profileId} value={c.customerName} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">از ماه</label>
              <div className="flex gap-1">
                {yearSelect(fromYear, setFromYear)}
                {monthSelect(fromMonth, setFromMonth)}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">تا ماه</label>
              <div className="flex gap-1">
                {yearSelect(toYear, setToYear)}
                {monthSelect(toMonth, setToMonth)}
              </div>
            </div>

            <ApplyBtn loading={loading} onApply={applyFilter} />
            {paged && <CsvBtn onExport={exportOverview} />}
          </FilterRow>

          {paged ? (
            <>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  <span className="font-bold text-gray-800">{paged.totalRecords}</span> رکورد یافت شد
                </span>
                <span>صفحه {page} از {totalPages}</span>
              </div>

              <TableWrap>
                <THead cols={['#', 'مشتری', 'سال', 'ماه', 'شناسه اشتراک', 'هزینه با متین', 'هزینه بدون متین', 'صرفه‌جویی', 'جزئیات']} />
                <tbody className="divide-y divide-gray-50">
                  {rows.length === 0
                    ? <EmptyRow cols={9} />
                    : rows.map((x, i) => (
                      <tr key={x.id} className="hover:bg-gray-50/60">
                        <Td>{(page - 1) * 20 + i + 1}</Td>
                        <Td bold>{x.customerName}</Td>
                        <Td mono>{x.year}</Td>
                        <Td>{monthName(x.month)}</Td>
                        <Td mono>{x.billIdentifier}</Td>
                        <Td mono>{fmt(x.costWithMatin ?? 0)}</Td>
                        <Td mono>{fmt(x.costWithoutMatin ?? 0)}</Td>
                        <Td mono bold className="text-emerald-700">{fmt(x.netSaving ?? 0)}</Td>
                        <Td>
                          <button
                            onClick={() => openDrill(x)}
                            className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
                            مشاهده
                          </button>
                        </Td>
                      </tr>
                    ))}
                </tbody>
              </TableWrap>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => goPage(page - 1)}
                    disabled={page <= 1 || loading}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronRight className="h-3.5 w-3.5" /> قبلی
                  </button>
                  <span className="text-xs text-gray-500">{page} / {totalPages}</span>
                  <button
                    onClick={() => goPage(page + 1)}
                    disabled={page >= totalPages || loading}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    بعدی <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState loading={loading} onLoad={() => load(1)} label="گزارش سود انباشته" />
          )}
        </div>
      </div>
    </div>
  )
}
