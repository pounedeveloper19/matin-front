import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, BarChart2, TrendingUp, Activity, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { Table, Pagination } from '../../components/ui/Table'
import { StatCard } from '../../components/ui/Card'
import { SvgLineChart } from '../../components/ui/Charts'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import type { MonthlyMarketRate } from '../../types'

const JALALI_MONTHS = ['', 'فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']

const empty: MonthlyMarketRate = {
  id: 0, year: 1404, month: 1,
  marketPeak: 0, marketMid: 0, marketLow: 0, backupRate: 0,
  boardPeak: 0, boardMid: 0, boardLow: 0,
  greenBoardRate: 0, article16Rate: 0, fuelFee: 0,
  industrialTariffBase: 0, executiveTariffBase: 0,
}

export default function AdminMarketRates() {
  const [data, setData]           = useState<MonthlyMarketRate[]>([])
  const [total, setTotal]         = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState<'create' | 'edit' | 'delete' | null>(null)
  const [form, setForm]           = useState<MonthlyMarketRate>(empty)
  const [saving, setSaving]       = useState(false)
  const pageSize = 10

  const fetch = useCallback((p: number) => {
    setLoading(true)
    adminApi.getMarketRates({ pageNumber: p, pageSize })
      .then((r) => {
        const res = r.result as any
        setData(res?.data ?? [])
        setTotal(res?.totalRecords ?? 0)
        setTotalPages(res?.totalPages ?? 1)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetch(page) }, [page, fetch])

  const openCreate = () => { setForm(empty); setModal('create') }
  const openEdit = async (row: MonthlyMarketRate) => {
    try { const r = await adminApi.getMarketRateDetail(row.id); setForm(r.result ?? row) }
    catch { setForm(row) }
    setModal('edit')
  }
  const openDelete = (row: MonthlyMarketRate) => { setForm(row); setModal('delete') }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = modal === 'create'
        ? await adminApi.createMarketRate(form)
        : await adminApi.updateMarketRate(form)
      if (res.code === 200) {
        toast.success(modal === 'create' ? 'نرخ ثبت شد' : 'نرخ ویرایش شد')
        setModal(null); fetch(page)
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const res = await adminApi.deleteMarketRate(form.id)
      if (res.code === 200) { toast.success('نرخ حذف شد'); setModal(null); fetch(page) }
      else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const stats = useMemo(() => {
    if (!data.length) return null
    const avg = (key: keyof MonthlyMarketRate) =>
      Math.round(data.reduce((s, d) => s + ((d[key] as number) || 0), 0) / data.length)
    const latest = data[0]
    const maxRate = Math.max(latest?.marketPeak || 0, latest?.marketMid || 0, latest?.marketLow || 0) || 1
    const sorted  = [...data].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    const chartLabels = sorted.map(d => (JALALI_MONTHS[d.month] ?? String(d.month)).slice(0, 3))
    const chartSeries = [
      { name: 'اوج', color: '#ef4444', data: sorted.map(d => d.marketPeak) },
      { name: 'میان', color: '#f59e0b', data: sorted.map(d => d.marketMid)  },
      { name: 'کم',   color: '#10b981', data: sorted.map(d => d.marketLow)  },
    ]
    return { avgPeak: avg('marketPeak'), avgMid: avg('marketMid'), avgLow: avg('marketLow'), avgBackup: avg('backupRate'), latest, maxRate, chartLabels, chartSeries }
  }, [data])

  const f = (key: keyof MonthlyMarketRate) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: +e.target.value })

  const columns = [
    { key: 'year',       header: 'سال' },
    { key: 'month',      header: 'ماه', render: (r: MonthlyMarketRate) => JALALI_MONTHS[r.month] },
    { key: 'marketPeak', header: 'نرخ اوج بار (ریال/kWh)' },
    { key: 'marketMid',  header: 'نرخ میان بار' },
    { key: 'marketLow',  header: 'نرخ کم بار' },
    { key: 'backupRate', header: 'نرخ پشتیبان' },
    {
      key: 'actions', header: 'عملیات', className: 'w-24',
      render: (row: MonthlyMarketRate) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(row)} className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={() => openDelete(row)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="میانگین اوج بار"  value={stats.avgPeak.toLocaleString('fa-IR')}  icon={<TrendingUp className="h-5 w-5" />} color="red"   subtitle="ریال/kWh" />
          <StatCard title="میانگین میان بار" value={stats.avgMid.toLocaleString('fa-IR')}   icon={<Activity className="h-5 w-5" />}   color="amber" subtitle="ریال/kWh" />
          <StatCard title="میانگین کم بار"   value={stats.avgLow.toLocaleString('fa-IR')}   icon={<Zap className="h-5 w-5" />}         color="green" subtitle="ریال/kWh" />
          <StatCard title="میانگین پشتیبان"  value={stats.avgBackup.toLocaleString('fa-IR')} icon={<BarChart2 className="h-5 w-5" />}  color="blue"  subtitle="ریال/kWh" />
        </div>
      )}

      {/* Latest month rate bars */}
      {stats?.latest && (
        <div className="overflow-hidden rounded-2xl p-5 space-y-4"
          style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)', border: '1px solid rgba(209,250,229,0.6)', boxShadow: '0 4px 20px rgba(6,78,59,0.06)' }}>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="h-4 w-4 text-rose-500" />
            <p className="text-sm font-semibold text-gray-700">نرخ‌های آخرین ماه ثبت‌شده</p>
            <span className="text-xs text-gray-400">{JALALI_MONTHS[stats.latest.month]} {stats.latest.year}</span>
          </div>
          {[
            { label: 'اوج بار',  value: stats.latest.marketPeak, color: '#ef4444' },
            { label: 'میان بار', value: stats.latest.marketMid,  color: '#f59e0b' },
            { label: 'کم بار',   value: stats.latest.marketLow,  color: '#10b981' },
            { label: 'پشتیبان',  value: stats.latest.backupRate, color: '#6366f1' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-20 text-right text-xs text-gray-500 shrink-0">{label}</span>
              <div className="flex-1 overflow-hidden rounded-full bg-gray-100 h-3">
                <div
                  className="h-3 rounded-full transition-all"
                  style={{
                    width: `${Math.round(((Number(value) || 0) / stats.maxRate) * 100)}%`,
                    background: color,
                  }}
                />
              </div>
              <span className="w-28 text-xs font-bold text-gray-700 shrink-0">{(Number(value) || 0).toLocaleString('fa-IR')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Line chart */}
      {stats && stats.chartSeries[0].data.length > 1 && (
        <div className="overflow-hidden rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)', border: '1px solid rgba(209,250,229,0.6)', boxShadow: '0 4px 20px rgba(6,78,59,0.06)' }}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-rose-500" />
              <p className="text-sm font-semibold text-gray-700">نوسانات نرخ ماهانه</p>
            </div>
            <div className="flex items-center gap-3">
              {[{ label: 'اوج بار', color: '#ef4444' }, { label: 'میان بار', color: '#f59e0b' }, { label: 'کم بار', color: '#10b981' }].map(s => (
                <span key={s.label} className="flex items-center gap-1 text-[11px] text-gray-500">
                  <span className="inline-block h-2 w-4 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
              ))}
            </div>
          </div>
          <SvgLineChart series={stats.chartSeries} labels={stats.chartLabels} height={170} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-rose-500" />
          <p className="text-sm font-semibold text-gray-700">نرخ‌های بازار ماهانه</p>
          <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
            {total.toLocaleString('fa-IR')} رکورد
          </span>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> نرخ جدید</Button>
      </div>

      <Table columns={columns} data={data} loading={loading} keyField="id" emptyText="نرخی ثبت نشده" />
      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />

      <Modal
        open={modal === 'create' || modal === 'edit'}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'نرخ جدید' : 'ویرایش نرخ'}
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Input label="سال"          type="number" value={form.year}             onChange={f('year')} />
          <Input label="ماه"          type="number" value={form.month}            onChange={f('month')} />
          <Input label="نرخ اوج بار" type="number" value={form.marketPeak}       onChange={f('marketPeak')} />
          <Input label="نرخ میان بار" type="number" value={form.marketMid}       onChange={f('marketMid')} />
          <Input label="نرخ کم بار"  type="number" value={form.marketLow}        onChange={f('marketLow')} />
          <Input label="نرخ پشتیبان" type="number" value={form.backupRate}       onChange={f('backupRate')} />
          <Input label="تابلوی اوج"  type="number" value={form.boardPeak}        onChange={f('boardPeak')} />
          <Input label="تابلوی میان" type="number" value={form.boardMid}         onChange={f('boardMid')} />
          <Input label="تابلوی کم"   type="number" value={form.boardLow}         onChange={f('boardLow')} />
          <Input label="نرخ سبز تابلو" type="number" value={form.greenBoardRate} onChange={f('greenBoardRate')} />
          <Input label="ماده ۱۶ (ریال/kWh)" type="number" value={form.article16Rate} onChange={f('article16Rate')} />
          <Input label="هزینه سوخت"  type="number" value={form.fuelFee}          onChange={f('fuelFee')} />
          <Input label="تعرفه پایه صنعتی" type="number" value={form.industrialTariffBase} onChange={f('industrialTariffBase')} />
          <Input label="تعرفه پایه اجرایی" type="number" value={form.executiveTariffBase} onChange={f('executiveTariffBase')} />
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button loading={saving} onClick={handleSave}>{modal === 'create' ? 'ثبت نرخ' : 'ذخیره تغییرات'}</Button>
        </div>
      </Modal>

      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="حذف نرخ" size="sm">
        <p className="text-sm text-gray-600">
          آیا از حذف نرخ <span className="font-bold text-gray-900">{JALALI_MONTHS[form.month]} {form.year}</span> اطمینان دارید؟
        </p>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}><Trash2 className="h-4 w-4" /> حذف</Button>
        </div>
      </Modal>
    </div>
  )
}
