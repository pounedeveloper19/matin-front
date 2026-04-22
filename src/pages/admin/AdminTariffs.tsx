import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { Table, Pagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import type { Tariff } from '../../types'

const empty: Tariff = {
  tariffId: 0, tariffTypeId: 1, customerTypeId: 1,
  powerEntitiesId: 0, effectiveFrom: null,
}

export default function AdminTariffs() {
  const [data, setData]             = useState<Tariff[]>([])
  const [total, setTotal]           = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState<'create' | 'edit' | 'delete' | null>(null)
  const [form, setForm]             = useState<Tariff>(empty)
  const [saving, setSaving]         = useState(false)
  const pageSize = 10

  const fetch = useCallback((p: number) => {
    setLoading(true)
    adminApi.getTariffs({ pageNumber: p, pageSize })
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
  const openEdit = async (row: Tariff) => {
    try { const r = await adminApi.getTariffDetail(row.tariffId); setForm(r.result ?? row) }
    catch { setForm(row) }
    setModal('edit')
  }
  const openDelete = (row: Tariff) => { setForm(row); setModal('delete') }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = modal === 'create'
        ? await adminApi.createTariff(form)
        : await adminApi.updateTariff(form)
      if (res.code === 200) {
        toast.success(modal === 'create' ? 'تعرفه ثبت شد' : 'تعرفه ویرایش شد')
        setModal(null); fetch(page)
      } else { toast.error(res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const res = await adminApi.deleteTariff(form.tariffId)
      if (res.code === 200) { toast.success('تعرفه حذف شد'); setModal(null); fetch(page) }
      else { toast.error(res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'tariffId',      header: '#', className: 'w-16' },
    { key: 'tariffType',    header: 'نوع تعرفه' },
    { key: 'customerType',  header: 'نوع مشتری' },
    { key: 'powerEntity',   header: 'شرکت برق' },
    { key: 'effectiveFrom', header: 'تاریخ اجرا' },
    {
      key: 'actions', header: 'عملیات', className: 'w-24',
      render: (row: Tariff) => (
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
          <Tag className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">تعرفه‌ها ({total} رکورد)</span>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> تعرفه جدید</Button>
      </div>

      <Table columns={columns} data={data} loading={loading} keyField="tariffId" emptyText="تعرفه‌ای ثبت نشده" />
      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />

      <Modal
        open={modal === 'create' || modal === 'edit'}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'تعرفه جدید' : 'ویرایش تعرفه'}
        size="md"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="نوع تعرفه (ID)"
            type="number"
            value={form.tariffTypeId}
            onChange={(e) => setForm({ ...form, tariffTypeId: +e.target.value })}
          />
          <Input
            label="نوع مشتری (ID)"
            type="number"
            value={form.customerTypeId}
            onChange={(e) => setForm({ ...form, customerTypeId: +e.target.value })}
          />
          <Input
            label="شرکت برق (ID)"
            type="number"
            value={form.powerEntitiesId}
            onChange={(e) => setForm({ ...form, powerEntitiesId: +e.target.value })}
          />
          <Input
            label="تاریخ اجرا"
            type="date"
            value={form.effectiveFrom ?? ''}
            onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
          />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button loading={saving} onClick={handleSave}>{modal === 'create' ? 'ثبت تعرفه' : 'ذخیره تغییرات'}</Button>
        </div>
      </Modal>

      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="حذف تعرفه" size="sm">
        <p className="text-sm text-gray-600">
          آیا از حذف تعرفه <span className="font-bold text-gray-900">#{form.tariffId}</span> اطمینان دارید؟
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}><Trash2 className="h-4 w-4" /> حذف</Button>
        </div>
      </Modal>
    </div>
  )
}
