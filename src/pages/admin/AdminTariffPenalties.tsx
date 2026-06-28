import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Percent } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import type { TariffCode, TariffCodeOption } from '../../types'

interface CreateForm {
  tariffCodeIds: number[]
  penaltyMultiplier: number
  creditMultiplier: number
}

interface EditForm {
  id: number
  tariffCodeId: number
  optionTitle: string
  penaltyMultiplier: number
  creditMultiplier: number
}

const emptyCreate = (): CreateForm => ({
  tariffCodeIds: [],
  penaltyMultiplier: 1.3,
  creditMultiplier: 0.75,
})

export default function AdminTariffPenalties() {
  const [options, setOptions]       = useState<TariffCodeOption[]>([])
  const [codes, setCodes]           = useState<TariffCode[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreate())
  const [editForm, setEditForm]     = useState<EditForm | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TariffCodeOption | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [or, cr] = await Promise.all([
        adminApi.getTariffCodeOptions({ pageSize: 500 }),
        adminApi.getTariffCodes({ pageSize: 200 }),
      ])
      setOptions((or.result as any)?.data ?? [])
      setCodes((cr.result as any)?.data ?? [])
    } catch { toast.error('خطا در بارگذاری') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const codeMap = Object.fromEntries(codes.map(c => [c.id, c]))

  const toggleCode = (id: number) =>
    setCreateForm(f => ({
      ...f,
      tariffCodeIds: f.tariffCodeIds.includes(id)
        ? f.tariffCodeIds.filter(x => x !== id)
        : [...f.tariffCodeIds, id],
    }))

  const handleCreate = async () => {
    if (createForm.tariffCodeIds.length === 0) { toast.error('حداقل یک کد تعرفه انتخاب کنید'); return }
    if (!createForm.penaltyMultiplier || createForm.penaltyMultiplier <= 0) { toast.error('ضریب جریمه باید بزرگتر از صفر باشد'); return }
    if (!createForm.creditMultiplier || createForm.creditMultiplier <= 0) { toast.error('ضریب بستانکاری باید بزرگتر از صفر باشد'); return }
    setSaving(true)
    try {
      const results = await Promise.all(
        createForm.tariffCodeIds.map(codeId =>
          adminApi.createTariffCodeOption({
            id: 0,
            tariffCodeId: codeId,
            title: codeMap[codeId]?.title ?? codeMap[codeId]?.code ?? String(codeId),
            penaltyMultiplier: createForm.penaltyMultiplier,
            creditMultiplier: createForm.creditMultiplier,
          } as TariffCodeOption)
        )
      )
      const failed = results.find(r => r.type !== 'Success')
      if (failed) { toast.error(failed.message ?? 'خطا در ثبت'); return }
      toast.success(`${createForm.tariffCodeIds.length} گزینه ثبت شد`)
      setCreateOpen(false)
      setCreateForm(emptyCreate())
      fetchAll()
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const openEdit = (opt: TariffCodeOption) => {
    setEditForm({
      id: opt.id,
      tariffCodeId: opt.tariffCodeId,
      optionTitle: opt.title,
      penaltyMultiplier: opt.penaltyMultiplier,
      creditMultiplier: opt.creditMultiplier,
    })
  }

  const handleSave = async () => {
    if (!editForm) return
    if (!editForm.penaltyMultiplier || editForm.penaltyMultiplier <= 0) { toast.error('ضریب جریمه باید بزرگتر از صفر باشد'); return }
    if (!editForm.creditMultiplier || editForm.creditMultiplier <= 0) { toast.error('ضریب بستانکاری باید بزرگتر از صفر باشد'); return }
    setSaving(true)
    try {
      const res = await adminApi.updateTariffCodeOption({
        id: editForm.id,
        tariffCodeId: editForm.tariffCodeId,
        title: editForm.optionTitle,
        penaltyMultiplier: editForm.penaltyMultiplier,
        creditMultiplier: editForm.creditMultiplier,
      } as TariffCodeOption)
      if (res.type !== 'Success') { toast.error(res.message ?? 'خطا'); return }
      toast.success('ذخیره شد')
      setEditForm(null)
      fetchAll()
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      const res = await adminApi.deleteTariffCodeOption(deleteTarget.id)
      if (res.type === 'Success' || res.code === 200) { toast.success('حذف شد'); setDeleteTarget(null); fetchAll() }
      else toast.error(res.message ?? 'خطا')
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
        <h2 className="text-3xl font-black tracking-tight text-gray-900">ضرایب و جرایم</h2>
        <p className="mt-1 text-sm text-gray-500">ویرایش ضریب جریمه مازاد و ضریب بستانکاری کسری برای گزینه‌های کد تعرفه</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-emerald-600" />
            <span className="font-bold text-gray-800">فهرست ضرایب</span>
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">{options.length}</span>
          </div>
          <Button size="sm" onClick={() => { setCreateForm(emptyCreate()); setCreateOpen(true) }}>
            <Plus className="h-3.5 w-3.5" /> جدید
          </Button>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : options.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            <Percent className="mx-auto mb-2 h-8 w-8 opacity-20" />رکوردی ثبت نشده
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {options.map(opt => {
              const code = codeMap[opt.tariffCodeId]
              return (
                <div key={opt.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {code && (
                        <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs font-bold text-gray-600">{code.code}</span>
                      )}
                      <p className="font-semibold text-gray-800">{opt.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-600">
                        جریمه ×{opt.penaltyMultiplier}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">
                        بستانکاری ×{opt.creditMultiplier}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 mr-4">
                    <button onClick={() => openEdit(opt)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(opt)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="ضریب جدید" size="md">
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">کدهای تعرفه <span className="text-red-500">*</span></p>
            <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-48 overflow-y-auto">
              {codes.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">کد تعرفه‌ای تعریف نشده</p>
              ) : codes.map(c => {
                const checked = createForm.tariffCodeIds.includes(c.id)
                return (
                  <label key={c.id} className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors ${checked ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCode(c.id)}
                      className="h-4 w-4 rounded accent-emerald-600"
                    />
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs font-bold text-gray-600">{c.code}</span>
                    <span className="text-sm text-gray-800">{c.title}</span>
                  </label>
                )
              })}
            </div>
            {createForm.tariffCodeIds.length > 0 && (
              <p className="mt-1 text-[11px] text-emerald-600">{createForm.tariffCodeIds.length} کد انتخاب شده</p>
            )}
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">ضرایب</p>
            <Input
              label="ضریب جریمه مازاد"
              type="number"
              step="0.01"
              value={createForm.penaltyMultiplier}
              onChange={e => setCreateForm(f => ({ ...f, penaltyMultiplier: +e.target.value }))}
            />
            <Input
              label="ضریب بستانکاری کسری"
              type="number"
              step="0.01"
              value={createForm.creditMultiplier}
              onChange={e => setCreateForm(f => ({ ...f, creditMultiplier: +e.target.value }))}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>انصراف</Button>
          <Button loading={saving} onClick={handleCreate}>ثبت</Button>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editForm} onClose={() => setEditForm(null)} title="ویرایش ضرایب" size="sm">
        {editForm && (
          <>
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
              {codeMap[editForm.tariffCodeId] && (
                <span className="rounded bg-gray-200 px-2 py-0.5 font-mono text-xs font-bold text-gray-700">
                  {codeMap[editForm.tariffCodeId].code}
                </span>
              )}
              <span className="text-sm font-semibold text-gray-700">{editForm.optionTitle}</span>
            </div>

            <div className="space-y-4">
              <Input
                label="ضریب جریمه مازاد"
                type="number"
                step="0.01"
                value={editForm.penaltyMultiplier}
                onChange={e => setEditForm(f => f && ({ ...f, penaltyMultiplier: +e.target.value }))}
              />
              <Input
                label="ضریب بستانکاری کسری"
                type="number"
                step="0.01"
                value={editForm.creditMultiplier}
                onChange={e => setEditForm(f => f && ({ ...f, creditMultiplier: +e.target.value }))}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
              <Button variant="secondary" onClick={() => setEditForm(null)}>انصراف</Button>
              <Button loading={saving} onClick={handleSave}>ذخیره</Button>
            </div>
          </>
        )}
      </Modal>

      {/* Delete modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="حذف گزینه" size="sm">
        {deleteTarget && (
          <>
            <p className="text-sm text-gray-600">
              آیا از حذف گزینه <span className="font-bold text-gray-900">«{deleteTarget.title}»</span> اطمینان دارید؟
            </p>
            <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>انصراف</Button>
              <Button variant="danger" loading={saving} onClick={handleDelete}>
                <Trash2 className="h-4 w-4" /> حذف
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
