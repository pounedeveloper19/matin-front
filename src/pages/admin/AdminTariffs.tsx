import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Pencil, Trash2, Tag, Layers, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { lookupApi } from '../../api/lookup'
import type { IdTitle, IdName } from '../../api/lookup'
import { Table, Pagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input, { Select, DatePicker } from '../../components/ui/Input'
import type { Tariff, TariffSlab } from '../../types'

const emptyTariff: Tariff = { tariffId: 0, tariffTypeId: 1, customerTypeId: 1, powerEntitiesId: 0, effectiveFrom: null }
const emptySlab: TariffSlab = { id: 0, tariffId: 0, fromKwh: 0, toKwh: null, multiplier: 1 }

export default function AdminTariffs() {
  // ── Tariff state ─────────────────────────────────────────────────────
  const [tariffs, setTariffs]         = useState<Tariff[]>([])
  const [tariffTotal, setTariffTotal] = useState(0)
  const [tariffPages, setTariffPages] = useState(1)
  const [tariffPage, setTariffPage]   = useState(1)
  const [tariffLoading, setTariffLoading] = useState(true)
  const [tariffModal, setTariffModal] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [tariffForm, setTariffForm]   = useState<Tariff>(emptyTariff)
  const [tariffSaving, setTariffSaving] = useState(false)

  // ── Lookups ──────────────────────────────────────────────────────────
  const [tariffTypes, setTariffTypes]     = useState<IdTitle[]>([])
  const [customerTypes, setCustomerTypes] = useState<IdTitle[]>([])
  const [powerEntities, setPowerEntities] = useState<IdName[]>([])
  const [lookupsLoading, setLookupsLoading] = useState(true)

  // ── Selected tariff → slabs ──────────────────────────────────────────
  const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null)
  const slabsRef = useRef<HTMLDivElement>(null)

  // ── Slab state ───────────────────────────────────────────────────────
  const [slabs, setSlabs]           = useState<TariffSlab[]>([])
  const [slabTotal, setSlabTotal]   = useState(0)
  const [slabPages, setSlabPages]   = useState(1)
  const [slabPage, setSlabPage]     = useState(1)
  const [slabLoading, setSlabLoading] = useState(false)
  const [slabModal, setSlabModal]   = useState<'create' | 'edit' | 'delete' | null>(null)
  const [slabForm, setSlabForm]     = useState<TariffSlab>(emptySlab)
  const [slabSaving, setSlabSaving] = useState(false)

  const pageSize = 10

  // ── Fetchers ─────────────────────────────────────────────────────────
  const fetchTariffs = useCallback((p: number) => {
    setTariffLoading(true)
    adminApi.getTariffs({ pageNumber: p, pageSize })
      .then((r) => {
        const res = r.result as any
        setTariffs(res?.data ?? [])
        setTariffTotal(res?.totalRecords ?? 0)
        setTariffPages(res?.totalPages ?? 1)
      })
      .finally(() => setTariffLoading(false))
  }, [])

  const fetchSlabs = useCallback((p: number, tariffId: number) => {
    setSlabLoading(true)
    adminApi.getTariffSlabs({ pageNumber: p, pageSize, Search_TariffId: tariffId })
      .then((r) => {
        const res = r.result as any
        setSlabs(res?.data ?? [])
        setSlabTotal(res?.totalRecords ?? 0)
        setSlabPages(res?.totalPages ?? 1)
      })
      .finally(() => setSlabLoading(false))
  }, [])

  useEffect(() => {
    Promise.all([lookupApi.getTariffTypes(), lookupApi.getCustomerTypes(), lookupApi.getPowerEntities()])
      .then(([tt, ct, pe]) => {
        if (tt.code === 200 && Array.isArray(tt.result)) setTariffTypes(tt.result as IdTitle[])
        if (ct.code === 200 && Array.isArray(ct.result)) setCustomerTypes(ct.result as IdTitle[])
        if (pe.code === 200 && Array.isArray(pe.result)) setPowerEntities(pe.result as IdName[])
      })
      .finally(() => setLookupsLoading(false))
  }, [])

  useEffect(() => { fetchTariffs(tariffPage) }, [tariffPage, fetchTariffs])

  useEffect(() => {
    if (selectedTariff) {
      setSlabPage(1)
      fetchSlabs(1, selectedTariff.tariffId)
      setTimeout(() => slabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }
  }, [selectedTariff, fetchSlabs])

  useEffect(() => {
    if (selectedTariff) fetchSlabs(slabPage, selectedTariff.tariffId)
  }, [slabPage, selectedTariff, fetchSlabs])

  // ── Tariff CRUD ───────────────────────────────────────────────────────
  const openCreateTariff = () => { setTariffForm(emptyTariff); setTariffModal('create') }
  const openEditTariff = async (row: Tariff) => {
    try { const r = await adminApi.getTariffDetail(row.tariffId); setTariffForm(r.result ?? row) }
    catch { setTariffForm(row) }
    setTariffModal('edit')
  }
  const openDeleteTariff = (row: Tariff) => { setTariffForm(row); setTariffModal('delete') }

  const handleSaveTariff = async () => {
    setTariffSaving(true)
    try {
      const res = tariffModal === 'create'
        ? await adminApi.createTariff(tariffForm)
        : await adminApi.updateTariff(tariffForm)
      if (res.code === 200) {
        toast.success(tariffModal === 'create' ? 'تعرفه ثبت شد' : 'تعرفه ویرایش شد')
        setTariffModal(null); fetchTariffs(tariffPage)
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setTariffSaving(false) }
  }

  const handleDeleteTariff = async () => {
    setTariffSaving(true)
    try {
      const res = await adminApi.deleteTariff(tariffForm.tariffId)
      if (res.code === 200) {
        toast.success('تعرفه حذف شد')
        setTariffModal(null)
        fetchTariffs(tariffPage)
        if (selectedTariff?.tariffId === tariffForm.tariffId) setSelectedTariff(null)
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setTariffSaving(false) }
  }

  // ── Slab CRUD ─────────────────────────────────────────────────────────
  const openCreateSlab = () => {
    setSlabForm({ ...emptySlab, tariffId: selectedTariff!.tariffId })
    setSlabModal('create')
  }
  const openEditSlab = async (row: TariffSlab) => {
    try { const r = await adminApi.getTariffSlabDetail(row.id); setSlabForm(r.result ?? row) }
    catch { setSlabForm(row) }
    setSlabModal('edit')
  }
  const openDeleteSlab = (row: TariffSlab) => { setSlabForm(row); setSlabModal('delete') }

  const handleSaveSlab = async () => {
    setSlabSaving(true)
    try {
      const res = slabModal === 'create'
        ? await adminApi.createTariffSlab(slabForm)
        : await adminApi.updateTariffSlab(slabForm)
      if (res.code === 200) {
        toast.success(slabModal === 'create' ? 'پله ثبت شد' : 'پله ویرایش شد')
        setSlabModal(null); fetchSlabs(slabPage, selectedTariff!.tariffId)
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSlabSaving(false) }
  }

  const handleDeleteSlab = async () => {
    setSlabSaving(true)
    try {
      const res = await adminApi.deleteTariffSlab(slabForm.id)
      if (res.code === 200) {
        toast.success('پله حذف شد')
        setSlabModal(null); fetchSlabs(slabPage, selectedTariff!.tariffId)
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSlabSaving(false) }
  }

  // ── Columns ───────────────────────────────────────────────────────────
  const tariffColumns = [
    { key: 'tariffId',      header: '#',          className: 'w-16' },
    { key: 'tariffType',    header: 'نوع تعرفه' },
    { key: 'customerType',  header: 'نوع مشتری' },
    { key: 'powerEntity',   header: 'شرکت برق' },
    { key: 'effectiveFrom', header: 'تاریخ اجرا' },
    {
      key: 'actions', header: 'عملیات', className: 'w-32',
      render: (row: Tariff) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedTariff(prev => prev?.tariffId === row.tariffId ? null : row)}
            title="تعرفه پلکانی"
            className={`rounded p-1.5 transition-colors ${
              selectedTariff?.tariffId === row.tariffId
                ? 'bg-purple-100 text-purple-600'
                : 'text-gray-400 hover:bg-purple-50 hover:text-purple-600'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => openEditTariff(row)} className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => openDeleteTariff(row)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  const slabColumns = [
    { key: 'id',         header: '#',        className: 'w-16' },
    { key: 'fromKwh',   header: 'از (kWh)' },
    { key: 'toKwh',     header: 'تا (kWh)',  render: (r: TariffSlab) => r.toKwh ?? '—' },
    { key: 'multiplier', header: 'ضریب' },
    {
      key: 'actions', header: 'عملیات', className: 'w-24',
      render: (row: TariffSlab) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEditSlab(row)} className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => openDeleteSlab(row)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Tariffs section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">تعرفه‌ها ({tariffTotal} رکورد)</span>
        </div>
        <Button size="sm" onClick={openCreateTariff}><Plus className="h-4 w-4" /> تعرفه جدید</Button>
      </div>

      <Table columns={tariffColumns} data={tariffs} loading={tariffLoading} keyField="tariffId" emptyText="تعرفه‌ای ثبت نشده" />
      <Pagination page={tariffPage} totalPages={tariffPages} total={tariffTotal} pageSize={pageSize} onPageChange={setTariffPage} />

      {/* Slabs panel */}
      {selectedTariff && (
        <div ref={slabsRef} className="rounded-xl border-2 border-purple-200 bg-purple-50/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-semibold text-gray-700">
                پله‌های تعرفه #{selectedTariff.tariffId}
              </span>
              <span className="text-xs text-gray-400">({slabTotal} رکورد)</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={openCreateSlab}><Plus className="h-4 w-4" /> تعرفه پلکانی جدید</Button>
              <button
                onClick={() => setSelectedTariff(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <Table columns={slabColumns} data={slabs} loading={slabLoading} keyField="id" emptyText="پله‌ای برای این تعرفه ثبت نشده" />
          <Pagination page={slabPage} totalPages={slabPages} total={slabTotal} pageSize={pageSize} onPageChange={setSlabPage} />
        </div>
      )}

      {/* ── Tariff modals ── */}
      <Modal open={tariffModal === 'create' || tariffModal === 'edit'} onClose={() => setTariffModal(null)}
        title={tariffModal === 'create' ? 'تعرفه جدید' : 'ویرایش تعرفه'} size="md">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="نوع تعرفه" value={tariffForm.tariffTypeId} loading={lookupsLoading}
            options={tariffTypes.map(t => ({ value: t.id, label: t.title }))}
            onChange={(v) => setTariffForm({ ...tariffForm, tariffTypeId: +v })} />
          <Select label="نوع مشتری" value={tariffForm.customerTypeId} loading={lookupsLoading}
            options={customerTypes.map(t => ({ value: t.id, label: t.title }))}
            onChange={(v) => setTariffForm({ ...tariffForm, customerTypeId: +v })} />
          <Select label="شرکت برق" value={tariffForm.powerEntitiesId} loading={lookupsLoading}
            options={powerEntities.map(p => ({ value: p.id, label: p.province ? `${p.name} — ${p.province}` : p.name }))}
            onChange={(v) => setTariffForm({ ...tariffForm, powerEntitiesId: +v })} />
          <DatePicker label="تاریخ اجرا" value={tariffForm.effectiveFrom}
            onChange={(v) => setTariffForm({ ...tariffForm, effectiveFrom: v })} />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setTariffModal(null)}>انصراف</Button>
          <Button loading={tariffSaving} onClick={handleSaveTariff}>
            {tariffModal === 'create' ? 'ثبت تعرفه' : 'ذخیره تغییرات'}
          </Button>
        </div>
      </Modal>

      <Modal open={tariffModal === 'delete'} onClose={() => setTariffModal(null)} title="حذف تعرفه" size="sm">
        <p className="text-sm text-gray-600">
          آیا از حذف تعرفه <span className="font-bold text-gray-900">#{tariffForm.tariffId}</span> اطمینان دارید؟
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setTariffModal(null)}>انصراف</Button>
          <Button variant="danger" loading={tariffSaving} onClick={handleDeleteTariff}>
            <Trash2 className="h-4 w-4" /> حذف
          </Button>
        </div>
      </Modal>

      {/* ── Slab modals ── */}
      <Modal open={slabModal === 'create' || slabModal === 'edit'} onClose={() => setSlabModal(null)}
        title={slabModal === 'create' ? 'پله تعرفه جدید' : 'ویرایش پله تعرفه'} size="sm">
        <div className="grid grid-cols-1 gap-4">
          <Input label="از (kWh)" type="number" value={slabForm.fromKwh}
            onChange={(e) => setSlabForm({ ...slabForm, fromKwh: +e.target.value })} />
          <Input label="تا (kWh) — خالی یعنی نامحدود" type="number" value={slabForm.toKwh ?? ''}
            onChange={(e) => setSlabForm({ ...slabForm, toKwh: e.target.value === '' ? null : +e.target.value })} />
          <Input label="ضریب" type="number" step="0.01" value={slabForm.multiplier}
            onChange={(e) => setSlabForm({ ...slabForm, multiplier: +e.target.value })} />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setSlabModal(null)}>انصراف</Button>
          <Button loading={slabSaving} onClick={handleSaveSlab}>
            {slabModal === 'create' ? 'ثبت پله' : 'ذخیره تغییرات'}
          </Button>
        </div>
      </Modal>

      <Modal open={slabModal === 'delete'} onClose={() => setSlabModal(null)} title="حذف پله تعرفه" size="sm">
        <p className="text-sm text-gray-600">آیا از حذف این پله تعرفه اطمینان دارید؟</p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setSlabModal(null)}>انصراف</Button>
          <Button variant="danger" loading={slabSaving} onClick={handleDeleteSlab}>
            <Trash2 className="h-4 w-4" /> حذف
          </Button>
        </div>
      </Modal>
    </div>
  )
}
