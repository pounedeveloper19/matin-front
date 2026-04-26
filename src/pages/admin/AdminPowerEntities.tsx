import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Building } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { lookupApi } from '../../api/lookup'
import type { IdTitle, IdNameSimple } from '../../api/lookup'
import { Table, Pagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input, { Select } from '../../components/ui/Input'
import type { AdminPowerEntity } from '../../types'
import { toArr } from '../../utils'

const empty: AdminPowerEntity = {
  id: 0,
  name: '',
  provinceId: 0,
  entityTypeId: 1,
  isActive: true,
}

export default function AdminPowerEntities() {
  const [data, setData]             = useState<AdminPowerEntity[]>([])
  const [total, setTotal]           = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState<'create' | 'edit' | 'delete' | null>(null)
  const [form, setForm]             = useState<AdminPowerEntity>(empty)
  const [saving, setSaving]         = useState(false)

  const [provinces, setProvinces]         = useState<IdNameSimple[]>([])
  const [entityTypes, setEntityTypes]     = useState<IdTitle[]>([])
  const [lookupsLoading, setLookupsLoading] = useState(true)
  const pageSize = 10

  useEffect(() => {
    Promise.all([lookupApi.getProvinces(), lookupApi.getPowerEntityTypes()])
      .then(([prov, types]) => {
        setProvinces(toArr(prov.result) as IdNameSimple[])
        setEntityTypes(toArr(types.result) as IdTitle[])
      })
      .finally(() => setLookupsLoading(false))
  }, [])

  const fetch = useCallback((p: number) => {
    setLoading(true)
    adminApi.getPowerEntitiesAdmin({ pageNumber: p, pageSize })
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
  const openEdit = async (row: AdminPowerEntity) => {
    try { const r = await adminApi.getPowerEntityDetail(row.id); setForm(r.result ?? row) }
    catch { setForm(row) }
    setModal('edit')
  }
  const openDelete = (row: AdminPowerEntity) => { setForm(row); setModal('delete') }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('نام شرکت برق الزامی است'); return }
    if (!form.provinceId) { toast.error('استان را انتخاب کنید'); return }
    setSaving(true)
    try {
      const res = modal === 'create'
        ? await adminApi.createPowerEntity(form)
        : await adminApi.updatePowerEntity(form)
      if (res.code === 200) {
        toast.success(modal === 'create' ? 'شرکت برق ثبت شد' : 'شرکت برق ویرایش شد')
        setModal(null); fetch(page)
      } else { toast.error(res.message ?? res.caption ?? 'خطا در عملیات') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const res = await adminApi.deletePowerEntity(form.id)
      if (res.code === 200) { toast.success('شرکت برق حذف شد'); setModal(null); fetch(page) }
      else { toast.error(res.message ?? res.caption ?? 'خطا در حذف') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'id',         header: '#',       className: 'w-16' },
    { key: 'name',       header: 'نام شرکت برق' },
    { key: 'province',   header: 'استان' },
    { key: 'entityType', header: 'نوع' },
    {
      key: 'isActive',
      header: 'وضعیت',
      render: (row: AdminPowerEntity) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          row.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {row.isActive ? 'فعال' : 'غیرفعال'}
        </span>
      ),
    },
    {
      key: 'actions', header: 'عملیات', className: 'w-24',
      render: (row: AdminPowerEntity) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(row)} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => openDelete(row)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-teal-500" />
          <p className="text-sm font-semibold text-gray-700">شرکت‌های برق</p>
          <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-700">
            {total.toLocaleString('fa-IR')} رکورد
          </span>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> شرکت جدید</Button>
      </div>

      <Table columns={columns} data={data} loading={loading} keyField="id" emptyText="شرکت برقی ثبت نشده" />
      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />

      <Modal
        open={modal === 'create' || modal === 'edit'}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'شرکت برق جدید' : 'ویرایش شرکت برق'}
        size="md"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="نام شرکت برق"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <Select
            label="استان"
            value={form.provinceId || ''}
            loading={lookupsLoading}
            options={provinces.map(p => ({ value: p.id, label: p.name }))}
            onChange={(v) => setForm({ ...form, provinceId: +v })}
          />
          <Select
            label="نوع"
            value={form.entityTypeId}
            loading={lookupsLoading}
            options={entityTypes.map(t => ({ value: t.id, label: t.title }))}
            onChange={(v) => setForm({ ...form, entityTypeId: +v })}
          />
          <div className="flex items-center gap-3 sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">وضعیت:</label>
            <button
              type="button"
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                form.isActive ? 'bg-primary-500' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                form.isActive ? '-translate-x-6' : '-translate-x-1'
              }`} />
            </button>
            <span className="text-sm text-gray-600">{form.isActive ? 'فعال' : 'غیرفعال'}</span>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button loading={saving} onClick={handleSave}>
            {modal === 'create' ? 'ثبت شرکت' : 'ذخیره تغییرات'}
          </Button>
        </div>
      </Modal>

      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="حذف شرکت برق" size="sm">
        <p className="text-sm text-gray-600">
          آیا از حذف <span className="font-bold text-gray-900">{form.name}</span> اطمینان دارید؟
          این عملیات قابل بازگشت نیست.
        </p>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}>
            <Trash2 className="h-4 w-4" /> حذف
          </Button>
        </div>
      </Modal>
    </div>
  )
}
