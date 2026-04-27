import { Bell, Settings, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface HeaderProps {
  title: string
  role: 'admin' | 'customer'
}

export default function Header({ title, role }: HeaderProps) {
  const { user } = useAuth()

  return (
    <header
      className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-6 lg:px-8"
      style={{
        boxShadow: '0 1px 6px rgba(15,23,42,0.04)',
      }}
    >
      {/* Page title — right side (RTL) */}
      <div className="min-w-0 shrink-0">
        <h1 className="text-base font-bold text-gray-900">{title}</h1>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {role === 'admin' ? 'پنل مدیریت سیستم' : 'پنل کاربری'}
        </p>
      </div>

      {/* Center search (matches reference top bar) */}
      <div className="relative mx-auto hidden w-full max-w-md lg:block">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          placeholder={role === 'admin' ? 'جستجو در درخواست‌ها...' : 'جستجو در قراردادها و تیکت‌ها...'}
          className="h-10 w-full rounded-full border border-gray-200 bg-gray-50 py-2 pr-10 pl-4 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {/* Actions — left side (RTL: user pill rightmost, bell leftmost) */}
      <div className="flex shrink-0 items-center gap-2">
        {/* User pill */}
        <div
          className="flex items-center gap-2.5 rounded-xl px-3 py-1.5"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #065f46, #064e3b)' }}
          >
            {user?.fullName?.charAt(0) ?? 'U'}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {user?.fullName}
          </span>
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-all hover:bg-gray-100 hover:text-emerald-800"
          title="تنظیمات"
        >
          <Settings style={{ width: '18px', height: '18px' }} />
        </button>

        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-all hover:bg-gray-100 hover:text-emerald-800"
          title="اعلانات"
        >
          <Bell style={{ width: '18px', height: '18px' }} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  )
}
