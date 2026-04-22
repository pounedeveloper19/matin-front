import { useEffect, useState } from 'react'
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { customerApi } from '../../api/customer'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Badge, { contractStatusVariant } from '../../components/ui/Badge'
import type { ContractResult } from '../../types'

export default function CustomerContracts() {
  const [contracts, setContracts] = useState<ContractResult[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ContractResult | null>(null)
  const [confirming, setConfirming] = useState(false)

  const fetchContracts = () => {
    setLoading(true)
    customerApi.getContracts()
      .then((r) => { if (r.code === 200 && r.result) setContracts(r.result) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchContracts() }, [])

  const handleConfirm = async (statusId: number) => {
    if (!selected) return
    setConfirming(true)
    try {
      const res = await customerApi.confirmContract(selected.id, statusId)
      if (res.code === 200) {
        toast.success(statusId === 2 ? 'قرارداد تأیید شد' : 'قرارداد رد شد')
        setSelected(null)
        fetchContracts()
      } else {
        toast.error(res.caption ?? 'خطا در عملیات')
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setConfirming(false) }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-gray-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  if (contracts.length === 0) {
    return (
      <Card className="flex flex-col items-center py-16 text-center">
        <FileText className="mb-3 h-12 w-12 text-gray-300" />
        <h3 className="text-gray-600 font-medium">هنوز قراردادی ثبت نشده</h3>
        <p className="mt-1 text-sm text-gray-400">قراردادهای شما در این بخش نمایش داده می‌شود</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {contracts.map((c) => (
        <div
          key={c.id}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{c.contractNumber}</p>
                <p className="mt-0.5 text-xs text-gray-400">اشتراک: {c.subscription}</p>
              </div>
            </div>
            <Badge variant={contractStatusVariant(c.status)}>{c.status}</Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-gray-400">تاریخ شروع</p>
              <p className="mt-0.5 font-medium text-gray-700">{c.startDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">تاریخ پایان</p>
              <p className="mt-0.5 font-medium text-gray-700">{c.endDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">نرخ قرارداد</p>
              <p className="mt-0.5 font-medium text-gray-700">{c.contractRate?.toLocaleString('fa-IR')} ریال</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">ضمانت</p>
              <p className="mt-0.5 font-medium text-gray-700">{c.warrantyType ?? '—'}</p>
            </div>
          </div>

          {c.address && (
            <p className="mt-3 text-xs text-gray-400">📍 {c.address}</p>
          )}

          {c.status.includes('انتظار') && (
            <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
              <Button size="sm" onClick={() => setSelected(c)}>
                <CheckCircle className="h-4 w-4" /> تأیید قرارداد
              </Button>
              <Button size="sm" variant="danger" onClick={() => { setSelected(c); handleConfirm(3) }}>
                <XCircle className="h-4 w-4" /> رد قرارداد
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* Confirm modal */}
      <Modal open={!!selected && !confirming} onClose={() => setSelected(null)} title="تأیید قرارداد" size="sm">
        <p className="text-sm text-gray-600 mb-6">
          آیا از تأیید قرارداد <span className="font-bold text-gray-900">{selected?.contractNumber}</span> اطمینان دارید؟
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setSelected(null)}>انصراف</Button>
          <Button loading={confirming} onClick={() => handleConfirm(2)}>
            <CheckCircle className="h-4 w-4" /> تأیید
          </Button>
        </div>
      </Modal>
    </div>
  )
}
