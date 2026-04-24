import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, RefreshCw, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import type { PendingUser } from '../../types'

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
      if (res.type === 'Success') setUsers((res.result as PendingUser[]) ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openConfirm = (user: PendingUser, action: 'activate' | 'reject') => {
    setConfirmUser(user)
    setConfirmAction(action)
  }

  const handleConfirm = async () => {
    if (!confirmUser || !confirmAction) return
    setActing(true)
    try {
      const res = confirmAction === 'activate'
        ? await adminApi.activateUser(confirmUser.id)
        : await adminApi.rejectUser(confirmUser.id)
      if (res.type === 'Success') {
        toast.success(confirmAction === 'activate' ? 'کاربر فعال شد' : 'درخواست رد شد')
        setConfirmUser(null)
        setConfirmAction(null)
        load()
      } else {
        toast.error(res.message ?? 'خطا')
      }
    } finally {
      setActing(false)
    }
  }

  const displayName = (u: PendingUser) =>
    u.customerType === 1
      ? (u.realName ?? u.fullName ?? u.mobile)
      : (u.legalName ?? u.fullName ?? u.mobile)

  const identifier = (u: PendingUser) =>
    u.customerType === 1 ? u.nationalCode : u.nationalId

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="text-orange-500" size={22} />
          <h1 className="text-xl font-bold text-gray-800">درخواست‌های ثبت‌نام</h1>
          {!loading && (
            <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {users.length} درخواست
            </span>
          )}
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          بارگذاری مجدد
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">در حال بارگذاری...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <UserCheck size={48} className="mx-auto mb-3 opacity-30" />
          <p>درخواست ثبت‌نام جدیدی وجود ندارد</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">نام</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">موبایل</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">کد ملی / شناسه</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">نوع</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{displayName(u)}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono">{u.mobile}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono">{identifier(u) ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      u.customerType === 1
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {u.customerType === 1 ? 'حقیقی' : 'حقوقی'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openConfirm(u, 'activate')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        <CheckCircle size={14} />
                        تأیید
                      </button>
                      <button
                        onClick={() => openConfirm(u, 'reject')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        <XCircle size={14} />
                        رد
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!confirmUser}
        onClose={() => { setConfirmUser(null); setConfirmAction(null) }}
        title={confirmAction === 'activate' ? 'تأیید فعال‌سازی' : 'رد درخواست'}
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            {confirmAction === 'activate'
              ? <>آیا می‌خواهید حساب <strong>{confirmUser && displayName(confirmUser)}</strong> را فعال کنید؟</>
              : <>آیا درخواست <strong>{confirmUser && displayName(confirmUser)}</strong> را رد می‌کنید؟ این عمل غیرقابل بازگشت است.</>
            }
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => { setConfirmUser(null); setConfirmAction(null) }}>
              انصراف
            </Button>
            <Button
              variant={confirmAction === 'activate' ? 'primary' : 'danger'}
              onClick={handleConfirm}
              disabled={acting}
            >
              {acting ? 'در حال انجام...' : confirmAction === 'activate' ? 'فعال‌سازی' : 'رد درخواست'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
