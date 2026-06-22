import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { Plus, Pencil, Trash2, Tag, Layers, X, Download, BarChart3, Home, Factory, Store, Zap, Calculator, Hash, ChevronRight, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { lookupApi } from '../../api/lookup'
import type { IdTitle, IdName } from '../../api/lookup'
import { Table, Pagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input, { Select, DatePicker } from '../../components/ui/Input'
import type { Tariff, TariffSlab, TariffCode, TariffCodeOption, TariffCodeOptionRate } from '../../types'

const emptyTariff: Tariff = { tariffId: 0, tariffTypeId: 1, customerTypeId: 1, powerEntitiesId: 0, effectiveFrom: null }
const emptySlab: TariffSlab = { id: 0, tariffId: 0, fromKwh: 0, toKwh: null, multiplier: 1 }

const TYPE_META: Record<number, { badge: string; badgeColor: string; desc: string; btnLabel: string; icon: typeof Home }> = {
  1: { badge: 'مصرفی', badgeColor: 'bg-blue-100 text-blue-700', desc: 'محاسبه بر اساس پله‌های مصرفی با نرخ‌های پلکانی جهت تشویق به صرفه‌جویی.', btnLabel: 'مشاهده جزئیات کامل', icon: Home },
  2: { badge: 'تولیدی', badgeColor: 'bg-amber-100 text-amber-700', desc: 'ساختار منعطف بر اساس قدرت قرارداد، ضریب‌بندی قدرت و ولتاژ اتصال.', btnLabel: 'تحلیل هزینه صنعتی', icon: Factory },
  3: { badge: 'سایر مصارف', badgeColor: 'bg-purple-100 text-purple-700', desc: 'تعرفه‌های ویژه برای اغذیه‌فروشی، مراکز خرید و هتل‌ها.', btnLabel: 'استعلام نرخ تجاری', icon: Store },
}

const CARD_COLORS = [
  { border: '#10b981', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { border: '#f59e0b', iconBg: 'bg-amber-50',   iconColor: 'text-amber-600' },
  { border: '#8b5cf6', iconBg: 'bg-violet-50',  iconColor: 'text-violet-600' },
]

export default function AdminTariffs() {
  // ── Tariff state ─────────────────────────────────────────────────────
  const [tariffs, setTariffs]             = useState<Tariff[]>([])
  const [tariffTotal, setTariffTotal]     = useState(0)
  const [tariffPages, setTariffPages]     = useState(1)
  const [tariffPage, setTariffPage]       = useState(1)
  const [tariffLoading, setTariffLoading] = useState(true)
  const [tariffModal, setTariffModal]     = useState<'create' | 'edit' | 'delete' | null>(null)
  const [tariffForm, setTariffForm]       = useState<Tariff>(emptyTariff)
  const [tariffSaving, setTariffSaving]   = useState(false)
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)

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

  // ── Per-type preview slabs ────────────────────────────────────────────
  const [typeSlabs, setTypeSlabs]           = useState<Record<number, TariffSlab[]>>({})
  const [typeSlabsLoaded, setTypeSlabsLoaded] = useState<Record<number, boolean>>({})

  // ── TariffCode state ─────────────────────────────────────────────────
  const [tcodes, setTcodes]               = useState<TariffCode[]>([])
  const [tcodeTotal, setTcodeTotal]       = useState(0)
  const [tcodePages, setTcodePages]       = useState(1)
  const [tcodePage, setTcodePage]         = useState(1)
  const [tcodeLoading, setTcodeLoading]   = useState(false)
  const [tcodeModal, setTcodeModal]       = useState<'create'|'edit'|'delete'|null>(null)
  const [tcodeForm, setTcodeForm]         = useState<TariffCode>({ id: 0, code: '', title: '' })
  const [tcodeSaving, setTcodeSaving]     = useState(false)
  const [selectedTcode, setSelectedTcode] = useState<TariffCode | null>(null)
  const tcodeRef = useRef<HTMLDivElement>(null)

  // ── TariffCodeOption state ────────────────────────────────────────────
  const [options, setOptions]               = useState<TariffCodeOption[]>([])
  const [optionTotal, setOptionTotal]       = useState(0)
  const [optionPages, setOptionPages]       = useState(1)
  const [optionPage, setOptionPage]         = useState(1)
  const [optionLoading, setOptionLoading]   = useState(false)
  const [optionModal, setOptionModal]       = useState<'create'|'edit'|'delete'|null>(null)
  const [optionForm, setOptionForm]         = useState<TariffCodeOption>({ id: 0, tariffCodeId: 0, title: '', penaltyMultiplier: 1.3, creditMultiplier: 0.75 })
  const [optionSaving, setOptionSaving]     = useState(false)
  const [selectedOption, setSelectedOption] = useState<TariffCodeOption | null>(null)
  const optionRef = useRef<HTMLDivElement>(null)

  // ── TariffCodeOptionRate state ────────────────────────────────────────
  const [rates, setRates]             = useState<TariffCodeOptionRate[]>([])
  const [rateTotal, setRateTotal]     = useState(0)
  const [ratePages, setRatePages]     = useState(1)
  const [ratePage, setRatePage]       = useState(1)
  const [rateLoading, setRateLoading] = useState(false)
  const [rateModal, setRateModal]     = useState<'create'|'edit'|'delete'|null>(null)
  const [rateForm, setRateForm]       = useState<TariffCodeOptionRate>({ id: 0, tariffCodeOptionId: 0, year: new Date().getFullYear() - 621, rateRialPerKwh: 0, ratePeakRialPerKwh: 0, rateLowRialPerKwh: 0 })
  const [rateSaving, setRateSaving]   = useState(false)
  const rateRef = useRef<HTMLDivElement>(null)

  // ── Estimator ────────────────────────────────────────────────────────
  const [estimatorKwh, setEstimatorKwh]       = useState('')
  const [estimatorTypeId, setEstimatorTypeId] = useState<number>(1)

  const pageSize = 10

  // ── Derived ──────────────────────────────────────────────────────────
  const newestPerType = useMemo(() => {
    const groups = new Map<number, Tariff[]>()
    tariffs.forEach((t) => {
      if (!groups.has(t.tariffTypeId)) groups.set(t.tariffTypeId, [])
      groups.get(t.tariffTypeId)!.push(t)
    })
    return Array.from(groups.entries()).map(([typeId, items]) => {
      const newest = [...items].sort((a, b) => b.tariffId - a.tariffId)[0]
      return { typeId, newest, count: items.length }
    })
  }, [tariffs])

  const filteredTariffs = selectedTypeId
    ? tariffs.filter(t => t.tariffTypeId === selectedTypeId)
    : tariffs

  const slabBars = useMemo(() => {
    if (!slabs.length) return []
    return slabs
      .slice()
      .sort((a, b) => Number(a.fromKwh) - Number(b.fromKwh))
      .map((s, idx) => ({
        label: `${Number(s.fromKwh).toLocaleString('fa-IR')}`,
        value: Number(s.multiplier),
        color: idx % 3 === 0 ? '#99f6e4' : idx % 3 === 1 ? '#34d399' : '#047857',
      }))
  }, [slabs])
  const slabBarsMax = useMemo(
    () => Math.max(...slabBars.map(b => b.value), 1),
    [slabBars],
  )

  const estimatorResult = useMemo(() => {
    const kwh = parseFloat(estimatorKwh)
    if (!kwh || kwh <= 0) return null
    const ts = typeSlabs[estimatorTypeId] ?? []
    const sorted = [...ts].sort((a, b) => Number(a.fromKwh) - Number(b.fromKwh))
    const slab = sorted.find(s => kwh >= Number(s.fromKwh) && (s.toKwh === null || kwh <= Number(s.toKwh)))
    if (!slab) return null
    return { slab, kwh }
  }, [estimatorKwh, estimatorTypeId, typeSlabs])

  // ── TariffCode fetchers & CRUD ────────────────────────────────────────
  const fetchTcodes = useCallback((p: number) => {
    setTcodeLoading(true)
    adminApi.getTariffCodes({ pageNumber: p, pageSize })
      .then(r => { const res = r.result as any; setTcodes(res?.data ?? []); setTcodeTotal(res?.totalRecords ?? 0); setTcodePages(res?.totalPages ?? 1) })
      .finally(() => setTcodeLoading(false))
  }, [])

  const fetchOptions = useCallback((p: number, tcodeId: number) => {
    setOptionLoading(true)
    adminApi.getTariffCodeOptions({ pageNumber: p, pageSize, Search_TariffCodeId: tcodeId })
      .then(r => { const res = r.result as any; setOptions(res?.data ?? []); setOptionTotal(res?.totalRecords ?? 0); setOptionPages(res?.totalPages ?? 1) })
      .finally(() => setOptionLoading(false))
  }, [])

  const fetchRates = useCallback((p: number, optionId: number) => {
    setRateLoading(true)
    adminApi.getTariffCodeOptionRates({ pageNumber: p, pageSize, Search_TariffCodeOptionId: optionId })
      .then(r => { const res = r.result as any; setRates(res?.data ?? []); setRateTotal(res?.totalRecords ?? 0); setRatePages(res?.totalPages ?? 1) })
      .finally(() => setRateLoading(false))
  }, [])

  useEffect(() => { fetchTcodes(1) }, [fetchTcodes])
  useEffect(() => { if (selectedTcode) { setOptionPage(1); fetchOptions(1, selectedTcode.id); setTimeout(() => optionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50) } }, [selectedTcode, fetchOptions])
  useEffect(() => { if (selectedTcode) fetchOptions(optionPage, selectedTcode.id) }, [optionPage, selectedTcode, fetchOptions])
  useEffect(() => { if (selectedOption) { setRatePage(1); fetchRates(1, selectedOption.id); setTimeout(() => rateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50) } }, [selectedOption, fetchRates])
  useEffect(() => { if (selectedOption) fetchRates(ratePage, selectedOption.id) }, [ratePage, selectedOption, fetchRates])

  const handleSaveTcode = async () => {
    if (!tcodeForm.code || !tcodeForm.title) { toast.error('کد و عنوان الزامی است'); return }
    setTcodeSaving(true)
    try {
      const res = tcodeModal === 'create' ? await adminApi.createTariffCode(tcodeForm) : await adminApi.updateTariffCode(tcodeForm)
      if (res.type === 'Success' || res.code === 200) { toast.success(tcodeModal === 'create' ? 'کد تعرفه ثبت شد' : 'کد تعرفه ویرایش شد'); setTcodeModal(null); fetchTcodes(tcodePage) }
      else toast.error(res.message ?? 'خطا')
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setTcodeSaving(false) }
  }

  const handleDeleteTcode = async () => {
    setTcodeSaving(true)
    try {
      const res = await adminApi.deleteTariffCode(tcodeForm.id)
      if (res.type === 'Success' || res.code === 200) { toast.success('کد تعرفه حذف شد'); setTcodeModal(null); fetchTcodes(tcodePage); if (selectedTcode?.id === tcodeForm.id) { setSelectedTcode(null); setSelectedOption(null) } }
      else toast.error(res.message ?? 'خطا')
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setTcodeSaving(false) }
  }

  const handleSaveOption = async () => {
    if (!optionForm.title) { toast.error('عنوان الزامی است'); return }
    setOptionSaving(true)
    try {
      const res = optionModal === 'create' ? await adminApi.createTariffCodeOption(optionForm) : await adminApi.updateTariffCodeOption(optionForm)
      if (res.type === 'Success' || res.code === 200) { toast.success(optionModal === 'create' ? 'گزینه ثبت شد' : 'گزینه ویرایش شد'); setOptionModal(null); fetchOptions(optionPage, selectedTcode!.id) }
      else toast.error(res.message ?? 'خطا')
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setOptionSaving(false) }
  }

  const handleDeleteOption = async () => {
    setOptionSaving(true)
    try {
      const res = await adminApi.deleteTariffCodeOption(optionForm.id)
      if (res.type === 'Success' || res.code === 200) { toast.success('گزینه حذف شد'); setOptionModal(null); fetchOptions(optionPage, selectedTcode!.id); if (selectedOption?.id === optionForm.id) setSelectedOption(null) }
      else toast.error(res.message ?? 'خطا')
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setOptionSaving(false) }
  }

  const handleSaveRate = async () => {
    if (!rateForm.year || rateForm.rateRialPerKwh <= 0) { toast.error('سال و نرخ الزامی است'); return }
    setRateSaving(true)
    try {
      const res = rateModal === 'create' ? await adminApi.createTariffCodeOptionRate(rateForm) : await adminApi.updateTariffCodeOptionRate(rateForm)
      if (res.type === 'Success' || res.code === 200) { toast.success(rateModal === 'create' ? 'نرخ ثبت شد' : 'نرخ ویرایش شد'); setRateModal(null); fetchRates(ratePage, selectedOption!.id) }
      else toast.error(res.message ?? 'خطا')
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setRateSaving(false) }
  }

  const handleDeleteRate = async () => {
    setRateSaving(true)
    try {
      const res = await adminApi.deleteTariffCodeOptionRate(rateForm.id)
      if (res.type === 'Success' || res.code === 200) { toast.success('نرخ حذف شد'); setRateModal(null); fetchRates(ratePage, selectedOption!.id) }
      else toast.error(res.message ?? 'خطا')
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setRateSaving(false) }
  }

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

  // fetch preview slabs for each type's newest tariff
  useEffect(() => {
    if (!newestPerType.length) return
    newestPerType.forEach(({ typeId, newest }) => {
      if (!newest) {
        setTypeSlabsLoaded(prev => ({ ...prev, [typeId]: true }))
        return
      }
      adminApi.getTariffSlabs({ pageNumber: 1, pageSize: 20, Search_TariffId: newest.tariffId })
        .then((r) => {
          const data: TariffSlab[] = (r.result as any)?.data ?? []
          setTypeSlabs(prev => ({ ...prev, [typeId]: data }))
        })
        .finally(() => setTypeSlabsLoaded(prev => ({ ...prev, [typeId]: true })))
    })
  }, [newestPerType])

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
      if (res.type === 'Success') {
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
      if (res.type === 'Success') {
        toast.success('تعرفه حذف شد')
        setTariffModal(null)
        fetchTariffs(tariffPage)
        if (selectedTariff?.tariffId === tariffForm.tariffId) setSelectedTariff(null)
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setTariffSaving(false) }
  }

  // ── Slab CRUD ─────────────────────────────────────────────────────────
  const openCreateSlab = () => { setSlabForm({ ...emptySlab, tariffId: selectedTariff!.tariffId }); setSlabModal('create') }
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
      if (res.type === 'Success') {
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
      if (res.type === 'Success') {
        toast.success('پله حذف شد')
        setSlabModal(null); fetchSlabs(slabPage, selectedTariff!.tariffId)
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSlabSaving(false) }
  }

  // ── Table columns ─────────────────────────────────────────────────────
  const tariffColumns = [
    { key: 'tariffId',      header: '#',           className: 'w-16' },
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
            title="پله‌های تعرفه"
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
    {
      key: 'range', header: 'پله مصرف (کیلووات ساعت در ماه)',
      render: (r: TariffSlab) => {
        const from = Number(r.fromKwh).toLocaleString('fa-IR')
        const to   = r.toKwh != null ? Number(r.toKwh).toLocaleString('fa-IR') : '∞'
        return <span className="font-mono text-xs">{from} تا {to}</span>
      },
    },
    {
      key: 'multiplier', header: 'ضریب جریمه الگو',
      render: (r: TariffSlab) => (
        <span className="font-semibold text-gray-800">{Number(r.multiplier).toLocaleString('fa-IR')}</span>
      ),
    },
    {
      key: 'status', header: 'وضعیت شناسه',
      render: (r: TariffSlab) => {
        const m = Number(r.multiplier)
        if (m <= 1)   return <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">خوش‌مصرف</span>
        if (m <= 1.5) return <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">نرمال</span>
        if (m <= 2.5) return <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">در مجزده الگو</span>
        if (m <= 4)   return <span className="inline-flex rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">پرمصرف</span>
        return              <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">بسیار پرمصرف</span>
      },
    },
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

      {/* Hero */}
      <div
        className="overflow-hidden rounded-2xl px-8 py-8 text-right"
        style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #ecfdf5 100%)', border: '1px solid #e5e7eb' }}
      >
        <h2 className="text-3xl font-black tracking-tight text-gray-900">ساختار تعرفه‌های هوشمند انرژی</h2>
        <p className="mt-2 max-w-lg text-sm text-gray-500">
          مشاهده و تحلیل دقیق هزینه‌های انرژی بر اساس نوع شناسه، پله‌های مصرف و ساعات اوج بار جهت مدیریت بهینه هزینه‌ها.
        </p>
      </div>

      {/* Type cards */}
      {tariffTypes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {tariffTypes.map((type, idx) => {
            const meta      = TYPE_META[type.id] ?? TYPE_META[1]
            const colors    = CARD_COLORS[idx % CARD_COLORS.length]
            const group     = newestPerType.find(g => g.typeId === type.id)
            const preview   = (typeSlabs[type.id] ?? []).slice().sort((a, b) => Number(a.fromKwh) - Number(b.fromKwh)).slice(0, 3)
            const loaded    = !!typeSlabsLoaded[type.id]
            const TypeIcon  = meta.icon
            const isSelected = selectedTypeId === type.id

            const btnColors = [
              'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
              'bg-amber-50 text-amber-700 hover:bg-amber-100',
              'bg-violet-50 text-violet-700 hover:bg-violet-100',
            ]

            return (
              <div
                key={type.id}
                className="flex flex-col overflow-hidden rounded-2xl bg-white transition-all"
                style={{
                  border: isSelected ? `2px solid ${colors.border}` : '1px solid #e5e7eb',
                  boxShadow: isSelected
                    ? `0 0 0 3px ${colors.border}22, 0 4px 16px rgba(0,0,0,0.08)`
                    : '0 2px 10px rgba(0,0,0,0.04)',
                }}
              >
                <div className="flex-1 p-5">
                  {/* Badge + icon row */}
                  <div className="flex items-start justify-between">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.badgeColor}`}>
                      {meta.badge}
                    </span>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.iconBg}`}>
                      <TypeIcon className={`h-5 w-5 ${colors.iconColor}`} />
                    </div>
                  </div>

                  {/* Title + desc */}
                  <div className="mt-4">
                    <p className="text-lg font-bold text-gray-900">{type.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">{meta.desc}</p>
                  </div>

                  {/* Slab metric rows */}
                  <div className="mt-4 space-y-2">
                    {preview.length > 0 ? (
                      preview.map((s, si) => {
                        const from = Number(s.fromKwh).toLocaleString('fa-IR')
                        const to   = s.toKwh != null ? Number(s.toKwh).toLocaleString('fa-IR') : '—'
                        const labels = ['پله اول', 'پله میانی', 'پله نهایی']
                        return (
                          <div key={si} className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">{labels[si] ?? `پله ${si + 1}`} ({from} تا {to})</span>
                            <span className="font-bold text-gray-800">ضریب {Number(s.multiplier).toLocaleString('fa-IR')}</span>
                          </div>
                        )
                      })
                    ) : loaded ? (
                      <p className="text-xs text-gray-400">پله‌ای برای این تعرفه ثبت نشده</p>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-200 border-t-gray-400" />
                        در حال بارگذاری...
                      </div>
                    )}
                  </div>
                </div>

                {/* Divider + action */}
                <div className="border-t border-gray-100 px-5 py-3">
                  <button
                    onClick={() => {
                      setSelectedTypeId(isSelected ? null : type.id)
                      setEstimatorTypeId(type.id)
                      const newest = group?.newest
                      if (newest) setSelectedTariff(newest)
                    }}
                    className={`w-full rounded-xl py-2 text-sm font-semibold transition-all ${btnColors[idx % btnColors.length]}`}
                  >
                    {isSelected ? '✓ انتخاب‌شده' : meta.btnLabel}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Estimator + TOU chart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" dir="ltr">

        {/* Estimator — dark card (left in ltr) */}
        <div className="flex flex-col justify-between overflow-hidden rounded-2xl p-5 text-right"
          style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', color: '#fff' }}>
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                <Calculator className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-white">تخمین‌گر هزینه</p>
                <p className="text-[10px] text-slate-400">بر اساس آخرین تعرفه‌ها</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              با وارد کردن میزان مصرف خود، هزینه قبض را بر اساس آخرین تعرفه‌ها محاسبه کنید.
            </p>

            {tariffTypes.length > 1 && (
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {tariffTypes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setEstimatorTypeId(t.id)}
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
                      estimatorTypeId === t.id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4">
              <input
                type="number"
                placeholder="میزان مصرف (KWh)"
                value={estimatorKwh}
                onChange={e => setEstimatorKwh(e.target.value)}
                className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                dir="ltr"
              />
            </div>

            {estimatorResult && (
              <div className="mt-3 rounded-xl bg-emerald-900/40 px-4 py-3 text-xs">
                <p className="text-emerald-300">
                  {estimatorResult.kwh.toLocaleString('fa-IR')} kWh در پله{' '}
                  <span className="font-bold text-white">
                    {Number(estimatorResult.slab.fromKwh).toLocaleString('fa-IR')} – {estimatorResult.slab.toKwh != null ? Number(estimatorResult.slab.toKwh).toLocaleString('fa-IR') : '∞'}
                  </span>
                </p>
                <p className="mt-1 text-emerald-300">
                  ضریب: <span className="font-bold text-white">{Number(estimatorResult.slab.multiplier).toLocaleString('fa-IR')}×</span>
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (!estimatorKwh) { toast.error('مقدار مصرف را وارد کنید'); return }
              if (!estimatorResult && typeSlabsLoaded[estimatorTypeId])
                toast.error('مصرف وارد‌شده در محدوده پله‌های تعرفه نیست')
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
          >
            <Zap className="h-4 w-4" /> محاسبه کن ←
          </button>
        </div>

        {/* TOU chart (right, spans 2 cols in ltr) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:col-span-2" dir="rtl">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-700" />
              <span className="text-sm font-semibold text-gray-700">نمودار زمانی تعرفه (TOU)</span>
            </div>
            <span className="text-xs text-gray-400">
              {selectedTariff ? `تعرفه #${selectedTariff.tariffId}` : 'برای نمایش، تعرفه انتخاب کنید'}
            </span>
          </div>
          <div className="flex h-40 items-end gap-2 overflow-hidden rounded-xl bg-emerald-50/50 p-3">
            {slabBars.length === 0 ? (
              <p className="m-auto text-sm text-gray-400">داده پله‌ای برای رسم نمودار موجود نیست</p>
            ) : (
              slabBars.map((bar, idx) => (
                <div key={`${bar.label}-${idx}`} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${Math.max(16, (bar.value / slabBarsMax) * 120)}px`,
                      background: bar.color,
                    }}
                    title={`ضریب ${bar.value.toLocaleString('fa-IR')}`}
                  />
                  <span className="text-[10px] text-gray-500">{bar.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Table header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-emerald-700" />
          <p className="text-sm font-semibold text-gray-700">
            جدول تفصیلی پله‌های مصرف
            {selectedTypeId ? ` (${tariffTypes.find(t => t.id === selectedTypeId)?.title ?? ''})` : ' (عادی)'}
          </p>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
            {(selectedTypeId ? filteredTariffs.length : tariffTotal).toLocaleString('fa-IR')} رکورد
          </span>
          {selectedTypeId && (
            <button
              onClick={() => setSelectedTypeId(null)}
              className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700 hover:bg-emerald-100"
            >
              <X className="h-3 w-3" /> حذف فیلتر
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            <Download className="h-3.5 w-3.5" /> دریافت PDF
          </button>
          <Button size="sm" onClick={openCreateTariff}><Plus className="h-4 w-4" /> تعرفه جدید</Button>
        </div>
      </div>

      <Table columns={tariffColumns} data={filteredTariffs} loading={tariffLoading} keyField="tariffId" emptyText="تعرفه‌ای ثبت نشده" />
      {!selectedTypeId && <Pagination page={tariffPage} totalPages={tariffPages} total={tariffTotal} pageSize={pageSize} onPageChange={setTariffPage} />}

      {/* Slabs panel */}
      {selectedTariff && (
        <div ref={slabsRef} className="overflow-hidden rounded-2xl p-5 space-y-4"
          style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(15,23,42,0.04)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-700" />
              <span className="text-sm font-semibold text-gray-700">پله‌های تعرفه #{selectedTariff.tariffId}</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">{slabTotal} رکورد</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={openCreateSlab}><Plus className="h-4 w-4" /> پله جدید</Button>
              <button onClick={() => setSelectedTariff(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <Table columns={slabColumns} data={slabs} loading={slabLoading} keyField="id" emptyText="پله‌ای برای این تعرفه ثبت نشده" />
          <Pagination page={slabPage} totalPages={slabPages} total={slabTotal} pageSize={pageSize} onPageChange={setSlabPage} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
           بخش کدهای تعرفه
          ══════════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-4">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-violet-600" />
            <span className="font-semibold text-gray-800">کدهای تعرفه</span>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">{tcodeTotal} رکورد</span>
          </div>
          <Button size="sm" onClick={() => { setTcodeForm({ id: 0, code: '', title: '' }); setTcodeModal('create') }}>
            <Plus className="h-4 w-4" /> کد جدید
          </Button>
        </div>
        <Table
          columns={[
            { key: 'code',  header: 'کد', render: (r: TariffCode) => <span className="font-mono text-xs font-bold text-violet-700">{r.code}</span> },
            { key: 'title', header: 'عنوان', render: (r: TariffCode) => <span className="text-sm text-gray-800">{r.title}</span> },
            { key: 'actions', header: 'عملیات', className: 'w-32',
              render: (r: TariffCode) => (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedTcode(prev => prev?.id === r.id ? null : r)}
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${selectedTcode?.id === r.id ? 'bg-violet-100 text-violet-700' : 'text-gray-400 hover:bg-violet-50 hover:text-violet-600'}`}>
                    <ChevronRight className="h-3 w-3" /> گزینه‌ها
                  </button>
                  <button onClick={() => { setTcodeForm(r); setTcodeModal('edit') }} className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => { setTcodeForm(r); setTcodeModal('delete') }} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ),
            },
          ]}
          data={tcodes} loading={tcodeLoading} keyField="id" emptyText="کد تعرفه‌ای ثبت نشده"
        />
        <div className="px-5 pb-3">
          <Pagination page={tcodePage} totalPages={tcodePages} total={tcodeTotal} pageSize={pageSize} onPageChange={setTcodePage} />
        </div>
      </div>

      {/* TariffCodeOption panel */}
      {selectedTcode && (
        <div ref={optionRef} className="overflow-hidden rounded-2xl border border-violet-200 bg-white">
          <div className="flex items-center justify-between border-b border-violet-100 bg-violet-50 px-5 py-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-violet-600" />
              <span className="font-semibold text-violet-800">گزینه‌های کد تعرفه — <span className="font-mono">{selectedTcode.code}</span> {selectedTcode.title}</span>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">{optionTotal} رکورد</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => { setOptionForm({ id: 0, tariffCodeId: selectedTcode.id, title: '', penaltyMultiplier: 1.3, creditMultiplier: 0.75 }); setOptionModal('create') }}>
                <Plus className="h-4 w-4" /> گزینه جدید
              </Button>
              <button onClick={() => { setSelectedTcode(null); setSelectedOption(null) }} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
          </div>
          <Table
            columns={[
              { key: 'title', header: 'عنوان گزینه', render: (r: TariffCodeOption) => <span className="font-semibold text-gray-800">{r.title}</span> },
              { key: 'penaltyMultiplier', header: 'ضریب جریمه', render: (r: TariffCodeOption) => <span className="font-mono text-sm font-bold text-red-600">{r.penaltyMultiplier}</span> },
              { key: 'creditMultiplier',  header: 'ضریب بستانکاری', render: (r: TariffCodeOption) => <span className="font-mono text-sm font-bold text-emerald-600">{r.creditMultiplier}</span> },
              { key: 'actions', header: 'عملیات', className: 'w-36',
                render: (r: TariffCodeOption) => (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedOption(prev => prev?.id === r.id ? null : r)}
                      className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${selectedOption?.id === r.id ? 'bg-emerald-100 text-emerald-700' : 'text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                      <DollarSign className="h-3 w-3" /> نرخ‌ها
                    </button>
                    <button onClick={() => { setOptionForm(r); setOptionModal('edit') }} className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { setOptionForm(r); setOptionModal('delete') }} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ),
              },
            ]}
            data={options} loading={optionLoading} keyField="id" emptyText="گزینه‌ای ثبت نشده"
          />
          <div className="px-5 pb-3">
            <Pagination page={optionPage} totalPages={optionPages} total={optionTotal} pageSize={pageSize} onPageChange={setOptionPage} />
          </div>
        </div>
      )}

      {/* TariffCodeOptionRate panel */}
      {selectedOption && (
        <div ref={rateRef} className="overflow-hidden rounded-2xl border border-emerald-200 bg-white">
          <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50 px-5 py-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold text-emerald-800">نرخ‌های سالانه — {selectedOption.title}</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">{rateTotal} رکورد</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => { setRateForm({ id: 0, tariffCodeOptionId: selectedOption.id, year: new Date().getFullYear() - 621, rateRialPerKwh: 0, ratePeakRialPerKwh: 0, rateLowRialPerKwh: 0 }); setRateModal('create') }}>
                <Plus className="h-4 w-4" /> نرخ جدید
              </Button>
              <button onClick={() => setSelectedOption(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
          </div>
          <Table
            columns={[
              { key: 'year', header: 'سال شمسی', render: (r: TariffCodeOptionRate) => <span className="font-mono text-sm font-bold text-gray-800">{r.year}</span> },
              { key: 'rateRialPerKwh', header: 'نرخ (ریال/kWh)', render: (r: TariffCodeOptionRate) => <span className="font-mono font-bold text-emerald-700">{r.rateRialPerKwh.toLocaleString('fa-IR')} ریال</span> },
              { key: 'actions', header: 'عملیات', className: 'w-24',
                render: (r: TariffCodeOptionRate) => (
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setRateForm(r); setRateModal('edit') }} className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { setRateForm(r); setRateModal('delete') }} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ),
              },
            ]}
            data={rates} loading={rateLoading} keyField="id" emptyText="نرخی ثبت نشده"
          />
          <div className="px-5 pb-3">
            <Pagination page={ratePage} totalPages={ratePages} total={rateTotal} pageSize={pageSize} onPageChange={setRatePage} />
          </div>
        </div>
      )}

      {/* TariffCode modals */}
      <Modal open={tcodeModal === 'create' || tcodeModal === 'edit'} onClose={() => setTcodeModal(null)}
        title={tcodeModal === 'create' ? 'کد تعرفه جدید' : 'ویرایش کد تعرفه'} size="sm">
        <div className="grid grid-cols-1 gap-4">
          <Input label="کد" value={tcodeForm.code} onChange={e => setTcodeForm(p => ({ ...p, code: e.target.value }))} placeholder="مثلاً ۱۱۱" />
          <Input label="عنوان" value={tcodeForm.title} onChange={e => setTcodeForm(p => ({ ...p, title: e.target.value }))} placeholder="عنوان کد تعرفه" />
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <Button variant="secondary" onClick={() => setTcodeModal(null)}>انصراف</Button>
          <Button loading={tcodeSaving} onClick={handleSaveTcode}>{tcodeModal === 'create' ? 'ثبت' : 'ذخیره'}</Button>
        </div>
      </Modal>
      <Modal open={tcodeModal === 'delete'} onClose={() => setTcodeModal(null)} title="حذف کد تعرفه" size="sm">
        <p className="text-sm text-gray-600">آیا از حذف کد تعرفه <span className="font-bold">{tcodeForm.title}</span> اطمینان دارید؟</p>
        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <Button variant="secondary" onClick={() => setTcodeModal(null)}>انصراف</Button>
          <Button variant="danger" loading={tcodeSaving} onClick={handleDeleteTcode}><Trash2 className="h-4 w-4" /> حذف</Button>
        </div>
      </Modal>

      {/* TariffCodeOption modals */}
      <Modal open={optionModal === 'create' || optionModal === 'edit'} onClose={() => setOptionModal(null)}
        title={optionModal === 'create' ? 'گزینه جدید' : 'ویرایش گزینه'} size="sm">
        <div className="grid grid-cols-1 gap-4">
          <Input label="عنوان گزینه" value={optionForm.title} onChange={e => setOptionForm(p => ({ ...p, title: e.target.value }))} placeholder="عنوان گزینه کد تعرفه" />
          <Input label="ضریب جریمه" type="number" step="0.01" value={optionForm.penaltyMultiplier} onChange={e => setOptionForm(p => ({ ...p, penaltyMultiplier: +e.target.value }))} />
          <Input label="ضریب بستانکاری" type="number" step="0.01" value={optionForm.creditMultiplier} onChange={e => setOptionForm(p => ({ ...p, creditMultiplier: +e.target.value }))} />
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <Button variant="secondary" onClick={() => setOptionModal(null)}>انصراف</Button>
          <Button loading={optionSaving} onClick={handleSaveOption}>{optionModal === 'create' ? 'ثبت' : 'ذخیره'}</Button>
        </div>
      </Modal>
      <Modal open={optionModal === 'delete'} onClose={() => setOptionModal(null)} title="حذف گزینه" size="sm">
        <p className="text-sm text-gray-600">آیا از حذف گزینه <span className="font-bold">{optionForm.title}</span> اطمینان دارید؟</p>
        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <Button variant="secondary" onClick={() => setOptionModal(null)}>انصراف</Button>
          <Button variant="danger" loading={optionSaving} onClick={handleDeleteOption}><Trash2 className="h-4 w-4" /> حذف</Button>
        </div>
      </Modal>

      {/* TariffCodeOptionRate modals */}
      <Modal open={rateModal === 'create' || rateModal === 'edit'} onClose={() => setRateModal(null)}
        title={rateModal === 'create' ? 'نرخ جدید' : 'ویرایش نرخ'} size="md">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="سال شمسی" type="number" value={rateForm.year} onChange={e => setRateForm(p => ({ ...p, year: +e.target.value }))} disabled hint="سال شمسی جاری به صورت خودکار تنظیم شده" />
          </div>
          <Input label="نرخ میان‌بار — مبنای ماده ۱۶ (ریال/kWh)" type="number" value={rateForm.rateRialPerKwh || ''} onChange={e => setRateForm(p => ({ ...p, rateRialPerKwh: +e.target.value }))} placeholder="مثلاً ۵۴۹۰" />
          <Input label="نرخ اوج‌بار (ریال/kWh)" type="number" value={rateForm.ratePeakRialPerKwh || ''} onChange={e => setRateForm(p => ({ ...p, ratePeakRialPerKwh: +e.target.value }))} placeholder="مثلاً ۹۲۹۲" />
          <Input label="نرخ کم‌بار (ریال/kWh)" type="number" value={rateForm.rateLowRialPerKwh || ''} onChange={e => setRateForm(p => ({ ...p, rateLowRialPerKwh: +e.target.value }))} placeholder="مثلاً ۲۹۳" />
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <Button variant="secondary" onClick={() => setRateModal(null)}>انصراف</Button>
          <Button loading={rateSaving} onClick={handleSaveRate}>{rateModal === 'create' ? 'ثبت' : 'ذخیره'}</Button>
        </div>
      </Modal>
      <Modal open={rateModal === 'delete'} onClose={() => setRateModal(null)} title="حذف نرخ" size="sm">
        <p className="text-sm text-gray-600">آیا از حذف نرخ سال <span className="font-bold">{rateForm.year}</span> اطمینان دارید؟</p>
        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <Button variant="secondary" onClick={() => setRateModal(null)}>انصراف</Button>
          <Button variant="danger" loading={rateSaving} onClick={handleDeleteRate}><Trash2 className="h-4 w-4" /> حذف</Button>
        </div>
      </Modal>

      {/* Tariff modals */}
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
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
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
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setTariffModal(null)}>انصراف</Button>
          <Button variant="danger" loading={tariffSaving} onClick={handleDeleteTariff}>
            <Trash2 className="h-4 w-4" /> حذف
          </Button>
        </div>
      </Modal>

      {/* Slab modals */}
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
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setSlabModal(null)}>انصراف</Button>
          <Button loading={slabSaving} onClick={handleSaveSlab}>
            {slabModal === 'create' ? 'ثبت پله' : 'ذخیره تغییرات'}
          </Button>
        </div>
      </Modal>

      <Modal open={slabModal === 'delete'} onClose={() => setSlabModal(null)} title="حذف پله تعرفه" size="sm">
        <p className="text-sm text-gray-600">آیا از حذف این پله تعرفه اطمینان دارید؟</p>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setSlabModal(null)}>انصراف</Button>
          <Button variant="danger" loading={slabSaving} onClick={handleDeleteSlab}>
            <Trash2 className="h-4 w-4" /> حذف
          </Button>
        </div>
      </Modal>
    </div>
  )
}
