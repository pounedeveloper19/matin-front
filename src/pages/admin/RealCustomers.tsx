import { useEffect, useState, useCallback } from 'react'
import { Search, Users, Plus, Pencil, Trash2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { Table, Pagination } from '../../components/ui/Table'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import CustomerDetailPanel from '../../components/admin/CustomerDetailPanel'
import type { AdminRealCustomer } from '../../types'

const emptyForm: AdminRealCustomer = {
  id: 0,
  nationalCode: '',
  firstName: '',
  lastName: '',
  mobile: '',
  familiarityType: 0,
  customerTypeId: 1,
  isActive: true,
}

const familiarityOptions = [
  { value: 0, label: '-- انتخاب کنید --' },
  { value: 1, label: 'معرفی دوستان' },
  { value: 2, label: 'فضای مجازی' },
  { value: 3, label: 'تبلیغات' },
  { value: 4, label: 'سایر' },
]

export default function AdminRealCustomers() {
  const [data, setData] = useState<AdminRealCustomer[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState({ name: '', nationalCode: '', mobile: '' })
  const [applied, setApplied] = useState(search)
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [form, setForm] = useState<AdminRealCustomer>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [detailProfileId, setDetailProfileId] = useState<number | null>(null)
  const [detailTitle, setDetailTitle] = useState('')
  const pageSize = 10

  const fetchData = useCallback((p: number, filters: typeof search) => {
    setLoading(true)
    adminApi
      .getRealCustomers({
        pageNumber: p,
        pageSize,
        ...(filters.name && { Search_Name: filters.name }),
        ...(filters.nationalCode && { Search_NationalCode: filters.nationalCode }),
        ...(filters.mobile && { Search_Mobile: filters.mobile }),
      })
      .then((r) => {
        if (r.code !== 200) {
          toast.error(r.caption ?? 'خطا در دریافت اطلاعات')
          return
        }
        const res = r.result as any
        setData(res?.data ?? [])
        setTotal(res?.totalRecords ?? 0)
        setTotalPages(res?.totalPages ?? 1)
      })
      .catch(() => toast.error('خطا در ارتباط با سرور'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData(page, applied) }, [page, applied, fetchData])

  const handleSearch = () => { setPage(1); setApplied(search) }
  const handleReset = () => {
    const e = { name: '', nationalCode: '', mobile: '' }
    setSearch(e); setApplied(e); setPage(1)
  }

  const openDetail = (row: AdminRealCustomer) => {
    setDetailProfileId(row.id)
    setDetailTitle(`${row.firstName} ${row.lastName}`)
  }

  const openCreate = () => { setForm(emptyForm); setModal('create') }
  const openEdit = async (row: AdminRealCustomer) => {
    try {
      const res = await adminApi.getRealCustomerDetail(row.id)
      setForm({ ...emptyForm, ...(res.result ?? row) })
    } catch { setForm({ ...emptyForm, ...row }) }
    setModal('edit')
  }
  const openDelete = (row: AdminRealCustomer) => { setForm(row); setModal('delete') }

  const handleSave = async () => {
    if (!form.nationalCode || !form.firstName || !form.lastName || !form.mobile) {
      toast.error('فیلدهای اجباری را پر کنید')
      return
    }
    setSaving(true)
    try {
      const res = modal === 'create'
        ? await adminApi.createRealCustomer(form)
        : await adminApi.updateRealCustomer(form)
      if (res.code === 200) {
        toast.success(modal === 'create' ? 'مشتری حقیقی اضافه شد' : 'اطلاعات ویرایش شد')
        setModal(null)
        fetchData(page, applied)
      } else {
        toast.error(res.message ?? res.caption ?? 'خطا در عملیات')
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const res = await adminApi.deleteRealCustomer(form.id)
      if (res.code === 200) {
        toast.success('مشتری حذف شد')
        setModal(null)
        fetchData(page, applied)
      } else {
        toast.error(res.message ?? res.caption ?? 'خطا در حذف')
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const f = (k: keyof AdminRealCustomer) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const columns = [
    { key: 'id', header: '#', className: 'w-14' },
    { key: 'firstName', header: 'نام' },
    { key: 'lastName', header: 'نام خانوادگی' },
    { key: 'nationalCode', header: 'کد ملی' },
    { key: 'mobile', header: 'موبایل' },
    {
      key: 'isActive',
      header: 'وضعیت',
      render: (row: AdminRealCustomer) => (
        <Badge variant={row.isActive ? 'green' : 'gray'}>{row.isActive ? 'فعال' : 'غیرفعال'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'عملیات',
      className: 'w-32',
      render: (row: AdminRealCustomer) => (
        <div className="flex gap-1">
          <button onClick={() => openDetail(row)} title="جزئیات"
            className="rounded p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600">
            <Eye className="h-3.5 w-3.5" />
          </button>
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
          <Input placeholder="نام / نام خانوادگی" value={search.name}
            onChange={(e) => setSearch({ ...search, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          <Input placeholder="کد ملی" value={search.nationalCode}
            onChange={(e) => setSearch({ ...search, nationalCode: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          <Input placeholder="موبایل" value={search.mobile}
            onChange={(e) => setSearch({ ...search, mobile: e.target.value })}
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
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">مشتریان حقیقی ({total} رکورد)</span>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> مشتری جدید</Button>
      </div>

      <Table columns={columns} data={data} loading={loading} keyField="id" emptyText="مشتری حقیقی یافت نشد" />
      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />

      {/* Create / Edit Modal */}
      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'create' ? 'مشتری حقیقی جدید' : 'ویرایش مشتری حقیقی'} size="lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="نام *" value={form.firstName} onChange={f('firstName')} placeholder="نام" />
          <Input label="نام خانوادگی *" value={form.lastName} onChange={f('lastName')} placeholder="نام خانوادگی" />
          <Input label="کد ملی *" value={form.nationalCode} onChange={f('nationalCode')}
            placeholder="۱۰ رقم" maxLength={10} inputMode="numeric" />
          <Input label="موبایل *" value={form.mobile} onChange={f('mobile')}
            placeholder="09xxxxxxxxx" maxLength={11} inputMode="numeric" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">نحوه آشنایی</label>
            <select value={form.familiarityType ?? 0} onChange={f('familiarityType')}
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500">
              {familiarityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <input type="checkbox" id="realActive" checked={form.isActive ?? true}
              onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-primary-600" />
            <label htmlFor="realActive" className="text-sm text-gray-700">کاربر فعال است</label>
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
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="حذف مشتری حقیقی" size="sm">
        <p className="text-sm text-gray-600 mb-5">
          آیا از حذف <span className="font-bold text-gray-900">{form.firstName} {form.lastName}</span> اطمینان دارید؟
          این عملیات قابل بازگشت نیست.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}>
            <Trash2 className="h-4 w-4" /> حذف
          </Button>
        </div>
      </Modal>

      <CustomerDetailPanel
        open={detailProfileId !== null}
        profileId={detailProfileId}
        customerTitle={detailTitle}
        onClose={() => setDetailProfileId(null)}
      />
    </div>
  )
}
