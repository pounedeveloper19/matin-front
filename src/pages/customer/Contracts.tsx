import { useEffect, useState } from 'react'
import { FileText, Upload, CheckCircle, Clock, XCircle, Pencil, Printer, Shield, Zap, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { customerApi } from '../../api/customer'
import { lookupApi } from '../../api/lookup'
import type { IdTitle } from '../../api/lookup'
import { StatCard } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Select } from '../../components/ui/Input'
import Input from '../../components/ui/Input'
import Badge, { contractStatusVariant } from '../../components/ui/Badge'
import FileUpload from '../../components/ui/FileUpload'
import ContractPrintModal, { type PrintableContract } from '../../components/ui/ContractPrintModal'
import type { ContractResult, SubmitWarrantyRequest } from '../../types'
import { toArr } from '../../utils'

export default function CustomerContracts() {
  const [contracts, setContracts]           = useState<ContractResult[]>([])
  const [loading, setLoading]               = useState(true)
  const [guaranteeTypes, setGuaranteeTypes] = useState<IdTitle[]>([])
  const [selected, setSelected]             = useState<ContractResult | null>(null)
  const [form, setForm]                     = useState<SubmitWarrantyRequest>({ contractId: 0, amount: 0, typeId: 0 })
  const [saving, setSaving]                 = useState(false)
  const [printData, setPrintData]           = useState<PrintableContract | null>(null)

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
    setForm({ contractId: c.id, amount: c.warrantyAmount ?? 0, typeId: c.warrantyTypeId ?? 0, fileId: c.warrantyFileId ?? null })
  }

  const handleSubmit = async () => {
    if (!form.typeId) { toast.error('نوع ضمانت‌نامه را انتخاب کنید'); return }
    if (!form.amount || form.amount <= 0) { toast.error('مبلغ ضمانت را وارد کنید'); return }
    setSaving(true)
    try {
      const res = await customerApi.submitWarranty(form)
      if (res.code === 200) {
        toast.success('ضمانت‌نامه ثبت شد و قرارداد برای تایید ادمین ارسال شد')
        setSelected(null); fetchContracts()
      } else { toast.error(res.message ?? res.caption ?? 'خطا در ثبت ضمانت‌نامه') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const activeCount   = contracts.filter(c => c.statusId === 3).length
  const pendingCount  = contracts.filter(c => c.statusId === 1 || c.statusId === 2).length
  const rejectedCount = contracts.filter(c => c.statusId === 4).length

  const StatusIcon = ({ statusId }: { statusId: number }) => {
    if (statusId === 3) return <CheckCircle className="h-4 w-4 text-emerald-500" />
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

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="مجموع قراردادها" value={contracts.length} icon={<FileText className="h-5 w-5" />} color="green" />
        <StatCard title="فعال / تأیید شده" value={activeCount} icon={<CheckCircle className="h-5 w-5" />} color="blue" />
        <StatCard title="در انتظار" value={pendingCount} icon={<Clock className="h-5 w-5" />} color="amber" />
        <StatCard title="رد شده" value={rejectedCount} icon={<XCircle className="h-5 w-5" />} color="red" />
      </div>

      {contracts.length === 0 ? (
        <div
          className="flex flex-col items-center py-20 text-center rounded-2xl"
          style={{ background: '#fff', border: '1px solid #e5e7eb' }}
        >
          <FileText className="mb-3 h-12 w-12 text-gray-300" />
          <h3 className="font-semibold text-gray-600">هنوز قراردادی ثبت نشده</h3>
          <p className="mt-1 text-sm text-gray-400">قراردادهای شما پس از ثبت توسط ادمین اینجا نمایش داده می‌شود</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((c) => (
            <div
              key={c.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
              style={{
                boxShadow: '0 2px 12px rgba(15,23,42,0.04)',
              }}
            >
              {/* Card header */}
              <div
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{c.contractNumber}</p>
                    <p className="mt-0.5 text-xs text-gray-400">انشعاب: {c.subscription}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon statusId={c.statusId} />
                  <Badge variant={contractStatusVariant(c.status)}>{c.status}</Badge>
                  <button
                    onClick={() => setPrintData({
                      contractNumber: c.contractNumber, subscription: c.subscription,
                      address: c.address, startDate: c.startDate, endDate: c.endDate,
                      contractRate: c.contractRate, status: c.status,
                      warrantyAmount: c.warrantyAmount, warrantyType: c.warrantyType,
                    })}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                    title="مشاهده / چاپ"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Contract details bento */}
              <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <p className="text-[10px] text-gray-400">تاریخ شروع</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">{c.startDate || '—'}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <p className="text-[10px] text-gray-400">تاریخ پایان</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">{c.endDate || '—'}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="h-3 w-3 text-gray-400" />
                    <p className="text-[10px] text-gray-400">نرخ قرارداد</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    {c.contractRate?.toLocaleString('fa-IR')}
                    <span className="text-[10px] text-gray-400 mr-1">ریال</span>
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[10px] text-gray-400 mb-1">آدرس</p>
                  <p className="text-xs text-gray-600 truncate">{c.address || '—'}</p>
                </div>
              </div>

              {/* Warranty section */}
              <div className="mx-5 mb-5 rounded-xl px-4 py-3"
                style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-700" />
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">ضمانت‌نامه</p>
                  </div>
                  {(c.statusId === 1 || c.statusId === 4) && (
                    <Button size="sm" variant="secondary" onClick={() => openWarrantyModal(c)}>
                      {c.warrantyAmount > 0
                        ? <><Pencil className="h-3.5 w-3.5" /> ویرایش</>
                        : <><Upload className="h-3.5 w-3.5" /> ثبت ضمانت</>
                      }
                    </Button>
                  )}
                </div>
                {c.warrantyAmount > 0 ? (
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-[10px] text-gray-400">نوع ضمانت</p>
                      <p className="mt-0.5 font-semibold text-gray-700">{c.warrantyType || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">مبلغ</p>
                      <p className="mt-0.5 font-semibold text-gray-700">
                        {c.warrantyAmount.toLocaleString('fa-IR')}
                        <span className="text-[10px] text-gray-400 mr-1">ریال</span>
                      </p>
                    </div>
                    {c.warrantyFileId && (
                      <div>
                        <p className="text-[10px] text-gray-400">مدرک</p>
                        <p className="mt-0.5 text-xs font-semibold text-emerald-600">بارگذاری شده ✓</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-400">ضمانت‌نامه‌ای ثبت نشده است.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ContractPrintModal open={!!printData} data={printData} onClose={() => setPrintData(null)} />

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
          <p className="text-xs text-gray-400">پس از ثبت، قرارداد جهت تایید نهایی به ادمین ارسال می‌شود.</p>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setSelected(null)}>انصراف</Button>
          <Button loading={saving} onClick={handleSubmit}>ثبت ضمانت‌نامه</Button>
        </div>
      </Modal>
    </div>
  )
}
