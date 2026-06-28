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

const POPUP_W = 280

type Pos = { top: number; left: number; arrowLeft: number; below: boolean }

export default function HelpTooltip({ pageKey, fieldKey }: Props) {
  const [entry, setEntry] = useState<TooltipEntry | null>(null)
  const [open, setOpen]   = useState(false)
  const [pos, setPos]     = useState<Pos>({ top: 0, left: 0, arrowLeft: 140, below: true })
  const hideTimer         = useRef<ReturnType<typeof setTimeout> | null>(null)
  const buttonRef         = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    fetchTooltips(pageKey).then(items => {
      setEntry(items.find(t => t.fieldKey === fieldKey) ?? null)
    })
  }, [pageKey, fieldKey])

  if (!entry) return null

  const show = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    if (buttonRef.current) {
      const rect      = buttonRef.current.getBoundingClientRect()
      const centerX   = rect.left + rect.width / 2
      const rawLeft   = centerX - POPUP_W / 2
      const left      = Math.max(8, Math.min(rawLeft, window.innerWidth - POPUP_W - 8))
      const arrowLeft = Math.round(Math.max(16, Math.min(centerX - left, POPUP_W - 16)))
      // Show below when there's 200px+ of viewport below the button
      const below     = window.innerHeight - rect.bottom >= 200
      const top       = below ? rect.bottom + 8 : rect.top - 8
      setPos({ top, left, arrowLeft, below })
    }
    setOpen(true)
  }
  const hide = () => { hideTimer.current = setTimeout(() => setOpen(false), 150) }

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600 transition-colors hover:border-blue-400 hover:bg-blue-100"
      >
        <HelpCircle className="h-3 w-3" />
        راهنما
      </button>

      {open && (
        <div
          onMouseEnter={show}
          onMouseLeave={hide}
          style={{
            position: 'fixed',
            ...(pos.below
              ? { top: pos.top }
              : { bottom: window.innerHeight - pos.top }),
            left: pos.left,
            zIndex: 9999,
            width: POPUP_W,
          }}
          className="rounded-xl border border-blue-100 bg-white shadow-xl"
        >
          {pos.below ? (
            /* Arrow at top, pointing up toward button */
            <div
              className="absolute h-3 w-3 border-l border-t border-blue-100 bg-white"
              style={{ top: -6, left: pos.arrowLeft, transform: 'translateX(-50%) rotate(45deg)' }}
            />
          ) : (
            /* Arrow at bottom, pointing down toward button */
            <div
              className="absolute h-3 w-3 border-b border-r border-blue-100 bg-white"
              style={{ bottom: -6, left: pos.arrowLeft, transform: 'translateX(-50%) rotate(45deg)' }}
            />
          )}

          <div className="flex items-center gap-2 rounded-t-xl border-b border-blue-50 bg-blue-50 px-3 py-2">
            <HelpCircle className="h-3.5 w-3.5 shrink-0 text-blue-500" />
            <span className="text-xs font-bold text-blue-800">{entry.title}</span>
          </div>
          <div className="px-3 py-2.5">
            <p className="whitespace-pre-line text-xs leading-6 text-gray-600">{entry.content}</p>
          </div>
        </div>
      )}
    </div>
  )
}
