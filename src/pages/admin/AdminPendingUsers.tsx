import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, RefreshCw, UserCheck, Clock, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { StatCard } from '../../components/ui/Card'
import { RegionHeatMap } from '../../components/ui/Charts'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
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
  const [confirmUser, setConfirmUser] = useState<PendingUser | null>(null)
  const [confirmAction, setConfirmAction] = useState<'activate' | 'reject' | null>(null)
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.getPendingUsers()
      if (res.code === 200) setUsers((res.result as PendingUser[]) ?? [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

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

  const realCount = users.filter(u => u.customerType === 1).length
  const legalCount = users.filter(u => u.customerType !== 1).length

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="مجموع درخواست‌ها" value={users.length.toLocaleString('fa-IR')} icon={<Clock className="h-5 w-5" />} color="amber" subtitle="در انتظار بررسی" />
        <StatCard title="حقیقی" value={realCount.toLocaleString('fa-IR')} icon={<Users className="h-5 w-5" />} color="blue" />
        <StatCard title="حقوقی" value={legalCount.toLocaleString('fa-IR')} icon={<UserCheck className="h-5 w-5" />} color="purple" />
        <StatCard title="بررسی‌شده امروز" value="—" icon={<CheckCircle className="h-5 w-5" />} color="green" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-700">درخواست‌های ثبت‌نام</p>
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
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(209,250,229,0.6)',
            boxShadow: '0 4px 24px rgba(6,78,59,0.06)',
          }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y text-sm" style={{ borderColor: 'rgba(209,250,229,0.5)' }}>
              <thead style={{ background: 'rgba(236,253,245,0.7)' }}>
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-primary-800/70">نام متقاضی</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-primary-800/70">موبایل</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-primary-800/70">کد ملی / شناسه</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-primary-800/70">نوع</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-primary-800/70">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'rgba(209,250,229,0.4)' }}>
                {users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-emerald-50/30">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColors[u.id % avatarColors.length]}`}>
                          {displayName(u)?.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-800">{displayName(u)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-gray-600">{u.mobile}</td>
                    <td className="px-4 py-3.5 font-mono text-gray-500">{identifier(u) ?? '—'}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={u.customerType === 1 ? 'blue' : 'purple'}>
                        {u.customerType === 1 ? 'حقیقی' : 'حقوقی'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setConfirmUser(u); setConfirmAction('activate') }}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> تأیید
                        </button>
                        <button
                          onClick={() => { setConfirmUser(u); setConfirmAction('reject') }}
                          className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                        >
                          <XCircle className="h-3.5 w-3.5" /> رد
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* Geographic distribution */}
      <RegionHeatMap totalCustomers={users.length} />
    </div>
  )
}
