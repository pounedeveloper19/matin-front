import { BarChart2, RefreshCw, Download, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { uploadApi } from '../../../api/upload'

export const fmt  = (n: number) => n.toLocaleString('fa-IR', { maximumFractionDigits: 0 })
export const rial = (n: number) => fmt(n) + ' ریال'

export function exportCSV(headers: string[], rows: (string | number | null)[][], filename: string) {
  const bom = '﻿'
  const lines = [headers.join(','), ...rows.map(r => r.map(c => `"${c ?? ''}"`).join(','))]
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export function PageHeader({ icon: Icon, title, subtitle }: {
  icon: React.ElementType; title: string; subtitle: string
}) {
  return (
    <div className="glass-card flex items-center gap-3 rounded-2xl px-5 py-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
    </div>
  )
}

export function FilterRow({ children, loading }: { children: React.ReactNode; loading: boolean }) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
      {children}
      {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />}
    </div>
  )
}

export function FilterSearch({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div className="flex-1 min-w-44">
      <label className="mb-1 block text-xs font-semibold text-gray-600">جستجو</label>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          className="w-full rounded-xl border border-gray-200 py-2 pr-8 pl-3 text-sm focus:border-indigo-400 focus:outline-none"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

export function FilterSelect({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-600">{label}</label>
      <select
        className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        value={value}
        onChange={e => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  )
}

export function FilterDate({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-600">{label}</label>
      <input
        type="date"
        className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

export function ApplyBtn({ loading, onApply }: { loading: boolean; onApply: () => void }) {
  return (
    <button onClick={onApply} disabled={loading}
      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
      اعمال فیلتر
    </button>
  )
}

export function CsvBtn({ onExport }: { onExport: () => void }) {
  return (
    <button onClick={onExport}
      className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
      <Download className="h-3.5 w-3.5" />
      خروجی CSV
    </button>
  )
}

export function StatCard({ label, value, color }: {
  label: string; value: string | number
  color: 'indigo' | 'emerald' | 'blue' | 'amber' | 'gray'
}) {
  const palette = {
    indigo:  'border-indigo-100  bg-indigo-50  text-indigo-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    blue:    'border-blue-100    bg-blue-50    text-blue-700',
    amber:   'border-amber-100   bg-amber-50   text-amber-700',
    gray:    'border-gray-100    bg-gray-50    text-gray-700',
  }
  return (
    <div className={`rounded-xl border p-3 ${palette[color]}`}>
      <p className="text-[10px] font-medium opacity-70">{label}</p>
      <p className="mt-0.5 text-sm font-bold leading-tight">{value}</p>
    </div>
  )
}

export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

export function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr style={{ background: '#f8fafc' }}>
        {cols.map(h => (
          <th key={h} className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold text-gray-500">{h}</th>
        ))}
      </tr>
    </thead>
  )
}

export function Td({ children, mono, bold, className }: {
  children: React.ReactNode; mono?: boolean; bold?: boolean; className?: string
}) {
  return (
    <td className={`px-3 py-2.5 text-xs text-gray-700 ${mono ? 'font-mono' : ''} ${bold ? 'font-bold text-gray-900' : ''} ${className ?? ''}`}>
      {children}
    </td>
  )
}

export function Badge({ bg, text, children }: { bg: string; text: string; children: React.ReactNode }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${bg} ${text}`}>{children}</span>
}

export function EmptyRow({ cols }: { cols: number }) {
  return <tr><td colSpan={cols} className="py-10 text-center text-sm text-gray-400">داده‌ای یافت نشد</td></tr>
}

export function EmptyState({ loading, onLoad, label }: {
  loading: boolean; onLoad: () => void; label: string
}) {
  return (
    <div className="flex flex-col items-center py-16 text-gray-400">
      <BarChart2 className="mb-3 h-10 w-10 text-gray-300" />
      <p className="font-semibold text-gray-500">{label} بارگذاری نشده</p>
      <p className="mt-1 text-xs">فیلترها را تنظیم کنید و «اعمال فیلتر» را بزنید</p>
      <button onClick={onLoad} disabled={loading}
        className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        بارگذاری
      </button>
    </div>
  )
}

export function DownloadReceiptBtn({ fileId }: { fileId: string | null }) {
  if (!fileId) return null
  return (
    <button
      onClick={() => uploadApi.download(fileId).catch(() => toast.error('خطا در دانلود'))}
      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100">
      <Download className="h-3 w-3" />
      دانلود
    </button>
  )
}
