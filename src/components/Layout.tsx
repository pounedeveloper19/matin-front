import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const pageTitles: Record<string, string> = {
  '/customer/dashboard': 'داشبورد',
  '/customer/profile': 'پروفایل کاربری',
  '/customer/contracts': 'قراردادها',
  '/customer/bills': 'تحلیل قبض',
  '/customer/tickets': 'تیکت‌های پشتیبانی',
  '/admin/dashboard': 'داشبورد مدیریت',
  '/admin/legal-customers': 'مشتریان حقوقی',
  '/admin/real-customers': 'مشتریان حقیقی',
  '/admin/contracts': 'مدیریت قراردادها',
}

interface LayoutProps {
  role: 'admin' | 'customer'
}

export default function Layout({ role }: LayoutProps) {
  const { pathname } = useLocation()
  const title = pageTitles[pathname] ?? 'متین پاور'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
