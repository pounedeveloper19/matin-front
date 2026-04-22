import { useEffect, useState } from 'react'
import { Save, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import Button from '../../components/ui/Button'
import type { HourEntry } from '../../types'

const JALALI_MONTHS = ['','فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']

const TOU_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: 'bg-red-500',    text: 'text-white', label: 'اوج بار' },
  2: { bg: 'bg-yellow-400', text: 'text-black', label: 'میان بار' },
  3: { bg: 'bg-green-500',  text: 'text-white', label: 'کم بار' },
  4: { bg: 'bg-purple-500', text: 'text-white', label: 'اوج جمعه' },
}

export default function AdminTouSchedule() {
  const [entities, setEntities]     = useState<{ id: number; name: string }[]>([])
  const [touTypes, setTouTypes]     = useState<{ id: number; title: string }[]>([])
  const [entityId, setEntityId]     = useState<number>(0)
  const [month, setMonth]           = useState<number>(1)
  const [schedule, setSchedule]     = useState<Record<number, number>>({})
  const [activeTou, setActiveTou]   = useState<number>(1)
  const [loading, setLoading]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [dragging, setDragging]     = useState(false)

  useEffect(() => {
    Promise.all([adminApi.getPowerEntities(), adminApi.getTouTypes()]).then(([pe, tt]) => {
      const peList = (pe.result as any) ?? []
      const ttList = (tt.result as any) ?? []
      setEntities(peList)
      setTouTypes(ttList)
      if (peList.length > 0) setEntityId(peList[0].id)
    })
  }, [])

  useEffect(() => {
    if (!entityId) return
    setLoading(true)
    adminApi.getMonthSchedule(entityId, month)
      .then((r) => {
        const hours = (r.result as HourEntry[]) ?? []
        const map: Record<number, number> = {}
        hours.forEach((h) => { map[h.hourNumber] = h.toutypeId })
        setSchedule(map)
      })
      .finally(() => setLoading(false))
  }, [entityId, month])

  const applyHour = (h: number) => {
    setSchedule((prev) => ({ ...prev, [h]: activeTou }))
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
      else toast.error(res.caption ?? 'خطا در ذخیره‌سازی')
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const clearAll = () => setSchedule({})

  const fillAll = (toutypeId: number) => {
    const map: Record<number, number> = {}
    for (let h = 0; h < 24; h++) map[h] = toutypeId
    setSchedule(map)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-600">برنامه‌ریزی TOU ساعتی</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">شرکت برق</label>
          <select
            value={entityId}
            onChange={(e) => setEntityId(+e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">ماه</label>
          <select
            value={month}
            onChange={(e) => setMonth(+e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {JALALI_MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* TOU type picker */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">نوع فعال:</span>
        {(touTypes.length > 0 ? touTypes : Object.entries(TOU_COLORS).map(([id, c]) => ({ id: +id, title: c.label }))).map((t) => {
          const style = TOU_COLORS[t.id] ?? { bg: 'bg-gray-400', text: 'text-white', label: t.title }
          return (
            <button
              key={t.id}
              onClick={() => setActiveTou(t.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${style.bg} ${style.text} ${activeTou === t.id ? 'ring-2 ring-offset-1 ring-gray-700 scale-105' : 'opacity-70'}`}
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
        {Object.entries(TOU_COLORS).map(([id, c]) => (
          <button
            key={id}
            onClick={() => fillAll(+id)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${c.bg} ${c.text} opacity-60 hover:opacity-100`}
          >
            همه {c.label}
          </button>
        ))}
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
          {Array.from({ length: 24 }, (_, h) => {
            const tou = schedule[h]
            const style = tou ? TOU_COLORS[tou] : null
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
                {style && <span className="mt-0.5 text-[10px] opacity-80">{TOU_COLORS[tou!]?.label}</span>}
              </div>
            )
          })}
        </div>
      )}

      {/* Legend + Save */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {Object.entries(TOU_COLORS).map(([id, c]) => (
            <span key={id} className="flex items-center gap-1">
              <span className={`inline-block h-3 w-3 rounded-sm ${c.bg}`} />
              {c.label}
            </span>
          ))}
        </div>
        <Button loading={saving} onClick={handleSave}>
          <Save className="h-4 w-4" /> ذخیره برنامه
        </Button>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-gray-200 p-4">
        <p className="mb-2 text-xs font-medium text-gray-600">خلاصه ساعات:</p>
        <div className="flex flex-wrap gap-4">
          {Object.entries(TOU_COLORS).map(([id, c]) => {
            const count = Object.values(schedule).filter((v) => v === +id).length
            return (
              <div key={id} className="flex items-center gap-2">
                <span className={`inline-block h-3 w-3 rounded-sm ${c.bg}`} />
                <span className="text-xs text-gray-700">{c.label}: <strong>{count}</strong> ساعت</span>
              </div>
            )
          })}
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm bg-gray-200" />
            <span className="text-xs text-gray-700">تنظیم‌نشده: <strong>{24 - Object.keys(schedule).length}</strong> ساعت</span>
          </div>
        </div>
      </div>
    </div>
  )
}
