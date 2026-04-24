import { useEffect, useState } from 'react'
import { MessageSquare, Plus, ChevronDown, ChevronUp, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { customerApi } from '../../api/customer'
import { Card } from '../../components/ui/Card'
import Badge, { ticketStatusVariant } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import type { TicketSummary, TicketMessage } from '../../types'
import { toArr } from '../../utils'

function TicketItem({ ticket, onRefresh }: { ticket: TicketSummary; onRefresh: () => void }) {
  const [open, setOpen]             = useState(false)
  const [messages, setMessages]     = useState<TicketMessage[]>([])
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [reply, setReply]           = useState('')
  const [sending, setSending]       = useState(false)

  const toggle = async () => {
    if (!open && messages.length === 0) {
      setLoadingMsg(true)
      try {
        const res = await customerApi.getTicketMessages(ticket.id)
        if (res.code === 200)
          setMessages(toArr(res.result) as TicketMessage[])
      } finally { setLoadingMsg(false) }
    }
    setOpen(!open)
  }

  const handleReply = async () => {
    if (!reply.trim()) return
    setSending(true)
    try {
      const res = await customerApi.addTicketMessage({ ticketId: ticket.id, body: reply })
      if (res.code === 200) {
        toast.success('پیام ارسال شد')
        setReply('')
        const r2 = await customerApi.getTicketMessages(ticket.id)
        if (r2.code === 200)
          setMessages(toArr(r2.result) as TicketMessage[])
        onRefresh()
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSending(false) }
  }

  const isClosed = ticket.statusId === 3

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button onClick={toggle}
        className="flex w-full items-center justify-between px-5 py-4 text-right hover:bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-600">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">{ticket.subject}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={ticketStatusVariant(ticket.status)}>{ticket.status}</Badge>
              <span className="text-xs text-gray-400">{ticket.messageCount} پیام</span>
            </div>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-3">
          {loadingMsg ? (
            <div className="text-sm text-gray-400">در حال بارگذاری...</div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-gray-400">پیامی ثبت نشده است</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col gap-1 rounded-lg border px-4 py-3 ${
                  m.isAdmin ? 'border-blue-100 bg-blue-50 mr-8' : 'border-gray-200 bg-white ml-8'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${m.isAdmin ? 'text-blue-600' : 'text-gray-600'}`}>
                      {m.isAdmin ? '🛡️ پشتیبانی' : '👤 شما'}
                    </span>
                    <span className="text-xs text-gray-400">{m.createdAt}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{m.body}</p>
                </div>
              ))}
            </div>
          )}

          {!isClosed && (
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <textarea
                rows={2}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="پیام خود را بنویسید..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
              <Button size="sm" loading={sending} onClick={handleReply} className="self-end">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
          {isClosed && (
            <p className="text-xs text-center text-gray-400 pt-1">این تیکت بسته شده است</p>
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
      .then((r) => {
        if (r.code === 200)
          setTickets(toArr(r.result) as TicketSummary[])
      })
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

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-gray-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  const open   = tickets.filter((t) => t.statusId !== 3)
  const closed = tickets.filter((t) => t.statusId === 3)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">تیکت‌های پشتیبانی ({tickets.length})</span>
        <Button size="sm" onClick={() => setModal(true)}>
          <Plus className="h-4 w-4" /> تیکت جدید
        </Button>
      </div>

      {tickets.length === 0 ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <MessageSquare className="mb-3 h-12 w-12 text-gray-300" />
          <h3 className="font-medium text-gray-600">تیکتی وجود ندارد</h3>
          <p className="mt-1 text-sm text-gray-400">برای ارتباط با پشتیبانی تیکت جدید ثبت کنید</p>
        </Card>
      ) : (
        <>
          {open.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-500">باز ({open.length})</h3>
              <div className="space-y-3">
                {open.map((t) => <TicketItem key={t.id} ticket={t} onRefresh={fetchTickets} />)}
              </div>
            </div>
          )}
          {closed.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-500">بسته ({closed.length})</h3>
              <div className="space-y-3">
                {closed.map((t) => <TicketItem key={t.id} ticket={t} onRefresh={fetchTickets} />)}
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="ثبت تیکت جدید" size="md">
        <div className="space-y-4">
          <Input label="موضوع *" value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="موضوع مشکل یا سوال خود را بنویسید" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">توضیحات *</label>
            <textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="مشکل یا سوال خود را با جزئیات شرح دهید..." />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModal(false)}>انصراف</Button>
          <Button loading={creating} onClick={handleCreate}>
            <Send className="h-4 w-4" /> ارسال تیکت
          </Button>
        </div>
      </Modal>
    </div>
  )
}
