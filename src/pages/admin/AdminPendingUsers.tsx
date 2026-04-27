import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, RefreshCw, UserCheck, Download, SlidersHorizontal, Sparkles, AlertTriangle, FileClock, Eye, ShieldCheck, FileBadge2, Search, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { lookupApi } from '../../api/lookup'
import { RegionHeatMap } from '../../components/ui/Charts'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import CustomerDetailPanel from '../../components/admin/CustomerDetailPanel'
import type { PendingUser } from '../../types'

const avatarColors = [
  'bg-emerald-100 text-emerald-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]

export default function AdminPendingUsers() {
  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(false)
  const [priority, setPriority] = useState<'all' | 'high'>('all')
  const [searchText, setSearchText] = useState('')
  const [confirmUser, setConfirmUser] = useState<PendingUser | null>(null)
  const [confirmAction, setConfirmAction] = useState<'activate' | 'reject' | null>(null)
  const [acting, setActing] = useState(false)
  const [detailProfileId, setDetailProfileId] = useState<number | null>(null)
  const [detailTitle, setDetailTitle] = useState('')
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.getPendingUsers()
      if (res.code === 200) setUsers((res.result as PendingUser[]) ?? [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    lookupApi.getProvinces().then(r => { if (r.code === 200 && Array.isArray(r.result)) setProvinces(r.result) })
  }, [])

  const displayName = (u: PendingUser) =>
    u.customerType === 1 ? (u.realName ?? u.fullName ?? u.mobile) : (u.legalName ?? u.fullName ?? u.mobile)

  const identifier = (u: PendingUser) =>
    u.customerType === 1 ? u.nationalCode : u.nationalId

  const handleConfirm = async () => {
    if (!confirmUser || !confirmAction) return
    setActing(true)
    try {
      const res = confirmAction === 'activate'
        ? await adminApi.activateUser(confirmUser.id)
        : await adminApi.rejectUser(confirmUser.id)
      if (res.code === 200) {
        toast.success(confirmAction === 'activate' ? 'کاربر فعال شد' : 'درخواست رد شد')
        setConfirmUser(null); setConfirmAction(null); load()
      } else { toast.error(res.message ?? 'خطا') }
    } finally { setActing(false) }
  }

  const byPriority = priority === 'high'
    ? users.filter((u) => !u.hasIdentityDoc || !u.hasAddress)
    : users
  const filteredUsers = byPriority.filter((u) => {
    if (!searchText.trim()) return true
    const q = searchText.trim().toLowerCase()
    const name = displayName(u)?.toLowerCase() ?? ''
    const reqId = `req-${89000 + u.id}`.toLowerCase()
    const mobile = (u.mobile ?? '').toLowerCase()
    const ident = (identifier(u) ?? '').toLowerCase()
    return name.includes(q) || reqId.includes(q) || mobile.includes(q) || ident.includes(q)
  })
  const waitingDocs = users.filter((u) => !u.hasIdentityDoc).length
  const stageReview = users.filter((u) => u.hasIdentityDoc && !u.hasAddress).length
  const approvedThisMonth = Math.max(users.length - waitingDocs, 0)

  const getDocStatus = (u: PendingUser): { label: string; tone: string } => {
    if (u.hasIdentityDoc && u.hasAddress) return { label: 'تکمیل شده', tone: 'text-emerald-700' }
    if (u.hasIdentityDoc && !u.hasAddress) return { label: 'آدرس ثبت نشده', tone: 'text-amber-700' }
    return { label: 'در انتظار بارگذاری', tone: 'text-rose-700' }
  }
  const getLocation = (u: PendingUser) => {
    if (u.city && u.province) return `${u.province}، ${u.city}`
    if (u.province) return u.province
    if (u.mainAddress) return u.mainAddress
    return '—'
  }
  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString('fa-IR') : '—'

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
        <h2 className="text-3xl font-black tracking-tight text-emerald-900">درخواست‌های ثبت‌نام جدید</h2>
        <p className="mt-1 text-sm text-gray-500">بررسی مدارک و تایید انتساب مشترکین جدید شبکه برق</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="جستجو بر اساس نام، موبایل یا کد ملی..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-9 pl-4 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div className="flex items-center justify-end gap-3">
        <Button size="sm" className="bg-emerald-900 px-5 hover:bg-emerald-950">
          <Download className="h-4 w-4" /> خروجی گزارش
        </Button>
        <Button size="sm" variant="secondary" className="bg-emerald-100/70 px-5 text-emerald-900 hover:bg-emerald-100">
          <SlidersHorizontal className="h-4 w-4" /> فیلتر کردن
        </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs text-gray-500">تأیید شده ماه جاری</span>
            <span className="rounded-lg bg-blue-50 p-2 text-blue-600"><ShieldCheck className="h-4 w-4" /></span>
          </div>
          <p className="text-4xl font-black leading-none text-gray-900">{approvedThisMonth.toLocaleString('fa-IR')}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs text-gray-500">در صف تخصیص کنتور</span>
            <span className="rounded-lg bg-amber-50 p-2 text-amber-600"><FileClock className="h-4 w-4" /></span>
          </div>
          <p className="text-4xl font-black leading-none text-gray-900">{stageReview.toLocaleString('fa-IR')}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white-50 p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs text-gray-700">در انتظار تایید مدارک</span>
            <span className="rounded-lg bg-amber-100 p-2 text-amber-700"><FileBadge2 className="h-4 w-4" /></span>
          </div>
          <p className="text-4xl font-black leading-none text-emerald-900">{waitingDocs.toLocaleString('fa-IR')}</p>
          <p className="mt-1 text-xs font-semibold text-emerald-700">+۱۲٪ امروز</p>
        </div>
        <div
          className="order-first rounded-2xl p-5 text-white lg:order-last"
          style={{ background: 'linear-gradient(145deg, #7dafa7 0%, #9ec9c2 100%)', boxShadow: '0 12px 24px rgba(23, 58, 48, 0.14)' }}
        >
          <div className="mb-7 flex justify-between">
            <span className="text-xs text-emerald-50/85">مگاوات درخواستی</span>
            <span className="rounded-xl bg-emerald-900 p-2.5 text-white shadow-md">
              <Zap className="h-4 w-4" strokeWidth={2.6} />
            </span>
          </div>
          <p className="text-4xl font-black leading-none">۸.۵</p>
          <p className="mt-1 text-xs text-emerald-50/90">مگاوات بر درخواستی کل</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-700">لیست فعلی درخواست‌ها</p>
          {!loading && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
              {users.length} در انتظار
            </span>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          بارگذاری مجدد
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : users.length === 0 ? (
        <div
          className="flex flex-col items-center py-20 text-center rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(209,250,229,0.6)' }}
        >
          <UserCheck className="mb-3 h-12 w-12 text-gray-300" />
          <p className="font-medium text-gray-500">درخواست ثبت‌نام جدیدی وجود ندارد</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 text-xs">
            <button
              onClick={() => setPriority('all')}
              className={`rounded-full px-3 py-1 font-semibold transition-colors ${priority === 'all' ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              عادی
            </button>
            <button
              onClick={() => setPriority('high')}
              className={`rounded-full px-3 py-1 font-semibold transition-colors ${priority === 'high' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              اولویت بالا
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y text-sm" style={{ borderColor: '#e5e7eb' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-bold tracking-wide text-gray-600">شناسه درخواست</th>
                  <th className="px-4 py-3 text-right text-xs font-bold tracking-wide text-gray-600">نام متقاضی</th>
                  <th className="px-4 py-3 text-right text-xs font-bold tracking-wide text-gray-600">نوع مشترک</th>
                  <th className="px-4 py-3 text-right text-xs font-bold tracking-wide text-gray-600">تاریخ ثبت</th>
                  <th className="px-4 py-3 text-right text-xs font-bold tracking-wide text-gray-600">موقعیت</th>
                  <th className="px-4 py-3 text-right text-xs font-bold tracking-wide text-gray-600">وضعیت مدارک</th>
                  <th className="px-4 py-3 text-center text-xs font-bold tracking-wide text-gray-600">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#f1f5f9' }}>
                {filteredUsers.map((u) => {
                  const status = getDocStatus(u)
                  return (
                  <tr key={u.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3.5 text-xs font-semibold text-gray-600">
                      REQ-{String(89000 + u.id)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColors[u.id % avatarColors.length]}`}>
                          {displayName(u)?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{displayName(u)}</p>
                          <p className="text-[11px] font-mono text-gray-400">{identifier(u) ?? u.mobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={u.customerType === 1 ? 'blue' : 'purple'}>
                        {u.customerType === 1 ? 'حقیقی' : 'حقوقی'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{formatDate(u.registeredAt)}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-600">{getLocation(u)}</td>
                    <td className={`px-4 py-3.5 text-xs font-semibold ${status.tone}`}>
                      {status.label}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => {
                            if (!u.customerProfileId) {
                              toast.error('پروفایل کاربر برای مشاهده جزئیات موجود نیست')
                              return
                            }
                            setDetailProfileId(u.customerProfileId)
                            setDetailTitle(displayName(u))
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-emerald-900 transition-colors hover:bg-emerald-100"
                          title="مشاهده"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setConfirmUser(u); setConfirmAction('activate') }}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white transition-colors hover:bg-emerald-700"
                          title="تایید"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setConfirmUser(u); setConfirmAction('reject') }}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700"
                          title="رد"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
            <span>نمایش ۱ تا {filteredUsers.length.toLocaleString('fa-IR')} از مجموع {users.length.toLocaleString('fa-IR')} درخواست</span>
            <span>صفحه ۱</span>
          </div>
        </div>
      )}

      <Modal
        open={!!confirmUser}
        onClose={() => { setConfirmUser(null); setConfirmAction(null) }}
        title={confirmAction === 'activate' ? 'تأیید فعال‌سازی' : 'رد درخواست'}
        size="sm"
      >
        <p className="text-sm text-gray-600">
          {confirmAction === 'activate'
            ? <>آیا می‌خواهید حساب <strong className="text-gray-900">{confirmUser && displayName(confirmUser)}</strong> را فعال کنید؟</>
            : <>آیا درخواست <strong className="text-gray-900">{confirmUser && displayName(confirmUser)}</strong> را رد می‌کنید؟</>
          }
        </p>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => { setConfirmUser(null); setConfirmAction(null) }}>انصراف</Button>
          <Button variant={confirmAction === 'activate' ? 'primary' : 'danger'} loading={acting} onClick={handleConfirm}>
            {confirmAction === 'activate' ? 'فعال‌سازی' : 'رد درخواست'}
          </Button>
        </div>
      </Modal>

      <CustomerDetailPanel
        open={detailProfileId !== null}
        profileId={detailProfileId}
        customerTitle={detailTitle}
        onClose={() => setDetailProfileId(null)}
      />

      {/* Bottom cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-rose-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-700">
            <AlertTriangle className="h-4 w-4" /> هشدار موارد بحرانی
          </div>
          <p className="text-sm leading-7 text-gray-600">
            {Math.max(Math.round(users.length * 0.16), 1).toLocaleString('fa-IR')} مورد نقص مدارک شناسایی در انتظار رفع توسط متقاضی می‌باشد.
          </p>
          <button className="mt-3 text-xs font-bold text-rose-700 hover:text-rose-800">مشاهده موارد بحرانی</button>
        </div>

        <RegionHeatMap totalCustomers={users.length} provinces={provinces} />

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Sparkles className="h-4 w-4 text-emerald-700" /> تحلیل هوشمند درخواست‌ها
          </div>
          <p className="text-sm leading-7 text-gray-600">
            میانگین زمان بررسی مدارک در ۲۴ ساعت گذشته، به میزان ۹.۴ ساعت کاهش یافته است.
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-emerald-700" style={{ width: '72%' }} />
          </div>
          <p className="mt-2 text-xs text-gray-400">۷۲٪ از درخواست‌ها مطابق با انتظار در وضعیت هستند</p>
        </div>
      </div>
    </div>
  )
}
