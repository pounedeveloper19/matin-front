import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Pencil, Trash2, Tag, ChevronLeft, DollarSign, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import type { TariffCode, TariffCodeOption, TariffCodeOptionRate } from '../../types'

const emptyCode: TariffCode = { id: 0, code: '', title: '' }
const emptyOption: TariffCodeOption = {
  id: 0, tariffCodeId: 0, title: '',
  penaltyMultiplier: 1.3, creditMultiplier: 0.75,
}
const currentShamsiYear = new Date().getFullYear() - 621
const emptyRate = (optionId: number): TariffCodeOptionRate => ({
  id: 0, tariffCodeOptionId: optionId, year: currentShamsiYear,
  rateRialPerKwh: 0, ratePeakRialPerKwh: 0, rateLowRialPerKwh: 0,
})

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

  // ── TariffCodeOptionRate state ─────────────────────────────────────────
  const [selectedOption, setSelectedOption] = useState<TariffCodeOption | null>(null)
  const [rates, setRates]                   = useState<TariffCodeOptionRate[]>([])
  const [ratesLoading, setRatesLoading]     = useState(false)
  const [rateModal, setRateModal]           = useState<'create' | 'edit' | 'delete' | null>(null)
  const [rateForm, setRateForm]             = useState<TariffCodeOptionRate>(emptyRate(0))
  const [rateSaving, setRateSaving]         = useState(false)
  const rateRef = useRef<HTMLDivElement>(null)

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

  const fetchRates = useCallback(async (optionId: number) => {
    setRatesLoading(true)
    try {
      const r = await adminApi.getTariffCodeOptionRates({ Search_TariffCodeOptionId: optionId, pageSize: 200 })
      setRates((r.result as any)?.data ?? [])
    } finally { setRatesLoading(false) }
  }, [])

  useEffect(() => { fetchCodes() }, [fetchCodes])
  useEffect(() => {
    if (selectedCode) fetchOptions(selectedCode.id)
    else { setOptions([]); setSelectedOption(null) }
  }, [selectedCode, fetchOptions])
  useEffect(() => {
    if (selectedOption) {
      fetchRates(selectedOption.id)
      setTimeout(() => rateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    } else { setRates([]) }
  }, [selectedOption, fetchRates])

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
        if (selectedCode?.id === codeForm.id) { setSelectedCode(null); setSelectedOption(null) }
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
        setOptionModal(null)
        if (selectedOption?.id === optionForm.id) setSelectedOption(null)
        if (selectedCode) fetchOptions(selectedCode.id)
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  // ── Rate CRUD
  const handleSaveRate = async () => {
    if (rateForm.rateRialPerKwh <= 0) { toast.error('نرخ باید بزرگتر از صفر باشد'); return }
    setRateSaving(true)
    try {
      const res = rateModal === 'create'
        ? await adminApi.createTariffCodeOptionRate(rateForm)
        : await adminApi.updateTariffCodeOptionRate(rateForm)
      if (res.type === 'Success' || res.code === 200) {
        toast.success(rateModal === 'create' ? 'نرخ ثبت شد' : 'نرخ ویرایش شد')
        setRateModal(null); if (selectedOption) fetchRates(selectedOption.id)
      } else { toast.error(res.message ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setRateSaving(false) }
  }

  const handleDeleteRate = async () => {
    setRateSaving(true)
    try {
      const res = await adminApi.deleteTariffCodeOptionRate(rateForm.id)
      if (res.type === 'Success' || res.code === 200) {
        toast.success('نرخ حذف شد')
        setRateModal(null); if (selectedOption) fetchRates(selectedOption.id)
      } else { toast.error(res.message ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setRateSaving(false) }
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
                <div key={opt.id}
                  className={`px-5 py-3 transition-colors ${selectedOption?.id === opt.id ? 'bg-violet-50 border-r-2 border-violet-500' : 'hover:bg-gray-50'}`}>
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
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => setSelectedOption(selectedOption?.id === opt.id ? null : opt)}
                        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors ${
                          selectedOption?.id === opt.id
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-gray-100 text-gray-500 hover:bg-violet-50 hover:text-violet-600'
                        }`}
                      >
                        <DollarSign className="h-3 w-3" /> نرخ‌ها
                      </button>
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

      {/* ── Rate panel */}
      {selectedOption && (
        <div ref={rateRef} className="rounded-2xl border border-violet-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-violet-100 bg-violet-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-violet-600" />
              <span className="font-bold text-violet-800">نرخ‌های سالانه — {selectedOption.title}</span>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">{rates.length} رکورد</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => { setRateForm(emptyRate(selectedOption.id)); setRateModal('create') }}>
                <Plus className="h-3.5 w-3.5" /> نرخ جدید
              </Button>
              <button onClick={() => setSelectedOption(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {ratesLoading ? (
            <div className="flex h-24 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
          ) : rates.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">نرخی برای این گزینه ثبت نشده</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {rates.map(r => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="rounded-lg bg-violet-100 px-3 py-1 font-mono text-sm font-bold text-violet-700">{r.year}</span>
                    <span className="text-xs text-gray-500">میان: <span className="font-bold text-gray-800">{r.rateRialPerKwh.toLocaleString('fa-IR')}</span></span>
                    <span className="text-xs text-red-500">اوج: <span className="font-bold">{r.ratePeakRialPerKwh.toLocaleString('fa-IR')}</span></span>
                    <span className="text-xs text-blue-500">کم: <span className="font-bold">{r.rateLowRialPerKwh.toLocaleString('fa-IR')}</span></span>
                    <span className="text-[10px] text-gray-400">ریال/kWh</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setRateForm(r); setRateModal('edit') }}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { setRateForm(r); setRateModal('delete') }}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* ── Rate modals */}
      <Modal open={rateModal === 'create' || rateModal === 'edit'}
        onClose={() => setRateModal(null)}
        title={rateModal === 'create' ? 'نرخ جدید' : 'ویرایش نرخ'} size="md">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="سال شمسی" type="number" value={rateForm.year}
              onChange={e => setRateForm(f => ({ ...f, year: +e.target.value }))}
              disabled hint="سال شمسی جاری به صورت خودکار تنظیم شده" />
          </div>
          <Input label="نرخ میان‌بار — مبنای ماده ۱۶ (ریال/kWh) *" type="number" value={rateForm.rateRialPerKwh || ''}
            placeholder="مثلاً ۵۴۹۰"
            onChange={e => setRateForm(f => ({ ...f, rateRialPerKwh: +e.target.value }))} />
          <Input label="نرخ اوج‌بار (ریال/kWh) *" type="number" value={rateForm.ratePeakRialPerKwh || ''}
            placeholder="مثلاً ۹۲۹۲"
            onChange={e => setRateForm(f => ({ ...f, ratePeakRialPerKwh: +e.target.value }))} />
          <Input label="نرخ کم‌بار (ریال/kWh) *" type="number" value={rateForm.rateLowRialPerKwh || ''}
            placeholder="مثلاً ۲۹۳"
            onChange={e => setRateForm(f => ({ ...f, rateLowRialPerKwh: +e.target.value }))} />
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setRateModal(null)}>انصراف</Button>
          <Button loading={rateSaving} onClick={handleSaveRate}>
            {rateModal === 'create' ? 'ثبت' : 'ذخیره'}
          </Button>
        </div>
      </Modal>

      <Modal open={rateModal === 'delete'} onClose={() => setRateModal(null)} title="حذف نرخ" size="sm">
        <p className="text-sm text-gray-600">
          آیا از حذف نرخ سال <span className="font-bold text-gray-900">{rateForm.year}</span> اطمینان دارید؟
        </p>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setRateModal(null)}>انصراف</Button>
          <Button variant="danger" loading={rateSaving} onClick={handleDeleteRate}><Trash2 className="h-4 w-4" /> حذف</Button>
        </div>
      </Modal>
    </div>
  )
}
