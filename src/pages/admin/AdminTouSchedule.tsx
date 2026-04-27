import { useEffect, useRef, useState } from 'react'
import { Save, Clock, Copy, Upload, FileDown, ChevronRight } from 'lucide-react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import Button from '../../components/ui/Button'
import { DonutChart, AreaWave } from '../../components/ui/Charts'
import type { HourEntry } from '../../types'
import { toArr } from '../../utils'

const JALALI_MONTHS = ['','فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']

function getTouStyle(title: string): { bg: string; text: string } {
  if (title.includes('جمعه'))                          return { bg: 'bg-purple-500', text: 'text-white' }
  if (title.includes('اوج') || title.includes('پیک'))  return { bg: 'bg-red-500',    text: 'text-white' }
  if (title.includes('میان') || title.includes('میانی'))return { bg: 'bg-yellow-400', text: 'text-black' }
  if (title.includes('کم')  || title.includes('کمبار')) return { bg: 'bg-green-500',  text: 'text-white' }
  return { bg: 'bg-gray-400', text: 'text-white' }
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function AdminTouSchedule() {
  const [entities, setEntities]     = useState<{ id: number; name: string }[]>([])
  const [touTypes, setTouTypes]     = useState<{ id: number; title: string }[]>([])
  const [entityId, setEntityId]     = useState<number>(0)
  const [month, setMonth]           = useState<number>(1)
  const [schedule, setSchedule]     = useState<Record<number, number>>({})
  const [activeTou, setActiveTou]   = useState<number>(0)
  const [loading, setLoading]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [copying, setCopying]       = useState(false)
  const [copyFromMonth, setCopyFromMonth] = useState<number>(1)
  const [dragging, setDragging]     = useState(false)

  // Range selection
  const [rangeFrom, setRangeFrom] = useState(0)
  const [rangeTo, setRangeTo]     = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([adminApi.getPowerEntities(), adminApi.getTouTypes()]).then(([pe, tt]) => {
      const peList = toArr(pe.result)
      const ttList = toArr(tt.result)
      setEntities(peList)
      setTouTypes(ttList)
      if (peList.length > 0) setEntityId(peList[0].id)
      if (ttList.length > 0) setActiveTou(ttList[0].id)
    })
  }, [])

  useEffect(() => {
    if (!entityId) return
    setLoading(true)
    adminApi.getMonthSchedule(entityId, month)
      .then((r) => {
        const hours = toArr(r.result) as HourEntry[]
        const map: Record<number, number> = {}
        hours.forEach((h) => { map[h.hourNumber] = h.toutypeId })
        setSchedule(map)
      })
      .finally(() => setLoading(false))
  }, [entityId, month])

  const applyHour = (h: number) => {
    if (!activeTou) return
    setSchedule((prev) => ({ ...prev, [h]: activeTou }))
  }

  const applyRange = () => {
    if (!activeTou) { toast.error('ابتدا نوع TOU را انتخاب کنید'); return }
    const from = Math.min(rangeFrom, rangeTo)
    const to   = Math.max(rangeFrom, rangeTo)
    const updates: Record<number, number> = {}
    for (let h = from; h <= to; h++) updates[h] = activeTou
    setSchedule(prev => ({ ...prev, ...updates }))
    toast.success(`ساعت ${from}:00 تا ${to}:59 اعمال شد`)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const hours: HourEntry[] = Object.entries(schedule).map(([hourNumber, toutypeId]) => ({
        hourNumber: +hourNumber,
        toutypeId,
      }))
      const res = await adminApi.saveSchedule(entityId, month, hours)
      if (res.code === 200) toast.success('برنامه TOU ذخیره شد')
      else toast.error(res.message ?? res.caption ?? 'خطا در ذخیره‌سازی')
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const clearAll = () => setSchedule({})

  const fillAll = (toutypeId: number) => {
    const map: Record<number, number> = {}
    for (let h = 0; h < 24; h++) map[h] = toutypeId
    setSchedule(map)
  }

  const handleCopy = async () => {
    if (copyFromMonth === month) { toast.error('ماه مبدأ و مقصد یکسان است'); return }
    setCopying(true)
    try {
      const res = await adminApi.copyTouFromMonth(entityId, copyFromMonth, month)
      if (res.code === 200) {
        toast.success(`برنامه از ${JALALI_MONTHS[copyFromMonth]} کپی شد`)
        setLoading(true)
        const r2 = await adminApi.getMonthSchedule(entityId, month)
        const hours = toArr(r2.result) as HourEntry[]
        const map: Record<number, number> = {}
        hours.forEach((h) => { map[h.hourNumber] = h.toutypeId })
        setSchedule(map)
        setLoading(false)
      } else { toast.error(res.message ?? res.caption ?? 'خطا در کپی') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setCopying(false) }
  }

  // ── Excel upload ──────────────────────────────────────────────────────
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result
        const wb   = XLSX.read(data, { type: 'binary' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

        const newMap: Record<number, number> = {}
        let matched = 0
        for (const row of rows) {
          const hourRaw = row['ساعت'] ?? row['hour'] ?? row['Hour']
          const typeRaw = row['نوع'] ?? row['type'] ?? row['Type']
          const hour = Number(hourRaw)
          const typeName = String(typeRaw ?? '').trim()
          if (isNaN(hour) || hour < 0 || hour > 23) continue
          const touType = touTypes.find(t =>
            t.title === typeName ||
            t.title.includes(typeName) ||
            typeName.includes(t.title)
          )
          if (touType) { newMap[hour] = touType.id; matched++ }
        }
        if (matched > 0) {
          setSchedule(prev => ({ ...prev, ...newMap }))
          toast.success(`${matched} ساعت از فایل اعمال شد`)
        } else {
          toast.error('هیچ داده معتبری در فایل یافت نشد — ستون‌ها: ساعت، نوع')
        }
      } catch { toast.error('خطا در پردازش فایل اکسل') }
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  const downloadTemplate = () => {
    const typeNames = touTypes.map(t => t.title).join(' / ')
    const headers = ['ساعت', 'نوع']
    const note    = [`انواع معتبر: ${typeNames}`]
    const rows    = HOURS.map(h => [h, ''])
    const ws = XLSX.utils.aoa_to_sheet([headers, note, ...rows])
    ws['!cols'] = [{ wch: 10 }, { wch: 20 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'TOU')
    XLSX.writeFile(wb, 'tou-template.xlsx')
  }

  const styleOf = (id: number) => {
    const t = touTypes.find(t => t.id === id)
    return t ? getTouStyle(t.title) : { bg: 'bg-gray-300', text: 'text-gray-600' }
  }

  const titleOf = (id: number) => touTypes.find(t => t.id === id)?.title ?? ''

  const activeTouStyle = activeTou ? getTouStyle(touTypes.find(t => t.id === activeTou)?.title ?? '') : null
  const activeTouTitle = touTypes.find(t => t.id === activeTou)?.title ?? ''

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-blue-500" />
        <p className="text-sm font-semibold text-gray-700">برنامه‌ریزی TOU ساعتی</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">شرکت برق</label>
          <select
            value={entityId}
            onChange={(e) => setEntityId(+e.target.value)}
            className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
            {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">ماه</label>
          <select
            value={month}
            onChange={(e) => setMonth(+e.target.value)}
            className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
            {JALALI_MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* TOU type picker */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">نوع فعال:</span>
        {touTypes.map((t) => {
          const s = getTouStyle(t.title)
          return (
            <button
              key={t.id}
              onClick={() => setActiveTou(t.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${s.bg} ${s.text} ${activeTou === t.id ? 'ring-2 ring-offset-1 ring-gray-700 scale-105' : 'opacity-70'}`}
            >
              {t.title}
            </button>
          )
        })}
        <button
          onClick={clearAll}
          className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-500 hover:bg-gray-100"
        >
          پاک کردن همه
        </button>
        {touTypes.map((t) => {
          const s = getTouStyle(t.title)
          return (
            <button
              key={t.id}
              onClick={() => fillAll(t.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${s.bg} ${s.text} opacity-60 hover:opacity-100`}
            >
              همه {t.title}
            </button>
          )
        })}
      </div>

      {/* Range selection panel */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
        <span className="text-xs font-medium text-gray-600">انتخاب بازه:</span>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">از</label>
          <select
            value={rangeFrom}
            onChange={(e) => setRangeFrom(+e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm focus:border-primary-400 focus:outline-none"
          >
            {HOURS.map(h => (
              <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
            ))}
          </select>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-gray-400 rotate-180" />
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">تا</label>
          <select
            value={rangeTo}
            onChange={(e) => setRangeTo(+e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm focus:border-primary-400 focus:outline-none"
          >
            {HOURS.map(h => (
              <option key={h} value={h}>{String(h).padStart(2, '0')}:59</option>
            ))}
          </select>
        </div>
        {activeTouStyle && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${activeTouStyle.bg} ${activeTouStyle.text}`}>
            {activeTouTitle}
          </span>
        )}
        <button
          onClick={applyRange}
          className="rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-50"
          disabled={!activeTou}
        >
          اعمال بازه
        </button>
      </div>

      {/* 24-hour grid */}
      {loading ? (
        <div className="flex h-32 items-center justify-center text-gray-400 text-sm">در حال بارگذاری...</div>
      ) : (
        <div
          className="grid select-none"
          style={{ gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px' }}
          onMouseLeave={() => setDragging(false)}
        >
          {HOURS.map((h) => {
            const tou = schedule[h]
            const style = tou ? styleOf(tou) : null
            return (
              <div
                key={h}
                onMouseDown={() => { setDragging(true); applyHour(h) }}
                onMouseEnter={() => { if (dragging) applyHour(h) }}
                onMouseUp={() => setDragging(false)}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 py-3 text-xs font-bold transition-all
                  ${style ? `${style.bg} ${style.text} border-transparent` : 'border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
              >
                <span>{String(h).padStart(2, '0')}:00</span>
                {tou && <span className="mt-0.5 text-[10px] opacity-80">{titleOf(tou)}</span>}
              </div>
            )
          })}
        </div>
      )}

      {/* Legend + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {touTypes.map((t) => {
            const s = getTouStyle(t.title)
            return (
              <span key={t.id} className="flex items-center gap-1">
                <span className={`inline-block h-3 w-3 rounded-sm ${s.bg}`} />
                {t.title}
              </span>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Copy from month */}
          <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1">
            <Copy className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">کپی از:</span>
            <select
              value={copyFromMonth}
              onChange={(e) => setCopyFromMonth(+e.target.value)}
              className="rounded border-0 bg-transparent text-xs text-gray-700 focus:outline-none"
            >
              {JALALI_MONTHS.slice(1).map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <Button size="sm" variant="secondary" loading={copying} onClick={handleCopy}>
              کپی
            </Button>
          </div>

          {/* Excel download template */}
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            title="دانلود فایل نمونه اکسل"
          >
            <FileDown className="h-3.5 w-3.5" /> نمونه اکسل
          </button>

          {/* Excel upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleExcelUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <Upload className="h-3.5 w-3.5" /> بارگزاری اکسل
          </button>

          <Button loading={saving} onClick={handleSave}>
            <Save className="h-4 w-4" /> ذخیره برنامه
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(209,250,229,0.6)' }}>
        <p className="mb-2 text-xs font-semibold text-gray-600">خلاصه ساعات:</p>
        <div className="flex flex-wrap gap-4">
          {touTypes.map((t) => {
            const s = getTouStyle(t.title)
            const count = Object.values(schedule).filter((v) => v === t.id).length
            return (
              <div key={t.id} className="flex items-center gap-2">
                <span className={`inline-block h-3 w-3 rounded-sm ${s.bg}`} />
                <span className="text-xs text-gray-700">{t.title}: <strong>{count}</strong> ساعت</span>
              </div>
            )
          })}
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm bg-gray-200" />
            <span className="text-xs text-gray-700">تنظیم‌نشده: <strong>{24 - Object.keys(schedule).length}</strong> ساعت</span>
          </div>
        </div>
      </div>

      {/* Charts row */}
      {Object.keys(schedule).length > 0 && (() => {
        const peakId  = touTypes.find(t => t.title.includes('اوج') || t.title.includes('پیک'))?.id
        const midId   = touTypes.find(t => t.title.includes('میان') || t.title.includes('میانی'))?.id
        const lowId   = touTypes.find(t => t.title.includes('کم') || t.title.includes('کمبار'))?.id
        const peakH   = peakId  ? Object.values(schedule).filter(v => v === peakId).length  : 0
        const midH    = midId   ? Object.values(schedule).filter(v => v === midId).length   : 0
        const lowH    = lowId   ? Object.values(schedule).filter(v => v === lowId).length   : 0
        const totalSet = peakH + midH + lowH
        const offPeakPct = totalSet ? Math.round(((midH + lowH) / 24) * 100) : 0

        const loadProfile = Array.from({ length: 24 }, (_, h) => {
          const tou = schedule[h]
          if (tou === peakId)  return 60 + Math.sin((h - 12) * 0.3) * 20 + Math.random() * 5
          if (tou === midId)   return 35 + Math.sin((h - 6) * 0.4) * 10  + Math.random() * 4
          if (tou === lowId)   return 15 + Math.random() * 5
          return 25 + Math.random() * 8
        })

        const hourLabels = Array.from({ length: 24 }, (_, i) => i % 3 === 0 ? String(i).padStart(2, '0') : '')

        return (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="flex flex-col items-center gap-3 rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(209,250,229,0.6)' }}>
              <p className="text-xs font-semibold text-gray-600 self-start">صرفه‌جویی اوج‌بار</p>
              <DonutChart value={offPeakPct} color="#10b981" size={110} label="ساعات غیر اوج" />
              <p className="text-[11px] text-gray-400 text-center">
                {midH + lowH} ساعت از ۲۴ ساعت در زمان غیر اوج
              </p>
            </div>

            <div className="col-span-2 rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(209,250,229,0.6)' }}>
              <p className="mb-3 text-xs font-semibold text-gray-600">توزیع بار شبانه‌روزی (شبیه‌سازی)</p>
              <AreaWave
                data={loadProfile}
                color="#10b981"
                height={110}
                labels={hourLabels}
              />
              <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                <span>ابتدای شبانه‌روز</span>
                <span>انتهای شبانه‌روز</span>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
