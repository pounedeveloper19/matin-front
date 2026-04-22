import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, BarChart2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { Table, Pagination } from '../../components/ui/Table'
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
      } else { toast.error(res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const res = await adminApi.deleteMarketRate(form.id)
      if (res.code === 200) { toast.success('نرخ حذف شد'); setModal(null); fetch(page) }
      else { toast.error(res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">نرخ‌های بازار ماهانه ({total} رکورد)</span>
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
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button loading={saving} onClick={handleSave}>{modal === 'create' ? 'ثبت نرخ' : 'ذخیره تغییرات'}</Button>
        </div>
      </Modal>

      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="حذف نرخ" size="sm">
        <p className="text-sm text-gray-600">
          آیا از حذف نرخ <span className="font-bold text-gray-900">{JALALI_MONTHS[form.month]} {form.year}</span> اطمینان دارید؟
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}><Trash2 className="h-4 w-4" /> حذف</Button>
        </div>
      </Modal>
    </div>
  )
}
