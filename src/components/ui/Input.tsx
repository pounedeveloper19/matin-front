import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'
import clsx from 'clsx'
import DatePickerLib from 'react-multi-date-picker'
import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  error?: string
  hint?: string
  prefix?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, className, id, ...props }, ref) => {
    const inputId = id ?? label

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'block w-full rounded-lg border bg-white py-2.5 text-sm shadow-sm transition-colors placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
              prefix ? 'pr-10 pl-4' : 'px-4',
              error
                ? 'border-red-400 focus:ring-red-400'
                : 'border-gray-300 focus:border-primary-500',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input

interface SelectProps extends Omit<InputHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  error?: string
  hint?: string
  placeholder?: string
  loading?: boolean
  options: { value: string | number; label: string }[]
  onChange?: (value: number | string) => void
}

export function Select({ label, error, hint, placeholder = 'انتخاب کنید...', loading, options, className, id, value, onChange, disabled, ...props }: SelectProps) {
  const inputId = id ?? label
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={inputId}
        value={value ?? ''}
        disabled={disabled || loading}
        onChange={(e) => onChange?.(e.target.value)}
        className={clsx(
          'block w-full rounded-lg border bg-white px-4 py-2.5 text-sm shadow-sm transition-colors',
          'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500',
          error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300',
          (disabled || loading) && 'cursor-not-allowed opacity-60',
          className
        )}
        {...props}
      >
        <option value="">{loading ? 'در حال بارگذاری...' : placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

interface DatePickerProps {
  label?: string
  error?: string
  hint?: string
  value?: string | null
  onChange?: (value: string) => void
  disabled?: boolean
  min?: string
  max?: string
}

export function DatePicker({ label, error, hint, value, onChange, disabled }: DatePickerProps) {
  const jsDate = value ? new Date(value) : null

  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      )}
      <DatePickerLib
        calendar={persian}
        locale={persian_fa}
        value={jsDate}
        onChange={(date: any) => {
          if (!date) { onChange?.(''); return }
          const g = date.toDate()
          onChange?.(g.toISOString().slice(0, 10))
        }}
        disabled={disabled}
        containerStyle={{ width: '100%' }}
        inputClass={clsx(
          'block w-full rounded-lg border bg-white px-4 py-2.5 text-sm shadow-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-500',
          error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:border-primary-500',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}
