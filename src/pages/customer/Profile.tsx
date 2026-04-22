import { useEffect, useState } from 'react'
import { User, MapPin, UserCog, Building2, Pencil, Plus, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { customerApi } from '../../api/customer'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import type { AddressResult, CustomerAgent, CustomerReal, CustomerLegal, SubscriptionResult, AddSubscriptionRequest } from '../../types'

type ProfileData =
  | ({ type: 'real' } & CustomerReal)
  | ({ type: 'legal' } & CustomerLegal)

export default function CustomerProfile() {
  const [profile, setProfile]           = useState<ProfileData | null>(null)
  const [addresses, setAddresses]       = useState<AddressResult[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionResult[]>([])
  const [agent, setAgent]               = useState<CustomerAgent | null>(null)
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)

  // modals
  const [editModal, setEditModal]   = useState(false)
  const [addrModal, setAddrModal]   = useState(false)
  const [agentModal, setAgentModal] = useState(false)
  const [subModal, setSubModal]     = useState(false)

  // form states
  const [realForm, setRealForm]   = useState<CustomerReal>({ firstName: '', lastName: '', nationalCode: '', mobile: '' })
  const [legalForm, setLegalForm] = useState<CustomerLegal>({ companyName: '', nationalId: '', economicCode: '', ceo_FullName: '', ceo_Mobile: '' })
  const [addrForm, setAddrForm]   = useState({ customerProfileId: 0, powerEntityId: 0, cityId: 0, mainAddress: '', postalCode: '' })
  const [agentForm, setAgentForm] = useState<CustomerAgent>({ customerProfileId: 0, fullName: '', mobile: '', password: '' })
  const [subForm, setSubForm]     = useState<AddSubscriptionRequest>({ addressId: 0, billIdentifier: '', contractCapacityKw: null })

  const loadAll = () => {
    setLoading(true)
    Promise.all([
      customerApi.getCustomer(),
      customerApi.getAddresses(),
      customerApi.getSubscriptions(),
      customerApi.getAgent(),
    ]).then(([c, a, s, ag]) => {
      if (c.code === 200 && c.result) {
        const raw = Array.isArray(c.result) ? c.result[0] : c.result
        if (raw && 'firstName' in raw) {
          setProfile({ type: 'real', ...(raw as CustomerReal) })
          setRealForm(raw as CustomerReal)
        } else if (raw && 'companyName' in raw) {
          setProfile({ type: 'legal', ...(raw as CustomerLegal) })
          setLegalForm(raw as CustomerLegal)
        }
      }
      if (a.code === 200 && Array.isArray(a.result)) setAddresses(a.result)
      if (s.code === 200 && Array.isArray(s.result)) setSubscriptions(s.result)
      if (ag.code === 200 && ag.result) setAgent(ag.result as CustomerAgent)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [])

  // ─── ویرایش پروفایل ───────────────────────────────────────────
  const openEdit = () => setEditModal(true)

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
        toast.error(res.caption ?? 'خطا در ذخیره')
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  // ─── افزودن آدرس ──────────────────────────────────────────────
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
        toast.error(res.caption ?? 'خطا در ثبت آدرس')
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  // ─── ثبت اشتراک ────────────────────────────────────────────────
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
        toast.error(res.caption ?? 'خطا در ثبت اشتراک')
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  // ─── ثبت / ویرایش نماینده ─────────────────────────────────────
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
        toast.error(res.caption ?? 'خطا در ثبت نماینده')
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  // ─── render helpers ────────────────────────────────────────────
  const isLegal = profile?.type === 'legal'

  const profileRows: { label: string; value: string | undefined }[] = profile
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
              <h3 className="font-semibold text-gray-900">{isLegal ? 'اطلاعات شرکت' : 'اطلاعات فردی'}</h3>
              <p className="text-xs text-gray-400">{isLegal ? 'مشتری حقوقی' : 'مشتری حقیقی'}</p>
            </div>
          </div>
          {profile && (
            <Button variant="secondary" size="sm" onClick={openEdit}>
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
          <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-5 text-center">
            <p className="text-sm text-amber-700 font-medium">پروفایل تکمیل نشده است</p>
            <p className="mt-1 text-xs text-amber-500">لطفاً اطلاعات خود را تکمیل کنید</p>
          </div>
        )}
      </Card>

      {/* ─── آدرس‌ها ─── */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-gray-900">آدرس‌ها</h3>
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
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700 font-medium">
                    {a.powerEntityName}
                  </span>
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
              <h3 className="font-semibold text-gray-900">اشتراک‌های برق</h3>
              <p className="text-xs text-gray-400">هر آدرس می‌تواند چند اشتراک داشته باشد</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
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
            <Input
              label="شناسه شهر"
              type="number"
              value={addrForm.cityId || ''}
              onChange={(e) => setAddrForm({ ...addrForm, cityId: +e.target.value })}
              placeholder="عدد شناسه"
            />
            <Input
              label="شناسه شرکت برق"
              type="number"
              value={addrForm.powerEntityId || ''}
              onChange={(e) => setAddrForm({ ...addrForm, powerEntityId: +e.target.value })}
              placeholder="عدد شناسه"
            />
          </div>
          <p className="text-xs text-gray-400">شناسه‌ها را از بخش مدیریت سیستم دریافت کنید.</p>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setAddrModal(false)}>انصراف</Button>
          <Button loading={saving} onClick={handleAddAddress}>ثبت آدرس</Button>
        </div>
      </Modal>

      {/* ═══ مودال اشتراک جدید ═══ */}
      <Modal open={subModal} onClose={() => setSubModal(false)} title="ثبت اشتراک جدید" size="sm">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">آدرس مرتبط *</label>
            <select
              value={subForm.addressId}
              onChange={(e) => setSubForm({ ...subForm, addressId: +e.target.value })}
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={0}>انتخاب کنید...</option>
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.mainAddress} ({a.powerEntityName})
                </option>
              ))}
            </select>
          </div>
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
          <Input label="نام کامل *"   value={agentForm.fullName} onChange={(e) => setAgentForm({ ...agentForm, fullName: e.target.value })} />
          <Input label="موبایل *"     value={agentForm.mobile}   onChange={(e) => setAgentForm({ ...agentForm, mobile: e.target.value })}   inputMode="numeric" maxLength={11} />
          <Input label="رمز عبور *"   type="password" value={agentForm.password} onChange={(e) => setAgentForm({ ...agentForm, password: e.target.value })} />
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
