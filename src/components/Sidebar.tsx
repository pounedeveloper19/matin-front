import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, User, FileText, Zap,
  Users, Building2, Building, LogOut, Bolt,
  BarChart2, Tag, Clock, Receipt, UserCheck,
  Megaphone, Headset, Shield, ChevronDown, ChevronLeft, ChevronRight,
  ShoppingCart, CreditCard, FlaskConical, Activity, TrendingUp,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { lookupApi } from '../api/lookup'
import type { NavMenuItem } from '../types'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, User, FileText, Zap,
  Users, Building2, Building, Bolt,
  BarChart2, Tag, Clock, Receipt,
  UserCheck, Megaphone, Headset, Shield,
  ShoppingCart, CreditCard, FlaskConical, Activity, TrendingUp,
}

const customerFallback: NavMenuItem[] = [
  { id: 1, title: 'داشبورد',    path: '/customer/dashboard', icon: 'LayoutDashboard', isSelectable: true, children: [] },
  { id: 2, title: 'پروفایل',    path: '/customer/profile',   icon: 'User',            isSelectable: true, children: [] },
  { id: 3, title: 'قراردادها',  path: '/customer/contracts', icon: 'FileText',        isSelectable: true, children: [] },
  { id: 4, title: 'تحلیل قبض',  path: '/customer/bills',     icon: 'Zap',             isSelectable: true, children: [] },
  { id: 6, title: 'سفارشات',      path: '/customer/orders',   icon: 'ShoppingCart', isSelectable: true, children: [] },
  { id: 5, title: 'تیکت‌ها',      path: '/customer/tickets',  icon: 'Headset',      isSelectable: true, children: [] },
  { id: 7, title: 'سود انباشته',  path: '/customer/savings',  icon: 'TrendingUp',   isSelectable: true, children: [] },
]

const adminFallback: NavMenuItem[] = [
  { id: 11, title: 'داشبورد',          path: '/admin/dashboard',       icon: 'LayoutDashboard', isSelectable: true, children: [] },
  { id: 12, title: 'مشتریان حقوقی',    path: '/admin/legal-customers', icon: 'Building2',       isSelectable: true, children: [] },
  { id: 13, title: 'مشتریان حقیقی',    path: '/admin/real-customers',  icon: 'Users',           isSelectable: true, children: [] },
  { id: 14, title: 'قراردادها',         path: '/admin/contracts',       icon: 'FileText',        isSelectable: true, children: [] },
  { id: 15, title: 'نرخ‌های بازار',     path: '/admin/market-rates',    icon: 'BarChart2',       isSelectable: true, children: [] },
  { id: 16, title: 'تعرفه‌ها',          path: '/admin/tariffs',         icon: 'Tag',             isSelectable: true, children: [] },
  { id: 17, title: 'برنامه TOU',        path: '/admin/tou-schedule',    icon: 'Clock',           isSelectable: true, children: [] },
  { id: 27, title: 'سفارشات',           path: '/admin/orders',          icon: 'ShoppingCart',    isSelectable: true, children: [] },
  { id: 36, title: 'محاسبه تعرفه',     path: '/admin/bill-analysis',   icon: 'FlaskConical',    isSelectable: true, children: [] },
  { id: 33, title: 'گزارشات',           path: null,                     icon: 'BarChart2',       isSelectable: false, children: [
    { id: 18, title: 'گزارش قبض‌ها',    path: '/admin/bill-reports',              icon: 'Receipt',      isSelectable: true, children: [] },
    { id: 32, title: 'گزارش قراردادها', path: '/admin/reports/contracts',         icon: 'FileText',     isSelectable: true, children: [] },
    { id: 34, title: 'گزارش سفارشات',    path: '/admin/reports/orders',   icon: 'ShoppingCart', isSelectable: true, children: [] },
    { id: 35, title: 'گزارش پرداخت‌ها',  path: '/admin/reports/payments', icon: 'CreditCard',   isSelectable: true, children: [] },
    { id: 38, title: 'سود انباشته',      path: '/admin/reports/savings',  icon: 'TrendingUp',   isSelectable: true, children: [] },
  ]},
  { id: 19, title: 'تیکت‌ها',           path: '/admin/tickets',         icon: 'Headset',         isSelectable: true, children: [] },
  { id: 20, title: 'اعلانات',           path: '/admin/announcements',   icon: 'Megaphone',       isSelectable: true, children: [] },
  { id: 37, title: 'مدیریت راهنماها',  path: '/admin/tooltips',        icon: 'HelpCircle',      isSelectable: true, children: [] },
  { id: 23, title: 'کدهای تعرفه',       path: null,                     icon: 'Tag',             isSelectable: false, children: [
    { id: 231, title: 'کد تعرفه و گزینه‌ها', path: '/admin/tariff-codes',     icon: 'Tag',     isSelectable: true, children: [] },
    { id: 232, title: 'ضرایب و جرایم',       path: '/admin/tariff-penalties', icon: 'Percent', isSelectable: true, children: [] },
  ]},
  { id: 26, title: 'مدیریت امنیت',      path: null,                     icon: 'Shield',          isSelectable: false, children: [
    { id: 21, title: 'درخواست‌های ثبت‌نام', path: '/admin/pending-users', icon: 'UserCheck', isSelectable: true, children: [] },
    { id: 24, title: 'مدیریت کاربران',      path: '/admin/users',         icon: 'Users',     isSelectable: true, children: [] },
    { id: 25, title: 'نقش‌ها و دسترسی‌ها',  path: '/admin/roles',         icon: 'Shield',    isSelectable: true, children: [] },
  ]},
]

function collectPaths(item: NavMenuItem): string[] {
  const paths: string[] = []
  if (item.path) paths.push(item.path)
  item.children.forEach(c => paths.push(...collectPaths(c)))
  return paths
}

function isGroupActive(item: NavMenuItem, pathname: string): boolean {
  return collectPaths(item).some(p => pathname.startsWith(p))
}

function flattenSelectable(items: NavMenuItem[]): NavMenuItem[] {
  const result: NavMenuItem[] = []
  for (const item of items) {
    if (item.isSelectable && item.path) result.push(item)
    if (item.children?.length) result.push(...flattenSelectable(item.children))
  }
  return result
}

interface SidebarProps { role: 'admin' | 'customer' }

const ADMIN = {
  bg: '#003322',
  activeBg: '#1a4d3d',
  text: 'rgba(255,255,255,0.88)',
  textMuted: 'rgba(255,255,255,0.55)',
  border: 'rgba(255,255,255,0.08)',
  mint: '#4ade80',
  mintText: '#003322',
}

export default function Sidebar({ role }: SidebarProps) {
  const { user, logout }   = useAuth()
  const location           = useLocation()
  const [navItems, setNavItems]       = useState<NavMenuItem[]>([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [expanded, setExpanded]       = useState<Set<number>>(new Set())
  const [collapsed, setCollapsed]     = useState<boolean>(() => {
    try { return localStorage.getItem('sb-collapsed') === '1' } catch { return false }
  })
  const isAdmin = role === 'admin'

  const toggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('sb-collapsed', next ? '1' : '0') } catch {}
      return next
    })
  }

  useEffect(() => {
    lookupApi.getMyMenu()
      .then(r => {
        const raw: NavMenuItem[] = Array.isArray(r.result) ? r.result : (r.result as any)?.$values ?? []
        setNavItems(raw)
        const auto = new Set<number>()
        raw.forEach(item => {
          if (!item.isSelectable && isGroupActive(item, location.pathname)) auto.add(item.id)
        })
        setExpanded(auto)
      })
      .catch(() => setNavItems(role === 'admin' ? adminFallback : customerFallback))
      .finally(() => setMenuLoading(false))
  }, [role])

  useEffect(() => {
    setExpanded(prev => {
      const next = new Set(prev)
      navItems.forEach(item => {
        if (!item.isSelectable && isGroupActive(item, location.pathname)) next.add(item.id)
      })
      return next
    })
  }, [location.pathname, navItems])

  const toggle = (id: number) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const renderItem = (item: NavMenuItem, depth = 0) => {
    const Icon = iconMap[item.icon] ?? Shield
    const indent = depth * 12

    if (!item.isSelectable) {
      const open   = expanded.has(item.id)
      const active = isGroupActive(item, location.pathname)
      return (
        <li key={item.id}>
          <button
            onClick={() => toggle(item.id)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150"
            style={{
              paddingRight: `${12 + indent}px`,
              color: isAdmin ? (active ? '#fff' : ADMIN.text) : (active ? '#064e3b' : '#416656'),
              background: isAdmin
                ? (active ? ADMIN.activeBg : 'transparent')
                : (active ? 'rgba(6,78,59,0.07)' : 'transparent'),
            }}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate text-right">{item.title}</span>
            {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" /> : <ChevronLeft className="h-3.5 w-3.5 shrink-0 opacity-60" />}
          </button>
          {open && item.children.length > 0 && (
            <ul className="mt-0.5 space-y-0.5 mr-5" style={{ borderRight: isAdmin ? `1px solid ${ADMIN.border}` : '1px solid #d1fae5' }}>
              {item.children.map(c => renderItem(c, depth + 1))}
            </ul>
          )}
        </li>
      )
    }

    return (
      <li key={item.id}>
        <NavLink
          to={item.path as string}
          end
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150"
          style={({ isActive }) => ({
            paddingRight: `${12 + indent}px`,
            background: isActive ? (isAdmin ? ADMIN.activeBg : '#064e3b') : 'transparent',
            color: isActive ? '#ffffff' : (isAdmin ? ADMIN.text : '#416656'),
          })}
        >
          {({ isActive }) => (
            <>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.title}</span>
              {isActive && isAdmin && (
                <span className="mr-auto h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: ADMIN.mint }} />
              )}
            </>
          )}
        </NavLink>
      </li>
    )
  }

  const renderCollapsedItem = (item: NavMenuItem) => {
    const Icon = iconMap[item.icon] ?? Shield
    const pathname = location.pathname
    const isActive = item.path ? pathname.startsWith(item.path) : false
    return (
      <li key={item.id}>
        <NavLink
          to={item.path as string}
          end
          title={item.title}
          className="flex items-center justify-center rounded-xl py-2.5 text-sm transition-all duration-150"
          style={({ isActive: a }) => ({
            background: a ? (isAdmin ? ADMIN.activeBg : '#064e3b') : 'transparent',
            color: a ? '#ffffff' : (isAdmin ? ADMIN.text : '#416656'),
          })}
        >
          <Icon className="h-5 w-5 shrink-0" />
        </NavLink>
      </li>
    )
  }

  if (isAdmin) {
    return (
      <aside
        className={`flex h-full shrink-0 flex-col sidebar-scroll overflow-y-auto text-white transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'}`}
        style={{ background: ADMIN.bg, boxShadow: '4px 0 24px rgba(0,0,0,0.12)' }}
      >
        {/* Header */}
        <div
          className={`flex flex-col items-center py-6 text-center ${collapsed ? 'px-2' : 'px-5'}`}
          style={{ borderBottom: `1px solid ${ADMIN.border}` }}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: ADMIN.activeBg }}>
            <Bolt className="h-5 w-5" style={{ color: ADMIN.mint }} />
          </div>
          {!collapsed && (
            <>
              <p className="mt-3 text-base font-bold leading-tight text-white">مدیریت برق</p>
              <p className="mt-1 text-[11px]" style={{ color: ADMIN.textMuted }}>پنل هوشمند انرژی</p>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 py-4 ${collapsed ? 'px-1' : 'px-3'}`}>
          {menuLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: ADMIN.mint, borderTopColor: 'transparent' }} />
            </div>
          ) : collapsed ? (
            <ul className="space-y-0.5">
              {flattenSelectable(navItems).map(item => renderCollapsedItem(item))}
            </ul>
          ) : (
            <ul className="space-y-0.5">{navItems.map(item => renderItem(item))}</ul>
          )}
        </nav>

        {/* Footer */}
        <div className={`pb-4 ${collapsed ? 'px-1' : 'px-3'}`} style={{ borderTop: `1px solid ${ADMIN.border}` }}>
          {!collapsed && (
            <NavLink
              to="/admin/dashboard"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: ADMIN.mint, color: ADMIN.mintText }}
            >
              <Activity className="h-4 w-4" />
              گزارش لحظه‌ای
            </NavLink>
          )}
          <div
            className={`mb-2 mt-3 flex items-center rounded-xl ${collapsed ? 'justify-center px-1 py-2' : 'gap-3 px-3 py-2.5'}`}
            style={{ background: ADMIN.activeBg }}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: ADMIN.mint, color: ADMIN.mintText }}>
              {user?.fullName?.charAt(0) ?? 'U'}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{user?.fullName}</p>
                <p className="text-[11px]" style={{ color: ADMIN.textMuted }}>مدیر سیستم</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={logout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all hover:bg-white/10"
              style={{ color: ADMIN.text }}
            >
              <LogOut className="h-4 w-4" />
              خروج از سیستم
            </button>
          )}
          <button
            onClick={toggleCollapse}
            className={`flex w-full items-center rounded-xl px-3 py-2 text-sm transition-all hover:bg-white/10 ${collapsed ? 'justify-center' : 'gap-2.5'}`}
            style={{ color: ADMIN.text }}
            title={collapsed ? 'باز کردن منو' : 'بستن منو'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span>بستن منو</span>}
          </button>
        </div>
      </aside>
    )
  }

  // ── Customer sidebar (light) ──
  return (
    <aside
      className={`flex h-full shrink-0 flex-col sidebar-scroll overflow-y-auto transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'}`}
      style={{
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(20px)',
        boxShadow: '-6px 0 30px rgba(6,78,59,0.06)',
        borderLeft: '1px solid #e1e3e4',
      }}
    >
      {/* Header */}
      <div
        className={`flex flex-col items-center py-6 text-center ${collapsed ? 'px-2' : 'px-5'}`}
        style={{ borderBottom: '1px solid #e1e3e4' }}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: '#064e3b' }}>
          <Bolt className="h-5 w-5 text-emerald-50" />
        </div>
        {!collapsed && (
          <div className="mt-3">
            <p className="text-base font-bold leading-tight" style={{ color: '#003527' }}>توزیع نیروی برق</p>
            <p className="mt-1 text-[11px]" style={{ color: '#416656' }}>مدیریت هوشمند انرژی</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-4 ${collapsed ? 'px-1' : 'px-3'}`}>
        {menuLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : collapsed ? (
          <ul className="space-y-0.5">
            {flattenSelectable(navItems).map(item => renderCollapsedItem(item))}
          </ul>
        ) : (
          <ul className="space-y-0.5">{navItems.map(item => renderItem(item))}</ul>
        )}
      </nav>

      {/* Footer */}
      <div className={`pb-4 ${collapsed ? 'px-1' : 'px-3'}`} style={{ borderTop: '1px solid #e1e3e4' }}>
        <div
          className={`mb-2 mt-3 flex items-center rounded-xl ${collapsed ? 'justify-center px-1 py-2' : 'gap-3 px-3 py-2.5'}`}
          style={{ background: '#edeeef' }}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-emerald-50" style={{ background: '#064e3b' }}>
            {user?.fullName?.charAt(0) ?? 'U'}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" style={{ color: '#294e3f' }}>{user?.fullName}</p>
              <p className="text-[11px]" style={{ color: '#416656' }}>مشتری</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all hover:bg-emerald-900 hover:text-white" style={{ color: '#416656' }}>
            <LogOut className="h-4 w-4" />
            خروج از سیستم
          </button>
        )}
        <button
          onClick={toggleCollapse}
          className={`flex w-full items-center rounded-xl px-3 py-2 text-sm transition-all hover:bg-emerald-900 hover:text-white ${collapsed ? 'justify-center' : 'gap-2.5'}`}
          style={{ color: '#416656' }}
          title={collapsed ? 'باز کردن منو' : 'بستن منو'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>بستن منو</span>}
        </button>
      </div>
    </aside>
  )
}
