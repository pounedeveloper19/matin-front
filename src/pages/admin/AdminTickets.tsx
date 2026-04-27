import { useEffect, useRef, useState } from 'react'
import {
  MessageSquare, Send, CheckCircle, XCircle, Clock,
  AlertTriangle, RefreshCw, Plus, MousePointer,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import Badge, { ticketStatusVariant } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { StatCard } from '../../components/ui/Card'
import type { AdminTicketSummary, TicketMessage } from '../../types'
import { toArr } from '../../utils'

const avatarColors = [
  'bg-emerald-100 text-emerald-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]

function cardAccent(statusId: number) {
  if (statusId === 3) return '#10b981'
  return '#3b82f6'
}

type FilterTab = 'all' | 'open' | 'closed'

export default function AdminTickets() {
  const [tickets, setTickets]           = useState<AdminTicketSummary[]>([])
  const [loading, setLoading]           = useState(true)
  const [activeTab, setActiveTab]       = useState<FilterTab>('all')
  const [selected, setSelected]         = useState<AdminTicketSummary | null>(null)
  const [messages, setMessages]         = useState<TicketMessage[]>([])
  const [msgLoading, setMsgLoading]     = useState(false)
  const [reply, setReply]               = useState('')
  const [sending, setSending]           = useState(false)
  const [closing, setClosing]           = useState(false)
  const msgEndRef = useRef<HTMLDivElement>(null)

  const fetchTickets = () => {
    setLoading(true)
    adminApi.getAdminTickets()
      .then((r) => { if (r.code === 200) setTickets(toArr(r.result) as AdminTicketSummary[]) })
      .catch(() => toast.error('خطا در دریافت تیکت‌ها'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTickets() }, [])

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async (ticket: AdminTicketSummary) => {
    setMsgLoading(true)
    setMessages([])
    try {
      const res = await adminApi.getAdminTicketMessages(ticket.id)
      if (res.code === 200) setMessages(toArr(res.result) as TicketMessage[])
    } finally { setMsgLoading(false) }
  }

  const selectTicket = (ticket: AdminTicketSummary) => {
    setSelected(ticket)
    setReply('')
    loadMessages(ticket)
  }

  const handleReply = async () => {
    if (!selected || !reply.trim()) return
    setSending(true)
    try {
      const res = await adminApi.replyTicket({ ticketId: selected.id, body: reply })
      if (res.code === 200) {
        setReply('')
        await loadMessages(selected)
        fetchTickets()
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSending(false) }
  }

  const handleToggleClose = async () => {
    if (!selected) return
    setClosing(true)
    const newStatus = selected.statusId === 3 ? 1 : 3
    try {
      const res = await adminApi.setTicketStatus({ ticketId: selected.id, statusId: newStatus })
      if (res.code === 200) {
        toast.success(newStatus === 3 ? 'تیکت بسته شد' : 'تیکت باز شد')
        setSelected(prev => prev ? { ...prev, statusId: newStatus } : null)
        fetchTickets()
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا') }
    finally { setClosing(false) }
  }

  const openTickets   = tickets.filter(t => t.statusId !== 3)
  const closedTickets = tickets.filter(t => t.statusId === 3)
  const repliedCount  = tickets.filter(t => t.status?.includes('پاسخ')).length

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all',    label: 'همه',        count: tickets.length },
    { key: 'open',   label: 'باز',        count: openTickets.length },
    { key: 'closed', label: 'بسته‌شده',   count: closedTickets.length },
  ]

  const filtered =
    activeTab === 'open'   ? openTickets   :
    activeTab === 'closed' ? closedTickets :
    tickets

  const isClosed = selected?.statusId === 3

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="کل تیکت‌ها"       value={tickets.length}        icon={<MessageSquare className="h-5 w-5" />} color="blue" />
        <StatCard title="باز / در انتظار"   value={openTickets.length}    icon={<Clock className="h-5 w-5" />}        color="amber" />
        <StatCard title="پاسخ داده‌شده"     value={repliedCount}           icon={<CheckCircle className="h-5 w-5" />}  color="green" />
        <StatCard title="بسته‌شده"          value={closedTickets.length}  icon={<XCircle className="h-5 w-5" />}      color="purple" />
      </div>

      {/* Filter tabs + refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1">
          {tabs.map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === tab.key ? 'bg-emerald-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>
        <button onClick={fetchTickets}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-emerald-700 transition-colors">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr] [direction:ltr]">

        {/* LEFT: Conversation panel */}
        <div className="glass-card rounded-2xl overflow-hidden flex flex-col [direction:rtl]" style={{ minHeight: 520 }}>
          {selected ? (
            <>
              {/* Panel header */}
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-emerald-700">
                      TK-{String(selected.id).padStart(4, '0')}
                    </span>
                    <Badge variant={ticketStatusVariant(selected.status ?? '')}>{selected.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-gray-900 leading-snug">{selected.subject}</p>
                  <p className="text-xs text-gray-400">{selected.customerName}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={handleToggleClose}
                    disabled={closing}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isClosed
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    {isClosed ? 'باز کردن' : 'بستن تیکت'}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 p-4" style={{ maxHeight: 360 }}>
                {msgLoading ? (
                  <div className="flex h-24 items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400">پیامی ثبت نشده است</p>
                ) : messages.map((m, i) => (
                  <div key={i}
                    className={`flex flex-col gap-1 rounded-xl px-3 py-2.5 text-sm ${m.isAdmin ? 'mr-6' : 'ml-6'}`}
                    style={m.isAdmin
                      ? { background: 'rgba(239,246,255,0.9)', border: '1px solid rgba(147,197,253,0.4)' }
                      : { background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(209,250,229,0.5)' }
                    }>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-semibold ${m.isAdmin ? 'text-blue-600' : 'text-gray-600'}`}>
                        {m.isAdmin ? '🛡️ پشتیبانی' : `👤 ${m.senderName ?? selected.customerName}`}
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0">{m.createdAt?.split('T')[0]}</span>
                    </div>
                    <p className="leading-relaxed text-gray-700">{m.body}</p>
                  </div>
                ))}
                <div ref={msgEndRef} />
              </div>

              {/* Reply area */}
              {!isClosed ? (
                <div className="border-t border-gray-100 bg-gray-50 p-3 flex gap-2">
                  <textarea
                    rows={3}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleReply() }}
                    placeholder="پاسخ خود را بنویسید... (Ctrl+Enter برای ارسال)"
                    className="flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                  <Button size="sm" loading={sending} onClick={handleReply} className="self-end">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-t border-gray-100 bg-emerald-50 px-4 py-3 text-center">
                  <p className="text-xs text-emerald-600 font-medium">تیکت بسته شده است</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
              <MousePointer className="h-10 w-10 text-gray-200" />
              <p className="text-sm font-medium text-gray-400">یک تیکت را از لیست انتخاب کنید</p>
              <p className="text-xs text-gray-300">مکالمه و پاسخ‌دهی در این پنل نمایش داده می‌شود</p>
            </div>
          )}
        </div>

        {/* RIGHT: Ticket list */}
        <div className="[direction:rtl] space-y-2">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center glass-card rounded-2xl">
              <MessageSquare className="mb-3 h-10 w-10 text-gray-200" />
              <p className="text-sm text-gray-400">تیکتی در این بخش وجود ندارد</p>
            </div>
          ) : filtered.map(ticket => {
            const accent = cardAccent(ticket.statusId)
            const isSelected = selected?.id === ticket.id
            const ticketId = `TK-${String(ticket.id).padStart(4, '0')}`

            return (
              <button
                key={ticket.id}
                onClick={() => selectTicket(ticket)}
                className={`w-full text-right overflow-hidden rounded-xl border-2 bg-white transition-all hover:shadow-sm ${
                  isSelected ? 'border-emerald-500 shadow-sm' : 'border-gray-100 hover:border-gray-200'
                }`}
                style={{ borderRight: `4px solid ${accent}` }}
              >
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColors[ticket.id % avatarColors.length]}`}>
                    {ticket.customerName?.charAt(0) ?? '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 leading-snug truncate">{ticket.subject}</p>
                      <Badge variant={ticketStatusVariant(ticket.status ?? '')}>{ticket.status}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-emerald-600">{ticketId}</span>
                      <span className="text-xs text-gray-400">{ticket.customerName}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{ticket.messageCount ?? 0} پیام</span>
                      {ticket.createdAt && (
                        <>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400">{ticket.createdAt.split('T')[0]}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {ticket.statusId !== 3 && (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  )}
                </div>
                {isSelected && (
                  <div className="h-0.5 bg-emerald-500" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
