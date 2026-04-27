import { useEffect, useState, useCallback } from 'react'
import { Search, Users, Plus, Pencil, Trash2, Eye, Trash, UserCheck, UserX, Home, Briefcase, MoreHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import { validateNationalCode, validateMobile } from '../../utils/validators'
import { adminApi } from '../../api/admin'
import { lookupApi } from '../../api/lookup'
import { Table, Pagination } from '../../components/ui/Table'
import { StatCard } from '../../components/ui/Card'
import { RegionHeatMap } from '../../components/ui/Charts'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import CustomerDetailPanel from '../../components/admin/CustomerDetailPanel'
import type { AdminRealCustomer } from '../../types'

const emptyForm: AdminRealCustomer = {
  id: 0, nationalCode: '', firstName: '', lastName: '', mobile: '',
  familiarityType: 0, customerTypeId: 1, isActive: true,
}

const familiarityOptions = [
  { value: 0, label: '-- انتخاب کنید --' },
  { value: 1, label: 'معرفی دوستان' },
  { value: 2, label: 'فضای مجازی' },
  { value: 3, label: 'تبلیغات' },
  { value: 4, label: 'سایر' },
]

const avatarColors = [
  'bg-emerald-100 text-emerald-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]

export default function AdminRealCustomers() {
  const [data, setData] = useState<AdminRealCustomer[]>([])
  const [total, setTotal] = useState(0)
  const [totalActive, setTotalActive] = useState(0)
  const [totalInactive, setTotalInactive] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState({ name: '', nationalCode: '', mobile: '', isActive: '' })
  const [applied, setApplied] = useState(search)
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [form, setForm] = useState<AdminRealCustomer>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [detailProfileId, setDetailProfileId] = useState<number | null>(null)
  const [detailTitle, setDetailTitle] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([])
  const pageSize = 10

  useEffect(() => {
    lookupApi.getProvinces().then(r => { if (r.code === 200 && Array.isArray(r.result)) setProvinces(r.result) })
  }, [])

  const fetchStats = useCallback(() => {
    adminApi.getRealCustomers({ pageNumber: 1, pageSize: 1, Search_IsActive: 'true' })
      .then(r => { const res = r.result as any; setTotalActive(res?.totalRecords ?? 0) })
    adminApi.getRealCustomers({ pageNumber: 1, pageSize: 1, Search_IsActive: 'false' })
      .then(r => { const res = r.result as any; setTotalInactive(res?.totalRecords ?? 0) })
  }, [])

  const fetchData = useCallback((p: number, filters: typeof search) => {
    setLoading(true)
    adminApi.getRealCustomers({
      pageNumber: p, pageSize,
      ...(filters.name && { Search_Name: filters.name }),
      ...(filters.nationalCode && { Search_NationalCode: filters.nationalCode }),
      ...(filters.mobile && { Search_Mobile: filters.mobile }),
      ...(filters.isActive && { Search_IsActive: filters.isActive }),
    })
      .then((r) => {
        if (r.code !== 200) { toast.error(r.caption ?? 'خطا در دریافت اطلاعات'); return }
        const res = r.result as any
        setData(res?.data ?? [])
        setTotal(res?.totalRecords ?? 0)
        setTotalPages(res?.totalPages ?? 1)
      })
      .catch(() => toast.error('خطا در ارتباط با سرور'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData(page, applied) }, [page, applied, fetchData])
  useEffect(() => { fetchStats() }, [fetchStats])

  const handleSearch = () => { setPage(1); setApplied(search); setSelectedIds([]) }
  const handleReset = () => {
    const e = { name: '', nationalCode: '', mobile: '', isActive: '' }
    setSearch(e); setApplied(e); setPage(1); setSelectedIds([])
  }

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return
    if (!window.confirm(`آیا از حذف ${selectedIds.length} مشتری اطمینان دارید؟`)) return
    setBulkDeleting(true)
    try {
      await Promise.all(selectedIds.map((id) => adminApi.deleteRealCustomer(id)))
      toast.success(`${selectedIds.length} مشتری حذف شد`)
      setSelectedIds([]); fetchData(page, applied); fetchStats()
    } catch { toast.error('خطا در حذف گروهی') }
    finally { setBulkDeleting(false) }
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
      toast.error('فیلدهای اجباری را پر کنید'); return
    }
    if (!validateNationalCode(form.nationalCode)) { toast.error('کد ملی وارد شده معتبر نیست'); return }
    if (!validateMobile(form.mobile)) { toast.error('موبایل باید ۱۱ رقم و با ۰۹ شروع شود'); return }
    setSaving(true)
    try {
      const res = modal === 'create' ? await adminApi.createRealCustomer(form) : await adminApi.updateRealCustomer(form)
      if (res.code === 200) {
        toast.success(modal === 'create' ? 'مشتری حقیقی اضافه شد' : 'اطلاعات ویرایش شد')
        setModal(null); fetchData(page, applied); fetchStats()
      } else { toast.error(res.message ?? res.caption ?? 'خطا در عملیات') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const res = await adminApi.deleteRealCustomer(form.id)
      if (res.code === 200) {
        toast.success('مشتری حذف شد'); setModal(null); fetchData(page, applied); fetchStats()
      } else { toast.error(res.message ?? res.caption ?? 'خطا در حذف') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const f = (k: keyof AdminRealCustomer) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }))
  const fNum = (k: keyof AdminRealCustomer) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value.replace(/\D/g, '') }))

  const columns = [
    {
      key: 'firstName',
      header: 'نام و کد ملی',
      render: (row: AdminRealCustomer) => (
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColors[row.id % avatarColors.length]}`}>
            {row.firstName?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{row.firstName} {row.lastName}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{row.nationalCode}</p>
          </div>
        </div>
      ),
    },
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
      className: 'w-28',
      render: (row: AdminRealCustomer) => (
        <div className="flex gap-1">
          <button onClick={() => { setDetailProfileId(row.id); setDetailTitle(`${row.firstName} ${row.lastName}`) }}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => openEdit(row)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => openDelete(row)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="مجموع مشتریان" value={total.toLocaleString('fa-IR')} icon={<Users className="h-5 w-5" />} color="green" />
        <StatCard title="مشتریان فعال" value={totalActive.toLocaleString('fa-IR')} icon={<UserCheck className="h-5 w-5" />} color="blue" />
        <StatCard title="غیرفعال" value={totalInactive.toLocaleString('fa-IR')} icon={<UserX className="h-5 w-5" />} color="amber" />
        <StatCard title="انتخاب شده" value={selectedIds.length.toLocaleString('fa-IR')} icon={<Users className="h-5 w-5" />} color="purple" subtitle="برای عملیات گروهی" />
      </div>

      {/* Filters */}
      <div className="glass-card-solid rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary-800">
          <Search className="h-4 w-4" /> جستجو و فیلتر
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Input placeholder="نام / نام خانوادگی" value={search.name}
            onChange={(e) => setSearch({ ...search, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          <Input placeholder="کد ملی" value={search.nationalCode} inputMode="numeric"
            onChange={(e) => setSearch({ ...search, nationalCode: e.target.value.replace(/\D/g, '') })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          <Input placeholder="موبایل" value={search.mobile} inputMode="numeric"
            onChange={(e) => setSearch({ ...search, mobile: e.target.value.replace(/\D/g, '') })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          <div className="flex h-[42px] overflow-hidden rounded-xl border border-gray-200 bg-white/80 text-sm">
            {(['', 'true', 'false'] as const).map((val, i) => (
              <button key={val} onClick={() => setSearch({ ...search, isActive: val })}
                className={[
                  'flex-1 px-3 font-medium transition-colors',
                  i === 1 ? 'border-x border-gray-200' : '',
                  search.isActive === val
                    ? val === 'true' ? 'bg-emerald-500 text-white'
                      : val === 'false' ? 'bg-red-500 text-white'
                      : 'bg-primary-700 text-white'
                    : 'bg-transparent text-gray-500 hover:bg-emerald-50',
                ].join(' ')}>
                {val === '' ? 'همه' : val === 'true' ? 'فعال' : 'غیرفعال'}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={handleSearch}><Search className="h-4 w-4" /> جستجو</Button>
          <Button size="sm" variant="secondary" onClick={handleReset}>برداشتن جستجو</Button>
        </div>
      </div>

      {/* Table header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-700">مشتریان حقیقی</p>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
            {total.toLocaleString('fa-IR')} رکورد
          </span>
          {selectedIds.length > 0 && (
            <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
              {selectedIds.length} انتخاب شده
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button size="sm" variant="danger" loading={bulkDeleting} onClick={handleBulkDelete}>
              <Trash className="h-4 w-4" /> حذف انتخاب‌شده‌ها
            </Button>
          )}
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> مشتری جدید</Button>
        </div>
      </div>

      <Table columns={columns} data={data} loading={loading} keyField="id"
        emptyText="مشتری حقیقی یافت نشد" selectable selectedIds={selectedIds}
        onSelectedChange={setSelectedIds} />
      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />

      {/* Create / Edit Modal */}
      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'create' ? 'مشتری حقیقی جدید' : 'ویرایش مشتری حقیقی'} size="lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="نام *" value={form.firstName} onChange={f('firstName')} placeholder="نام" />
          <Input label="نام خانوادگی *" value={form.lastName} onChange={f('lastName')} placeholder="نام خانوادگی" />
          <Input label="کد ملی *" value={form.nationalCode} onChange={fNum('nationalCode')}
            placeholder="۱۰ رقم" maxLength={10} inputMode="numeric" />
          <Input label="موبایل *" value={form.mobile} onChange={fNum('mobile')}
            placeholder="09xxxxxxxxx" maxLength={11} inputMode="numeric" />
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">نحوه آشنایی</label>
            <select value={form.familiarityType ?? 0} onChange={f('familiarityType')}
              className="block w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100">
              {familiarityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <input type="checkbox" id="realActive" checked={form.isActive ?? true}
              onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 accent-primary-600" />
            <label htmlFor="realActive" className="text-sm text-gray-700">کاربر فعال است</label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button loading={saving} onClick={handleSave}>
            {modal === 'create' ? 'ثبت مشتری' : 'ذخیره تغییرات'}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="حذف مشتری حقیقی" size="sm">
        <p className="text-sm text-gray-600">
          آیا از حذف <span className="font-bold text-gray-900">{form.firstName} {form.lastName}</span> اطمینان دارید؟
          این عملیات قابل بازگشت نیست.
        </p>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}>
            <Trash2 className="h-4 w-4" /> حذف
          </Button>
        </div>
      </Modal>

      <CustomerDetailPanel open={detailProfileId !== null} profileId={detailProfileId}
        customerTitle={detailTitle} onClose={() => setDetailProfileId(null)} />

      {/* Bottom analytics row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Consumption breakdown */}
        <div className="overflow-hidden rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)', border: '1px solid rgba(209,250,229,0.6)', boxShadow: '0 4px 20px rgba(6,78,59,0.06)' }}>
          <div className="flex items-center gap-2 px-5 py-4"
            style={{ background: 'rgba(236,253,245,0.5)', borderBottom: '1px solid rgba(209,250,229,0.5)' }}>
            <Home className="h-4 w-4 text-primary-600" />
            <p className="text-sm font-semibold text-gray-700">پایش مصرف لحظه‌ای</p>
          </div>
          <div className="space-y-4 p-5">
            {[
              { label: 'مصرف خانگی (حقیقی)', pct: Math.min(Math.round((totalActive / Math.max(total, 1)) * 100), 99) || 72, color: '#10b981', icon: Home },
              { label: 'مشاغل و آپارتمانی',  pct: Math.min(Math.round((totalInactive / Math.max(total, 1)) * 100), 99) || 18, color: '#6366f1', icon: Briefcase },
              { label: 'سایر موارد',           pct: 10, color: '#f59e0b', icon: MoreHorizontal },
            ].map(({ label, pct, color, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${color}18` }}>
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">{label}</span>
                    <span className="text-xs font-bold" style={{ color }}>{pct}٪</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-2 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-2 rounded-xl p-3 text-xs text-gray-500"
              style={{ background: 'rgba(236,253,245,0.5)', border: '1px solid rgba(167,243,208,0.3)' }}>
              در ۲۴ ساعت گذشته، مصرف مشتریان حقیقی نسبت به بازه مشابه دیروز
              {' '}<span className="font-semibold text-primary-700">۳.۲٪ کاهش</span> یافته است.
            </div>
          </div>
        </div>

        {/* Region heat map */}
        <RegionHeatMap totalCustomers={total} provinces={provinces} />
      </div>
    </div>
  )
}
