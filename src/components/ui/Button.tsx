import { type ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const base = [
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'disabled:cursor-not-allowed disabled:opacity-60',
    'active:scale-[0.97]',
  ].join(' ')

  const variants = {
    primary: [
      'bg-emerald-800 text-white shadow-sm',
      'hover:bg-emerald-900 hover:shadow-md',
      'focus:ring-primary-500',
    ].join(' '),
    secondary: [
      'border border-gray-200 bg-white text-gray-700 shadow-sm',
      'hover:bg-gray-50 hover:border-gray-300',
      'focus:ring-primary-300',
    ].join(' '),
    danger: [
      'bg-red-600 text-white shadow-sm',
      'hover:bg-red-700 hover:shadow-md',
      'focus:ring-red-500',
    ].join(' '),
    ghost: [
      'text-gray-600',
      'hover:bg-gray-100 hover:text-emerald-800',
      'focus:ring-primary-300',
    ].join(' '),
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base',
  }

  return (
    <button
      disabled={disabled || loading}
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
