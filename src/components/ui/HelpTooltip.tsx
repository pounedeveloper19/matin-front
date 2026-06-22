import { useState, useEffect, useRef } from 'react'
import { HelpCircle } from 'lucide-react'
import client from '../../api/client'
import type { ExecutionResult } from '../../types'

type TooltipEntry = { id: number; fieldKey: string; title: string; content: string }

const cache: Record<string, TooltipEntry[]> = {}

async function fetchTooltips(pageKey: string): Promise<TooltipEntry[]> {
  if (cache[pageKey]) return cache[pageKey]
  try {
    const res = await client.get<ExecutionResult<TooltipEntry[]>>(
      '/Tooltip/GetByPage', { params: { pageKey } }
    )
    if (res.data.code === 200) {
      const items = Array.isArray(res.data.result) ? res.data.result : []
      cache[pageKey] = items
      return items
    }
  } catch {}
  cache[pageKey] = []
  return []
}

interface Props {
  pageKey: string
  fieldKey: string
}

export default function HelpTooltip({ pageKey, fieldKey }: Props) {
  const [entry, setEntry] = useState<TooltipEntry | null>(null)
  const [open, setOpen]   = useState(false)
  const hideTimer         = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetchTooltips(pageKey).then(items => {
      setEntry(items.find(t => t.fieldKey === fieldKey) ?? null)
    })
  }, [pageKey, fieldKey])

  if (!entry) return null

  const show = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setOpen(true)
  }
  const hide = () => { hideTimer.current = setTimeout(() => setOpen(false), 150) }

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {/* Badge */}
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600 transition-colors hover:border-blue-400 hover:bg-blue-100"
      >
        <HelpCircle className="h-3 w-3" />
        راهنما
      </button>

      {/* Popup */}
      {open && (
        <div
          onMouseEnter={show}
          onMouseLeave={hide}
          className="absolute bottom-full left-0 z-50 mb-2 rounded-xl border border-blue-100 bg-white shadow-xl"
          style={{ minWidth: '230px', maxWidth: '320px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 rounded-t-xl border-b border-blue-50 bg-blue-50 px-3 py-2">
            <HelpCircle className="h-3.5 w-3.5 shrink-0 text-blue-500" />
            <span className="text-xs font-bold text-blue-800">{entry.title}</span>
          </div>
          {/* Content */}
          <div className="px-3 py-2.5">
            <p className="whitespace-pre-line text-xs leading-6 text-gray-600">{entry.content}</p>
          </div>
          {/* Arrow */}
          <div className="absolute -bottom-1.5 left-4 h-3 w-3 rotate-45 border-b border-r border-blue-100 bg-white" />
        </div>
      )}
    </div>
  )
}
