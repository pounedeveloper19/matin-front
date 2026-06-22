import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Pencil, Trash2, MapPin, Zap, FileText, Download,
  User2, Clock, BarChart3, ChevronDown, ChevronUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { validateBillIdentifier } from '../../utils/validators'
import { adminApi } from '../../api/admin'
import { uploadApi } from '../../api/upload'
import { lookupApi } from '../../api/lookup'
import type { IdTitle, IdName } from '../../api/lookup'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input, { Select } from '../ui/Input'
import Badge from '../ui/Badge'
import type { AdminAddress, AdminSubscription, AdminBillReport, BillAnalysisResult, BillBand, HourEntry } from '../../types'
import { toArr } from '../../utils'

// ─── constants ───────────────────────────────────────────────────────────────

const JALALI_MONTHS = ['','فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']


function touColor(title: string): string {
  if (title.includes('جمعه'))                              return '#8b5cf6'
  if (title.includes('اوج') || title.includes('پیک'))     return '#ef4444'
  if (title.includes('میان') || title.includes('میانی'))  return '#f59e0b'
  if (title.includes('کم')  || title.includes('کمبار'))   return '#10b981'
  return '#9ca3af'
}

function touLabel(title: string): string {
  if (title.includes('جمعه'))                              return 'اوج جمعه'
  if (title.includes('اوج') || title.includes('پیک'))     return 'اوج'
  if (title.includes('میان') || title.includes('میانی'))  return 'میان'
  if (title.includes('کم')  || title.includes('کمبار'))   return 'کم'
  return title
}

const rial = (n: number) => n.toLocaleString('fa-IR') + ' ریال'
const kwh  = (n: number) => n.toLocaleString('fa-IR') + ' kWh'

// ─── mini components ─────────────────────────────────────────────────────────

function TouDayChart({ schedule, touTypes }: { schedule: Record<number, number>; touTypes: { id: number; title: string }[] }) {
  const typeMap = Object.fromEntries(touTypes.map(t => [t.id, t]))
  const counts: Record<number, number> = {}
  for (let h = 0; h < 24; h++) {
    const id = schedule[h]
    if (id) counts[id] = (counts[id] ?? 0) + 1
  }
  const showLabel = (h: number) => h === 0 || h === 6 || h === 12 || h === 18 || h === 23

  return (
    <div className="space-y-3">
      <div className="flex gap-0.5 items-stretch" style={{ height: 52 }}>
        {Array.from({ length: 24 }, (_, h) => {
          const id  = schedule[h]
          const typ = id ? typeMap[id] : null
          const bg  = typ ? touColor(typ.title) : '#e5e7eb'
          return (
            <div key={h} className="flex flex-1 flex-col">
              <div
                className="flex-1 rounded-sm cursor-default"
                style={{ background: bg }}
                title={`ساعت ${h}: ${typ?.title ?? '—'}`}
              />
              <span className="mt-1 block text-center font-mono text-[8px] text-gray-400">
                {showLabel(h) ? h : ''}
              </span>
            </div>
          )
        })}
      </div>

      {/* Hour count badges */}
      <div className="flex flex-wrap gap-2">
        {touTypes.map(type => {
          const cnt = counts[type.id] ?? 0
          if (cnt === 0) return null
          const color = touColor(type.title)
          const label = touLabel(type.title)
          return (
            <span key={type.id}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ background: color }}>
              {label} بار: {cnt} ساعت
            </span>
          )
        })}
        {Object.keys(counts).length === 0 && (
          <span className="text-xs text-gray-400">برنامه‌ای برای این ماه ثبت نشده</span>
        )}
      </div>
    </div>
  )
}

function TouBillChart({ bands }: { bands: BillBand[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const maxKwh = Math.max(...bands.flatMap(b => [b.actualKwh, b.contractedKwh]), 1)

  return (
    <div className="space-y-2">
      {bands.map((band, i) => {
        const hasExcess  = band.excessKwh > 0
        const hasDeficit = band.deficitKwh > 0
        const barColor   = hasExcess ? '#ef4444' : hasDeficit ? '#f59e0b' : '#10b981'
        const open = openIdx === i

        return (
          <div key={i} className="overflow-hidden rounded-xl"
            style={{ background: 'rgba(248,250,252,0.9)', border: '1px solid rgba(209,250,229,0.5)' }}>
            <button
              onClick={() => setOpenIdx(open ? null : i)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-right transition-colors hover:bg-emerald-50/40">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${hasExcess ? 'bg-red-500' : hasDeficit ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                <span className="text-sm font-semibold text-gray-900">{band.name}</span>
                <span className="text-xs text-gray-400">{kwh(band.actualKwh)}</span>
              </div>
              <div className="flex items-center gap-2">
                {hasExcess  && <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">جریمه: {rial(band.penaltyRial)}</span>}
                {hasDeficit && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">بستانکاری: {rial(band.creditRial)}</span>}
                {!hasExcess && !hasDeficit && <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">در محدوده</span>}
                {open ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
              </div>
            </button>
            {open && (
              <div className="px-4 pb-3 pt-2"
                style={{ background: 'rgba(236,253,245,0.35)', borderTop: '1px solid rgba(209,250,229,0.4)' }}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-4">
                  <div><p className="text-gray-400">واقعی</p><p className="font-medium">{kwh(band.actualKwh)}</p></div>
                  <div><p className="text-gray-400">قراردادی</p><p className="font-medium">{kwh(band.contractedKwh)}</p></div>
                  <div><p className="text-gray-400">مازاد</p>
                    <p className={`font-medium ${band.excessKwh > 0 ? 'text-red-600' : 'text-gray-400'}`}>{kwh(band.excessKwh)}</p></div>
                  <div><p className="text-gray-400">کسری</p>
                    <p className={`font-medium ${band.deficitKwh > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{kwh(band.deficitKwh)}</p></div>
                  <div><p className="text-gray-400">نرخ بازار</p><p className="font-medium">{band.marketRateRial.toLocaleString('fa-IR')} ر/kWh</p></div>
                  <div><p className="text-gray-400">جریمه</p><p className="font-medium text-red-600">{rial(band.penaltyRial)}</p></div>
                  <div><p className="text-gray-400">بستانکاری</p><p className="font-medium text-emerald-600">{rial(band.creditRial)}</p></div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {[
                    { label: 'واقعی',    value: band.actualKwh,     color: barColor },
                    { label: 'قراردادی', value: band.contractedKwh, color: '#6366f1' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-16 shrink-0">{label}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min((value / maxKwh) * 100, 100)}%`, background: color }} />
                      </div>
                      <span className="w-24 shrink-0 font-medium">{kwh(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── types ───────────────────────────────────────────────────────────────────

type Tab = 'info' | 'addresses' | 'subscriptions' | 'tou' | 'bill' | 'documents'

type AddressRow = {
  id: number; mainAddress: string; postalCode: string
  city: string; province: string; powerEntity?: string
}

type SubRow = {
  id: number; billIdentifier: string
  contractCapacityKw: number | null
  mainAddress: string; city: string
}

interface Props {
  open: boolean
  profileId: number | null
  customerTitle: string
  customerType?: 'legal' | 'real'
  onClose: () => void
}

const emptyAddr: AdminAddress = { id: 0, postalCode: '', mainAddress: '', cityId: 0, powerEntityId: 0 }
const emptySub: AdminSubscription  = { id: 0, billIdentifier: '', contractCapacityKw: null, addressId: 0 }

// ─── main component ───────────────────────────────────────────────────────────

export default function CustomerDetailPanel({ open, profileId, customerTitle, customerType = 'legal', onClose }: Props) {
  const [tab, setTab] = useState<Tab>('info')

  // ── base data
  const [customerInfo, setCustomerInfo]     = useState<any>(null)
  const [addresses, setAddresses]           = useState<AddressRow[]>([])
  const [addrLoading, setAddrLoading]       = useState(false)
  const [subscriptions, setSubscriptions]   = useState<SubRow[]>([])
  const [subLoading, setSubLoading]         = useState(false)
  const [identityDocId, setIdentityDocId]   = useState<string | null>(null)

  // ── lookups
  const [cities, setCities]                 = useState<IdTitle[]>([])
  const [powerEntities, setPowerEntities]   = useState<IdName[]>([])
  const [lookupsLoaded, setLookupsLoaded]   = useState(false)

  // ── address modals
  const [addrModal, setAddrModal]           = useState<'create' | 'edit' | 'delete' | null>(null)
  const [addrForm, setAddrForm]             = useState<AdminAddress>(emptyAddr)
  const [addrSaving, setAddrSaving]         = useState(false)

  // ── subscription modals
  const [subModal, setSubModal]             = useState<'create' | 'delete' | null>(null)
  const [subForm, setSubForm]               = useState<AdminSubscription>(emptySub)
  const [subSaving, setSubSaving]           = useState(false)

  // ── TOU schedule
  const [touEntities, setTouEntities]       = useState<{ id: number; name: string }[]>([])
  const [touTypes, setTouTypes]             = useState<{ id: number; title: string }[]>([])
  const [touEntityId, setTouEntityId]       = useState<number>(0)
  const [touMonth, setTouMonth]             = useState<number>(1)
  const [touSchedule, setTouSchedule]       = useState<Record<number, number>>({})
  const [touLoading, setTouLoading]         = useState(false)

  // ── bill history
  const [billReports, setBillReports]           = useState<AdminBillReport[]>([])
  const [billReportsLoading, setBillReportsLoading] = useState(false)
  const [selectedReport, setSelectedReport]     = useState<AdminBillReport | null>(null)
  const [reportAnalysis, setReportAnalysis]     = useState<BillAnalysisResult | null>(null)
  const [analysisLoading, setAnalysisLoading]   = useState(false)
  // TOU comparison
  const [touCompReport, setTouCompReport]       = useState<AdminBillReport | null>(null)
  const [touCompAnalysis, setTouCompAnalysis]   = useState<BillAnalysisResult | null>(null)
  const [touCompLoading, setTouCompLoading]     = useState(false)

  // ── fetch helpers
  const fetchAddresses = useCallback(async () => {
    if (!profileId) return
    setAddrLoading(true)
    try {
      const r = await adminApi.getAdminAddresses(profileId)
      setAddresses((r.result as any)?.data ?? [])
    } finally { setAddrLoading(false) }
  }, [profileId])

  const fetchSubscriptions = useCallback(async () => {
    if (!profileId) return
    setSubLoading(true)
    try {
      const r = await adminApi.getAdminSubscriptions(profileId)
      const subs: SubRow[] = (r.result as any)?.data ?? []
      setSubscriptions(subs)

      // fetch bill reports for all subscriptions in one pass
      if (subs.length > 0) {
        setBillReportsLoading(true)
        try {
          const billResults = await Promise.all(
            subs.map(s => adminApi.getBillReports({ pageSize: 200, Search_SubscriptionId: s.id }))
          )
          const all: AdminBillReport[] = billResults.flatMap(br => (br.result as any)?.data ?? [])
          all.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || (b.month ?? 0) - (a.month ?? 0))
          setBillReports(all)
        } catch { setBillReports([]) }
        finally { setBillReportsLoading(false) }
      } else {
        setBillReports([])
      }
    } finally { setSubLoading(false) }
  }, [profileId])

  // ── on open
  useEffect(() => {
    if (!open || !profileId) return
    setTab('info')
    setCustomerInfo(null)
    setAddresses([]); setSubscriptions([]); setIdentityDocId(null)
    setBillReports([]); setSelectedReport(null); setReportAnalysis(null)
    setTouCompReport(null); setTouCompAnalysis(null)
    fetchAddresses(); fetchSubscriptions()

    const profileFetch = customerType === 'legal'
      ? adminApi.getLegalCustomerDetail(profileId)
      : adminApi.getRealCustomerDetail(profileId)
    profileFetch.then(r => { if (r.code === 200 && r.result) setCustomerInfo(r.result) })

    adminApi.getCustomerFullDetail(profileId).then((r) => {
      if (r.code === 200 && r.result) setIdentityDocId((r.result as any).identityDocFileId ?? null)
    })

    Promise.all([adminApi.getPowerEntities(), adminApi.getTouTypes()]).then(([pe, tt]) => {
      const pes = toArr(pe.result) as { id: number; name: string }[]
      const tts = toArr(tt.result) as { id: number; title: string }[]
      setTouEntities(pes)
      setTouTypes(tts)
      if (pes.length) setTouEntityId(pes[0].id)
    })

    if (!lookupsLoaded) {
      Promise.all([lookupApi.getCities(), lookupApi.getPowerEntities()]).then(([c, p]) => {
        if (c.code === 200 && Array.isArray(c.result)) setCities(c.result as IdTitle[])
        if (p.code === 200 && Array.isArray(p.result)) setPowerEntities(p.result as IdName[])
        setLookupsLoaded(true)
      })
    }
  }, [open, profileId, fetchAddresses, fetchSubscriptions, lookupsLoaded])

  // ── auto-select TOU entity from address
  useEffect(() => {
    if (!addresses.length || !touEntities.length) return
    const name  = addresses[0]?.powerEntity
    const match = touEntities.find(e => e.name === name)
    if (match) setTouEntityId(match.id)
  }, [addresses, touEntities])

  // ── fetch bill reports: once subscriptions are loaded, query per subscription
  useEffect(() => {
    if (!open) return
    if (subscriptions.length === 0) {
      // still loading or genuinely empty — clear and wait
      setBillReports([])
      return
    }
    setBillReportsLoading(true)
    Promise.all(
      subscriptions.map(s =>
        adminApi.getBillReports({ pageSize: 100, Search_SubscriptionId: s.id })
      )
    ).then(results => {
      const all: AdminBillReport[] = results.flatMap(r => (r.result as any)?.data ?? [])
      all.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || (b.month ?? 0) - (a.month ?? 0))
      setBillReports(all)
    }).catch(() => setBillReports([]))
    .finally(() => setBillReportsLoading(false))
  }, [open, subscriptions])

  // ── open bill report detail
  const openReportDetail = async (report: AdminBillReport) => {
    setSelectedReport(report)
    setReportAnalysis(null)
    setAnalysisLoading(true)
    try {
      const res = await adminApi.adminBillAnalysis({
        subscriptionId: report.subscriptionId,
        year: report.year ?? 0, month: report.month ?? 0,
        peakKwh: report.peakCons ?? 0, midKwh: report.midCons ?? 0,
        lowKwh: report.lowCons ?? 0, fridayPeakKwh: 0,
      })
      if (res.code === 200 && res.result) setReportAnalysis(res.result as BillAnalysisResult)
      else toast.error(res.message ?? res.caption ?? 'خطا در بارگذاری جزئیات')
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setAnalysisLoading(false) }
  }

  // ── TOU comparison: load analysis for selected report
  const loadTouComp = async (report: AdminBillReport) => {
    setTouCompReport(report)
    setTouCompAnalysis(null)
    setTouCompLoading(true)
    try {
      const res = await adminApi.adminBillAnalysis({
        subscriptionId: report.subscriptionId,
        year: report.year ?? 0, month: report.month ?? 0,
        peakKwh: report.peakCons ?? 0, midKwh: report.midCons ?? 0,
        lowKwh: report.lowCons ?? 0, fridayPeakKwh: 0,
      })
      if (res.code === 200 && res.result) setTouCompAnalysis(res.result as BillAnalysisResult)
    } finally { setTouCompLoading(false) }
  }

  // ── load TOU schedule
  useEffect(() => {
    if (!touEntityId) return
    setTouLoading(true)
    adminApi.getMonthSchedule(touEntityId, touMonth)
      .then(r => {
        const hours = toArr(r.result) as HourEntry[]
        const s: Record<number, number> = {}
        hours.forEach(h => { s[h.hourNumber] = h.toutypeId })
        setTouSchedule(s)
      })
      .finally(() => setTouLoading(false))
  }, [touEntityId, touMonth])

  // ── address CRUD
  const openCreateAddr = () => { setAddrForm(emptyAddr); setAddrModal('create') }
  const openEditAddr   = async (row: AddressRow) => {
    try { const r = await adminApi.getAdminAddressDetail(row.id); setAddrForm(r.result ?? { ...emptyAddr, id: row.id }) }
    catch { setAddrForm({ ...emptyAddr, id: row.id }) }
    setAddrModal('edit')
  }
  const openDeleteAddr = (row: AddressRow) =>
    { setAddrForm({ ...emptyAddr, id: row.id, mainAddress: row.mainAddress }); setAddrModal('delete') }

  const handleSaveAddr = async () => {
    if (!addrForm.cityId || !addrForm.powerEntityId || !addrForm.mainAddress || !addrForm.postalCode) {
      toast.error('همه فیلدها الزامی هستند'); return
    }
    setAddrSaving(true)
    try {
      const res = addrModal === 'create'
        ? await adminApi.createAdminAddress(profileId!, { postalCode: addrForm.postalCode, mainAddress: addrForm.mainAddress, cityId: addrForm.cityId, powerEntityId: addrForm.powerEntityId })
        : await adminApi.updateAdminAddress({ ...addrForm, customerProfileId: profileId! })
      if (res.code === 200) {
        toast.success(addrModal === 'create' ? 'آدرس ثبت شد' : 'آدرس ویرایش شد')
        setAddrModal(null); fetchAddresses()
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setAddrSaving(false) }
  }

  const handleDeleteAddr = async () => {
    setAddrSaving(true)
    try {
      const res = await adminApi.deleteAdminAddress(addrForm.id)
      if (res.code === 200) { toast.success('آدرس حذف شد'); setAddrModal(null); fetchAddresses() }
      else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setAddrSaving(false) }
  }

  // ── subscription CRUD
  const openCreateSub = () => { setSubForm(emptySub); setSubModal('create') }
  const openDeleteSub = (row: SubRow) =>
    { setSubForm({ ...emptySub, id: row.id, billIdentifier: row.billIdentifier }); setSubModal('delete') }

  const handleSaveSub = async () => {
    if (!subForm.addressId || !subForm.billIdentifier) { toast.error('آدرس و شناسه قبض الزامی است'); return }
    if (!/^\d{13}$/.test(subForm.billIdentifier)) { toast.error('شناسه قبض باید دقیقاً ۱۳ رقم باشد'); return }
    if (!validateBillIdentifier(subForm.billIdentifier)) { toast.error('شناسه قبض معتبر نیست (رقم کنترل اشتباه است)'); return }
    setSubSaving(true)
    try {
      const res = await adminApi.createAdminSubscription(subForm)
      if (res.code === 200) { toast.success('شناسه ثبت شد'); setSubModal(null); fetchSubscriptions() }
      else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSubSaving(false) }
  }

  const handleDeleteSub = async () => {
    setSubSaving(true)
    try {
      const res = await adminApi.deleteAdminSubscription(subForm.id)
      if (res.code === 200) { toast.success('شناسه حذف شد'); setSubModal(null); fetchSubscriptions() }
      else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSubSaving(false) }
  }

  if (!open) return null

  // ── sidebar tabs config
  const TABS: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'info',          label: 'اطلاعات',    icon: User2 },
    { key: 'addresses',     label: 'آدرس‌ها',    icon: MapPin,    count: addresses.length },
    { key: 'subscriptions', label: 'شناسه‌ها',   icon: Zap,       count: subscriptions.length },
    { key: 'tou',           label: 'برنامه TOU', icon: Clock },
    { key: 'bill',          label: 'تحلیل قبض',  icon: BarChart3 },
    { key: 'documents',     label: 'مدارک',       icon: FileText },
  ]

  const infoRow = (label: string, value: any) =>
    value ? (
      <div key={label} className="rounded-xl px-4 py-3"
        style={{ background: 'rgba(236,253,245,0.5)', border: '1px solid rgba(209,250,229,0.5)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-gray-900">{String(value)}</p>
      </div>
    ) : null

  const info = customerInfo as any

  return (
    <>
      <Modal open={open} onClose={onClose} title={`پروفایل — ${customerTitle}`} size="2xl" noPadding>
        <div className="flex" style={{ height: 'calc(82vh - 60px)', direction: 'rtl' }}>

          {/* ── Right sidebar: vertical tabs */}
          <div className="w-44 shrink-0 border-l border-gray-100 bg-gray-50/80 p-2 space-y-0.5 overflow-y-auto">
            {TABS.map(({ key, label, icon: Icon, count }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-right ${
                  tab === key
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                }`}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {count !== undefined && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    tab === key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>{count}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Left content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* ── INFO TAB */}
            {tab === 'info' && (
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">اطلاعات مشتری</p>
                {!info ? (
                  <div className="py-10 text-center text-sm text-gray-400">در حال بارگذاری...</div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {infoRow('نام شرکت',       info.companyName)}
                    {infoRow('نام و نام خانوادگی', info.fullName ?? (info.firstName && info.lastName ? `${info.firstName} ${info.lastName}` : null))}
                    {infoRow('نام مدیرعامل',   info.ceoFullName)}
                    {infoRow('کد ملی مدیرعامل', info.ceoNationalId)}
                    {infoRow('شناسه ملی',       info.nationalId)}
                    {infoRow('کد ملی',          info.nationalCode)}
                    {infoRow('شماره ثبت شرکت',  info.registerNumber)}
                    {infoRow('موبایل',          info.ceoMobile ?? info.mobile)}
                    {infoRow('کد اقتصادی',      info.economicCode)}
                    {info.gazetteDate && infoRow('تاریخ آگهی روزنامه', new Date(info.gazetteDate).toLocaleDateString('fa-IR'))}
                    {infoRow('وضعیت', info.isActive === true ? 'فعال' : info.isActive === false ? 'غیرفعال' : null)}
                  </div>
                )}
              </div>
            )}

            {/* ── ADDRESSES TAB */}
            {tab === 'addresses' && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button size="sm" onClick={openCreateAddr}><Plus className="h-4 w-4" /> آدرس جدید</Button>
                </div>
                {addrLoading ? (
                  <div className="py-8 text-center text-sm text-gray-400">در حال بارگذاری...</div>
                ) : addresses.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-400">
                    <MapPin className="mx-auto mb-2 h-8 w-8 opacity-30" />آدرسی ثبت نشده
                  </div>
                ) : (
                  <div className="space-y-2">
                    {addresses.map(a => (
                      <div key={a.id}
                        className="flex items-center justify-between rounded-xl px-4 py-3"
                        style={{ background: 'rgba(236,253,245,0.5)', border: '1px solid rgba(209,250,229,0.6)' }}>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-800">{a.mainAddress}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {a.province} — {a.city} | کد پستی: {a.postalCode}
                            {a.powerEntity && <span className="mr-2 font-medium text-emerald-600">| {a.powerEntity}</span>}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button onClick={() => openEditAddr(a)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => openDeleteAddr(a)}
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

            {/* ── SUBSCRIPTIONS TAB */}
            {tab === 'subscriptions' && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button size="sm" onClick={openCreateSub}><Plus className="h-4 w-4" /> شناسه جدید</Button>
                </div>
                {subLoading ? (
                  <div className="py-8 text-center text-sm text-gray-400">در حال بارگذاری...</div>
                ) : subscriptions.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-400">
                    <Zap className="mx-auto mb-2 h-8 w-8 opacity-30" />شناسه‌ای ثبت نشده
                  </div>
                ) : (
                  <div className="space-y-2">
                    {subscriptions.map(s => (
                      <div key={s.id}
                        className="flex items-center justify-between rounded-xl px-4 py-3"
                        style={{ background: 'rgba(236,253,245,0.5)', border: '1px solid rgba(209,250,229,0.6)' }}>
                        <div>
                          <p className="font-mono text-sm font-semibold text-gray-800">{s.billIdentifier}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{s.mainAddress || s.city}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {s.contractCapacityKw != null && <Badge variant="blue">{s.contractCapacityKw} kW</Badge>}
                          <button onClick={() => openDeleteSub(s)}
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

            {/* ── TOU TAB */}
            {tab === 'tou' && (() => {
              const monthReports = billReports.filter(r => r.month === touMonth)
              return (
                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">برنامه زمان‌بندی TOU + مقایسه مصرف</p>

                  {/* Selectors */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">شرکت برق</label>
                      <select value={touEntityId} onChange={e => setTouEntityId(+e.target.value)}
                        className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100">
                        {touEntities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">ماه</label>
                      <select value={touMonth} onChange={e => { setTouMonth(+e.target.value); setTouCompReport(null); setTouCompAnalysis(null) }}
                        className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100">
                        {JALALI_MONTHS.slice(1).map((name, i) => <option key={i+1} value={i+1}>{name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* 24-hour chart */}
                  <div className="rounded-2xl p-4"
                    style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(209,250,229,0.6)' }}>
                    <p className="mb-3 text-sm font-semibold text-gray-700">نمودار ۲۴ ساعته — {JALALI_MONTHS[touMonth]}</p>
                    {touLoading ? (
                      <div className="flex h-14 items-center justify-center">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                      </div>
                    ) : (
                      <TouDayChart schedule={touSchedule} touTypes={touTypes} />
                    )}
                  </div>

                  {/* Hour count table */}
                  {!touLoading && touTypes.length > 0 && (
                    <div className="rounded-2xl overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(209,250,229,0.6)' }}>
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <p className="text-xs font-semibold text-gray-700">تفکیک ساعات در ماه {JALALI_MONTHS[touMonth]}</p>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {touTypes.map(type => {
                          const cnt = Object.values(touSchedule).filter(id => id === type.id).length
                          if (cnt === 0) return null
                          const color = touColor(type.title)
                          return (
                            <div key={type.id} className="flex items-center justify-between px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-sm" style={{ background: color }} />
                                <span className="text-sm font-medium text-gray-700">{type.title}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="h-2 w-32 rounded-full bg-gray-100 overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${(cnt / 24) * 100}%`, background: color }} />
                                </div>
                                <span className="w-16 text-sm font-bold text-gray-900">{cnt} ساعت</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Compare with a bill from this month */}
                  <div className="rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(147,197,253,0.35)' }}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-blue-50/50">
                      <p className="text-xs font-semibold text-blue-700">مقایسه با مصرف واقعی مشتری</p>
                      {monthReports.length > 0 && (
                        <select
                          value={touCompReport?.id ?? ''}
                          onChange={e => {
                            const r = monthReports.find(x => x.id === +e.target.value)
                            if (r) loadTouComp(r); else { setTouCompReport(null); setTouCompAnalysis(null) }
                          }}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none">
                          <option value="">انتخاب قبض...</option>
                          {monthReports.map(r => (
                            <option key={r.id} value={r.id}>
                              {JALALI_MONTHS[r.month ?? 0]} {r.year} — {r.billIdentifier}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    {monthReports.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs text-gray-400">هیچ تحلیل قبضی برای ماه {JALALI_MONTHS[touMonth]} ثبت نشده</p>
                    ) : !touCompReport ? (
                      <p className="px-4 py-6 text-center text-xs text-gray-400">یک قبض از لیست بالا انتخاب کنید</p>
                    ) : touCompLoading ? (
                      <div className="flex h-20 items-center justify-center">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                      </div>
                    ) : touCompAnalysis ? (
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                          {[
                            { label: 'ساعات اوج',  value: `${touCompAnalysis.peakHoursPerDay} ساعت/روز`,  color: '#ef4444' },
                            { label: 'ساعات میان', value: `${touCompAnalysis.midHoursPerDay} ساعت/روز`,   color: '#f59e0b' },
                            { label: 'ساعات کم',   value: `${touCompAnalysis.lowHoursPerDay} ساعت/روز`,   color: '#10b981' },
                            { label: 'مصرف کل',   value: kwh(touCompAnalysis.totalConsumption), color: '#6366f1' },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="rounded-lg p-2.5" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
                              <p className="text-gray-500">{label}</p>
                              <p className="mt-0.5 font-bold" style={{ color }}>{value}</p>
                            </div>
                          ))}
                        </div>
                        <TouBillChart bands={touCompAnalysis.bands} />
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })()}

            {/* ── BILL TAB */}
            {tab === 'bill' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">تاریخچه تحلیل قبض</p>
                  {billReports.length > 0 && (
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                      {billReports.length} گزارش
                    </span>
                  )}
                </div>

                {billReportsLoading ? (
                  <div className="flex h-32 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                  </div>
                ) : billReports.length === 0 ? (
                  <div className="py-16 text-center rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(209,250,229,0.6)' }}>
                    <BarChart3 className="mx-auto mb-2 h-10 w-10 text-gray-200" />
                    <p className="text-sm text-gray-400">هیچ تحلیل قبضی برای این مشتری ثبت نشده</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {billReports.map(report => {
                      const isSelected = selectedReport?.id === report.id
                      const sub = subscriptions.find(s => s.id === report.subscriptionId)
                      const saving = report.netSaving ?? 0
                      return (
                        <div key={report.id} className="overflow-hidden rounded-2xl"
                          style={{ border: isSelected ? '2px solid #10b981' : '1px solid rgba(209,250,229,0.6)', background: 'rgba(255,255,255,0.95)' }}>
                          {/* Report header row */}
                          <button
                            onClick={() => isSelected ? setSelectedReport(null) : openReportDetail(report)}
                            className="flex w-full items-start justify-between gap-3 px-4 py-3 text-right transition-colors hover:bg-emerald-50/40">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <BarChart3 className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900">
                                  {JALALI_MONTHS[report.month ?? 0]} {report.year}
                                </p>
                                <p className="font-mono text-xs text-gray-400 truncate">
                                  {sub?.billIdentifier ?? report.billIdentifier}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                              <div className="text-left">
                                <p className="text-[10px] text-gray-400">صرفه‌جویی</p>
                                <p className={`text-sm font-bold ${saving > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                                  {saving > 0 ? rial(saving) : '—'}
                                </p>
                              </div>
                              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                            </div>
                          </button>

                          {/* Consumption summary chips */}
                          <div className="flex flex-wrap gap-1.5 px-4 pb-2.5 pt-0">
                            {[
                              { label: 'اوج', value: report.peakCons, color: '#ef4444' },
                              { label: 'میان', value: report.midCons, color: '#f59e0b' },
                              { label: 'کم', value: report.lowCons, color: '#10b981' },
                            ].map(({ label, value, color }) => value != null ? (
                              <span key={label} className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                                style={{ background: color }}>
                                {label}: {value.toLocaleString('fa-IR')} kWh
                              </span>
                            ) : null)}
                            {report.costWithMatin != null && (
                              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                                با متین: {rial(report.costWithMatin)}
                              </span>
                            )}
                          </div>

                          {/* Expanded analysis detail */}
                          {isSelected && (
                            <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                              {analysisLoading ? (
                                <div className="flex h-20 items-center justify-center">
                                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                                </div>
                              ) : reportAnalysis ? (
                                <div className="space-y-4">
                                  {/* Financial summary */}
                                  <div className="grid grid-cols-3 gap-2">
                                    {[
                                      { label: 'بدون متین', value: reportAnalysis.withoutMatinBillRial, cls: 'border-red-200 bg-red-50', txt: 'text-red-700', bar: 'bg-red-400' },
                                      { label: 'با متین',   value: reportAnalysis.withMatinBillRial,    cls: 'border-blue-200 bg-blue-50', txt: 'text-blue-700', bar: 'bg-blue-400' },
                                      { label: 'صرفه‌جویی', value: reportAnalysis.savingRial,           cls: 'border-emerald-200 bg-emerald-50', txt: 'text-emerald-700', bar: 'bg-emerald-400' },
                                    ].map(({ label, value, cls, txt, bar }) => {
                                      const mx = Math.max(reportAnalysis.withoutMatinBillRial, reportAnalysis.withMatinBillRial, 1)
                                      return (
                                        <div key={label} className={`rounded-xl border p-3 ${cls}`}>
                                          <p className={`text-xs ${txt.replace('700','500')}`}>{label}</p>
                                          <p className={`mt-0.5 text-sm font-bold ${txt}`}>{rial(value)}</p>
                                          <div className="mt-1 h-1.5 rounded-full bg-white/60 overflow-hidden">
                                            <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min((value/mx)*100,100)}%` }} />
                                          </div>
                                          {label === 'صرفه‌جویی' && (
                                            <p className={`mt-0.5 text-xs font-semibold ${txt}`}>{reportAnalysis.savingPercent.toFixed(1)}٪</p>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>

                                  {/* TOU info */}
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-600">اوج {reportAnalysis.peakHoursPerDay} ساعت/روز</span>
                                    <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-600">میان {reportAnalysis.midHoursPerDay} ساعت/روز</span>
                                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-600">کم {reportAnalysis.lowHoursPerDay} ساعت/روز</span>
                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-600">مصرف کل {kwh(reportAnalysis.totalConsumption)}</span>
                                  </div>

                                  {/* Band chart */}
                                  <TouBillChart bands={reportAnalysis.bands} />

                                  {/* Article 16 + fuel */}
                                  {(reportAnalysis.article16Rial > 0 || reportAnalysis.fuelFeeRial > 0) && (
                                    <div className="flex gap-2">
                                      {reportAnalysis.article16Rial > 0 && (
                                        <div className="flex-1 rounded-xl p-2.5" style={{ background: 'rgba(239,246,255,0.8)', border: '1px solid rgba(147,197,253,0.4)' }}>
                                          <p className="text-xs text-blue-500">ماده ۱۶</p>
                                          <p className="font-bold text-blue-700">{rial(reportAnalysis.article16Rial)}</p>
                                        </div>
                                      )}
                                      {reportAnalysis.fuelFeeRial > 0 && (
                                        <div className="flex-1 rounded-xl p-2.5" style={{ background: 'rgba(255,251,235,0.8)', border: '1px solid rgba(253,230,138,0.4)' }}>
                                          <p className="text-xs text-amber-500">هزینه سوخت</p>
                                          <p className="font-bold text-amber-700">{rial(reportAnalysis.fuelFeeRial)}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── DOCUMENTS TAB */}
            {tab === 'documents' && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">مدارک شناسایی</p>
                {identityDocId ? (
                  <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: 'rgba(236,253,245,0.5)', border: '1px solid rgba(209,250,229,0.6)' }}>
                    <FileText className="h-5 w-5 shrink-0 text-emerald-500" />
                    <span className="flex-1 text-sm text-gray-700">مدرک شناسایی بارگذاری شده است</span>
                    <button
                      onClick={() => uploadApi.download(identityDocId).catch(() => {})}
                      className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
                      <Download className="h-3.5 w-3.5" /> دانلود
                    </button>
                  </div>
                ) : (
                  <div className="py-10 text-center text-sm text-gray-400">
                    <FileText className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    مدرک شناسایی بارگذاری نشده است
                  </div>
                )}
              </div>
            )}

          </div>{/* /content */}
        </div>{/* /flex */}
      </Modal>

      {/* ── Address modals */}
      <Modal open={addrModal === 'create' || addrModal === 'edit'} onClose={() => setAddrModal(null)}
        title={addrModal === 'create' ? 'آدرس جدید' : 'ویرایش آدرس'} size="md">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="شهر *" value={addrForm.cityId ?? 0}
            options={cities.map(c => ({ value: c.id, label: c.title }))}
            onChange={v => setAddrForm({ ...addrForm, cityId: +v })} />
          <Select label="شرکت برق *" value={addrForm.powerEntityId ?? 0}
            options={powerEntities.map(p => ({ value: p.id, label: p.province ? `${p.name} — ${p.province}` : p.name }))}
            onChange={v => setAddrForm({ ...addrForm, powerEntityId: +v })} />
          <div className="sm:col-span-2">
            <Input label="آدرس *" value={addrForm.mainAddress}
              onChange={e => setAddrForm({ ...addrForm, mainAddress: e.target.value })} placeholder="آدرس کامل" />
          </div>
          <Input label="کد پستی *" value={addrForm.postalCode}
            onChange={e => setAddrForm({ ...addrForm, postalCode: e.target.value })}
            placeholder="۱۰ رقم" maxLength={10} inputMode="numeric" />
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setAddrModal(null)}>انصراف</Button>
          <Button loading={addrSaving} onClick={handleSaveAddr}>
            {addrModal === 'create' ? 'ثبت آدرس' : 'ذخیره تغییرات'}
          </Button>
        </div>
      </Modal>

      <Modal open={addrModal === 'delete'} onClose={() => setAddrModal(null)} title="حذف آدرس" size="sm">
        <p className="text-sm text-gray-600">
          آیا از حذف آدرس <span className="font-bold text-gray-900">«{addrForm.mainAddress}»</span> اطمینان دارید؟
        </p>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setAddrModal(null)}>انصراف</Button>
          <Button variant="danger" loading={addrSaving} onClick={handleDeleteAddr}><Trash2 className="h-4 w-4" /> حذف</Button>
        </div>
      </Modal>

      {/* ── Subscription modals */}
      <Modal open={subModal === 'create'} onClose={() => setSubModal(null)} title="شناسه جدید" size="md">
        <div className="space-y-4">
          <Select label="آدرس *" value={subForm.addressId} placeholder="انتخاب آدرس"
            options={addresses.map(a => ({ value: a.id, label: a.mainAddress }))}
            onChange={v => setSubForm({ ...subForm, addressId: +v })} />
          <Input label="شناسه قبض *" value={subForm.billIdentifier}
            onChange={e => setSubForm({ ...subForm, billIdentifier: e.target.value.replace(/\D/g, '') })}
            placeholder="۱۳ رقم" maxLength={13} inputMode="numeric" />
          <Input label="ظرفیت قرارداد (kW)" type="number" value={subForm.contractCapacityKw ?? ''}
            onChange={e => setSubForm({ ...subForm, contractCapacityKw: e.target.value === '' ? null : +e.target.value })}
            placeholder="مثلاً ۵۰۰" />
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setSubModal(null)}>انصراف</Button>
          <Button loading={subSaving} onClick={handleSaveSub}>ثبت شناسه</Button>
        </div>
      </Modal>

      <Modal open={subModal === 'delete'} onClose={() => setSubModal(null)} title="حذف شناسه" size="sm">
        <p className="text-sm text-gray-600">
          آیا از حذف شناسه <span className="font-bold text-gray-900">«{subForm.billIdentifier}»</span> اطمینان دارید؟
        </p>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setSubModal(null)}>انصراف</Button>
          <Button variant="danger" loading={subSaving} onClick={handleDeleteSub}><Trash2 className="h-4 w-4" /> حذف</Button>
        </div>
      </Modal>
    </>
  )
}
