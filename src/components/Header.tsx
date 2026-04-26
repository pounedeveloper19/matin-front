import { Bell, Settings } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface HeaderProps {
  title: string
  role: 'admin' | 'customer'
}

export default function Header({ title, role }: HeaderProps) {
  const { user } = useAuth()

  return (
    <header
      className="flex h-16 shrink-0 items-center justify-between px-6 lg:px-8"
      style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(209,250,229,0.7)',
        boxShadow: '0 1px 12px rgba(6,78,59,0.06)',
      }}
    >
      {/* Page title — right side (RTL) */}
      <div>
        <h1 className="text-base font-bold text-primary-900">{title}</h1>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {role === 'admin' ? 'پنل مدیریت سیستم' : 'پنل کاربری'}
        </p>
      </div>

      {/* Actions — left side (RTL: user pill rightmost, bell leftmost) */}
      <div className="flex items-center gap-2">
        {/* User pill */}
        <div
          className="flex items-center gap-2.5 rounded-xl px-3 py-1.5"
          style={{ background: 'rgba(236,253,245,0.8)', border: '1px solid rgba(167,243,208,0.5)' }}
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
          >
            {user?.fullName?.charAt(0) ?? 'U'}
          </div>
          <span className="text-sm font-medium text-primary-800 hidden sm:block">
            {user?.fullName}
          </span>
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-all hover:bg-emerald-50 hover:text-primary-700"
          title="تنظیمات"
        >
          <Settings style={{ width: '18px', height: '18px' }} />
        </button>

        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-all hover:bg-emerald-50 hover:text-primary-700"
          title="اعلانات"
        >
          <Bell style={{ width: '18px', height: '18px' }} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  )
}
