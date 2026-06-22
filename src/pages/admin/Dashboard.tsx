import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Download, ArrowLeft, Receipt, AlertCircle, Clock } from 'lucide-react'
import {
  PieChart, Pie, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart,
} from 'recharts'
import { adminApi } from '../../api/admin'
import type {
  DashboardSummary, ContractByStatus, CustomerGrowthRow, DashboardMarketRate, ActivityRow,
} from '../../types'
import { toJalaliLabel, jalaliMonthLabel } from '../../utils/persianDate'

// ─── helpers ────────────────────────────────────────────────────────────────

const PALETTE = {
  forest: '#003322',
  forestMid: '#1a4d3d',
  mint: '#4ade80',
  teal: '#14b8a6',
  charcoal: '#1f2937',
  red: '#ef4444',
}
const STATUS_COLORS = [PALETTE.forest, PALETTE.forestMid, PALETTE.mint, PALETTE.teal, '#065f46', '#86efac']

const cardStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '1rem',
  boxShadow: '0 2px 12px rgba(0, 51, 34, 0.06)',
}

function todayJalali() {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())
}

function formatNum(n: number) {
  return n.toLocaleString('fa-IR')
}

function initials(name: string | null | undefined) {
  if (!name) return '؟'
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('')
}

const TABLE_FA: Record<string, string> = {
  Contract: 'قرارداد', ElectricityOrder: 'سفارش', Payment: 'پرداخت',
  CustomerProfile: 'مشتری', Subscription: 'شناسه', User: 'کاربر',
  Announcement: 'اعلان', Ticket: 'تیکت', BillAnalysisReport: 'گزارش قبض',
}

const AUDIT_TYPE_STYLE: Record<string, { label: string; cls: string }> = {
  'ایجاد':  { label: 'ایجاد',       cls: 'bg-[#dcfce7] text-[#003322]' },
  'ویرایش': { label: 'ویرایش',      cls: 'bg-[#ecfdf5] text-[#1a4d3d]' },
  'حذف':    { label: 'حذف',         cls: 'bg-red-50 text-red-600' },
  'تایید':  { label: 'تکمیل شده',  cls: 'bg-[#dcfce7] text-[#003322]' },
  'رد':     { label: 'رد شده',     cls: 'bg-orange-50 text-orange-600' },
  'چاپ':    { label: 'چاپ',         cls: 'bg-slate-100 text-slate-600' },
}

const AVATAR_COLORS = [
  'bg-[#003322]', 'bg-[#1a4d3d]', 'bg-[#14b8a6]',
  'bg-[#065f46]', 'bg-[#4ade80]', 'bg-slate-600',
]

function avatarColor(name: string | null | undefined) {
  const code = (name ?? '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

function exportCsv(rows: ActivityRow[]) {
  const header = ['کاربر', 'عملیات', 'جدول', 'شناسه', 'زمان ثبت', 'وضعیت']
  const lines = rows.map(r => [
    r.userName ?? '',
    r.newValue ?? '',
    TABLE_FA[r.tableName ?? ''] ?? r.tableName ?? '',
    String(r.recordId ?? ''),
    r.createdAt ? new Date(r.createdAt).toLocaleString('fa-IR-u-ca-persian') : '',
    r.auditType,
  ])
  const csv = '﻿' + [header, ...lines].map(r => r.join('\t')).join('\n')
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })),
    download: 'فعالیت‌ها.csv',
  })
  a.click()
}

// ─── sub-components ──────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex h-48 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4ade80] border-t-transparent" />
    </div>
  )
}

function EmptyChart() {
  return <div className="flex h-48 items-center justify-center text-sm text-gray-300">داده‌ای موجود نیست</div>
}

// ─── custom donut legend ──────────────────────────────────────────────────────

function DonutLegend({ data, total }: { data: (ContractByStatus & { fill: string })[]; total: number }) {
  return (
    <div className="mt-3 space-y-2">
      {data.map(d => {
        const pct = total > 0 ? Math.round((d.count / total) * 100) : 0
        return (
          <div key={d.statusId} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
              <span className="text-sm text-gray-600">{d.title ?? `وضعیت ${d.statusId}`}</span>
            </div>
            <span className="text-sm font-bold text-gray-800">{pct}٪</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [summary,        setSummary]        = useState<DashboardSummary | null>(null)
  const [byStatus,       setByStatus]       = useState<ContractByStatus[]>([])
  const [customerGrowth, setCustomerGrowth] = useState<CustomerGrowthRow[]>([])
  const [rates,          setRates]          = useState<DashboardMarketRate[]>([])
  const [activity,       setActivity]       = useState<ActivityRow[]>([])
  const [loading,        setLoading]        = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.getDashboardSummary(),
      adminApi.getDashboardContractsByStatus(),
      adminApi.getDashboardCustomerGrowth(),
      adminApi.getDashboardMarketRates(),
      adminApi.getDashboardRecentActivity(),
    ]).then(([s, cs, cg, mr, ra]) => {
      if (s.code  === 200 && s.result)  setSummary(s.result        as DashboardSummary)
      if (cs.code === 200 && cs.result) setByStatus(cs.result      as ContractByStatus[])
      if (cg.code === 200 && cg.result) setCustomerGrowth(cg.result as CustomerGrowthRow[])
      if (mr.code === 200 && mr.result) setRates(mr.result          as DashboardMarketRate[])
      if (ra.code === 200 && ra.result) setActivity(ra.result       as ActivityRow[])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const statusTotal    = byStatus.reduce((a, s) => a + s.count, 0)
  const statusPieData  = byStatus.map((s, i) => ({
    name: s.title ?? `وضعیت ${s.statusId}`,
    value: s.count,
    fill: STATUS_COLORS[i % STATUS_COLORS.length],
  }))
  const growthData     = customerGrowth.map(r => ({
    name: toJalaliLabel(r.year, r.month),
    حقوقی: r.legal,
    حقیقی: r.real,
  }))
  const ratesData = rates.map(r => ({
    name: jalaliMonthLabel(r.year, r.month),
    'متوسط بازار': r.marketAvg        ?? 0,
    'تابلوی سبز':  r.greenBoardRate   ?? 0,
    'تابلوی آزاد': r.openBoardRate    ?? 0,
  }))

  // market rate change badge
  const latestAvg = rates.length > 0 ? (rates[rates.length - 1]?.marketAvg ?? 0) : 0
  const prevAvg   = rates.length > 1 ? (rates[rates.length - 2]?.marketAvg ?? 0) : 0
  const rateChangePct = prevAvg > 0 ? ((latestAvg - prevAvg) / prevAvg * 100) : 0

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">گزارش هوشمند پایش شبکه</h2>
          <p className="mt-0.5 text-sm text-gray-500">تحلیل داده‌محور وضعیت مشتریان و نوسانات بازار انرژی</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          <span>امروز: {todayJalali()}</span>
        </div>
      </div>

      {/* ── Two-column grid: in RTL first child → RIGHT, second child → LEFT ── */}
      {/* Charts go first (RIGHT, wider), Donut+cards go second (LEFT, narrower)  */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[3fr_2fr]">

        {/* ════ RIGHT COLUMN — Charts ════ */}
        <div className="flex flex-col gap-5">

          {/* Customer growth — area chart, 2 lines */}
          <div className="rounded-2xl p-5"
          style={cardStyle}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800">روند رشد مشتریان</h3>
                <p className="text-xs text-gray-400">تفکیک مشتریان حقیقی و حقوقی در ۱۲ ماه اخیر</p>
              </div>
              <div className="flex gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded-full" style={{ background: PALETTE.charcoal }} />حقوقی</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded-full" style={{ background: PALETTE.mint }} />حقیقی</span>
              </div>
            </div>
            {loading || growthData.length === 0 ? <EmptyChart /> : (
              <div className="mt-3">
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={growthData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLegal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={PALETTE.charcoal} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={PALETTE.charcoal} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={PALETTE.mint} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={PALETTE.mint} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f1" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="حقوقی" stroke={PALETTE.charcoal} strokeWidth={2.5}
                      fill="url(#colorLegal)" dot={{ r: 3, fill: PALETTE.charcoal }} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="حقیقی" stroke={PALETTE.mint} strokeWidth={2.5}
                      fill="url(#colorReal)" dot={{ r: 3, fill: PALETTE.mint }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Market rates — line chart */}
          <div className="rounded-2xl p-5"
          style={cardStyle}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800">نوسانات نرخ بازار</h3>
                <p className="text-xs text-gray-400">تغییرات قیمت هر کیلووات ساعت (ریال)</p>
              </div>
              {rateChangePct !== 0 && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${rateChangePct < 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                  {rateChangePct < 0 ? '↓' : '↑'} {Math.abs(rateChangePct).toFixed(1)}٪ {rateChangePct < 0 ? 'کاهش' : 'افزایش'}
                </span>
              )}
            </div>
            {loading || ratesData.length === 0 ? <EmptyChart /> : (
              <div className="mt-3">
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={ratesData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f1" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="متوسط بازار" stroke={PALETTE.charcoal} strokeWidth={2.5}
                      dot={{ r: 4, fill: '#fff', stroke: PALETTE.charcoal, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="تابلوی سبز" stroke={PALETTE.mint} strokeWidth={1.5}
                      strokeDasharray="4 3" dot={{ r: 2.5, fill: PALETTE.mint }} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="تابلوی آزاد" stroke={PALETTE.forestMid} strokeWidth={1.5}
                      strokeDasharray="4 3" dot={{ r: 2.5, fill: PALETTE.forestMid }} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* ════ LEFT COLUMN — Donut + stat cards ════ */}
        <div className="flex flex-col gap-5">

          {/* Donut: contracts by status */}
          <div className="rounded-2xl p-5"
          style={cardStyle}>
            <h3 className="text-sm font-bold text-gray-800">وضعیت قراردادها</h3>
            <p className="text-xs text-gray-400">توزیع انواع قراردادهای فعال</p>
            {loading ? <Spinner /> : statusPieData.length === 0 ? <EmptyChart /> : (
              <>
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={52} outerRadius={78}
                      dataKey="value" paddingAngle={2} />
                    <Tooltip formatter={(v) => [formatNum(Number(v ?? 0)), 'قرارداد']} />
                  </PieChart>
                </ResponsiveContainer>
                <DonutLegend data={statusPieData.map((d, i) => ({ ...byStatus[i], fill: d.fill }))} total={statusTotal} />
              </>
            )}
          </div>

          {/* Pending registrations */}
          <div className="rounded-2xl p-5" style={{ ...cardStyle, borderRight: `4px solid ${PALETTE.red}` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-red-500">در انتظار تایید ثبت‌نام</p>
                <p className="mt-1 text-4xl font-black text-gray-900">
                  {loading ? '...' : formatNum(summary?.pendingRegistrations ?? 0)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                نیاز به بررسی فوری
              </span>
            </div>
          </div>

          {/* Bill reports — dark card */}
          <div className="rounded-2xl p-5" style={{ background: PALETTE.forest, border: `1px solid ${PALETTE.forestMid}` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium" style={{ color: PALETTE.mint }}>گزارش‌های قبض صادر شده</p>
                <p className="mt-1 text-4xl font-black text-white">
                  {loading ? '...' : formatNum(summary?.billReports ?? 0)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <Receipt className="h-5 w-5" style={{ color: PALETTE.mint }} />
              </div>
            </div>
            <Link to="/admin/bill-reports"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
              style={{ color: PALETTE.mint }}>
              مشاهده جزئیات
              <ArrowLeft className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Activity table — full width ── */}
      <div className="overflow-hidden rounded-2xl" style={cardStyle}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5" style={{ background: '#f8f9fa' }}>
          <div>
            <h3 className="text-sm font-bold text-gray-800">آخرین تعاملات سیستمی</h3>
            <p className="text-xs text-gray-400">رصد بلادرنگ فعالیت‌های کاربران و واحدها</p>
          </div>
          {activity.length > 0 && (
            <button onClick={() => exportCsv(activity)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50">
              <Download className="h-3.5 w-3.5" />
              خروجی اکسل
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : activity.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-300">هنوز فعالیتی ثبت نشده</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-right text-[11px] text-gray-400">
                  <th className="px-5 py-3 font-medium">کاربر</th>
                  <th className="px-5 py-3 font-medium">عملیات</th>
                  <th className="px-5 py-3 font-medium">زمان ثبت</th>
                  <th className="px-5 py-3 font-medium">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activity.map(row => {
                  const tableLabel = TABLE_FA[row.tableName ?? ''] ?? row.tableName ?? ''
                  const desc = row.newValue
                    ? row.newValue
                    : `${row.auditType} ${tableLabel}${row.recordId ? ` (${row.recordId})` : ''}`
                  const badge = AUDIT_TYPE_STYLE[row.auditType] ?? { label: row.auditType, cls: 'bg-gray-100 text-gray-600' }
                  const jalaliTime = row.createdAt
                    ? new Date(row.createdAt).toLocaleString('fa-IR-u-ca-persian', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })
                    : '—'
                  return (
                    <tr key={row.auditId} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(row.userName)}`}>
                            {initials(row.userName)}
                          </div>
                          <span className="font-medium text-gray-700">{row.userName ?? <span className="text-gray-300">نامشخص</span>}</span>
                        </div>
                      </td>
                      <td className="max-w-[260px] px-5 py-3">
                        <p className="truncate text-gray-700">{desc}</p>
                        {tableLabel && <p className="text-[10px] text-gray-400">{tableLabel}</p>}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-[11px] text-gray-500">{jalaliTime}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
