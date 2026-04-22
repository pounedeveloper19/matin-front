import { type ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div className={clsx('rounded-xl border border-gray-200 bg-white shadow-sm', padding && 'p-6', className)}>
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  color?: 'green' | 'blue' | 'amber' | 'red' | 'purple'
  subtitle?: string
}

const colorMap = {
  green:  { bg: 'bg-emerald-50',  icon: 'bg-emerald-100 text-emerald-600',  value: 'text-emerald-700' },
  blue:   { bg: 'bg-blue-50',     icon: 'bg-blue-100 text-blue-600',         value: 'text-blue-700' },
  amber:  { bg: 'bg-amber-50',    icon: 'bg-amber-100 text-amber-600',       value: 'text-amber-700' },
  red:    { bg: 'bg-red-50',      icon: 'bg-red-100 text-red-600',           value: 'text-red-700' },
  purple: { bg: 'bg-purple-50',   icon: 'bg-purple-100 text-purple-600',     value: 'text-purple-700' },
}

export function StatCard({ title, value, icon, color = 'green', subtitle }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className={clsx('rounded-xl border border-gray-200 p-5', c.bg)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={clsx('mt-1 text-2xl font-bold', c.value)}>{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className={clsx('rounded-lg p-2.5', c.icon)}>{icon}</div>
      </div>
    </div>
  )
}
