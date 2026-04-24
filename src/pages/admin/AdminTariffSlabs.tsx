import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Layers } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { lookupApi } from '../../api/lookup'
import type { TariffOption } from '../../api/lookup'
import { Table, Pagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input, { Select } from '../../components/ui/Input'
import type { TariffSlab } from '../../types'
import { toArr } from '../../utils'

const empty: TariffSlab = { id: 0, tariffId: 0, fromKwh: 0, toKwh: null, multiplier: 1 }

export default function AdminTariffSlabs() {
  const [data, setData]             = useState<TariffSlab[]>([])
  const [total, setTotal]           = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState<'create' | 'edit' | 'delete' | null>(null)
  const [form, setForm]             = useState<TariffSlab>(empty)
  const [saving, setSaving]         = useState(false)
  const [filterTariffId, setFilterTariffId] = useState('')
  const [tariffs, setTariffs]       = useState<TariffOption[]>([])
  const [tariffsLoading, setTariffsLoading] = useState(true)
  const pageSize = 10

  useEffect(() => {
    lookupApi.getAllTariffs()
      .then(r => { if (r.code === 200) setTariffs(toArr(r.result) as TariffOption[]) })
      .finally(() => setTariffsLoading(false))
  }, [])

  const fetch = useCallback((p: number) => {
    setLoading(true)
    adminApi.getTariffSlabs({
      pageNumber: p, pageSize,
      ...(filterTariffId ? { Search_TariffId: filterTariffId } : {}),
    })
      .then((r) => {
        const res = r.result as any
        setData(res?.data ?? [])
        setTotal(res?.totalRecords ?? 0)
        setTotalPages(res?.totalPages ?? 1)
      })
      .finally(() => setLoading(false))
  }, [filterTariffId])

  useEffect(() => { fetch(page) }, [page, fetch])

  const openCreate = () => { setForm(empty); setModal('create') }
  const openEdit = async (row: TariffSlab) => {
    try { const r = await adminApi.getTariffSlabDetail(row.id); setForm(r.result ?? row) }
    catch { setForm(row) }
    setModal('edit')
  }
  const openDelete = (row: TariffSlab) => { setForm(row); setModal('delete') }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = modal === 'create'
        ? await adminApi.createTariffSlab(form)
        : await adminApi.updateTariffSlab(form)
      if (res.code === 200) {
        toast.success(modal === 'create' ? 'پله تعرفه ثبت شد' : 'پله تعرفه ویرایش شد')
        setModal(null); fetch(page)
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const res = await adminApi.deleteTariffSlab(form.id)
      if (res.code === 200) { toast.success('پله تعرفه حذف شد'); setModal(null); fetch(page) }
      else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'id',         header: '#',        className: 'w-16' },
    { key: 'tariffId',   header: 'شناسه تعرفه' },
    { key: 'fromKwh',   header: 'از (kWh)' },
    { key: 'toKwh',     header: 'تا (kWh)', render: (r: TariffSlab) => r.toKwh ?? '—' },
    { key: 'multiplier', header: 'ضریب' },
    {
      key: 'actions', header: 'عملیات', className: 'w-24',
      render: (row: TariffSlab) => (
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
          <Layers className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">پله‌های تعرفه ({total} رکورد)</span>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> پله جدید</Button>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <div className="w-64">
          <Select
            placeholder="همه تعرفه‌ها"
            value={filterTariffId}
            loading={tariffsLoading}
            options={tariffs.map(t => ({ value: t.tariffId, label: `تعرفه #${t.tariffId}` }))}
            onChange={(v) => { setFilterTariffId(String(v)); setPage(1) }}
          />
        </div>
      </div>

      <Table columns={columns} data={data} loading={loading} keyField="id" emptyText="پله‌ای ثبت نشده" />
      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />

      <Modal
        open={modal === 'create' || modal === 'edit'}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'پله تعرفه جدید' : 'ویرایش پله تعرفه'}
        size="sm"
      >
        <div className="grid grid-cols-1 gap-4">
          <Select
            label="تعرفه"
            value={form.tariffId || ''}
            loading={tariffsLoading}
            options={tariffs.map(t => ({ value: t.tariffId, label: `تعرفه #${t.tariffId}` }))}
            onChange={(v) => setForm({ ...form, tariffId: +v })}
          />
          <Input
            label="از (kWh)"
            type="number"
            value={form.fromKwh}
            onChange={(e) => setForm({ ...form, fromKwh: +e.target.value })}
          />
          <Input
            label="تا (kWh) — خالی یعنی نامحدود"
            type="number"
            value={form.toKwh ?? ''}
            onChange={(e) => setForm({ ...form, toKwh: e.target.value === '' ? null : +e.target.value })}
          />
          <Input
            label="ضریب"
            type="number"
            step="0.01"
            value={form.multiplier}
            onChange={(e) => setForm({ ...form, multiplier: +e.target.value })}
          />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button loading={saving} onClick={handleSave}>{modal === 'create' ? 'ثبت پله' : 'ذخیره تغییرات'}</Button>
        </div>
      </Modal>

      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="حذف پله تعرفه" size="sm">
        <p className="text-sm text-gray-600">آیا از حذف این پله تعرفه اطمینان دارید؟</p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}><Trash2 className="h-4 w-4" /> حذف</Button>
        </div>
      </Modal>
    </div>
  )
}
