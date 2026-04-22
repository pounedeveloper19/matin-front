import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Users, FileText, MapPin, ArrowLeft } from 'lucide-react'
import { adminApi } from '../../api/admin'
import { StatCard } from '../../components/ui/Card'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ legal: 0, real: 0, contracts: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.getLegalCustomers({ pageSize: 1 }),
      adminApi.getRealCustomers({ pageSize: 1 }),
      adminApi.getContracts({ pageSize: 1 }),
    ]).then(([l, r, c]) => {
      setStats({
        legal: (l.result as any)?.totalRecords ?? 0,
        real: (r.result as any)?.totalRecords ?? 0,
        contracts: (c.result as any)?.totalRecords ?? 0,
      })
    }).finally(() => setLoading(false))
  }, [])

  const sections = [
    { to: '/admin/legal-customers', icon: Building2, label: 'مشتریان حقوقی', count: stats.legal, color: 'bg-blue-50 text-blue-600', desc: 'مدیریت شرکت‌ها' },
    { to: '/admin/real-customers',  icon: Users,     label: 'مشتریان حقیقی', count: stats.real,    color: 'bg-purple-50 text-purple-600', desc: 'مدیریت اشخاص' },
    { to: '/admin/contracts',       icon: FileText,  label: 'قراردادها',      count: stats.contracts, color: 'bg-emerald-50 text-emerald-600', desc: 'مدیریت قراردادها' },
  ]

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-xl bg-gradient-to-l from-gray-800 to-gray-900 p-6 text-white">
        <p className="text-gray-400 text-sm">پنل مدیریت</p>
        <h2 className="mt-1 text-2xl font-bold">متین پاور</h2>
        <p className="mt-2 text-sm text-gray-400">مدیریت مشتریان، قراردادها و اشتراک‌های برق</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="مشتریان حقوقی" value={loading ? '...' : stats.legal} icon={<Building2 className="h-5 w-5" />} color="blue" />
        <StatCard title="مشتریان حقیقی" value={loading ? '...' : stats.real}  icon={<Users className="h-5 w-5" />}    color="purple" />
        <StatCard title="قراردادها"      value={loading ? '...' : stats.contracts} icon={<FileText className="h-5 w-5" />} color="green" />
      </div>

      {/* Quick nav */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-gray-500">دسترسی سریع</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {sections.map(({ to, icon: Icon, label, count, color, desc }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500">{desc} · {loading ? '...' : count} رکورد</p>
                </div>
              </div>
              <ArrowLeft className="h-4 w-4 text-gray-400 transition-transform group-hover:-translate-x-1" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
