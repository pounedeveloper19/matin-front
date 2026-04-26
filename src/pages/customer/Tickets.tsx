import { useEffect, useState } from 'react'
import {
  MessageSquare, Plus, ChevronDown, ChevronUp,
  Send, CheckCircle, AlertTriangle, Clock, RefreshCw, XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { customerApi } from '../../api/customer'
import { StatCard } from '../../components/ui/Card'
import Badge, { ticketStatusVariant } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import type { TicketSummary, TicketMessage } from '../../types'
import { toArr } from '../../utils'

const glassCard = {
  background: 'rgba(255,255,255,0.88)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(209,250,229,0.6)',
  boxShadow: '0 4px 20px rgba(6,78,59,0.06)',
}

function ticketMeta(statusId: number, status: string) {
  if (statusId === 3 || status.includes('بسته')) return {
    icon: CheckCircle,
    iconColor: 'text-emerald-500',
    iconBg:  'bg-emerald-100',
    accent:  '#10b981',
  }
  if (status.includes('انتظار')) return {
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    iconBg:  'bg-amber-100',
    accent:  '#f59e0b',
  }
  return {
    icon: Clock,
    iconColor: 'text-blue-500',
    iconBg:  'bg-blue-100',
    accent:  '#3b82f6',
  }
}

function TicketCard({ ticket, onRefresh }: { ticket: TicketSummary; onRefresh: () => void }) {
  const [open, setOpen]             = useState(false)
  const [messages, setMessages]     = useState<TicketMessage[]>([])
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [reply, setReply]           = useState('')
  const [sending, setSending]       = useState(false)

  const meta = ticketMeta(ticket.statusId, ticket.status)
  const Icon = meta.icon
  const isClosed = ticket.statusId === 3

  const loadMessages = async () => {
    setLoadingMsg(true)
    try {
      const res = await customerApi.getTicketMessages(ticket.id)
      if (res.code === 200) setMessages(toArr(res.result) as TicketMessage[])
    } finally { setLoadingMsg(false) }
  }

  const toggle = async () => {
    if (!open && messages.length === 0) await loadMessages()
    setOpen(v => !v)
  }

  const handleReply = async () => {
    if (!reply.trim()) return
    setSending(true)
    try {
      const res = await customerApi.addTicketMessage({ ticketId: ticket.id, body: reply })
      if (res.code === 200) {
        toast.success('پیام ارسال شد'); setReply('')
        await loadMessages(); onRefresh()
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSending(false) }
  }

  const ticketId = `TK-${String(ticket.id).padStart(5, '0')}`

  return (
    <div className="overflow-hidden rounded-2xl transition-shadow hover:shadow-md"
      style={{ ...glassCard, borderRight: `4px solid ${meta.accent}` }}>

      {/* Card Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.iconBg}`}>
            <Icon className={`h-4 w-4 ${meta.iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 leading-snug">{ticket.subject}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-gray-400">{ticketId}</span>
              {ticket.createdAt && (
                <span className="text-xs text-gray-400">{ticket.createdAt.split('T')[0]}</span>
              )}
              <span className="text-xs text-gray-400">{ticket.messageCount} پیام</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={ticketStatusVariant(ticket.status)}>{ticket.status}</Badge>
          <button onClick={toggle}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-emerald-50 hover:text-primary-600">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 border-t px-5 py-3"
        style={{ borderColor: 'rgba(209,250,229,0.5)', background: 'rgba(236,253,245,0.3)' }}>
        <button onClick={toggle}
          className="rounded-xl border border-emerald-200 bg-white px-4 py-1.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-emerald-50">
          مشاهده جزئیات
        </button>
        {!isClosed && (
          <button onClick={() => { setOpen(true); if (messages.length === 0) loadMessages() }}
            className="rounded-xl bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700">
            ارسال پاسخ
          </button>
        )}
        {isClosed && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <XCircle className="h-3.5 w-3.5" /> تیکت بسته شده
          </span>
        )}
      </div>

      {/* Expanded: Messages + Reply */}
      {open && (
        <div className="space-y-3 px-5 pb-5 pt-4"
          style={{ borderTop: '1px solid rgba(209,250,229,0.5)', background: 'rgba(236,253,245,0.25)' }}>
          {loadingMsg ? (
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
                    : { background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(209,250,229,0.5)' }
                  }>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${m.isAdmin ? 'text-blue-600' : 'text-primary-700'}`}>
                      {m.isAdmin ? '🛡️ پشتیبانی' : '👤 شما'}
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
                placeholder="پیام خود را بنویسید..."
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

export default function CustomerTickets() {
  const [tickets, setTickets]   = useState<TicketSummary[]>([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [subject, setSubject]   = useState('')
  const [body, setBody]         = useState('')
  const [creating, setCreating] = useState(false)

  const fetchTickets = () => {
    setLoading(true)
    customerApi.getTickets()
      .then((r) => { if (r.code === 200) setTickets(toArr(r.result) as TicketSummary[]) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTickets() }, [])

  const handleCreate = async () => {
    if (!subject.trim() || !body.trim()) { toast.error('موضوع و متن الزامی است'); return }
    setCreating(true)
    try {
      const res = await customerApi.createTicket({ subject, body })
      if (res.code === 200) {
        toast.success('تیکت با موفقیت ثبت شد')
        setModal(false); setSubject(''); setBody('')
        fetchTickets()
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setCreating(false) }
  }

  const openTickets   = tickets.filter(t => t.statusId !== 3)
  const closedTickets = tickets.filter(t => t.statusId === 3)
  const pendingTickets = tickets.filter(t => t.status.includes('انتظار'))

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="مجموع تیکت‌ها"    value={tickets.length}       icon={<MessageSquare className="h-5 w-5" />} color="blue" />
        <StatCard title="تیکت‌های باز"      value={openTickets.length}   icon={<Clock className="h-5 w-5" />}        color="amber" subtitle="در انتظار پاسخ" />
        <StatCard title="در انتظار پاسخ"   value={pendingTickets.length} icon={<AlertTriangle className="h-5 w-5" />} color="red" />
        <StatCard title="بسته / حل‌شده"    value={closedTickets.length}  icon={<CheckCircle className="h-5 w-5" />}  color="green" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary-600" />
          <p className="text-sm font-semibold text-gray-700">تیکت‌های پشتیبانی</p>
          {tickets.length > 0 && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {tickets.length} تیکت
            </span>
          )}
        </div>
        <button onClick={fetchTickets}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-emerald-50 hover:text-primary-600">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Ticket lists */}
      {tickets.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(209,250,229,0.6)' }}>
          <MessageSquare className="mb-3 h-12 w-12 text-gray-300" />
          <h3 className="font-semibold text-gray-600">تیکتی وجود ندارد</h3>
          <p className="mt-1 text-sm text-gray-400">برای ارتباط با پشتیبانی روی دکمه + کلیک کنید</p>
        </div>
      ) : (
        <div className="space-y-6">
          {openTickets.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                تیکت‌های باز ({openTickets.length})
              </h3>
              {openTickets.map(t => <TicketCard key={t.id} ticket={t} onRefresh={fetchTickets} />)}
            </div>
          )}
          {closedTickets.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                تیکت‌های بسته ({closedTickets.length})
              </h3>
              {closedTickets.map(t => <TicketCard key={t.id} ticket={t} onRefresh={fetchTickets} />)}
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setModal(true)}
        className="fixed bottom-6 left-6 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95 z-50"
        style={{ background: 'linear-gradient(135deg, #065f46, #047857)' }}
        title="تیکت جدید"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* New Ticket Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="ثبت تیکت جدید" size="md">
        <div className="space-y-4">
          <Input label="موضوع *" value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="موضوع مشکل یا سوال خود را بنویسید" />
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">
              توضیحات *
            </label>
            <textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)}
              className="block w-full resize-none rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="مشکل یا سوال خود را با جزئیات شرح دهید..." />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setModal(false)}>انصراف</Button>
          <Button loading={creating} onClick={handleCreate}>
            <Send className="h-4 w-4" /> ارسال تیکت
          </Button>
        </div>
      </Modal>
    </div>
  )
}
