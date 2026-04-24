import { useEffect, useState } from 'react'
import { MessageSquare, ChevronDown, ChevronUp, Send, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import Badge, { ticketStatusVariant } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import type { AdminTicketSummary, TicketMessage } from '../../types'
import { toArr } from '../../utils'

function TicketRow({ ticket, onStatusChange }: {
  ticket: AdminTicketSummary
  onStatusChange: () => void
}) {
  const [open, setOpen]           = useState(false)
  const [messages, setMessages]   = useState<TicketMessage[]>([])
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [reply, setReply]         = useState('')
  const [sending, setSending]     = useState(false)

  const toggle = async () => {
    if (!open && messages.length === 0) {
      setLoadingMsg(true)
      try {
        const res = await adminApi.getAdminTicketMessages(ticket.id)
        if (res.code === 200) setMessages(toArr(res.result) as TicketMessage[])
      } finally { setLoadingMsg(false) }
    }
    setOpen(!open)
  }

  const handleReply = async () => {
    if (!reply.trim()) return
    setSending(true)
    try {
      const res = await adminApi.replyTicket({ ticketId: ticket.id, body: reply })
      if (res.code === 200) {
        toast.success('پاسخ ارسال شد')
        setReply('')
        // reload messages
        const r2 = await adminApi.getAdminTicketMessages(ticket.id)
        if (r2.code === 200) setMessages(toArr(r2.result) as TicketMessage[])
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSending(false) }
  }

  const handleClose = async () => {
    try {
      const statusId = ticket.statusId === 3 ? 1 : 3 // toggle open/closed
      const res = await adminApi.setTicketStatus({ ticketId: ticket.id, statusId })
      if (res.code === 200) { toast.success(statusId === 3 ? 'تیکت بسته شد' : 'تیکت باز شد'); onStatusChange() }
      else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between px-5 py-4 text-right hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">{ticket.subject}</p>
            <p className="text-xs text-gray-500 mt-0.5">{ticket.customerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={ticketStatusVariant(ticket.status)}>{ticket.status}</Badge>
          <span className="text-xs text-gray-400">{ticket.messageCount} پیام</span>
          {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-4">
          {loadingMsg ? (
            <div className="text-sm text-gray-400">در حال بارگذاری...</div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col gap-1 rounded-lg border px-4 py-3 ${
                  m.isAdmin
                    ? 'border-blue-100 bg-blue-50 mr-8'
                    : 'border-gray-200 bg-white ml-8'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${m.isAdmin ? 'text-blue-600' : 'text-gray-600'}`}>
                      {m.isAdmin ? '🛡️ پشتیبانی' : `👤 ${m.senderName}`}
                    </span>
                    <span className="text-xs text-gray-400">{m.createdAt}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{m.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* Reply box */}
          {ticket.statusId !== 3 && (
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <textarea
                rows={2}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="پاسخ خود را بنویسید..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
              <Button size="sm" loading={sending} onClick={handleReply} className="self-end">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Status toggle */}
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                ticket.statusId === 3
                  ? 'bg-green-50 text-green-600 hover:bg-green-100'
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              {ticket.statusId === 3
                ? <><CheckCircle className="h-3.5 w-3.5" /> باز کردن تیکت</>
                : <><XCircle className="h-3.5 w-3.5" /> بستن تیکت</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminTickets() {
  const [tickets, setTickets] = useState<AdminTicketSummary[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTickets = () => {
    setLoading(true)
    adminApi.getAdminTickets()
      .then((r) => {
        if (r.code === 200)
          setTickets(toArr(r.result) as AdminTicketSummary[])
      })
      .catch(() => toast.error('خطا در دریافت تیکت‌ها'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTickets() }, [])

  const open   = tickets.filter((t) => t.statusId !== 3)
  const closed = tickets.filter((t) => t.statusId === 3)

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-600">پشتیبانی — تیکت‌ها ({tickets.length})</span>
      </div>

      {open.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500">تیکت‌های باز ({open.length})</h3>
          {open.map((t) => <TicketRow key={t.id} ticket={t} onStatusChange={fetchTickets} />)}
        </div>
      )}

      {closed.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500">تیکت‌های بسته ({closed.length})</h3>
          {closed.map((t) => <TicketRow key={t.id} ticket={t} onStatusChange={fetchTickets} />)}
        </div>
      )}

      {tickets.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center rounded-xl border border-gray-200 bg-white">
          <MessageSquare className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">هیچ تیکتی وجود ندارد</p>
        </div>
      )}
    </div>
  )
}
