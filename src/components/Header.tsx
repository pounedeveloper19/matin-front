import { Bell, Search, Send } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface HeaderProps {
  title: string
  role: 'admin' | 'customer'
}

const ADMIN = {
  primary: '#003322',
  mint: '#4ade80',
  bg: '#ffffff',
  searchBg: '#f1f3f4',
  border: '#e5e7eb',
}

export default function Header({ title, role }: HeaderProps) {
  const { user } = useAuth()
  const isAdmin = role === 'admin'

  if (isAdmin) {
    return (
      <header
        className="flex h-16 shrink-0 items-center gap-4 px-6 lg:px-8"
        style={{ background: ADMIN.bg, borderBottom: `1px solid ${ADMIN.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <div className="relative mx-auto hidden w-full max-w-md lg:block">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="جستجو در درخواست‌ها..."
            className="h-10 w-full rounded-full border-0 py-2 pr-10 pl-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4ade80]/40"
            style={{ background: ADMIN.searchBg }}
          />
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            className="hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:flex"
            style={{ background: ADMIN.primary }}
          >
            <Send className="h-4 w-4" />
            ارسال اعلان
          </button>

          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
            title="اعلانات"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <div className="hidden h-8 w-px bg-gray-200 sm:block" />

          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${ADMIN.primary}, #1a4d3d)` }}
            >
              {user?.fullName?.charAt(0) ?? 'U'}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold text-gray-900">{user?.fullName}</p>
              <p className="text-[11px] text-gray-500">مدیر سیستم</p>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header
      className="flex h-16 shrink-0 items-center gap-4 px-6 lg:px-8"
      style={{
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #e1e3e4',
        boxShadow: '0 8px 24px rgba(6, 78, 59, 0.04)',
      }}
    >
      <div className="min-w-0 shrink-0">
        <h1 className="text-base font-bold" style={{ color: 'var(--app-primary)' }}>{title}</h1>
        <p className="mt-0.5 text-[11px]" style={{ color: '#416656' }}>پنل کاربری</p>
      </div>

      <div className="relative mx-auto hidden w-full max-w-md lg:block">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#707974' }} />
        <input
          placeholder="جستجو در قراردادها و تیکت‌ها..."
          className="h-10 w-full rounded-full py-2 pr-10 pl-4 text-sm focus:outline-none focus:ring-2"
          style={{ background: '#edeeef', border: '1px solid #bfc9c3', color: '#191c1d' }}
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-2.5 rounded-xl px-3 py-1.5" style={{ background: '#edeeef', border: '1px solid #e1e3e4' }}>
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #064e3b, #003527)' }}
          >
            {user?.fullName?.charAt(0) ?? 'U'}
          </div>
          <span className="hidden text-sm font-medium sm:block" style={{ color: '#294e3f' }}>{user?.fullName}</span>
        </div>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:bg-emerald-50" style={{ color: '#416656' }} title="اعلانات">
          <Bell style={{ width: '18px', height: '18px' }} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  )
}
