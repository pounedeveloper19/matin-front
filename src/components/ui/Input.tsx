import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'
import clsx from 'clsx'

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

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string | number; label: string }[]
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
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
        className={clsx(
          'block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm',
          'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500',
          error && 'border-red-400',
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
