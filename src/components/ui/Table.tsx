import { type ReactNode } from 'react'
import clsx from 'clsx'
import { ChevronRight, ChevronLeft } from 'lucide-react'

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => ReactNode
  className?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyText?: string
  keyField?: keyof T
}

export function Table<T extends object>({ columns, data, loading, emptyText = 'داده‌ای یافت نشد', keyField }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={clsx('px-4 py-3 text-right text-xs font-semibold text-gray-500', col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                  در حال بارگذاری...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-gray-400">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={keyField ? String(row[keyField]) : idx}
                className="transition-colors hover:bg-gray-50"
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className={clsx('px-4 py-3 text-right text-gray-700', col.className)}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[String(col.key)] ?? '-')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between px-1 pt-3 text-sm text-gray-600">
      <span>
        نمایش {from} تا {to} از {total} رکورد
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={clsx(
              'min-w-[2rem] rounded px-2 py-1 text-xs font-medium',
              p === page ? 'bg-primary-600 text-white' : 'hover:bg-gray-100'
            )}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
