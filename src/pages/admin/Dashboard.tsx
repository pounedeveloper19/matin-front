import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Users, FileText, Megaphone, Bell, ArrowLeft, Clock, BarChart2, Receipt, Zap } from 'lucide-react'
import { adminApi } from '../../api/admin'
import { StatCard } from '../../components/ui/Card'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ legal: 0, real: 0, contracts: 0, pending: 0, announcements: 0, tariffs: 0, billReports: 0, marketRates: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.getLegalCustomers({ pageSize: 1 }),
      adminApi.getRealCustomers({ pageSize: 1 }),
      adminApi.getContracts({ pageSize: 1 }),
      adminApi.getPendingUsers(),
      adminApi.getAnnouncements({ pageSize: 1 }),
      adminApi.getTariffs({ pageSize: 1 }),
      adminApi.getBillReports({ pageSize: 1 }),
      adminApi.getMarketRates({ pageSize: 1 }),
    ]).then(([l, r, c, p, a, t, b, m]) => {
      setStats({
        legal:         (l.result as any)?.totalRecords ?? 0,
        real:          (r.result as any)?.totalRecords ?? 0,
        contracts:     (c.result as any)?.totalRecords ?? 0,
        pending:       Array.isArray(p.result) ? p.result.length : 0,
        announcements: (a.result as any)?.totalRecords ?? 0,
        tariffs:       (t.result as any)?.totalRecords ?? 0,
        billReports:   (b.result as any)?.totalRecords ?? 0,
        marketRates:   (m.result as any)?.totalRecords ?? 0,
      })
    }).finally(() => setLoading(false))
  }, [])

  const sections = [
    { to: '/admin/legal-customers', icon: Building2, label: 'مشتریان حقوقی', count: stats.legal,     color: 'bg-blue-100 text-blue-600',    desc: 'مدیریت شرکت‌ها' },
    { to: '/admin/real-customers',  icon: Users,     label: 'مشتریان حقیقی', count: stats.real,      color: 'bg-purple-100 text-purple-600', desc: 'مدیریت اشخاص' },
    { to: '/admin/contracts',       icon: FileText,  label: 'قراردادها',      count: stats.contracts, color: 'bg-emerald-100 text-emerald-700', desc: 'مدیریت قراردادها' },
    { to: '/admin/pending-users',   icon: Clock,     label: 'درخواست‌های ثبت‌نام', count: stats.pending, color: 'bg-amber-100 text-amber-600', desc: 'در انتظار تأیید' },
  ]

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div
        className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-7"
        style={{ boxShadow: '0 2px 12px rgba(15,23,42,0.04)' }}
      >
        <div className="relative z-10">
          <p className="text-sm text-emerald-700">پنل مدیریت</p>
          <h2 className="mt-1 text-3xl font-black text-gray-900">برق متین</h2>
          <p className="mt-2 text-sm text-gray-500">مدیریت مشتریان، قراردادها و اشتراک‌های برق</p>
          {stats.pending > 0 && !loading && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              <Bell className="h-3 w-3" />
              {stats.pending} درخواست ثبت‌نام در انتظار تأیید
            </div>
          )}
        </div>
        <div className="absolute left-6 top-1/2 -translate-y-1/2 h-24 w-24 rounded-full bg-emerald-50" />
        <div className="absolute left-16 top-1/2 -translate-y-1/2 h-40 w-40 rounded-full bg-emerald-50/70" />
      </div>

      {/* Stats – row 1 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="مشتریان حقوقی"  value={loading ? '...' : stats.legal.toLocaleString('fa-IR')}         icon={<Building2 className="h-5 w-5" />}  color="blue" />
        <StatCard title="مشتریان حقیقی"  value={loading ? '...' : stats.real.toLocaleString('fa-IR')}          icon={<Users className="h-5 w-5" />}      color="purple" />
        <StatCard title="قراردادها"       value={loading ? '...' : stats.contracts.toLocaleString('fa-IR')}     icon={<FileText className="h-5 w-5" />}   color="green" />
        <StatCard title="در انتظار تأیید" value={loading ? '...' : stats.pending.toLocaleString('fa-IR')}       icon={<Clock className="h-5 w-5" />}      color="amber" subtitle="درخواست ثبت‌نام" />
      </div>

      {/* Stats – row 2 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="اعلانات فعال"    value={loading ? '...' : stats.announcements.toLocaleString('fa-IR')} icon={<Megaphone className="h-5 w-5" />}  color="green"  subtitle="اطلاعیه‌های منتشرشده" />
        <StatCard title="تعرفه‌ها"         value={loading ? '...' : stats.tariffs.toLocaleString('fa-IR')}       icon={<Zap className="h-5 w-5" />}        color="blue"   subtitle="تعرفه‌های تعریف‌شده" />
        <StatCard title="گزارش‌های قبض"   value={loading ? '...' : stats.billReports.toLocaleString('fa-IR')}   icon={<Receipt className="h-5 w-5" />}    color="purple" subtitle="تحلیل‌های انجام‌شده" />
        <StatCard title="نرخ‌های بازار"    value={loading ? '...' : stats.marketRates.toLocaleString('fa-IR')}   icon={<BarChart2 className="h-5 w-5" />}  color="red"    subtitle="ماه‌های ثبت‌شده" />
      </div>

      {/* Quick nav */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">دسترسی سریع</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map(({ to, icon: Icon, label, count, color, desc }) => (
            <Link
              key={to}
              to={to}
              className="group glass-card rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="font-semibold text-gray-800">{label}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {desc} · {loading ? '...' : count.toLocaleString('fa-IR')} رکورد
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100">
                <span>مشاهده</span>
                <ArrowLeft className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* More links */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">سایر بخش‌ها</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { to: '/admin/announcements', label: 'اعلانات',       icon: Megaphone,  color: 'text-amber-600 bg-amber-50' },
            { to: '/admin/tariffs',       label: 'تعرفه‌ها',       icon: FileText,   color: 'text-indigo-600 bg-indigo-50' },
            { to: '/admin/market-rates',  label: 'نرخ‌های بازار',  icon: Building2,  color: 'text-rose-600 bg-rose-50' },
            { to: '/admin/power-entities',label: 'شرکت‌های برق',   icon: Users,      color: 'text-teal-600 bg-teal-50' },
          ].map(({ to, label, icon: Icon, color }) => (
            <Link key={to} to={to}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:bg-gray-50"
              style={{ boxShadow: '0 1px 6px rgba(15,23,42,0.03)' }}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-gray-700">{label}</span>
              <ArrowLeft className="mr-auto h-3.5 w-3.5 text-gray-300" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
