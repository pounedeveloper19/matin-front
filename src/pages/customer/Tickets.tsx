import { useEffect, useState } from 'react'
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { customerApi } from '../../api/customer'
import { Card } from '../../components/ui/Card'
import Badge, { ticketStatusVariant } from '../../components/ui/Badge'
import type { TicketSummary, TicketMessage } from '../../types'

function TicketItem({ ticket }: { ticket: TicketSummary & { id: number } }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loadingMsg, setLoadingMsg] = useState(false)

  const toggle = async () => {
    if (!open && messages.length === 0) {
      setLoadingMsg(true)
      try {
        const res = await customerApi.getTicketMessages(ticket.id)
        if (res.code === 200 && res.result) setMessages(Array.isArray(res.result) ? res.result : [])
      } finally { setLoadingMsg(false) }
    }
    setOpen(!open)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between px-5 py-4 text-right hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-600">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">{ticket.subject}</p>
            <Badge variant={ticketStatusVariant(ticket.status)} className="mt-1">{ticket.status}</Badge>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
          {loadingMsg ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              در حال بارگذاری...
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-gray-400">پیامی در این تیکت ثبت نشده است</p>
          ) : (
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">{m.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CustomerTickets() {
  const [tickets, setTickets] = useState<(TicketSummary & { id: number })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    customerApi.getTickets()
      .then((r) => {
        if (r.code === 200 && r.result) {
          const list = Array.isArray(r.result) ? r.result : []
          setTickets(list.map((t, i) => ({ ...t, id: (t as any).id ?? i })))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-gray-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <Card className="flex flex-col items-center py-16 text-center">
        <MessageSquare className="mb-3 h-12 w-12 text-gray-300" />
        <h3 className="font-medium text-gray-600">تیکتی وجود ندارد</h3>
        <p className="mt-1 text-sm text-gray-400">تیکت‌های پشتیبانی شما در این بخش نمایش داده می‌شود</p>
      </Card>
    )
  }

  const open = tickets.filter((t) => !t.status.includes('بسته'))
  const closed = tickets.filter((t) => t.status.includes('بسته'))

  return (
    <div className="space-y-6">
      {open.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-500">تیکت‌های باز ({open.length})</h3>
          <div className="space-y-3">
            {open.map((t) => <TicketItem key={t.id} ticket={t} />)}
          </div>
        </div>
      )}
      {closed.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-500">تیکت‌های بسته ({closed.length})</h3>
          <div className="space-y-3">
            {closed.map((t) => <TicketItem key={t.id} ticket={t} />)}
          </div>
        </div>
      )}
    </div>
  )
}
