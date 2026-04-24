import { useEffect, useState } from 'react'
import { FileText, Upload, CheckCircle, Clock, XCircle, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { customerApi } from '../../api/customer'
import { lookupApi } from '../../api/lookup'
import type { IdTitle } from '../../api/lookup'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Select } from '../../components/ui/Input'
import Input from '../../components/ui/Input'
import Badge, { contractStatusVariant } from '../../components/ui/Badge'
import FileUpload from '../../components/ui/FileUpload'
import type { ContractResult, SubmitWarrantyRequest } from '../../types'
import { toArr } from '../../utils'

export default function CustomerContracts() {
  const [contracts, setContracts]       = useState<ContractResult[]>([])
  const [loading, setLoading]           = useState(true)
  const [guaranteeTypes, setGuaranteeTypes] = useState<IdTitle[]>([])
  const [selected, setSelected]         = useState<ContractResult | null>(null)
  const [form, setForm]                 = useState<SubmitWarrantyRequest>({ contractId: 0, amount: 0, typeId: 0 })
  const [saving, setSaving]             = useState(false)

  const fetchContracts = () => {
    setLoading(true)
    customerApi.getContracts()
      .then((r) => { if (r.code === 200) setContracts(toArr(r.result) as ContractResult[]) })
      .catch(() => toast.error('خطا در دریافت قراردادها'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchContracts()
    lookupApi.getGuaranteeTypes()
      .then((r) => { if (r.code === 200) setGuaranteeTypes(toArr(r.result) as IdTitle[]) })
  }, [])

  const openWarrantyModal = (c: ContractResult) => {
    setSelected(c)
    setForm({
      contractId: c.id,
      amount: c.warrantyAmount ?? 0,
      typeId: c.warrantyTypeId ?? 0,
      fileId: c.warrantyFileId ?? null,
    })
  }

  const handleSubmit = async () => {
    if (!form.typeId) { toast.error('نوع ضمانت‌نامه را انتخاب کنید'); return }
    if (!form.amount || form.amount <= 0) { toast.error('مبلغ ضمانت را وارد کنید'); return }
    setSaving(true)
    try {
      const res = await customerApi.submitWarranty(form)
      if (res.code === 200) {
        toast.success('ضمانت‌نامه ثبت شد و قرارداد برای تایید ادمین ارسال شد')
        setSelected(null)
        fetchContracts()
      } else {
        toast.error(res.message ?? res.caption ?? 'خطا در ثبت ضمانت‌نامه')
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const StatusIcon = ({ statusId }: { statusId: number }) => {
    if (statusId === 3) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (statusId === 4) return <XCircle className="h-4 w-4 text-red-500" />
    return <Clock className="h-4 w-4 text-amber-500" />
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
        <p className="mt-1 text-sm text-gray-400">قراردادهای شما پس از ثبت توسط ادمین اینجا نمایش داده می‌شود</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {contracts.map((c) => (
        <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{c.contractNumber}</p>
                <p className="mt-0.5 text-xs text-gray-400">انشعاب: {c.subscription}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon statusId={c.statusId} />
              <Badge variant={contractStatusVariant(c.status)}>{c.status}</Badge>
            </div>
          </div>

          {/* Contract details */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-gray-400">تاریخ شروع</p>
              <p className="mt-0.5 font-medium text-gray-700">{c.startDate || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">تاریخ پایان</p>
              <p className="mt-0.5 font-medium text-gray-700">{c.endDate || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">نرخ قرارداد</p>
              <p className="mt-0.5 font-medium text-gray-700">{c.contractRate?.toLocaleString('fa-IR')} ریال</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">آدرس</p>
              <p className="mt-0.5 text-xs text-gray-600 truncate">{c.address || '—'}</p>
            </div>
          </div>

          {/* Warranty section */}
          <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">ضمانت‌نامه</p>
              {(c.statusId === 1 || c.statusId === 4) && (
                <Button size="sm" variant="secondary" onClick={() => openWarrantyModal(c)}>
                  {c.warrantyAmount > 0
                    ? <><Pencil className="h-3.5 w-3.5" /> ویرایش ضمانت</>
                    : <><Upload className="h-3.5 w-3.5" /> ثبت ضمانت‌نامه</>
                  }
                </Button>
              )}
            </div>
            {c.warrantyAmount > 0 ? (
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-400">نوع ضمانت</p>
                  <p className="mt-0.5 font-medium text-gray-700">{c.warrantyType || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">مبلغ</p>
                  <p className="mt-0.5 font-medium text-gray-700">{c.warrantyAmount.toLocaleString('fa-IR')} ریال</p>
                </div>
                {c.warrantyFileId && (
                  <div>
                    <p className="text-xs text-gray-400">مدرک</p>
                    <p className="mt-0.5 text-xs text-primary-600">بارگذاری شده ✓</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-400">ضمانت‌نامه‌ای ثبت نشده است.</p>
            )}
          </div>
        </div>
      ))}

      {/* Warranty Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="ثبت / ویرایش ضمانت‌نامه" size="md">
        <div className="space-y-4">
          <Select
            label="نوع ضمانت‌نامه *"
            value={form.typeId || ''}
            options={guaranteeTypes.map(g => ({ value: g.id, label: g.title }))}
            onChange={(v) => setForm(f => ({ ...f, typeId: +v }))}
          />
          <Input
            label="مبلغ ضمانت (ریال) *"
            type="number"
            value={form.amount || ''}
            onChange={(e) => setForm(f => ({ ...f, amount: +e.target.value }))}
            placeholder="مثال: ۵۰۰۰۰۰۰۰"
          />
          <FileUpload
            label="مدرک ضمانت‌نامه"
            fileId={form.fileId ?? null}
            accept="image/*,.pdf"
            onUploaded={(fileId) => setForm(f => ({ ...f, fileId }))}
            onDeleted={() => setForm(f => ({ ...f, fileId: null }))}
          />
          <p className="text-xs text-gray-400">
            پس از ثبت، قرارداد جهت تایید نهایی به ادمین ارسال می‌شود.
          </p>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setSelected(null)}>انصراف</Button>
          <Button loading={saving} onClick={handleSubmit}>ثبت ضمانت‌نامه</Button>
        </div>
      </Modal>
    </div>
  )
}
