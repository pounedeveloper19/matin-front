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
  selectable?: boolean
  selectedIds?: number[]
  onSelectedChange?: (ids: number[]) => void
}

export function Table<T extends object>({
  columns,
  data,
  loading,
  emptyText = 'داده‌ای یافت نشد',
  keyField,
  selectable,
  selectedIds = [],
  onSelectedChange,
}: TableProps<T>) {
  const allIds = keyField ? data.map((row) => Number(row[keyField])) : []
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id))
  const someSelected = allIds.some((id) => selectedIds.includes(id))

  const toggleAll = () => {
    if (!onSelectedChange) return
    onSelectedChange(allSelected ? [] : allIds)
  }

  const toggleOne = (id: number) => {
    if (!onSelectedChange) return
    onSelectedChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    )
  }

  const colCount = columns.length + (selectable ? 1 : 0)

  return (
    <div
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
      style={{
        boxShadow: '0 2px 12px rgba(15,23,42,0.04)',
      }}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y text-sm" style={{ borderColor: '#e5e7eb' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {selectable && (
                <th className="w-10 px-4 py-3 text-right">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 cursor-pointer accent-primary-600"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={clsx(
                    'px-4 py-3 text-right text-xs font-bold text-gray-600 tracking-wide',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: '#f1f5f9' }}>
            {loading ? (
              <tr>
                <td colSpan={colCount} className="py-14 text-center text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                    <span className="text-sm">در حال بارگذاری...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="py-14 text-center text-gray-400 text-sm">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const rowId = keyField ? Number(row[keyField]) : idx
                const checked = selectedIds.includes(rowId)
                return (
                  <tr
                    key={keyField ? String(row[keyField]) : idx}
                    className={clsx(
                      'transition-colors duration-100',
                      checked
                        ? 'bg-emerald-50/70'
                        : 'hover:bg-gray-50'
                    )}
                  >
                    {selectable && (
                      <td className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(rowId)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 cursor-pointer accent-primary-600"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={clsx('px-4 py-3.5 text-right text-gray-700', col.className)}
                      >
                        {col.render
                          ? col.render(row)
                          : String((row as Record<string, unknown>)[String(col.key)] ?? '—')}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
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
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const visiblePages = (() => {
    const delta = 2
    const range: number[] = []
    const left = Math.max(1, page - delta)
    const right = Math.min(totalPages, page + delta)
    for (let i = left; i <= right; i++) range.push(i)
    return range
  })()

  return (
    <div className="flex items-center justify-between px-1 pt-4 text-sm text-gray-500">
      <span className="text-xs">
        نمایش {from} تا {to} از {total} رکورد
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-100 hover:text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        {visiblePages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={clsx(
              'flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-semibold transition-all',
              p === page
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100 hover:text-emerald-800'
            )}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-100 hover:text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
