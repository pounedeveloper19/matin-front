import clsx from 'clsx'

type BadgeVariant = 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'purple'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  green:  'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/50',
  blue:   'bg-blue-100 text-blue-700 ring-1 ring-blue-200/50',
  amber:  'bg-amber-100 text-amber-700 ring-1 ring-amber-200/50',
  red:    'bg-red-100 text-red-700 ring-1 ring-red-200/50',
  gray:   'bg-gray-100 text-gray-600 ring-1 ring-gray-200/50',
  purple: 'bg-purple-100 text-purple-700 ring-1 ring-purple-200/50',
}

export function contractStatusVariant(status: string): BadgeVariant {
  if (status.includes('فعال') || status.includes('تایید')) return 'green'
  if (status.includes('انتظار') || status.includes('بررسی')) return 'amber'
  if (status.includes('لغو') || status.includes('رد')) return 'red'
  return 'gray'
}

export function ticketStatusVariant(status: string): BadgeVariant {
  if (status.includes('بسته') || status.includes('حل')) return 'green'
  if (status.includes('باز') || status.includes('جدید')) return 'blue'
  if (status.includes('انتظار')) return 'amber'
  return 'gray'
}

export default function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
