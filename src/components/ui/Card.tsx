import { type ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div className={clsx('glass-card-solid rounded-2xl', padding && 'p-6', className)}>
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
  trend?: string
}

const colorMap = {
  green: {
    icon: 'bg-emerald-100 text-emerald-600',
    value: 'text-primary-800',
    trend: 'text-emerald-600 bg-emerald-50',
    dot: 'bg-emerald-400',
  },
  blue: {
    icon: 'bg-blue-100 text-blue-600',
    value: 'text-blue-800',
    trend: 'text-blue-600 bg-blue-50',
    dot: 'bg-blue-400',
  },
  amber: {
    icon: 'bg-amber-100 text-amber-600',
    value: 'text-amber-800',
    trend: 'text-amber-600 bg-amber-50',
    dot: 'bg-amber-400',
  },
  red: {
    icon: 'bg-red-100 text-red-600',
    value: 'text-red-800',
    trend: 'text-red-600 bg-red-50',
    dot: 'bg-red-400',
  },
  purple: {
    icon: 'bg-purple-100 text-purple-600',
    value: 'text-purple-800',
    trend: 'text-purple-600 bg-purple-50',
    dot: 'bg-purple-400',
  },
}

export function StatCard({ title, value, icon, color = 'green', subtitle, trend }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 truncate">{title}</p>
          <p className={clsx('mt-2 text-3xl font-black leading-none tracking-tight', c.value)}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1.5 text-xs text-gray-400 truncate">{subtitle}</p>
          )}
          {trend && (
            <span className={clsx('mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', c.trend)}>
              {trend}
            </span>
          )}
        </div>
        <div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', c.icon)}>
          {icon}
        </div>
      </div>
    </div>
  )
}
