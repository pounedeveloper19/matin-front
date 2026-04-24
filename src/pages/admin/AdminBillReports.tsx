import { useEffect, useState, useCallback } from 'react'
import { Receipt, Plus, Trash2, Eye, TrendingDown, AlertTriangle, BarChart3, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { lookupApi } from '../../api/lookup'
import type { SubOption } from '../../api/lookup'
import { Table, Pagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input, { Select } from '../../components/ui/Input'
import type { AdminBillReport, BillAnalysisResult, BillBand } from '../../types'
import { toArr } from '../../utils'

const MONTHS = ['','فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']
const rial = (n: number) => n.toLocaleString('fa-IR') + ' ریال'
const kwh  = (n: number) => n.toLocaleString('fa-IR') + ' kWh'
const fmt  = (n: number | null | undefined) => n == null ? '—' : new Intl.NumberFormat('fa-IR').format(Math.round(n))

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="h-2 w-full rounded-full bg-gray-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function BandRow({ band }: { band: BillBand }) {
  const [open, setOpen] = useState(false)
  const hasExcess  = band.excessKwh > 0
  const hasDeficit = band.deficitKwh > 0

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-right hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className={`h-2 w-2 rounded-full ${hasExcess ? 'bg-red-500' : hasDeficit ? 'bg-amber-400' : 'bg-emerald-500'}`} />
          <span className="text-sm font-medium text-gray-900">{band.name}</span>
          <span className="text-xs text-gray-400">{kwh(band.actualKwh)}</span>
        </div>
        <div className="flex items-center gap-3">
          {hasExcess  && <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">جریمه: {rial(band.penaltyRial)}</span>}
          {hasDeficit && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">بستانکاری: {rial(band.creditRial)}</span>}
          {!hasExcess && !hasDeficit && <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">در محدوده</span>}
          {open ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 pb-3 pt-2">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-4">
            <div><p className="text-gray-400">واقعی</p><p className="font-medium">{kwh(band.actualKwh)}</p></div>
            <div><p className="text-gray-400">قراردادی</p><p className="font-medium">{kwh(band.contractedKwh)}</p></div>
            <div><p className="text-gray-400">مازاد</p><p className={`font-medium ${band.excessKwh > 0 ? 'text-red-600' : 'text-gray-400'}`}>{kwh(band.excessKwh)}</p></div>
            <div><p className="text-gray-400">کسری</p><p className={`font-medium ${band.deficitKwh > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{kwh(band.deficitKwh)}</p></div>
            <div><p className="text-gray-400">نرخ بازار</p><p className="font-medium">{band.marketRateRial.toLocaleString('fa-IR')} ر/kWh</p></div>
            <div><p className="text-gray-400">جریمه</p><p className="font-medium text-red-600">{rial(band.penaltyRial)}</p></div>
            <div><p className="text-gray-400">بستانکاری</p><p className="font-medium text-emerald-600">{rial(band.creditRial)}</p></div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-16">واقعی</span>
              <ProgressBar value={band.actualKwh} max={Math.max(band.actualKwh, band.contractedKwh)} color="bg-blue-500" />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-16">قراردادی</span>
              <ProgressBar value={band.contractedKwh} max={Math.max(band.actualKwh, band.contractedKwh)} color="bg-gray-400" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AnalysisDetail({ result }: { result: BillAnalysisResult }) {
  const maxBill = Math.max(result.withoutMatinBillRial, result.withMatinBillRial, 1)
  return (
    <div className="space-y-4">
      {/* سربرگ */}
      <div className="flex items-center justify-between rounded-lg bg-gray-900 px-4 py-3 text-white text-sm">
        <div><p className="text-gray-400 text-xs">دوره</p><p className="font-bold">{result.monthName} {result.year}</p></div>
        <div><p className="text-gray-400 text-xs">مصرف کل</p><p className="font-bold">{kwh(result.totalConsumption)}</p></div>
        <div><p className="text-gray-400 text-xs">قدرت قراردادی</p><p className="font-bold">{result.contractCapacityKw.toLocaleString('fa-IR')} kW</p></div>
      </div>

      {/* مقایسه */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-xs text-red-500">بدون متین</p>
          <p className="mt-1 text-base font-bold text-red-700">{rial(result.withoutMatinBillRial)}</p>
          <ProgressBar value={result.withoutMatinBillRial} max={maxBill} color="bg-red-400" />
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs text-blue-500">با متین</p>
          <p className="mt-1 text-base font-bold text-blue-700">{rial(result.withMatinBillRial)}</p>
          <ProgressBar value={result.withMatinBillRial} max={maxBill} color="bg-blue-400" />
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs text-emerald-600">صرفه‌جویی</p>
          <p className="mt-1 text-base font-bold text-emerald-700">{rial(result.savingRial)}</p>
          <p className="text-xs text-emerald-600 font-medium">{result.savingPercent.toLocaleString('fa-IR')}٪</p>
        </div>
      </div>

      {/* باندها */}
      <div>
        <p className="mb-2 text-xs font-medium text-gray-600">تفکیک TOU</p>
        <div className="space-y-2">
          {result.bands.map((b, i) => <BandRow key={i} band={b} />)}
        </div>
      </div>

      {/* جزئیات مالی */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-xs">
          <tbody className="divide-y divide-gray-100">
            <tr className="hover:bg-gray-50">
              <td className="px-3 py-2 text-gray-500">قرارداد متین</td>
              <td className="px-3 py-2 text-left font-medium text-blue-700">{rial(result.matinBillRial)}</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-3 py-2 text-gray-500">جریمه مازاد (×۱.۳)</td>
              <td className="px-3 py-2 text-left font-medium text-red-600">+ {rial(result.totalDifferentialRial)}</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-3 py-2 text-gray-500">بستانکاری کسری (×۰.۷۵)</td>
              <td className="px-3 py-2 text-left font-medium text-emerald-600">- {rial(result.totalCreditRial)}</td>
            </tr>
            {result.article16Rial > 0 && (
              <tr className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-500">ماده ۱۶</td>
                <td className="px-3 py-2 text-left font-medium">+ {rial(result.article16Rial)}</td>
              </tr>
            )}
            {result.fuelFeeRial > 0 && (
              <tr className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-500">هزینه سوخت</td>
                <td className="px-3 py-2 text-left font-medium">+ {rial(result.fuelFeeRial)}</td>
              </tr>
            )}
            <tr className="bg-gray-50 font-bold">
              <td className="px-3 py-2.5 text-gray-900">جمع کل با متین</td>
              <td className="px-3 py-2.5 text-left text-blue-700">{rial(result.withMatinBillRial)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* نرخ‌ها */}
      <div className="rounded-lg bg-gray-50 p-3">
        <p className="mb-1.5 text-xs font-medium text-gray-500">نرخ‌های بازار این ماه</p>
        <div className="grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-4">
          <div><span className="text-gray-400">اوج: </span><span className="font-medium">{result.marketPeakRate.toLocaleString('fa-IR')}</span></div>
          <div><span className="text-gray-400">میان: </span><span className="font-medium">{result.marketMidRate.toLocaleString('fa-IR')}</span></div>
          <div><span className="text-gray-400">کم: </span><span className="font-medium">{result.marketLowRate.toLocaleString('fa-IR')}</span></div>
          <div><span className="text-gray-400">پشتیبان: </span><span className="font-medium">{result.backupRate.toLocaleString('fa-IR')}</span></div>
        </div>
      </div>

      {result.savingRial > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-emerald-600 px-4 py-3 text-white text-sm">
          <TrendingDown className="h-4 w-4 shrink-0" />
          <span className="font-medium">صرفه‌جویی: {rial(result.savingRial)} — معادل {result.savingPercent.toLocaleString('fa-IR')}٪</span>
        </div>
      )}
      {result.savingRial < 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-700 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>در این ماه هزینه با متین بیشتر از نرخ پشتیبان است.</span>
        </div>
      )}
    </div>
  )
}

const emptyForm = {
  subscriptionId: '',
  year: '1404',
  month: '1',
  peakKwh: '',
  midKwh: '',
  lowKwh: '',
  fridayPeakKwh: '0',
}

export default function AdminBillReports() {
  const [data, setData]             = useState<AdminBillReport[]>([])
  const [total, setTotal]           = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [filterSubId, setFilterSubId]   = useState('')
  const [filterYear, setFilterYear]     = useState('')
  const [filterMonth, setFilterMonth]   = useState('')
  const pageSize = 10

  // modals
  const [analysisModal, setAnalysisModal] = useState(false)
  const [detailModal, setDetailModal]     = useState(false)
  const [deleteModal, setDeleteModal]     = useState(false)
  const [form, setForm]     = useState(emptyForm)
  const [selected, setSelected] = useState<AdminBillReport | null>(null)
  const [analysisResult, setAnalysisResult] = useState<BillAnalysisResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [subscriptions, setSubscriptions] = useState<SubOption[]>([])
  const [subsLoading, setSubsLoading] = useState(true)

  useEffect(() => {
    lookupApi.getAllSubscriptions()
      .then(r => { if (r.code === 200) setSubscriptions(toArr(r.result) as SubOption[]) })
      .finally(() => setSubsLoading(false))
  }, [])

  const fetchData = useCallback((p: number) => {
    setLoading(true)
    adminApi.getBillReports({
      pageNumber: p, pageSize,
      ...(filterSubId  ? { Search_SubscriptionId: filterSubId }  : {}),
      ...(filterYear   ? { Search_Year: filterYear }              : {}),
      ...(filterMonth  ? { Search_Month: filterMonth }            : {}),
    })
      .then((r) => {
        const res = r.result as any
        setData(res?.data ?? [])
        setTotal(res?.totalRecords ?? 0)
        setTotalPages(res?.totalPages ?? 1)
      })
      .finally(() => setLoading(false))
  }, [filterSubId, filterYear, filterMonth])

  useEffect(() => { fetchData(page) }, [page, fetchData])

  const set = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const handleAnalyze = async () => {
    if (!form.subscriptionId || !form.peakKwh || !form.midKwh || !form.lowKwh) {
      toast.error('شناسه اشتراک و مصارف را وارد کنید')
      return
    }
    setSaving(true)
    try {
      const res = await adminApi.adminBillAnalysis({
        subscriptionId: +form.subscriptionId,
        year: +form.year,
        month: +form.month,
        peakKwh: +form.peakKwh,
        midKwh: +form.midKwh,
        lowKwh: +form.lowKwh,
        fridayPeakKwh: +form.fridayPeakKwh,
      })
      if (res.code === 200 && res.result) {
        setAnalysisResult(res.result as BillAnalysisResult)
        toast.success('تحلیل قبض انجام شد')
        fetchData(page)
      } else {
        toast.error(res.message ?? res.caption ?? 'خطا در تحلیل')
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const openDetail = (row: AdminBillReport) => {
    setSelected(row)
    setAnalysisResult(null)
    setDetailModal(true)
    // re-run analysis with stored values to get full breakdown
    adminApi.adminBillAnalysis({
      subscriptionId: row.subscriptionId,
      year: row.year ?? 0,
      month: row.month ?? 0,
      peakKwh: row.peakCons ?? 0,
      midKwh: row.midCons ?? 0,
      lowKwh: row.lowCons ?? 0,
      fridayPeakKwh: 0,
    }).then((r) => {
      if (r.code === 200 && r.result) setAnalysisResult(r.result as BillAnalysisResult)
    }).catch(() => {})
  }

  const openDelete = (row: AdminBillReport) => { setSelected(row); setDeleteModal(true) }

  const handleDelete = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await adminApi.deleteBillReport(selected.id)
      if (res.code === 200) {
        toast.success('گزارش حذف شد')
        setDeleteModal(false)
        fetchData(page)
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const savingBadge = (r: AdminBillReport) => {
    if (r.costWithoutMatin == null || r.costWithMatin == null) return <span className="text-gray-400">—</span>
    const pct = r.costWithoutMatin > 0
      ? ((r.costWithoutMatin - r.costWithMatin) / r.costWithoutMatin * 100).toFixed(1)
      : '0'
    const pos = +pct > 0
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${pos ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {pos ? '+' : ''}{pct}٪
      </span>
    )
  }

  const columns = [
    { key: 'id',             header: '#',           className: 'w-12' },
    { key: 'billIdentifier', header: 'شناسه قبض' },
    { key: 'year',           header: 'سال' },
    { key: 'month',          header: 'ماه',         render: (r: AdminBillReport) => r.month ? MONTHS[r.month] : '—' },
    { key: 'costWithoutMatin', header: 'بدون متین', render: (r: AdminBillReport) => fmt(r.costWithoutMatin) },
    { key: 'costWithMatin',    header: 'با متین',   render: (r: AdminBillReport) => fmt(r.costWithMatin) },
    { key: 'saving',           header: 'صرفه',      render: savingBadge },
    { key: 'createdAt',        header: 'تاریخ',     render: (r: AdminBillReport) => r.createdAt?.split('T')[0] ?? '—' },
    {
      key: 'actions', header: 'عملیات', className: 'w-20',
      render: (row: AdminBillReport) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openDetail(row)} className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600" title="جزئیات">
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => openDelete(row)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" title="حذف">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">گزارش‌های تحلیل قبض ({total} رکورد)</span>
        </div>
        <Button size="sm" onClick={() => { setForm(emptyForm); setAnalysisResult(null); setAnalysisModal(true) }}>
          <Plus className="h-4 w-4" /> تحلیل جدید
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="w-56">
          <Select
            placeholder="همه اشتراک‌ها"
            value={filterSubId}
            loading={subsLoading}
            options={subscriptions.map(s => ({ value: s.id, label: `${s.billIdentifier} — ${s.address}` }))}
            onChange={(v) => { setFilterSubId(String(v)); setPage(1) }}
          />
        </div>
        <input
          type="number"
          placeholder="سال..."
          value={filterYear}
          onChange={(e) => { setFilterYear(e.target.value); setPage(1) }}
          className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={filterMonth}
          onChange={(e) => { setFilterMonth(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">همه ماه‌ها</option>
          {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
      </div>

      <Table columns={columns} data={data} loading={loading} keyField="id" emptyText="گزارشی یافت نشد" />
      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />

      {/* ===== مودال تحلیل جدید ===== */}
      <Modal
        open={analysisModal}
        onClose={() => setAnalysisModal(false)}
        title="تحلیل قبض جدید"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label="اشتراک *"
              value={form.subscriptionId}
              loading={subsLoading}
              options={subscriptions.map(s => ({ value: s.id, label: `${s.billIdentifier} — ${s.address}` }))}
              onChange={(v) => setForm(f => ({ ...f, subscriptionId: String(v) }))}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">سال (شمسی) *</label>
              <input type="number" value={form.year} onChange={set('year')}
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">ماه مصرف *</label>
              <select value={form.month} onChange={set('month')}
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500">
                {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">مصرف TOU (kWh)</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Input label="اوج بار *"      value={form.peakKwh}       onChange={set('peakKwh')}       placeholder="kWh" inputMode="numeric" />
              <Input label="میان بار *"     value={form.midKwh}        onChange={set('midKwh')}        placeholder="kWh" inputMode="numeric" />
              <Input label="کم بار *"       value={form.lowKwh}        onChange={set('lowKwh')}        placeholder="kWh" inputMode="numeric" />
              <Input label="اوج جمعه"       value={form.fridayPeakKwh} onChange={set('fridayPeakKwh')} placeholder="kWh" inputMode="numeric" />
            </div>
          </div>

          {/* نتیجه */}
          {analysisResult && <AnalysisDetail result={analysisResult} />}
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setAnalysisModal(false)}>بستن</Button>
          <Button loading={saving} onClick={handleAnalyze}>
            <BarChart3 className="h-4 w-4" /> اجرای تحلیل
          </Button>
        </div>
      </Modal>

      {/* ===== مودال جزئیات ===== */}
      <Modal
        open={detailModal}
        onClose={() => setDetailModal(false)}
        title={`جزئیات تحلیل — اشتراک ${selected?.subscriptionId ?? ''}`}
        size="lg"
      >
        {analysisResult ? (
          <AnalysisDetail result={analysisResult} />
        ) : (
          <div className="flex h-32 items-center justify-center">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Zap className="h-4 w-4 animate-pulse" />
              در حال بارگذاری جزئیات...
            </div>
          </div>
        )}
        <div className="mt-5 flex justify-end">
          <Button variant="secondary" onClick={() => setDetailModal(false)}>بستن</Button>
        </div>
      </Modal>

      {/* ===== مودال حذف ===== */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="حذف گزارش" size="sm">
        <p className="text-sm text-gray-600">
          آیا از حذف گزارش تحلیل اشتراک <span className="font-bold text-gray-900">{selected?.billIdentifier}</span> برای{' '}
          <span className="font-bold text-gray-900">{selected?.month ? MONTHS[selected.month] : ''} {selected?.year}</span> اطمینان دارید؟
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteModal(false)}>انصراف</Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}>
            <Trash2 className="h-4 w-4" /> حذف
          </Button>
        </div>
      </Modal>
    </div>
  )
}
