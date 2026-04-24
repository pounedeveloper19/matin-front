import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Zap, MessageSquare, User, ArrowLeft, Megaphone } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { customerApi } from '../../api/customer'
import { StatCard } from '../../components/ui/Card'
import type { ContractResult, TicketSummary, AnnouncementItem } from '../../types'
import { toArr } from '../../utils'

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [contracts, setContracts]         = useState<ContractResult[]>([])
  const [tickets, setTickets]             = useState<TicketSummary[]>([])
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([])

  useEffect(() => {
    customerApi.getContracts().then((r) => { if (r.code === 200) setContracts(toArr(r.result)) })
    customerApi.getTickets().then((r) => { if (r.code === 200) setTickets(toArr(r.result) as TicketSummary[]) })
    customerApi.getAnnouncements().then((r) => { if (r.code === 200) setAnnouncements(toArr(r.result) as AnnouncementItem[]) })
  }, [])

  const activeContracts = contracts.filter((c) => c.status.includes('فعال')).length
  const openTickets = tickets.filter((t) => !t.status.includes('بسته')).length

  const quickLinks = [
    { to: '/customer/profile', icon: User, label: 'پروفایل کاربری', desc: 'مشاهده و ویرایش اطلاعات', color: 'bg-blue-50 text-blue-600' },
    { to: '/customer/contracts', icon: FileText, label: 'قراردادها', desc: `${contracts.length} قرارداد ثبت‌شده`, color: 'bg-emerald-50 text-emerald-600' },
    { to: '/customer/bills', icon: Zap, label: 'تحلیل قبض', desc: 'مقایسه هزینه و صرفه‌جویی', color: 'bg-amber-50 text-amber-600' },
    { to: '/customer/tickets', icon: MessageSquare, label: 'پشتیبانی', desc: `${openTickets} تیکت باز`, color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-xl bg-gradient-to-l from-primary-600 to-primary-800 p-6 text-white">
        <p className="text-primary-200">خوش آمدید،</p>
        <h2 className="mt-1 text-2xl font-bold">{user?.fullName}</h2>
        <p className="mt-2 text-sm text-primary-200">از سامانه مدیریت برق برق متین استفاده می‌کنید</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="تعداد قراردادها" value={contracts.length} icon={<FileText className="h-5 w-5" />} color="green" />
        <StatCard title="قراردادهای فعال" value={activeContracts} icon={<FileText className="h-5 w-5" />} color="blue" />
        <StatCard title="تیکت‌های باز" value={openTickets} icon={<MessageSquare className="h-5 w-5" />} color="amber" />
        <StatCard title="کل تیکت‌ها" value={tickets.length} icon={<MessageSquare className="h-5 w-5" />} color="purple" />
      </div>

      {/* Quick links */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-gray-500">دسترسی سریع</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {quickLinks.map(({ to, icon: Icon, label, desc, color }) => (
            <Link
              key={to}
              to={to}
              className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="font-semibold text-gray-900">{label}</p>
              <p className="mt-1 text-xs text-gray-500">{desc}</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-primary-600 opacity-0 transition-opacity group-hover:opacity-100">
                <span>مشاهده</span>
                <ArrowLeft className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-500">اعلانات</h3>
          </div>
          <div className="space-y-2">
            {announcements.map((a) => (
              <div key={a.id} className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                <p className="text-sm font-semibold text-amber-800">{a.title}</p>
                <p className="mt-1 text-xs text-amber-700 leading-relaxed">{a.contents}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last contracts */}
      {contracts.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-500">آخرین قراردادها</h3>
            <Link to="/customer/contracts" className="text-xs text-primary-600 hover:underline">مشاهده همه</Link>
          </div>
          <div className="space-y-2">
            {contracts.slice(0, 3).map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.contractNumber}</p>
                  <p className="text-xs text-gray-400">{c.startDate} تا {c.endDate}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  c.status.includes('فعال') ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                }`}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
