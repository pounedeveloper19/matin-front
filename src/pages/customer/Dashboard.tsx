import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Zap, MessageSquare, User, ArrowLeft, Megaphone, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { customerApi } from '../../api/customer'
import { StatCard } from '../../components/ui/Card'
import Badge, { contractStatusVariant } from '../../components/ui/Badge'
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
  const openTickets     = tickets.filter((t) => !t.status.includes('بسته')).length

  const quickLinks = [
    { to: '/customer/profile',   icon: User,         label: 'پروفایل کاربری', desc: 'مشاهده و ویرایش اطلاعات',    color: 'bg-blue-100 text-blue-600' },
    { to: '/customer/contracts', icon: FileText,     label: 'قراردادها',       desc: `${contracts.length} قرارداد`, color: 'bg-emerald-100 text-emerald-600' },
    { to: '/customer/bills',     icon: Zap,           label: 'تحلیل قبض',      desc: 'مقایسه هزینه و صرفه‌جویی',   color: 'bg-amber-100 text-amber-600' },
    { to: '/customer/tickets',   icon: MessageSquare, label: 'پشتیبانی',        desc: `${openTickets} تیکت باز`,     color: 'bg-purple-100 text-purple-600' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)' }}
      >
        <div className="relative z-10">
          <p className="text-sm text-emerald-300">خوش آمدید،</p>
          <h2 className="mt-1 text-2xl font-bold">{user?.fullName}</h2>
          <p className="mt-2 text-sm text-emerald-200/80">از سامانه مدیریت هوشمند برق متین استفاده می‌کنید</p>
        </div>
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 h-20 w-20 rounded-full opacity-10"
          style={{ background: 'rgba(255,255,255,0.3)' }}
        />
        <div
          className="absolute left-14 top-1/2 -translate-y-1/2 h-32 w-32 rounded-full opacity-5"
          style={{ background: 'rgba(255,255,255,0.5)' }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="تعداد قراردادها"  value={contracts.length}  icon={<FileText className="h-5 w-5" />}     color="green" />
        <StatCard title="قراردادهای فعال" value={activeContracts}    icon={<CheckCircle className="h-5 w-5" />}  color="blue" />
        <StatCard title="تیکت‌های باز"    value={openTickets}        icon={<MessageSquare className="h-5 w-5" />} color="amber" />
        <StatCard title="کل تیکت‌ها"      value={tickets.length}     icon={<MessageSquare className="h-5 w-5" />} color="purple" />
      </div>

      {/* Quick links */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">دسترسی سریع</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {quickLinks.map(({ to, icon: Icon, label, desc, color }) => (
            <Link
              key={to}
              to={to}
              className="group glass-card rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="font-semibold text-gray-800">{label}</p>
              <p className="mt-1 text-xs text-gray-500">{desc}</p>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary-600 opacity-0 transition-opacity group-hover:opacity-100">
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
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">اعلانات</h3>
          </div>
          <div className="space-y-2">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="rounded-xl px-4 py-3"
                style={{ background: 'rgba(254,243,199,0.7)', border: '1px solid rgba(252,211,77,0.3)' }}
              >
                <p className="text-sm font-semibold text-amber-800">{a.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-700">{a.contents}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last contracts */}
      {contracts.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">آخرین قراردادها</h3>
            <Link to="/customer/contracts" className="text-xs font-semibold text-primary-600 hover:text-primary-800">
              مشاهده همه
            </Link>
          </div>
          <div className="space-y-2">
            {contracts.slice(0, 3).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(209,250,229,0.6)' }}
              >
                <div>
                  <p className="font-mono text-sm font-semibold text-gray-800">{c.contractNumber}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{c.startDate} تا {c.endDate}</p>
                </div>
                <Badge variant={contractStatusVariant(c.status)}>{c.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
