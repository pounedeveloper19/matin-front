import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Tag, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import type { TariffCode, TariffCodeOption } from '../../types'

const emptyCode: TariffCode = { id: 0, code: '', title: '' }
const emptyOption: TariffCodeOption = {
  id: 0, tariffCodeId: 0, title: '',
  penaltyMultiplier: 1.3, creditMultiplier: 0.75,
}

export default function AdminTariffCodes() {
  const [codes, setCodes]                   = useState<TariffCode[]>([])
  const [selectedCode, setSelectedCode]     = useState<TariffCode | null>(null)
  const [options, setOptions]               = useState<TariffCodeOption[]>([])
  const [codesLoading, setCodesLoading]     = useState(true)
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [saving, setSaving]                 = useState(false)

  const [codeModal, setCodeModal]     = useState<'create' | 'edit' | 'delete' | null>(null)
  const [optionModal, setOptionModal] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [codeForm, setCodeForm]       = useState<TariffCode>(emptyCode)
  const [optionForm, setOptionForm]   = useState<TariffCodeOption>(emptyOption)

  const fetchCodes = useCallback(async () => {
    setCodesLoading(true)
    try {
      const r = await adminApi.getTariffCodes({ pageSize: 200 })
      setCodes((r.result as any)?.data ?? [])
    } finally { setCodesLoading(false) }
  }, [])

  const fetchOptions = useCallback(async (codeId: number) => {
    setOptionsLoading(true)
    try {
      const r = await adminApi.getTariffCodeOptions({ Search_TariffCodeId: codeId, pageSize: 200 })
      setOptions((r.result as any)?.data ?? [])
    } finally { setOptionsLoading(false) }
  }, [])

  useEffect(() => { fetchCodes() }, [fetchCodes])
  useEffect(() => {
    if (selectedCode) fetchOptions(selectedCode.id)
    else setOptions([])
  }, [selectedCode, fetchOptions])

  // ── Code CRUD
  const handleSaveCode = async () => {
    if (!codeForm.code.trim() || !codeForm.title.trim()) { toast.error('کد و عنوان الزامی است'); return }
    setSaving(true)
    try {
      const res = codeModal === 'create'
        ? await adminApi.createTariffCode(codeForm)
        : await adminApi.updateTariffCode(codeForm)
      if (res.type === 'Success') {
        toast.success(codeModal === 'create' ? 'کد تعرفه ثبت شد' : 'کد تعرفه ویرایش شد')
        setCodeModal(null); fetchCodes()
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const handleDeleteCode = async () => {
    setSaving(true)
    try {
      const res = await adminApi.deleteTariffCode(codeForm.id)
      if (res.type === 'Success') {
        toast.success('کد تعرفه حذف شد')
        setCodeModal(null)
        if (selectedCode?.id === codeForm.id) setSelectedCode(null)
        fetchCodes()
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  // ── Option CRUD
  const openCreateOption = () => {
    if (!selectedCode) return
    setOptionForm({ ...emptyOption, tariffCodeId: selectedCode.id })
    setOptionModal('create')
  }

  const openEditOption = async (opt: TariffCodeOption) => {
    try { const r = await adminApi.getTariffCodeOptionDetail(opt.id); setOptionForm(r.result ?? opt) }
    catch { setOptionForm(opt) }
    setOptionModal('edit')
  }

  const handleSaveOption = async () => {
    if (!optionForm.title.trim()) { toast.error('عنوان گزینه الزامی است'); return }
    setSaving(true)
    try {
      const res = optionModal === 'create'
        ? await adminApi.createTariffCodeOption(optionForm)
        : await adminApi.updateTariffCodeOption(optionForm)
      if (res.type === 'Success') {
        toast.success(optionModal === 'create' ? 'گزینه ثبت شد' : 'گزینه ویرایش شد')
        setOptionModal(null); if (selectedCode) fetchOptions(selectedCode.id)
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const handleDeleteOption = async () => {
    setSaving(true)
    try {
      const res = await adminApi.deleteTariffCodeOption(optionForm.id)
      if (res.type === 'Success') {
        toast.success('گزینه حذف شد')
        setOptionModal(null); if (selectedCode) fetchOptions(selectedCode.id)
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
        <h2 className="text-3xl font-black tracking-tight text-gray-900">کد تعرفه و گزینه‌های انتخابی</h2>
        <p className="mt-1 text-sm text-gray-500">تعریف کدهای تعرفه و گزینه‌های هر کد — گزینه انتخاب‌شده توسط مشتری در فرمول‌های محاسبه اثرگذار است</p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* ── Left: TariffCode list */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-emerald-600" />
              <span className="font-bold text-gray-800">کدهای تعرفه</span>
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">{codes.length}</span>
            </div>
            <Button size="sm" onClick={() => { setCodeForm(emptyCode); setCodeModal('create') }}>
              <Plus className="h-3.5 w-3.5" /> کد جدید
            </Button>
          </div>

          {codesLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : codes.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              <Tag className="mx-auto mb-2 h-8 w-8 opacity-20" />کد تعرفه‌ای ثبت نشده
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {codes.map(c => (
                <button key={c.id}
                  onClick={() => setSelectedCode(selectedCode?.id === c.id ? null : c)}
                  className={`flex w-full items-center justify-between px-5 py-3 text-right transition-colors ${
                    selectedCode?.id === c.id
                      ? 'bg-emerald-50 border-r-2 border-emerald-600'
                      : 'hover:bg-gray-50'
                  }`}>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold ${
                      selectedCode?.id === c.id
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>{c.code}</span>
                    <span className="text-sm font-semibold text-gray-800">{c.title}</span>
                    {c.optionCount !== undefined && (
                      <span className="text-xs text-gray-400">{c.optionCount} گزینه</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={e => { e.stopPropagation(); setCodeForm(c); setCodeModal('edit') }}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setCodeForm(c); setCodeModal('delete') }}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <ChevronLeft className={`h-4 w-4 transition-transform ${selectedCode?.id === c.id ? '-rotate-90 text-emerald-600' : 'text-gray-300'}`} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Options for selected code */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800">
                {selectedCode ? `گزینه‌های کد ${selectedCode.code}` : 'گزینه‌های انتخابی'}
              </span>
              {selectedCode && (
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">{options.length}</span>
              )}
            </div>
            {selectedCode && (
              <Button size="sm" onClick={openCreateOption}>
                <Plus className="h-3.5 w-3.5" /> گزینه جدید
              </Button>
            )}
          </div>

          {!selectedCode ? (
            <div className="py-16 text-center text-sm text-gray-400">
              <p>یک کد تعرفه از ستون چپ انتخاب کنید</p>
            </div>
          ) : optionsLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : options.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">گزینه‌ای برای این کد ثبت نشده</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {options.map(opt => (
                <div key={opt.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{opt.title}</p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                          جریمه ×{opt.penaltyMultiplier}
                        </span>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                          بستانکاری ×{opt.creditMultiplier}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => openEditOption(opt)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { setOptionForm(opt); setOptionModal('delete') }}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Code modals */}
      <Modal open={codeModal === 'create' || codeModal === 'edit'}
        onClose={() => setCodeModal(null)}
        title={codeModal === 'create' ? 'کد تعرفه جدید' : 'ویرایش کد تعرفه'} size="sm">
        <div className="space-y-4">
          <Input label="کد *" value={codeForm.code} placeholder="مثلاً ۳۱"
            onChange={e => setCodeForm(f => ({ ...f, code: e.target.value }))} />
          <Input label="عنوان *" value={codeForm.title} placeholder="مثلاً صنعتی"
            onChange={e => setCodeForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setCodeModal(null)}>انصراف</Button>
          <Button loading={saving} onClick={handleSaveCode}>
            {codeModal === 'create' ? 'ثبت' : 'ذخیره'}
          </Button>
        </div>
      </Modal>

      <Modal open={codeModal === 'delete'} onClose={() => setCodeModal(null)} title="حذف کد تعرفه" size="sm">
        <p className="text-sm text-gray-600">
          آیا از حذف کد <span className="font-bold text-gray-900">«{codeForm.code} — {codeForm.title}»</span> اطمینان دارید؟
          تمام گزینه‌های آن هم حذف می‌شوند.
        </p>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setCodeModal(null)}>انصراف</Button>
          <Button variant="danger" loading={saving} onClick={handleDeleteCode}><Trash2 className="h-4 w-4" /> حذف</Button>
        </div>
      </Modal>

      {/* ── Option modals */}
      <Modal open={optionModal === 'create' || optionModal === 'edit'}
        onClose={() => setOptionModal(null)}
        title={optionModal === 'create' ? 'گزینه جدید' : 'ویرایش گزینه'} size="md">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="عنوان گزینه *" value={optionForm.title} placeholder="مثلاً فشار متوسط"
              onChange={e => setOptionForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <Input label="ضریب جریمه مازاد" type="number" value={optionForm.penaltyMultiplier}
              onChange={e => setOptionForm(f => ({ ...f, penaltyMultiplier: +e.target.value }))} />
            <p className="mt-1 text-[10px] text-gray-400">پیش‌فرض: ۱.۳</p>
          </div>
          <div>
            <Input label="ضریب بستانکاری کسری" type="number" value={optionForm.creditMultiplier}
              onChange={e => setOptionForm(f => ({ ...f, creditMultiplier: +e.target.value }))} />
            <p className="mt-1 text-[10px] text-gray-400">پیش‌فرض: ۰.۷۵</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setOptionModal(null)}>انصراف</Button>
          <Button loading={saving} onClick={handleSaveOption}>
            {optionModal === 'create' ? 'ثبت گزینه' : 'ذخیره'}
          </Button>
        </div>
      </Modal>

      <Modal open={optionModal === 'delete'} onClose={() => setOptionModal(null)} title="حذف گزینه" size="sm">
        <p className="text-sm text-gray-600">
          آیا از حذف گزینه <span className="font-bold text-gray-900">«{optionForm.title}»</span> اطمینان دارید؟
        </p>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setOptionModal(null)}>انصراف</Button>
          <Button variant="danger" loading={saving} onClick={handleDeleteOption}><Trash2 className="h-4 w-4" /> حذف</Button>
        </div>
      </Modal>
    </div>
  )
}
