import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const pageTitles: Record<string, string> = {
  '/customer/dashboard':  'داشبورد',
  '/customer/profile':    'پروفایل کاربری',
  '/customer/contracts':  'قراردادها',
  '/customer/bills':      'تحلیل قبض',
  '/customer/tickets':    'تیکت‌های پشتیبانی',
  '/admin/dashboard':     'داشبورد مدیریت',
  '/admin/legal-customers': 'مشتریان حقوقی',
  '/admin/real-customers':  'مشتریان حقیقی',
  '/admin/contracts':       'مدیریت قراردادها',
  '/admin/market-rates':    'نرخ‌های بازار',
  '/admin/tariffs':         'تعرفه‌ها',
  '/admin/tou-schedule':    'برنامه TOU',
  '/admin/bill-reports':    'گزارش قبض‌ها',
  '/admin/tickets':         'تیکت‌های پشتیبانی',
  '/admin/announcements':   'اعلانات',
  '/admin/pending-users':   'درخواست‌های ثبت‌نام',
  '/admin/power-entities':  'شرکت‌های برق',
  '/admin/bill-analysis':   'محاسبه تعرفه و سفارش',
}

interface LayoutProps {
  role: 'admin' | 'customer'
}

export default function Layout({ role }: LayoutProps) {
  const { pathname } = useLocation()
  const title = pageTitles[pathname] ?? 'برق متین'

  const shellBg = role === 'admin' ? '#f8f9fa' : 'var(--app-bg)'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: shellBg }}>
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} role={role} />
        <main className="flex-1 overflow-y-auto p-5 lg:p-6" style={role === 'admin' ? { background: '#f8f9fa' } : undefined}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
