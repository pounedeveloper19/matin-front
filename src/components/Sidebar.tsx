import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  User,
  FileText,
  Zap,
  MessageSquare,
  Users,
  Building2,
  LogOut,
  Bolt,
  BarChart2,
  Tag,
  Clock,
  Receipt,
  UserCheck,
  Megaphone,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import clsx from 'clsx'

const customerNav = [
  { to: '/customer/dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { to: '/customer/profile', label: 'پروفایل', icon: User },
  { to: '/customer/contracts', label: 'قراردادها', icon: FileText },
  { to: '/customer/bills', label: 'تحلیل قبض', icon: Zap },
  { to: '/customer/tickets', label: 'تیکت‌ها', icon: MessageSquare },
]

const adminNav = [
  { to: '/admin/dashboard',      label: 'داشبورد',          icon: LayoutDashboard },
  { to: '/admin/legal-customers', label: 'مشتریان حقوقی',  icon: Building2 },
  { to: '/admin/real-customers',  label: 'مشتریان حقیقی',  icon: Users },
  { to: '/admin/contracts',       label: 'قراردادها',       icon: FileText },
  { to: '/admin/market-rates',    label: 'نرخ‌های بازار',   icon: BarChart2 },
  { to: '/admin/tariffs',         label: 'تعرفه‌ها',         icon: Tag },
  { to: '/admin/tou-schedule',    label: 'برنامه TOU',       icon: Clock },
  { to: '/admin/bill-reports',    label: 'گزارش قبض‌ها',        icon: Receipt },
  { to: '/admin/tickets',         label: 'تیکت‌های پشتیبانی',  icon: MessageSquare },
  { to: '/admin/announcements',   label: 'اعلانات',             icon: Megaphone },
  { to: '/admin/pending-users',   label: 'درخواست‌های ثبت‌نام', icon: UserCheck },
]

interface SidebarProps {
  role: 'admin' | 'customer'
}

export default function Sidebar({ role }: SidebarProps) {
  const { user, logout } = useAuth()
  const nav = role === 'admin' ? adminNav : customerNav

  return (
    <aside className="flex h-full w-64 flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-gray-700 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500">
          <Bolt className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none">برق متین</p>
          <p className="mt-1 text-xs text-gray-400">سامانه مدیریت برق</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-gray-700 px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-bold">
            {user?.fullName?.charAt(0) ?? 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="truncate text-sm font-medium">{user?.fullName}</p>
            <p className="text-xs text-gray-400">{role === 'admin' ? 'مدیر سیستم' : 'مشتری'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          خروج از سیستم
        </button>
      </div>
    </aside>
  )
}
