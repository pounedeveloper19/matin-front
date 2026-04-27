import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, MapPin, Zap, FileText, Download } from 'lucide-react'
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
import type { AdminAddress, AdminSubscription } from '../../types'

type Tab = 'addresses' | 'subscriptions' | 'documents'

type AddressRow = {
  id: number
  mainAddress: string
  postalCode: string
  city: string
  province: string
  powerEntity?: string
}

type SubRow = {
  id: number
  billIdentifier: string
  contractCapacityKw: number | null
  mainAddress: string
  city: string
}

interface Props {
  open: boolean
  profileId: number | null
  customerTitle: string
  onClose: () => void
}

const emptyAddr: AdminAddress = { id: 0, postalCode: '', mainAddress: '', cityId: 0, powerEntityId: 0 }
const emptySub: AdminSubscription = { id: 0, billIdentifier: '', contractCapacityKw: null, addressId: 0 }

export default function CustomerDetailPanel({ open, profileId, customerTitle, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('addresses')
  const [addresses, setAddresses]         = useState<AddressRow[]>([])
  const [addrLoading, setAddrLoading]     = useState(false)
  const [addrModal, setAddrModal]         = useState<'create' | 'edit' | 'delete' | null>(null)
  const [addrForm, setAddrForm]           = useState<AdminAddress>(emptyAddr)
  const [addrSaving, setAddrSaving]       = useState(false)
  const [subscriptions, setSubscriptions] = useState<SubRow[]>([])
  const [subLoading, setSubLoading]       = useState(false)
  const [subModal, setSubModal]           = useState<'create' | 'delete' | null>(null)
  const [subForm, setSubForm]             = useState<AdminSubscription>(emptySub)
  const [subSaving, setSubSaving]         = useState(false)
  const [identityDocId, setIdentityDocId] = useState<string | null>(null)
  const [cities, setCities]               = useState<IdTitle[]>([])
  const [powerEntities, setPowerEntities] = useState<IdName[]>([])
  const [lookupsLoaded, setLookupsLoaded] = useState(false)

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
      setSubscriptions((r.result as any)?.data ?? [])
    } finally { setSubLoading(false) }
  }, [profileId])

  useEffect(() => {
    if (!open || !profileId) return
    setTab('addresses')
    setAddresses([]); setSubscriptions([]); setIdentityDocId(null)
    fetchAddresses(); fetchSubscriptions()
    adminApi.getCustomerFullDetail(profileId).then((r) => {
      if (r.code === 200 && r.result)
        setIdentityDocId((r.result as any).identityDocFileId ?? null)
    })
    if (!lookupsLoaded) {
      Promise.all([lookupApi.getCities(), lookupApi.getPowerEntities()]).then(([c, p]) => {
        if (c.code === 200 && Array.isArray(c.result)) setCities(c.result as IdTitle[])
        if (p.code === 200 && Array.isArray(p.result)) setPowerEntities(p.result as IdName[])
        setLookupsLoaded(true)
      })
    }
  }, [open, profileId, fetchAddresses, fetchSubscriptions, lookupsLoaded])

  const openCreateAddr = () => { setAddrForm(emptyAddr); setAddrModal('create') }
  const openEditAddr   = async (row: AddressRow) => {
    try {
      const r = await adminApi.getAdminAddressDetail(row.id)
      setAddrForm(r.result ?? { ...emptyAddr, id: row.id })
    } catch { setAddrForm({ ...emptyAddr, id: row.id }) }
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

  const openCreateSub = () => { setSubForm(emptySub); setSubModal('create') }
  const openDeleteSub = (row: SubRow) =>
    { setSubForm({ ...emptySub, id: row.id, billIdentifier: row.billIdentifier }); setSubModal('delete') }

  const handleSaveSub = async () => {
    if (!subForm.addressId || !subForm.billIdentifier) {
      toast.error('آدرس و شناسه قبض الزامی است'); return
    }
    if (!/^\d{13}$/.test(subForm.billIdentifier)) {
      toast.error('شناسه قبض باید دقیقاً ۱۳ رقم باشد'); return
    }
    if (!validateBillIdentifier(subForm.billIdentifier)) {
      toast.error('شناسه قبض معتبر نیست (رقم کنترل اشتباه است)'); return
    }
    setSubSaving(true)
    try {
      const res = await adminApi.createAdminSubscription(subForm)
      if (res.code === 200) { toast.success('انشعاب ثبت شد'); setSubModal(null); fetchSubscriptions() }
      else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSubSaving(false) }
  }

  const handleDeleteSub = async () => {
    setSubSaving(true)
    try {
      const res = await adminApi.deleteAdminSubscription(subForm.id)
      if (res.code === 200) { toast.success('انشعاب حذف شد'); setSubModal(null); fetchSubscriptions() }
      else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSubSaving(false) }
  }

  if (!open) return null

  const tabs: { key: Tab; label: string; icon: typeof MapPin; count?: number }[] = [
    { key: 'addresses',     label: 'آدرس‌ها',   icon: MapPin,    count: addresses.length },
    { key: 'subscriptions', label: 'انشعاب‌ها',  icon: Zap,       count: subscriptions.length },
    { key: 'documents',     label: 'مدارک',       icon: FileText },
  ]

  return (
    <>
      <Modal open={open} onClose={onClose} title={`پروفایل — ${customerTitle}`} size="xl">
        {/* Tabs */}
        <div className="mb-5 flex gap-1 rounded-xl bg-gray-100/70 p-1">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={[
                'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                tab === key
                  ? 'bg-white text-primary-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {count !== undefined && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${tab === key ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-500'}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Addresses tab */}
        {tab === 'addresses' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={openCreateAddr}><Plus className="h-4 w-4" /> آدرس جدید</Button>
            </div>
            {addrLoading ? (
              <div className="py-8 text-center text-sm text-gray-400">در حال بارگذاری...</div>
            ) : addresses.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                <MapPin className="mx-auto mb-2 h-8 w-8 opacity-30" />
                آدرسی ثبت نشده است
              </div>
            ) : (
              <div className="space-y-2">
                {addresses.map((a) => (
                  <div key={a.id}
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{ background: 'rgba(236,253,245,0.5)', border: '1px solid rgba(209,250,229,0.6)' }}
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{a.mainAddress}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{a.province} — {a.city} | کد پستی: {a.postalCode}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
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

        {/* Subscriptions tab */}
        {tab === 'subscriptions' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={openCreateSub}><Plus className="h-4 w-4" /> انشعاب جدید</Button>
            </div>
            {subLoading ? (
              <div className="py-8 text-center text-sm text-gray-400">در حال بارگذاری...</div>
            ) : subscriptions.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                <Zap className="mx-auto mb-2 h-8 w-8 opacity-30" />
                انشعابی ثبت نشده است
              </div>
            ) : (
              <div className="space-y-2">
                {subscriptions.map((s) => (
                  <div key={s.id}
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{ background: 'rgba(236,253,245,0.5)', border: '1px solid rgba(209,250,229,0.6)' }}
                  >
                    <div>
                      <p className="font-mono text-sm font-semibold text-gray-800">{s.billIdentifier}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{s.mainAddress || s.city}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.contractCapacityKw && (
                        <Badge variant="blue">{s.contractCapacityKw} kW</Badge>
                      )}
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

        {/* Documents tab */}
        {tab === 'documents' && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">مدرک شناسایی</p>
            {identityDocId ? (
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: 'rgba(236,253,245,0.5)', border: '1px solid rgba(209,250,229,0.6)' }}
              >
                <FileText className="h-5 w-5 shrink-0 text-primary-500" />
                <span className="flex-1 text-sm text-gray-700">مدرک شناسایی بارگذاری شده است</span>
                <button
                  onClick={() => uploadApi.download(identityDocId).catch(() => {})}
                  className="flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition-colors">
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

        <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={onClose}>بستن</Button>
        </div>
      </Modal>

      {/* Address modals */}
      <Modal open={addrModal === 'create' || addrModal === 'edit'} onClose={() => setAddrModal(null)}
        title={addrModal === 'create' ? 'آدرس جدید' : 'ویرایش آدرس'} size="md">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="شهر *" value={addrForm.cityId ?? 0}
            options={cities.map(c => ({ value: c.id, label: c.title }))}
            onChange={(v) => setAddrForm({ ...addrForm, cityId: +v })} />
          <Select label="شرکت برق *" value={addrForm.powerEntityId ?? 0}
            options={powerEntities.map(p => ({ value: p.id, label: p.province ? `${p.name} — ${p.province}` : p.name }))}
            onChange={(v) => setAddrForm({ ...addrForm, powerEntityId: +v })} />
          <div className="sm:col-span-2">
            <Input label="آدرس *" value={addrForm.mainAddress}
              onChange={(e) => setAddrForm({ ...addrForm, mainAddress: e.target.value })} placeholder="آدرس کامل" />
          </div>
          <Input label="کد پستی *" value={addrForm.postalCode}
            onChange={(e) => setAddrForm({ ...addrForm, postalCode: e.target.value })}
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

      {/* Subscription modals */}
      <Modal open={subModal === 'create'} onClose={() => setSubModal(null)} title="انشعاب جدید" size="md">
        <div className="space-y-4">
          <Select label="آدرس *" value={subForm.addressId} placeholder="انتخاب آدرس"
            options={addresses.map(a => ({ value: a.id, label: a.mainAddress }))}
            onChange={(v) => setSubForm({ ...subForm, addressId: +v })} />
          <Input label="شناسه قبض *" value={subForm.billIdentifier}
            onChange={(e) => setSubForm({ ...subForm, billIdentifier: e.target.value.replace(/\D/g, '') })}
            placeholder="۱۳ رقم" maxLength={13} inputMode="numeric" />
          <Input label="ظرفیت قرارداد (kW)" type="number" value={subForm.contractCapacityKw ?? ''}
            onChange={(e) => setSubForm({ ...subForm, contractCapacityKw: e.target.value === '' ? null : +e.target.value })}
            placeholder="مثلاً ۵۰۰" />
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setSubModal(null)}>انصراف</Button>
          <Button loading={subSaving} onClick={handleSaveSub}>ثبت انشعاب</Button>
        </div>
      </Modal>

      <Modal open={subModal === 'delete'} onClose={() => setSubModal(null)} title="حذف انشعاب" size="sm">
        <p className="text-sm text-gray-600">
          آیا از حذف انشعاب <span className="font-bold text-gray-900">«{subForm.billIdentifier}»</span> اطمینان دارید؟
        </p>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setSubModal(null)}>انصراف</Button>
          <Button variant="danger" loading={subSaving} onClick={handleDeleteSub}><Trash2 className="h-4 w-4" /> حذف</Button>
        </div>
      </Modal>
    </>
  )
}
