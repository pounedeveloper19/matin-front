import clsx from 'clsx'

type BadgeVariant = 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'purple'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  green:  'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
  blue:   'bg-blue-100 text-blue-800 ring-1 ring-blue-200',
  amber:  'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
  red:    'bg-red-100 text-red-800 ring-1 ring-red-200',
  gray:   'bg-gray-100 text-gray-700 ring-1 ring-gray-200',
  purple: 'bg-purple-100 text-purple-800 ring-1 ring-purple-200',
}

// نگاشت دقیق بر اساس EnumContractStatuses واقعی دیتابیس (نه تشخیص از روی متن):
// 1=پیش‌نویس، 2=فعال، 3=منقضی شده، 4=فسخ شده، 5=عدم تایید
const CONTRACT_STATUS_VARIANT: Record<number, BadgeVariant> = {
  1: 'amber',
  2: 'green',
  3: 'gray',
  4: 'red',
  5: 'red',
}

export function contractStatusVariantById(statusId: number): BadgeVariant {
  return CONTRACT_STATUS_VARIANT[statusId] ?? 'gray'
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
