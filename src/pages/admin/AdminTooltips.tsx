import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, HelpCircle, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { Table } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'

type Tooltip = {
  id: number
  pageKey: string
  fieldKey: string
  title: string
  content: string
  isActive: boolean
}

const empty: Tooltip = { id: 0, pageKey: '', fieldKey: '', title: '', content: '', isActive: true }

const PAGE_OPTIONS = [
  { value: 'bill-optimal', label: 'بهینه‌ساز خرید (تحلیل قبض)' },
  { value: 'orders',       label: 'سفارشات مشتری' },
  { value: 'contracts',    label: 'قراردادها' },
  { value: 'profile',      label: 'پروفایل' },
]

const FIELD_OPTIONS: Record<string, { value: string; label: string }[]> = {
  'bill-optimal': [
    { value: 'year',             label: 'سال شمسی' },
    { value: 'month',            label: 'ماه' },
    { value: 'totalKwh',         label: 'مصرف کل (kWh)' },
    { value: 'midKwh',           label: 'مصرف میان بار (kWh)' },
    { value: 'peakKwh',          label: 'مصرف اوج بار (kWh)' },
    { value: 'lowKwh',           label: 'مصرف کم بار (kWh)' },
    { value: 'contractDemandKw', label: 'دیماند قراردادی (kW)' },
    { value: 'actualDemandKw',   label: 'دیماند مصرفی (kW)' },
  ],
  'orders': [
    { value: 'requestedKwh', label: 'مقدار درخواستی (kWh)' },
    { value: 'energyType',   label: 'نوع انرژی' },
    { value: 'isPriceRequest', label: 'استعلام قیمت' },
  ],
  'contracts': [
    { value: 'contractRate',     label: 'نرخ قرارداد' },
    { value: 'contractCapacity', label: 'ظرفیت قرارداد' },
  ],
  'profile': [
    { value: 'mobile', label: 'شماره موبایل' },
    { value: 'email',  label: 'ایمیل' },
  ],
}

export default function AdminTooltips() {
  const [data, setData]       = useState<Tooltip[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState<'create' | 'edit' | 'delete' | null>(null)
  const [form, setForm]       = useState<Tooltip>(empty)
  const [saving, setSaving]   = useState(false)

  const fetchData = useCallback(() => {
    setLoading(true)
    adminApi.getTooltips()
      .then(r => setData(Array.isArray(r.result) ? r.result : []))
      .catch(() => toast.error('خطا در دریافت راهنماها'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => { setForm(empty); setModal('create') }
  const openEdit   = (row: Tooltip) => { setForm({ ...row }); setModal('edit') }
  const openDelete = (row: Tooltip) => { setForm(row); setModal('delete') }

  const handleSave = async () => {
    if (!form.pageKey || !form.fieldKey || !form.title || !form.content) {
      toast.error('همه فیلدها الزامی هستند')
      return
    }
    setSaving(true)
    try {
      const res = modal === 'create'
        ? await adminApi.createTooltip(form)
        : await adminApi.updateTooltip(form)
      if (res.code === 200) {
        toast.success(modal === 'create' ? 'راهنما ثبت شد' : 'راهنما ویرایش شد')
        setModal(null); fetchData()
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const res = await adminApi.deleteTooltip(form.id)
      if (res.code === 200) { toast.success('راهنما حذف شد'); setModal(null); fetchData() }
      else toast.error(res.message ?? 'خطا')
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const pageLabelOf  = (key: string) => PAGE_OPTIONS.find(p => p.value === key)?.label ?? key
  const fieldLabelOf = (pageKey: string, fk: string) =>
    FIELD_OPTIONS[pageKey]?.find(f => f.value === fk)?.label ?? fk

  const fieldOptions = FIELD_OPTIONS[form.pageKey] ?? []

  const cols = [
    { key: 'pageKey',  header: 'صفحه',   render: (r: Tooltip) => <span className="text-xs text-gray-600">{pageLabelOf(r.pageKey)}</span> },
    { key: 'fieldKey', header: 'فیلد',   render: (r: Tooltip) => <span className="text-xs text-gray-700">{fieldLabelOf(r.pageKey, r.fieldKey)}</span> },
    { key: 'title',    header: 'عنوان',  render: (r: Tooltip) => <span className="text-sm font-medium">{r.title}</span> },
    { key: 'isActive', header: 'فعال',   render: (r: Tooltip) => r.isActive
        ? <ToggleRight className="h-5 w-5 text-emerald-500" />
        : <ToggleLeft  className="h-5 w-5 text-gray-400" /> },
    {
      key: 'actions', header: '', render: (r: Tooltip) => (
        <div className="flex justify-end gap-1">
          <button onClick={() => openEdit(r)}   className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"><Pencil  className="h-3.5 w-3.5" /></button>
          <button onClick={() => openDelete(r)} className="rounded-lg p-1.5 text-red-500  hover:bg-red-50" ><Trash2  className="h-3.5 w-3.5" /></button>
        </div>
      )
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <HelpCircle className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">مدیریت راهنماها</h2>
            <p className="text-xs text-gray-500">راهنمای داینامیک برای فرم‌های مشتریان</p>
          </div>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4" /> افزودن راهنما
        </Button>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl">
        <Table columns={cols} data={data} loading={loading} emptyText="راهنمایی ثبت نشده است" />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modal === 'create' || modal === 'edit'}
        title={modal === 'edit' ? 'ویرایش راهنما' : 'افزودن راهنما'}
        onClose={() => setModal(null)}
      >
        <div className="space-y-4">
          {/* صفحه */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">صفحه *</label>
            <select
              value={form.pageKey}
              onChange={e => setForm(f => ({ ...f, pageKey: e.target.value, fieldKey: '' }))}
              className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
            >
              <option value="">انتخاب کنید...</option>
              {PAGE_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          {/* فیلد */}
          {form.pageKey && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">فیلد مربوطه *</label>
              <select
                value={form.fieldKey}
                onChange={e => setForm(f => ({ ...f, fieldKey: e.target.value }))}
                className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
              >
                <option value="">انتخاب کنید...</option>
                {fieldOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          )}

          {/* عنوان */}
          <Input
            label="عنوان راهنما *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="مثال: مصرف اوج بار چیست؟"
          />

          {/* متن */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">متن راهنما *</label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={4}
              className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
              placeholder="توضیحات راهنما را بنویسید..."
            />
          </div>

          {/* فعال */}
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700">فعال (نمایش به مشتریان)</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModal(null)}>انصراف</Button>
            <Button loading={saving} onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">ذخیره</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={modal === 'delete'} title="حذف راهنما" onClose={() => setModal(null)}>
        <p className="text-sm text-gray-600">
          آیا از حذف راهنمای <strong>{form.title}</strong> مطمئن هستید؟
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModal(null)}>انصراف</Button>
          <Button loading={saving} onClick={handleDelete} className="bg-red-600 hover:bg-red-700">حذف</Button>
        </div>
      </Modal>
    </div>
  )
}
