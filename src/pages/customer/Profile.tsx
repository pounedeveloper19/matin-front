import { useEffect, useState } from 'react'
import { User, MapPin, UserCog, Building2, Pencil, Plus, Zap, ShieldCheck, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { customerApi } from '../../api/customer'
import { lookupApi } from '../../api/lookup'
import type { IdTitle, IdName } from '../../api/lookup'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input, { Select } from '../../components/ui/Input'
import FileUpload from '../../components/ui/FileUpload'
import type {
  AddressResult, CustomerAgent, CustomerReal, CustomerLegal,
  SubscriptionResult, AddSubscriptionRequest,
} from '../../types'

type ProfileData =
  | ({ type: 'real' } & CustomerReal)
  | ({ type: 'legal' } & CustomerLegal)

export default function CustomerProfile() {
  const [profile, setProfile]             = useState<ProfileData | null>(null)
  const [addresses, setAddresses]         = useState<AddressResult[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionResult[]>([])
  const [agent, setAgent]                 = useState<CustomerAgent | null>(null)
  const [identityDocFileId, setIdentityDocFileId] = useState<string | null>(null)
  const [loading, setLoading]             = useState(true)
  const [saving, setSaving]               = useState(false)
  const [cities, setCities]               = useState<IdTitle[]>([])
  const [powerEntities, setPowerEntities] = useState<IdName[]>([])
  const [lookupsLoading, setLookupsLoading] = useState(true)

  // modals
  const [editModal, setEditModal]         = useState(false)
  const [addrModal, setAddrModal]         = useState(false)
  const [deleteAddrId, setDeleteAddrId]   = useState<number | null>(null)
  const [agentModal, setAgentModal]       = useState(false)
  const [subModal, setSubModal]           = useState(false)

  // form states
  const [realForm, setRealForm]   = useState<CustomerReal>({ firstName: '', lastName: '', nationalCode: '', mobile: '' })
  const [legalForm, setLegalForm] = useState<CustomerLegal>({ companyName: '', nationalId: '', economicCode: '', ceo_FullName: '', ceo_Mobile: '' })
  const [addrForm, setAddrForm]   = useState({ customerProfileId: 0, powerEntityId: 0, cityId: 0, mainAddress: '', postalCode: '' })
  const [agentForm, setAgentForm] = useState<CustomerAgent>({ customerProfileId: 0, fullName: '', mobile: '', password: '' })
  const [subForm, setSubForm]     = useState<AddSubscriptionRequest>({ addressId: 0, billIdentifier: '', contractCapacityKw: null })

  const loadAll = async () => {
    setLoading(true)
    try {
      const [c, a, s, ag, meta] = await Promise.allSettled([
        customerApi.getCustomer(),
        customerApi.getAddresses(),
        customerApi.getSubscriptions(),
        customerApi.getAgent(),
        customerApi.getProfileMeta(),
      ])

      const toArr = (v: any): any[] =>
        Array.isArray(v) ? v : (v?.$values ?? [])

      if (c.status === 'fulfilled') {
        const r = c.value
        if (r.code === 200 && r.result) {
          const raw: any = r.result
          if (raw.type === 'real') {
            const p: CustomerReal = {
              firstName: raw.firstName ?? '',
              lastName: raw.lastName ?? '',
              nationalCode: raw.nationalCode ?? '',
              mobile: raw.mobile ?? '',
            }
            setProfile({ type: 'real', ...p })
            setRealForm(p)
          } else if (raw.type === 'legal') {
            const p: CustomerLegal = {
              companyName: raw.companyName ?? '',
              nationalId: raw.nationalId ?? '',
              economicCode: raw.economicCode ?? '',
              ceo_FullName: raw.ceo_FullName ?? '',
              ceo_Mobile: raw.ceo_Mobile ?? '',
            }
            setProfile({ type: 'legal', ...p })
            setLegalForm(p)
          } else {
            toast.error('نوع پروفایل قابل تشخیص نیست')
          }
        } else if (r.code !== 200) {
          toast.error(r.message ?? r.caption ?? 'خطا در دریافت اطلاعات پروفایل')
        }
      } else {
        toast.error('خطا در ارتباط با سرور هنگام دریافت پروفایل')
      }

      if (a.status === 'fulfilled' && a.value.code === 200)
        setAddresses(toArr(a.value.result))
      if (s.status === 'fulfilled' && s.value.code === 200)
        setSubscriptions(toArr(s.value.result))
      if (ag.status === 'fulfilled' && ag.value.code === 200 && ag.value.result)
        setAgent(ag.value.result as CustomerAgent)
      if (meta.status === 'fulfilled' && meta.value.code === 200 && meta.value.result)
        setIdentityDocFileId((meta.value.result as any).identityDocFileId ?? null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    Promise.all([lookupApi.getCities(), lookupApi.getPowerEntities()])
      .then(([c, p]) => {
        if (c.code === 200 && Array.isArray(c.result)) setCities(c.result as IdTitle[])
        if (p.code === 200 && Array.isArray(p.result)) setPowerEntities(p.result as IdName[])
      })
      .finally(() => setLookupsLoading(false))
  }, [])

  // ─── ویرایش پروفایل ──────────────────────────────────────────
  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = profile?.type === 'real'
        ? await customerApi.updateReal(realForm)
        : await customerApi.updateLegal(legalForm)
      if (res.code === 200) {
        toast.success('اطلاعات بروز شد')
        setEditModal(false)
        loadAll()
      } else {
        toast.error(res.message ?? res.caption ?? 'خطا در ذخیره')
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  // ─── حذف آدرس ────────────────────────────────────────────────
  const handleDeleteAddress = async () => {
    if (!deleteAddrId) return
    setSaving(true)
    try {
      const res = await customerApi.deleteAddress(deleteAddrId)
      if (res.code === 200) {
        toast.success('آدرس حذف شد')
        setDeleteAddrId(null)
        const updated = await customerApi.getAddresses()
        if (updated.code === 200 && Array.isArray(updated.result)) setAddresses(updated.result)
      } else {
        toast.error(res.message ?? res.caption ?? 'خطا در حذف آدرس')
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  // ─── افزودن آدرس ─────────────────────────────────────────────
  const handleAddAddress = async () => {
    if (!addrForm.mainAddress || !addrForm.postalCode) {
      toast.error('آدرس و کد پستی را وارد کنید')
      return
    }
    setSaving(true)
    try {
      const res = await customerApi.addAddress(addrForm)
      if (res.code === 200) {
        toast.success('آدرس اضافه شد')
        setAddrModal(false)
        setAddrForm({ customerProfileId: 0, powerEntityId: 0, cityId: 0, mainAddress: '', postalCode: '' })
        const updated = await customerApi.getAddresses()
        if (updated.code === 200 && Array.isArray(updated.result)) setAddresses(updated.result)
      } else {
        toast.error(res.message ?? res.caption ?? 'خطا در ثبت آدرس')
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  // ─── ثبت اشتراک ──────────────────────────────────────────────
  const handleAddSubscription = async () => {
    if (!subForm.addressId) { toast.error('یک آدرس انتخاب کنید'); return }
    if (!subForm.billIdentifier.trim()) { toast.error('شناسه قبض را وارد کنید'); return }
    setSaving(true)
    try {
      const res = await customerApi.addSubscription(subForm)
      if (res.code === 200) {
        toast.success('اشتراک ثبت شد')
        setSubModal(false)
        setSubForm({ addressId: 0, billIdentifier: '', contractCapacityKw: null })
        const updated = await customerApi.getSubscriptions()
        if (updated.code === 200 && Array.isArray(updated.result)) setSubscriptions(updated.result)
      } else {
        toast.error(res.message ?? res.caption ?? 'خطا در ثبت اشتراک')
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  // ─── ثبت / ویرایش نماینده ────────────────────────────────────
  const handleSaveAgent = async () => {
    if (!agentForm.fullName || !agentForm.mobile) {
      toast.error('نام و موبایل نماینده را وارد کنید')
      return
    }
    setSaving(true)
    try {
      const res = await customerApi.registerAgent(agentForm)
      if (res.code === 200) {
        toast.success('نماینده ثبت شد')
        setAgentModal(false)
        const updated = await customerApi.getAgent()
        if (updated.code === 200 && updated.result) setAgent(updated.result as CustomerAgent)
      } else {
        toast.error(res.message ?? res.caption ?? 'خطا در ثبت نماینده')
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  // ─── آپلود مدرک شناسایی ──────────────────────────────────────
  const handleIdentityUploaded = async (fileId: string) => {
    try {
      const res = await customerApi.updateIdentityDoc(fileId)
      if (res.code === 200) {
        setIdentityDocFileId(fileId)
        toast.success('مدرک شناسایی ثبت شد')
      } else {
        toast.error(res.message ?? res.caption ?? 'خطا در ثبت مدرک')
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
  }

  const handleIdentityDeleted = async () => {
    try {
      await customerApi.updateIdentityDoc(null)
      setIdentityDocFileId(null)
    } catch { /* silent */ }
  }

  // ─── render helpers ───────────────────────────────────────────
  const isLegal = profile?.type === 'legal'

  const profileRows = profile
    ? profile.type === 'real'
      ? [
          { label: 'نام',          value: profile.firstName },
          { label: 'نام خانوادگی', value: profile.lastName },
          { label: 'کد ملی',       value: profile.nationalCode },
          { label: 'موبایل',       value: profile.mobile },
        ]
      : [
          { label: 'نام شرکت',        value: profile.companyName },
          { label: 'شناسه ملی',       value: profile.nationalId },
          { label: 'کد اقتصادی',      value: profile.economicCode },
          { label: 'نام مدیرعامل',    value: profile.ceo_FullName },
          { label: 'موبایل مدیرعامل', value: profile.ceo_Mobile },
        ]
    : []

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ─── اطلاعات پروفایل ─── */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              {isLegal ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {profile ? (isLegal ? 'اطلاعات شرکت' : 'اطلاعات فردی') : 'پروفایل کاربری'}
              </h3>
              <p className="text-xs text-gray-400">
                {profile ? (isLegal ? 'مشتری حقوقی' : 'مشتری حقیقی') : ''}
              </p>
            </div>
          </div>
          {profile && (
            <Button variant="secondary" size="sm" onClick={() => setEditModal(true)}>
              <Pencil className="h-3.5 w-3.5" /> ویرایش
            </Button>
          )}
        </div>

        {profile ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {profileRows.map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="mt-0.5 text-sm font-medium text-gray-900">{value || '—'}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-5 text-center">
            <p className="text-sm text-gray-400">اطلاعات پروفایل یافت نشد. جهت تکمیل با پشتیبانی تماس بگیرید.</p>
          </div>
        )}
      </Card>

      {/* ─── مدارک شناسایی ─── */}
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">مدارک شناسایی</h3>
            <p className="text-xs text-gray-400">تصویر کارت ملی یا شناسنامه / اساسنامه شرکت</p>
          </div>
        </div>
        <FileUpload
          label="بارگذاری مدرک"
          fileId={identityDocFileId}
          accept="image/*,.pdf"
          onUploaded={handleIdentityUploaded}
          onDeleted={handleIdentityDeleted}
        />
      </Card>

      {/* ─── آدرس‌ها ─── */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-gray-900">
              آدرس‌ها
              {addresses.length > 0 && (
                <span className="mr-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600">{addresses.length}</span>
              )}
            </h3>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setAddrModal(true)}>
            <Plus className="h-3.5 w-3.5" /> افزودن آدرس
          </Button>
        </div>

        {addresses.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">هنوز آدرسی ثبت نشده است</p>
        ) : (
          <div className="space-y-3">
            {addresses.map((a) => (
              <div key={a.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.mainAddress}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {a.provinceTitle} / {a.cityTitle}
                      {a.postalCode && <> · کد پستی: {a.postalCode}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700 font-medium">
                      {a.powerEntityName}
                    </span>
                    <button
                      onClick={() => setDeleteAddrId(a.id)}
                      className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="حذف آدرس"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ─── اشتراک‌ها ─── */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                اشتراک‌های برق
                {subscriptions.length > 0 && (
                  <span className="mr-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-600">{subscriptions.length}</span>
                )}
              </h3>
              <p className="text-xs text-gray-400">هر آدرس می‌تواند چند اشتراک داشته باشد</p>
            </div>
          </div>
          <Button
            variant="secondary" size="sm"
            onClick={() => {
              setSubForm({ addressId: addresses[0]?.id ?? 0, billIdentifier: '', contractCapacityKw: null })
              setSubModal(true)
            }}
            disabled={addresses.length === 0}
          >
            <Plus className="h-3.5 w-3.5" /> اشتراک جدید
          </Button>
        </div>

        {addresses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
            ابتدا یک آدرس ثبت کنید تا بتوانید اشتراک اضافه کنید
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-sm text-amber-700">هنوز اشتراکی ثبت نشده است</p>
            <p className="text-xs text-amber-500 mt-1">با کلیک روی «اشتراک جدید» شناسه قبض خود را ثبت کنید</p>
          </div>
        ) : (
          <div className="space-y-3">
            {subscriptions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">شناسه: {s.billIdentifier}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{s.powerEntity} · {s.mainAddress}</p>
                </div>
                {s.contractCapacityKw != null && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {s.contractCapacityKw.toLocaleString('fa-IR')} kW
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ─── نماینده ─── */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <UserCog className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">نماینده کاربری</h3>
              <p className="text-xs text-gray-400">کاربری که از طرف شما وارد سیستم می‌شود</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => {
            if (agent) setAgentForm({ customerProfileId: 0, fullName: (agent as any).fullName ?? '', mobile: (agent as any).mobile ?? '', password: '' })
            setAgentModal(true)
          }}>
            {agent ? <><Pencil className="h-3.5 w-3.5" /> ویرایش</> : <><Plus className="h-3.5 w-3.5" /> ثبت نماینده</>}
          </Button>
        </div>

        {agent ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-400">نام کامل</p>
              <p className="mt-0.5 text-sm font-medium text-gray-900">{(agent as any).fullName ?? '—'}</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-400">موبایل</p>
              <p className="mt-0.5 text-sm font-medium text-gray-900">{(agent as any).mobile ?? '—'}</p>
            </div>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-gray-400">نماینده‌ای ثبت نشده است</p>
        )}
      </Card>

      {/* ═══ مودال ویرایش پروفایل ═══ */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="ویرایش اطلاعات" size="md">
        {profile?.type === 'real' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="نام *"          value={realForm.firstName}    onChange={(e) => setRealForm({ ...realForm, firstName: e.target.value })} />
            <Input label="نام خانوادگی *" value={realForm.lastName}     onChange={(e) => setRealForm({ ...realForm, lastName: e.target.value })} />
            <Input label="کد ملی *"       value={realForm.nationalCode} onChange={(e) => setRealForm({ ...realForm, nationalCode: e.target.value })} inputMode="numeric" maxLength={10} />
            <Input label="موبایل *"       value={realForm.mobile}       onChange={(e) => setRealForm({ ...realForm, mobile: e.target.value })}       inputMode="numeric" maxLength={11} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="نام شرکت *"        value={legalForm.companyName}  onChange={(e) => setLegalForm({ ...legalForm, companyName: e.target.value })} />
            <Input label="شناسه ملی *"       value={legalForm.nationalId}   onChange={(e) => setLegalForm({ ...legalForm, nationalId: e.target.value })}  inputMode="numeric" />
            <Input label="کد اقتصادی"        value={legalForm.economicCode} onChange={(e) => setLegalForm({ ...legalForm, economicCode: e.target.value })} />
            <Input label="نام مدیرعامل *"    value={legalForm.ceo_FullName} onChange={(e) => setLegalForm({ ...legalForm, ceo_FullName: e.target.value })} />
            <Input label="موبایل مدیرعامل *" value={legalForm.ceo_Mobile}   onChange={(e) => setLegalForm({ ...legalForm, ceo_Mobile: e.target.value })}   inputMode="numeric" maxLength={11} />
          </div>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setEditModal(false)}>انصراف</Button>
          <Button loading={saving} onClick={handleSaveProfile}>ذخیره تغییرات</Button>
        </div>
      </Modal>

      {/* ═══ مودال حذف آدرس ═══ */}
      <Modal open={deleteAddrId !== null} onClose={() => setDeleteAddrId(null)} title="حذف آدرس" size="sm">
        <p className="text-sm text-gray-600 mb-5">
          آیا از حذف این آدرس اطمینان دارید؟ آدرس‌هایی که دارای انشعاب فعال هستند قابل حذف نمی‌باشند.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteAddrId(null)}>انصراف</Button>
          <Button variant="danger" loading={saving} onClick={handleDeleteAddress}>
            <Trash2 className="h-4 w-4" /> حذف
          </Button>
        </div>
      </Modal>

      {/* ═══ مودال افزودن آدرس ═══ */}
      <Modal open={addrModal} onClose={() => setAddrModal(false)} title="افزودن آدرس جدید" size="md">
        <div className="space-y-4">
          <Input
            label="آدرس کامل *"
            value={addrForm.mainAddress}
            onChange={(e) => setAddrForm({ ...addrForm, mainAddress: e.target.value })}
            placeholder="خیابان، کوچه، پلاک..."
          />
          <Input
            label="کد پستی *"
            value={addrForm.postalCode}
            onChange={(e) => setAddrForm({ ...addrForm, postalCode: e.target.value })}
            inputMode="numeric"
            maxLength={10}
            placeholder="۱۰ رقم"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="شهر"
              value={addrForm.cityId || ''}
              loading={lookupsLoading}
              options={cities.map(c => ({ value: c.id, label: c.title }))}
              onChange={(v) => setAddrForm({ ...addrForm, cityId: +v })}
            />
            <Select
              label="شرکت برق"
              value={addrForm.powerEntityId || ''}
              loading={lookupsLoading}
              options={powerEntities.map(p => ({ value: p.id, label: p.province ? `${p.name} — ${p.province}` : p.name }))}
              onChange={(v) => setAddrForm({ ...addrForm, powerEntityId: +v })}
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setAddrModal(false)}>انصراف</Button>
          <Button loading={saving} onClick={handleAddAddress}>ثبت آدرس</Button>
        </div>
      </Modal>

      {/* ═══ مودال اشتراک جدید ═══ */}
      <Modal open={subModal} onClose={() => setSubModal(false)} title="ثبت اشتراک جدید" size="sm">
        <div className="space-y-4">
          <Select
            label="آدرس مرتبط *"
            value={subForm.addressId || ''}
            options={addresses.map(a => ({ value: a.id, label: `${a.mainAddress} (${a.powerEntityName})` }))}
            onChange={(v) => setSubForm({ ...subForm, addressId: +v })}
          />
          <Input
            label="شناسه قبض (Meter ID) *"
            value={subForm.billIdentifier}
            onChange={(e) => setSubForm({ ...subForm, billIdentifier: e.target.value })}
            placeholder="شناسه روی قبض برق"
          />
          <Input
            label="قدرت قراردادی (kW)"
            type="number"
            value={subForm.contractCapacityKw ?? ''}
            onChange={(e) => setSubForm({ ...subForm, contractCapacityKw: e.target.value ? +e.target.value : null })}
            placeholder="مثال: ۵۰۰"
          />
          <p className="text-xs text-gray-400">قدرت قراردادی روی قرارداد برق شما درج شده است.</p>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setSubModal(false)}>انصراف</Button>
          <Button loading={saving} onClick={handleAddSubscription}>ثبت اشتراک</Button>
        </div>
      </Modal>

      {/* ═══ مودال نماینده ═══ */}
      <Modal open={agentModal} onClose={() => setAgentModal(false)} title={agent ? 'ویرایش نماینده' : 'ثبت نماینده'} size="sm">
        <div className="space-y-4">
          <Input label="نام کامل *"  value={agentForm.fullName} onChange={(e) => setAgentForm({ ...agentForm, fullName: e.target.value })} />
          <Input label="موبایل *"    value={agentForm.mobile}   onChange={(e) => setAgentForm({ ...agentForm, mobile: e.target.value })}   inputMode="numeric" maxLength={11} />
          <Input label="رمز عبور *"  type="password" value={agentForm.password} onChange={(e) => setAgentForm({ ...agentForm, password: e.target.value })} />
          <p className="text-xs text-gray-400">نماینده با این موبایل و رمز می‌تواند وارد سیستم شود.</p>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setAgentModal(false)}>انصراف</Button>
          <Button loading={saving} onClick={handleSaveAgent}>{agent ? 'ذخیره تغییرات' : 'ثبت نماینده'}</Button>
        </div>
      </Modal>

    </div>
  )
}
