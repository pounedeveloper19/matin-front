import { useEffect, useState } from 'react'
import { MessageSquare, Send, CheckCircle, XCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
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

function cardAccent(statusId: number, status: string) {
  if (statusId === 3) return '#10b981'
  if (status.includes('انتظار')) return '#f59e0b'
  return '#3b82f6'
}

function TicketCard({ ticket, onStatusChange }: {
  ticket: AdminTicketSummary
  onStatusChange: () => void
}) {
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loading, setLoading]   = useState(false)
  const [reply, setReply]       = useState('')
  const [sending, setSending]   = useState(false)

  const isClosed = ticket.statusId === 3
  const accent   = cardAccent(ticket.statusId, ticket.status)
  const ticketId = `TK-${String(ticket.id).padStart(4, '0')}`

  const loadMessages = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getAdminTicketMessages(ticket.id)
      if (res.code === 200) setMessages(toArr(res.result) as TicketMessage[])
    } finally { setLoading(false) }
  }

  const toggle = async () => {
    if (!open && messages.length === 0) await loadMessages()
    setOpen(v => !v)
  }

  const handleReply = async () => {
    if (!reply.trim()) return
    setSending(true)
    try {
      const res = await adminApi.replyTicket({ ticketId: ticket.id, body: reply })
      if (res.code === 200) {
        toast.success('پاسخ ارسال شد'); setReply('')
        await loadMessages()
        onStatusChange()
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSending(false) }
  }

  const handleClose = async () => {
    try {
      const newStatus = isClosed ? 1 : 3
      const res = await adminApi.setTicketStatus({ ticketId: ticket.id, statusId: newStatus })
      if (res.code === 200) {
        toast.success(newStatus === 3 ? 'تیکت بسته شد' : 'تیکت باز شد')
        onStatusChange()
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا') }
  }

  return (
    <div className="overflow-hidden rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)', border: '1px solid rgba(209,250,229,0.6)', boxShadow: '0 4px 16px rgba(6,78,59,0.06)', borderRight: `4px solid ${accent}` }}>

      {/* Header */}
      <div className="flex flex-wrap items-start gap-3 px-5 py-4">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColors[ticket.id % avatarColors.length]}`}>
          {ticket.customerName?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 leading-snug">{ticket.subject}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-gray-400">{ticketId}</span>
            <span className="text-xs text-gray-400">{ticket.customerName}</span>
            {ticket.createdAt && (
              <span className="text-xs text-gray-400">{ticket.createdAt.split('T')[0]}</span>
            )}
            <span className="text-xs text-gray-400">{ticket.messageCount} پیام</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={ticketStatusVariant(ticket.status)}>{ticket.status}</Badge>
          <button onClick={toggle}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-primary-600 transition-colors">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2 border-t px-5 py-3"
        style={{ borderColor: 'rgba(209,250,229,0.5)', background: 'rgba(236,253,245,0.3)' }}>
        <button onClick={toggle}
          className="rounded-xl border border-emerald-200 bg-white px-4 py-1.5 text-xs font-semibold text-primary-700 hover:bg-emerald-50 transition-colors">
          مشاهده جزئیات
        </button>
        {!isClosed ? (
          <button onClick={() => { setOpen(true); if (messages.length === 0) loadMessages() }}
            className="rounded-xl bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 transition-colors">
            ارسال پاسخ
          </button>
        ) : (
          <button onClick={handleClose}
            className="rounded-xl bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
            <CheckCircle className="inline h-3.5 w-3.5 ml-1" /> باز کردن مجدد
          </button>
        )}
        {!isClosed && (
          <button onClick={handleClose}
            className="rounded-xl bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors">
            <XCircle className="inline h-3.5 w-3.5 ml-1" /> بستن تیکت
          </button>
        )}
      </div>

      {/* Expanded messages + reply */}
      {open && (
        <div className="space-y-3 px-5 pb-5 pt-4"
          style={{ borderTop: '1px solid rgba(209,250,229,0.5)', background: 'rgba(236,253,245,0.15)' }}>
          {loading ? (
            <div className="flex h-16 items-center justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">پیامی ثبت نشده است</p>
          ) : (
            <div className="max-h-72 space-y-3 overflow-y-auto">
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col gap-1 rounded-xl px-4 py-3 ${m.isAdmin ? 'mr-6' : 'ml-6'}`}
                  style={m.isAdmin
                    ? { background: 'rgba(239,246,255,0.9)', border: '1px solid rgba(147,197,253,0.4)' }
                    : { background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(209,250,229,0.5)' }}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${m.isAdmin ? 'text-blue-600' : 'text-gray-600'}`}>
                      {m.isAdmin ? '🛡️ پشتیبانی' : `👤 ${m.senderName ?? ticket.customerName}`}
                    </span>
                    <span className="text-xs text-gray-400">{m.createdAt?.split('T')[0]}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-700">{m.body}</p>
                </div>
              ))}
            </div>
          )}

          {!isClosed && (
            <div className="flex gap-2 pt-1" style={{ borderTop: '1px solid rgba(209,250,229,0.4)' }}>
              <textarea rows={2} value={reply} onChange={(e) => setReply(e.target.value)}
                placeholder="پاسخ خود را بنویسید..."
                className="flex-1 resize-none rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100" />
              <Button size="sm" loading={sending} onClick={handleReply} className="self-end">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

type FilterTab = 'all' | 'open' | 'replied' | 'closed'

export default function AdminTickets() {
  const [tickets, setTickets]     = useState<AdminTicketSummary[]>([])
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  const fetchTickets = () => {
    setLoading(true)
    adminApi.getAdminTickets()
      .then((r) => { if (r.code === 200) setTickets(toArr(r.result) as AdminTicketSummary[]) })
      .catch(() => toast.error('خطا در دریافت تیکت‌ها'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTickets() }, [])

  const openTickets   = tickets.filter(t => t.statusId !== 3)
  const repliedTickets = tickets.filter(t => t.status.includes('پاسخ'))
  const closedTickets = tickets.filter(t => t.statusId === 3)

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all',    label: 'همه',          count: tickets.length },
    { key: 'open',   label: 'در حال اقدام', count: openTickets.length },
    { key: 'replied', label: 'پاسخ داده شده', count: repliedTickets.length },
    { key: 'closed', label: 'بسته شده',     count: closedTickets.length },
  ]

  const filtered =
    activeTab === 'open'    ? openTickets   :
    activeTab === 'replied' ? repliedTickets :
    activeTab === 'closed'  ? closedTickets  :
    tickets

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="کل تیکت‌ها"      value={tickets.length.toLocaleString('fa-IR')}       icon={<MessageSquare className="h-5 w-5" />} color="blue" />
        <StatCard title="در انتظار پاسخ"  value={openTickets.length.toLocaleString('fa-IR')}   icon={<Clock className="h-5 w-5" />}        color="amber" subtitle="در حال اقدام" />
        <StatCard title="پاسخ داده شده"   value={repliedTickets.length.toLocaleString('fa-IR')} icon={<CheckCircle className="h-5 w-5" />}  color="green" />
        <StatCard title="بسته شده"        value={closedTickets.length.toLocaleString('fa-IR')} icon={<AlertTriangle className="h-5 w-5" />} color="red" />
      </div>

      {/* Header + filter tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary-600" />
          <p className="text-sm font-semibold text-gray-700">تیکت‌های پشتیبانی</p>
        </div>
        <button onClick={fetchTickets}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-primary-600 transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-2xl p-1"
        style={{ background: 'rgba(0,0,0,0.05)' }}>
        {tabs.map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              activeTab === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Ticket list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(209,250,229,0.6)' }}>
          <MessageSquare className="mb-3 h-12 w-12 text-gray-300" />
          <p className="font-medium text-gray-500">تیکتی در این بخش وجود ندارد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <TicketCard key={t.id} ticket={t} onStatusChange={fetchTickets} />
          ))}
        </div>
      )}
    </div>
  )
}
