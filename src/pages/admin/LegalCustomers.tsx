import { useEffect, useState, useCallback } from 'react'
import { Search, Building2, Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { Table, Pagination } from '../../components/ui/Table'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import type { AdminLegalCustomer } from '../../types'

const emptyForm: AdminLegalCustomer = {
  id: 0,
  nationalId: '',
  companyName: '',
  ceoFullName: '',
  economicCode: '',
  ceoMobile: '',
  familiarityType: 0,
  customerTypeId: 2,
  isActive: true,
}

const familiarityOptions = [
  { value: 0, label: '-- انتخاب کنید --' },
  { value: 1, label: 'معرفی دوستان' },
  { value: 2, label: 'فضای مجازی' },
  { value: 3, label: 'تبلیغات' },
  { value: 4, label: 'سایر' },
]

export default function AdminLegalCustomers() {
  const [data, setData] = useState<AdminLegalCustomer[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState({ companyName: '', nationalId: '', ceoFullName: '' })
  const [applied, setApplied] = useState(search)
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [form, setForm] = useState<AdminLegalCustomer>(emptyForm)
  const [saving, setSaving] = useState(false)
  const pageSize = 10

  const fetchData = useCallback((p: number, filters: typeof search) => {
    setLoading(true)
    adminApi
      .getLegalCustomers({
        pageNumber: p,
        pageSize,
        ...(filters.companyName && { Search_CompanyName: filters.companyName }),
        ...(filters.nationalId && { Search_NationalId: filters.nationalId }),
        ...(filters.ceoFullName && { Search_CeoFullName: filters.ceoFullName }),
      })
      .then((r) => {
        const res = r.result as any
        setData(res?.data ?? [])
        setTotal(res?.totalRecords ?? 0)
        setTotalPages(res?.totalPages ?? 1)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData(page, applied) }, [page, applied, fetchData])

  const handleSearch = () => { setPage(1); setApplied(search) }
  const handleReset = () => {
    const e = { companyName: '', nationalId: '', ceoFullName: '' }
    setSearch(e); setApplied(e); setPage(1)
  }

  const openCreate = () => { setForm(emptyForm); setModal('create') }
  const openEdit = async (row: AdminLegalCustomer) => {
    try {
      const res = await adminApi.getLegalCustomerDetail(row.id)
      setForm({ ...emptyForm, ...(res.result ?? row) })
    } catch { setForm({ ...emptyForm, ...row }) }
    setModal('edit')
  }
  const openDelete = (row: AdminLegalCustomer) => { setForm(row); setModal('delete') }

  const handleSave = async () => {
    if (!form.nationalId || !form.companyName || !form.ceoFullName) {
      toast.error('فیلدهای اجباری را پر کنید')
      return
    }
    setSaving(true)
    try {
      const res = modal === 'create'
        ? await adminApi.createLegalCustomer(form)
        : await adminApi.updateLegalCustomer(form)
      if (res.code === 200) {
        toast.success(modal === 'create' ? 'مشتری حقوقی اضافه شد' : 'اطلاعات ویرایش شد')
        setModal(null)
        fetchData(page, applied)
      } else {
        toast.error(res.caption ?? 'خطا در عملیات')
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const res = await adminApi.deleteLegalCustomer(form.id)
      if (res.code === 200) {
        toast.success('مشتری حذف شد')
        setModal(null)
        fetchData(page, applied)
      } else {
        toast.error(res.caption ?? 'خطا در حذف')
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const f = (k: keyof AdminLegalCustomer) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const columns = [
    { key: 'id', header: '#', className: 'w-14' },
    { key: 'companyName', header: 'نام شرکت' },
    { key: 'nationalId', header: 'شناسه ملی' },
    { key: 'ceoFullName', header: 'مدیرعامل' },
    { key: 'ceoMobile', header: 'موبایل مدیرعامل' },
    {
      key: 'isActive',
      header: 'وضعیت',
      render: (row: AdminLegalCustomer) => (
        <Badge variant={row.isActive ? 'green' : 'gray'}>{row.isActive ? 'فعال' : 'غیرفعال'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'عملیات',
      className: 'w-24',
      render: (row: AdminLegalCustomer) => (
        <div className="flex gap-1">
          <button onClick={() => openEdit(row)} title="ویرایش"
            className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => openDelete(row)} title="حذف"
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
          <Search className="h-4 w-4" /> جستجو
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input placeholder="نام شرکت" value={search.companyName}
            onChange={(e) => setSearch({ ...search, companyName: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          <Input placeholder="شناسه ملی" value={search.nationalId}
            onChange={(e) => setSearch({ ...search, nationalId: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          <Input placeholder="نام مدیرعامل" value={search.ceoFullName}
            onChange={(e) => setSearch({ ...search, ceoFullName: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={handleSearch}><Search className="h-4 w-4" /> جستجو</Button>
          <Button size="sm" variant="secondary" onClick={handleReset}>پاک کردن</Button>
        </div>
      </div>

      {/* Table header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">مشتریان حقوقی ({total} رکورد)</span>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> مشتری جدید</Button>
      </div>

      <Table columns={columns} data={data} loading={loading} keyField="id" emptyText="مشتری حقوقی یافت نشد" />
      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />

      {/* Create / Edit Modal */}
      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'create' ? 'مشتری حقوقی جدید' : 'ویرایش مشتری حقوقی'} size="lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="نام شرکت *" value={form.companyName} onChange={f('companyName')} placeholder="نام کامل شرکت" />
          <Input label="شناسه ملی *" value={form.nationalId} onChange={f('nationalId')} placeholder="۱۱ رقم" maxLength={12} inputMode="numeric" />
          <Input label="نام مدیرعامل *" value={form.ceoFullName} onChange={f('ceoFullName')} placeholder="نام و نام خانوادگی" />
          <Input label="موبایل مدیرعامل" value={form.ceoMobile ?? ''} onChange={f('ceoMobile')} placeholder="09xxxxxxxxx" maxLength={11} inputMode="numeric" />
          <Input label="کد اقتصادی" value={form.economicCode ?? ''} onChange={f('economicCode')} placeholder="کد اقتصادی" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">نحوه آشنایی</label>
            <select value={form.familiarityType ?? 0} onChange={f('familiarityType')}
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500">
              {familiarityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <input type="checkbox" id="legalActive" checked={form.isActive ?? true}
              onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-primary-600" />
            <label htmlFor="legalActive" className="text-sm text-gray-700">کاربر فعال است</label>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button loading={saving} onClick={handleSave}>
            {modal === 'create' ? 'ثبت مشتری' : 'ذخیره تغییرات'}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="حذف مشتری حقوقی" size="sm">
        <p className="text-sm text-gray-600 mb-5">
          آیا از حذف شرکت <span className="font-bold text-gray-900">{form.companyName}</span> اطمینان دارید؟
          این عملیات قابل بازگشت نیست.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}>
            <Trash2 className="h-4 w-4" /> حذف
          </Button>
        </div>
      </Modal>
    </div>
  )
}
