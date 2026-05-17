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
      className="flex h-16 shrink-0 items-center gap-4 px-6 lg:px-8"
      style={{
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #e1e3e4',
        boxShadow: '0 8px 24px rgba(6, 78, 59, 0.04)',
      }}
    >
      {/* Page title — right side (RTL) */}
      <div className="min-w-0 shrink-0">
        <h1 className="text-base font-bold" style={{ color: 'var(--app-primary)' }}>{title}</h1>
        <p className="mt-0.5 text-[11px]" style={{ color: '#416656' }}>
          {role === 'admin' ? 'پنل مدیریت سیستم' : 'پنل کاربری'}
        </p>
      </div>

      {/* Center search (matches reference top bar) */}
      <div className="relative mx-auto hidden w-full max-w-md lg:block">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#707974' }} />
        <input
          placeholder={role === 'admin' ? 'جستجو در درخواست‌ها...' : 'جستجو در قراردادها و تیکت‌ها...'}
          className="h-10 w-full rounded-full py-2 pr-10 pl-4 text-sm focus:outline-none focus:ring-2"
          style={{
            background: '#edeeef',
            border: '1px solid #bfc9c3',
            color: '#191c1d',
            boxShadow: 'none',
          }}
        />
      </div>

      {/* Actions — left side (RTL: user pill rightmost, bell leftmost) */}
      <div className="flex shrink-0 items-center gap-2">
        {/* User pill */}
        <div
          className="flex items-center gap-2.5 rounded-xl px-3 py-1.5"
          style={{ background: '#edeeef', border: '1px solid #e1e3e4' }}
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #064e3b, #003527)' }}
          >
            {user?.fullName?.charAt(0) ?? 'U'}
          </div>
          <span className="hidden text-sm font-medium sm:block" style={{ color: '#294e3f' }}>
            {user?.fullName}
          </span>
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:bg-emerald-50"
          style={{ color: '#416656' }}
          title="تنظیمات"
        >
          <Settings style={{ width: '18px', height: '18px' }} />
        </button>

        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:bg-emerald-50"
          style={{ color: '#416656' }}
          title="اعلانات"
        >
          <Bell style={{ width: '18px', height: '18px' }} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  )
}
