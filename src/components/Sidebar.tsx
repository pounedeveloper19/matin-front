import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, User, FileText, Zap, MessageSquare,
  Users, Building2, Building, LogOut, Bolt,
  BarChart2, Tag, Clock, Receipt, UserCheck, Megaphone,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const customerNav = [
  { to: '/customer/dashboard', label: 'داشبورد',          icon: LayoutDashboard },
  { to: '/customer/profile',   label: 'پروفایل',          icon: User },
  { to: '/customer/contracts', label: 'قراردادها',         icon: FileText },
  { to: '/customer/bills',     label: 'تحلیل قبض',        icon: Zap },
  { to: '/customer/tickets',   label: 'تیکت‌ها',          icon: MessageSquare },
]

const adminNav = [
  { to: '/admin/dashboard',       label: 'داشبورد',              icon: LayoutDashboard },
  { to: '/admin/legal-customers', label: 'مشتریان حقوقی',       icon: Building2 },
  { to: '/admin/real-customers',  label: 'مشتریان حقیقی',       icon: Users },
  { to: '/admin/contracts',       label: 'قراردادها',             icon: FileText },
  { to: '/admin/market-rates',    label: 'نرخ‌های بازار',        icon: BarChart2 },
  { to: '/admin/tariffs',         label: 'تعرفه‌ها',              icon: Tag },
  { to: '/admin/tou-schedule',    label: 'برنامه TOU',            icon: Clock },
  { to: '/admin/bill-reports',    label: 'گزارش قبض‌ها',         icon: Receipt },
  { to: '/admin/tickets',         label: 'تیکت‌های پشتیبانی',   icon: MessageSquare },
  { to: '/admin/announcements',   label: 'اعلانات',               icon: Megaphone },
  { to: '/admin/pending-users',   label: 'درخواست‌های ثبت‌نام', icon: UserCheck },
  { to: '/admin/power-entities',  label: 'شرکت‌های برق',         icon: Building },
]

interface SidebarProps {
  role: 'admin' | 'customer'
}

export default function Sidebar({ role }: SidebarProps) {
  const { user, logout } = useAuth()
  const nav = role === 'admin' ? adminNav : customerNav

  return (
    <aside
      className="flex h-full w-64 shrink-0 flex-col sidebar-scroll overflow-y-auto"
      style={{
        background: '#ffffff',
        boxShadow: '-6px 0 30px rgba(15, 23, 42, 0.08)',
        borderLeft: '1px solid #e5e7eb',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: '#065f46' }}
        >
          <Bolt className="h-5 w-5 text-emerald-50" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 leading-tight">توزیع نیروی برق</p>
          <p className="mt-0.5 text-[11px] text-emerald-700/70">مدیریت هوشمند انرژی</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-0.5">
          {nav.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-emerald-600 hover:text-white',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all',
                        isActive ? 'bg-emerald-500/40' : 'bg-transparent',
                      ].join(' ')}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="truncate">{label}</span>
                    {isActive && (
                      <span className="mr-auto h-1.5 w-1.5 rounded-full bg-emerald-300 shrink-0" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4" style={{ borderTop: '1px solid #f1f5f9' }}>
        <div
          className="mb-2 mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5"
          style={{ background: '#f8fafc' }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-emerald-50"
            style={{ background: '#047857' }}
          >
            {user?.fullName?.charAt(0) ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-700">{user?.fullName}</p>
            <p className="text-[11px] text-emerald-700/70">{role === 'admin' ? 'مدیر سیستم' : 'مشتری'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-600 transition-all hover:bg-emerald-600 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          خروج از سیستم
        </button>
      </div>
    </aside>
  )
}
