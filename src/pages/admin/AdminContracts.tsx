import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, FileText, Download, Printer, CheckCircle, Clock, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { lookupApi } from '../../api/lookup'
import type { SubOption, IdTitle } from '../../api/lookup'
import { Table, Pagination } from '../../components/ui/Table'
import { StatCard } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input, { Select, DatePicker } from '../../components/ui/Input'
import FileUpload from '../../components/ui/FileUpload'
import Badge, { contractStatusVariantById } from '../../components/ui/Badge'
import ContractPrintModal, { type PrintableContract } from '../../components/ui/ContractPrintModal'
import type { AdminContract } from '../../types'
import { toArr } from '../../utils'
import { useAuth } from '../../contexts/AuthContext'

function addOneYear(dateStr: string): string {
  const d = new Date(dateStr)
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

const emptyForm: AdminContract = {
  id: 0, contractNumber: '', contractRate: 0, statusId: 1,
  subscriptionId: 0, startDate: null, endDate: null, amount: 0, typeId: 1,
  contractPowerKw: null, contractVolumeKwh: null, contractAmountRial: null, paymentDeadline: null,
}

const avatarColors = [
  'bg-emerald-100 text-emerald-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]

export default function AdminContracts() {
  const { isAdminRole } = useAuth()
  const [data, setData] = useState<AdminContract[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | 'reject' | null>(null)
  const [form, setForm] = useState<AdminContract>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [subscriptions, setSubscriptions] = useState<SubOption[]>([])
  const [subsLoading, setSubsLoading] = useState(true)
  const [guaranteeTypes, setGuaranteeTypes] = useState<IdTitle[]>([])
  const [guaranteeLoading, setGuaranteeLoading] = useState(true)
  const [contractStatuses, setContractStatuses] = useState<IdTitle[]>([])
  const [statusLoading, setStatusLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [printData, setPrintData] = useState<PrintableContract | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'expired'>('all')
  const pageSize = 10

  const customerOptions = useMemo(() =>
    [...new Set(subscriptions.map(s => s.customerName ?? '').filter(Boolean))].sort()
  , [subscriptions])

  const filteredSubs = useMemo(() =>
    selectedCustomer ? subscriptions.filter(s => s.customerName === selectedCustomer) : subscriptions
  , [subscriptions, selectedCustomer])

  useEffect(() => {
    lookupApi.getAllSubscriptions()
      .then(r => { if (r.code === 200) setSubscriptions(toArr(r.result) as SubOption[]) })
      .finally(() => setSubsLoading(false))
    lookupApi.getGuaranteeTypes()
      .then(r => { if (r.code === 200) setGuaranteeTypes(toArr(r.result) as IdTitle[]) })
      .finally(() => setGuaranteeLoading(false))
    lookupApi.getContractStatuses()
      .then(r => { if (r.code === 200) setContractStatuses(toArr(r.result) as IdTitle[]) })
      .finally(() => setStatusLoading(false))
  }, [])

  const fetchData = useCallback((p: number) => {
    setLoading(true)
    adminApi.getContracts({ pageNumber: p, pageSize })
      .then((r) => {
        const res = r.result as any
        setData(res?.data ?? [])
        setTotal(res?.totalRecords ?? 0)
        setTotalPages(res?.totalPages ?? 1)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData(page) }, [page, fetchData])

  const openCreate = () => { setForm(emptyForm); setSelectedCustomer(''); setModal('create') }
  const openEdit = async (row: AdminContract) => {
    let subId = row.subscriptionId
    try {
      const res = await adminApi.getContractDetail(row.id)
      const detail = res.result ?? row
      setForm(detail)
      subId = (detail as AdminContract).subscriptionId ?? row.subscriptionId
    } catch { setForm(row) }
    setSelectedCustomer(subscriptions.find(s => s.id === subId)?.customerName ?? '')
    setModal('edit')
  }
  const openDelete  = (row: AdminContract) => { setForm(row); setModal('delete') }
  const openReject  = (row: AdminContract) => { setForm(row); setRejectionReason(''); setModal('reject') }

  const handleSave = async () => {
    if (!form.subscriptionId) { toast.error('لطفاً شناسه اشتراک را انتخاب کنید'); return }
    if (!form.startDate) { toast.error('تاریخ شروع قرارداد الزامی است'); return }
    if (!form.endDate) { toast.error('تاریخ پایان قرارداد الزامی است'); return }
    if (!form.contractRate || form.contractRate <= 0) { toast.error('نرخ قرارداد باید بزرگتر از صفر باشد'); return }
    if (form.contractPowerKw != null && form.contractPowerKw <= 0) { toast.error('قدرت قرارداد باید بزرگتر از صفر باشد'); return }
    if (form.contractVolumeKwh != null && form.contractVolumeKwh <= 0) { toast.error('حجم قرارداد باید بزرگتر از صفر باشد'); return }
    if (form.contractAmountRial != null && form.contractAmountRial <= 0) { toast.error('مبلغ قرارداد باید بزرگتر از صفر باشد'); return }
    if (form.amount != null && form.amount < 0) { toast.error('مبلغ ضمانت نمی‌تواند منفی باشد'); return }
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      toast.error('تاریخ پایان باید بعد از تاریخ شروع باشد'); return
    }
    if (
      form.contractVolumeKwh != null && form.contractPowerKw != null &&
      form.contractVolumeKwh > form.contractPowerKw * 720
    ) {
      toast.error(`حجم قرارداد نمی‌تواند از ظرفیت ماهانه (${(form.contractPowerKw * 720).toLocaleString('fa-IR')} kWh) بیشتر باشد`)
      return
    }
    setSaving(true)
    try {
      const res = modal === 'create' ? await adminApi.createContract(form) : await adminApi.updateContract(form)
      if (res.code === 200) {
        toast.success(modal === 'create' ? 'قرارداد ایجاد شد' : 'قرارداد ویرایش شد')
        setModal(null); fetchData(page)
      } else { toast.error(res.message ?? res.caption ?? 'خطا در عملیات') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const handleReject = async () => {
    setSaving(true)
    try {
      const res = await adminApi.rejectContract(form.id, rejectionReason || null)
      if (res.code === 200) {
        toast.success('قرارداد رد شد'); setModal(null); fetchData(page)
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (isFinalized(form.statusId)) { toast.error('قرارداد قطعی‌شده قابل حذف نیست'); return }
    setSaving(true)
    try {
      const res = await adminApi.deleteContract(form.id)
      if (res.code === 200) {
        toast.success('قرارداد حذف شد'); setModal(null); fetchData(page)
      } else { toast.error(res.message ?? res.caption ?? 'خطا در حذف') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  // نگاشت دقیق بر اساس EnumContractStatuses واقعی دیتابیس:
  // 1=پیش‌نویس، 2=فعال، 3=منقضی شده، 4=فسخ شده، 5=عدم تایید
  const activeCount  = data.filter(c => c.statusId === 2).length
  const pendingCount = data.filter(c => c.statusId === 1).length
  const expiredCount = data.filter(c => c.statusId === 3 || c.statusId === 4 || c.statusId === 5).length

  const filteredData =
    statusFilter === 'active'  ? data.filter(c => c.statusId === 2) :
    statusFilter === 'pending' ? data.filter(c => c.statusId === 1) :
    statusFilter === 'expired' ? data.filter(c => c.statusId === 3 || c.statusId === 4 || c.statusId === 5) :
    data

  const handleExportCsv = () => {
    const headers = ['شماره قرارداد', 'مشتری', 'کد ملی', 'وضعیت', 'تاریخ شروع', 'تاریخ پایان', 'نرخ قرارداد']
    const rows = filteredData.map(r => [
      r.contractNumber, r.customerName ?? '', r.customerNationalId ?? '',
      r.status ?? '', r.startDate ?? '', r.endDate ?? '', String(r.contractRate ?? ''),
    ])
    const csv = [headers, ...rows].map(row => row.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `قراردادها.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const isFinalized = (statusId?: number | null) => statusId === 2

  const filterTabs = [
    { key: 'all' as const,     label: 'همه',         count: data.length },
    { key: 'active' as const,  label: 'فعال',         count: activeCount },
    { key: 'pending' as const, label: 'در انتظار',    count: pendingCount },
    { key: 'expired' as const, label: 'منقضی / لغو',  count: expiredCount },
  ]

  const columns = [
    { key: 'contractNumber', header: 'شماره قرارداد', render: (row: AdminContract) => (
      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs font-semibold text-primary-700">{row.contractNumber}</span>
        {row.statusId === 1 && !row.contractRate && (
          <span className="w-fit rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700" title="نرخ هنوز تعیین نشده — احتمالاً درخواست مشتری است">
            نیازمند بررسی نرخ
          </span>
        )}
      </div>
    )},
    {
      key: 'customerName',
      header: 'مشتری',
      render: (row: AdminContract) => row.customerName ? (
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColors[row.id % avatarColors.length]}`}>
            {row.customerName.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-xs">{row.customerName}</p>
            <p className="text-[11px] text-gray-400 font-mono">{row.customerNationalId}</p>
          </div>
        </div>
      ) : <span className="text-gray-400">—</span>,
    },
    {
      key: 'status',
      header: 'وضعیت',
      render: (row: AdminContract) => (
        <Badge variant={contractStatusVariantById(row.statusId)}>{row.status ?? '—'}</Badge>
      ),
    },
    {
      key: 'contractPowerKw',
      header: 'قدرت (kW)',
      render: (row: AdminContract) => row.contractPowerKw != null
        ? <span className="text-xs font-semibold text-blue-700">{row.contractPowerKw.toLocaleString('fa-IR')}</span>
        : <span className="text-gray-300">—</span>,
    },
    {
      key: 'contractVolumeKwh',
      header: 'حجم (kWh)',
      render: (row: AdminContract) => row.contractVolumeKwh != null
        ? <span className="text-xs font-semibold text-violet-700">{row.contractVolumeKwh.toLocaleString('fa-IR')}</span>
        : <span className="text-gray-300">—</span>,
    },
    {
      key: 'contractAmountRial',
      header: 'مبلغ قرارداد',
      render: (row: AdminContract) => row.contractAmountRial != null
        ? <span className="text-xs font-semibold text-emerald-700">{row.contractAmountRial.toLocaleString('fa-IR')} ﷼</span>
        : <span className="text-gray-300">—</span>,
    },
    {
      key: 'paymentDeadline',
      header: 'مهلت پرداخت',
      render: (row: AdminContract) => row.paymentDeadline
        ? <span className="text-xs text-amber-700 font-semibold">{row.paymentDeadline}</span>
        : <span className="text-gray-300">—</span>,
    },
    { key: 'startDate', header: 'شروع', render: (row: AdminContract) => <span className="text-xs text-gray-600">{row.startDate ?? '—'}</span> },
    { key: 'endDate', header: 'پایان', render: (row: AdminContract) => <span className="text-xs text-gray-600">{row.endDate ?? '—'}</span> },
    {
      key: 'actions',
      header: 'عملیات',
      className: 'w-28',
      render: (row: AdminContract) => (
        <div className="flex items-center gap-1">
          <button
            onClick={async () => {
              try {
                const res = await adminApi.getContractPrintData(row.id)
                if (res.code === 200 && res.result) {
                  const d = res.result as any
                  setPrintData({
                    contractNumber: d.contractNumber,
                    customerName: d.companyName ?? row.customerName,
                    customerIdentifier: d.nationalId ?? row.customerNationalId,
                    registerNumber: d.registerNumber,
                    ceoFullName: d.ceoFullName,
                    ceoNationalId: d.ceoNationalId,
                    gazetteDate: d.gazetteDate,
                    subscription: d.subscription,
                    address: d.address,
                    postalCode: d.postalCode,
                    province: d.province,
                    startDate: d.startDate,
                    endDate: d.endDate,
                    contractRate: d.contractRate,
                    contractPowerKw: d.contractPowerKw,
                    contractVolumeKwh: d.contractVolumeKwh,
                    contractAmountRial: d.contractAmountRial,
                    paymentDeadline: d.paymentDeadline ?? row.paymentDeadline ?? null,
                    status: d.status,
                    statusId: d.statusId,
                    warrantyAmount: d.warrantyAmount,
                    warrantyType: d.warrantyType,
                    warrantyFileId: d.warrantyFileId ?? row.warrantyFileId ?? null,
                  })
                } else {
                  toast.error('خطا در دریافت اطلاعات قرارداد')
                }
              } catch { toast.error('خطا در ارتباط با سرور') }
            }}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-purple-50 hover:text-purple-600 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => openEdit(row)} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {row.statusId === 1 && (
            <button onClick={() => openReject(row)} title="رد قرارداد"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-orange-50 hover:text-orange-600 transition-colors">
              <XCircle className="h-3.5 w-3.5" />
            </button>
          )}
          {!isFinalized(row.statusId) && isAdminRole && (
            <button onClick={() => openDelete(row)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
        <h2 className="text-3xl font-black tracking-tight text-gray-900">لیست قراردادهای انرژی</h2>
        <p className="mt-1 text-sm text-gray-500">مدیریت و نظارت بر قراردادهای فعال صنایع و مشترکین</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="مجموع قراردادها" value={total.toLocaleString('fa-IR')} icon={<FileText className="h-5 w-5" />} color="green" />
        <StatCard title="فعال / تأیید شده" value={activeCount.toLocaleString('fa-IR')} icon={<CheckCircle className="h-5 w-5" />} color="blue" subtitle="در صفحه جاری" />
        <StatCard title="در انتظار تأیید" value={pendingCount.toLocaleString('fa-IR')} icon={<Clock className="h-5 w-5" />} color="amber" subtitle="در صفحه جاری" />
        <StatCard title="منقضی / فسخ / رد شده" value={expiredCount.toLocaleString('fa-IR')} icon={<XCircle className="h-5 w-5" />} color="red" subtitle="در صفحه جاری" />
      </div>

      {/* Filter tabs + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-2xl border border-gray-200 bg-white p-1">
          {filterTabs.map(tab => (
            <button key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                statusFilter === tab.key
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCsv} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="h-3.5 w-3.5" /> خروجی اکسل
          </button>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> قرارداد جدید</Button>
        </div>
      </div>

      <Table columns={columns} data={filteredData} loading={loading} keyField="id" emptyText="قراردادی یافت نشد" />
      {statusFilter === 'all' && <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />}

      {/* Create / Edit Modal */}
      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'create' ? 'قرارداد جدید' : 'ویرایش قرارداد'} size="lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {modal === 'edit' && (
            <Input label="شماره قرارداد" value={form.contractNumber} disabled onChange={() => {}} />
          )}
          {modal === 'edit' && (
            <Select label="وضعیت قرارداد" value={form.statusId ?? ''} loading={statusLoading}
              options={contractStatuses.map(s => ({ value: s.id, label: s.title }))}
              onChange={(v) => setForm({ ...form, statusId: +v })} />
          )}
          <Input label="نرخ قرارداد (ریال/kWh)" type="number" value={form.contractRate || ''}
            placeholder="نرخ را وارد کنید"
            onChange={(e) => setForm({ ...form, contractRate: e.target.value === '' ? 0 : +e.target.value })} />
          <Select label="مشتری" value={selectedCustomer} loading={subsLoading}
            options={customerOptions.map(name => ({ value: name, label: name }))}
            onChange={(v) => { setSelectedCustomer(String(v)); setForm({ ...form, subscriptionId: 0 }) }} />
          <Select label="شناسه" value={form.subscriptionId || ''} loading={subsLoading}
            disabled={!selectedCustomer}
            options={filteredSubs.map(s => ({ value: s.id, label: `${s.billIdentifier} — ${s.address}` }))}
            onChange={(v) => setForm({ ...form, subscriptionId: +v })} />

          {/* ── New contract fields ── */}
          <Input label="قدرت قرارداد (kW)" type="number" value={form.contractPowerKw ?? ''}
            placeholder="مثلاً ۵۰۰"
            onChange={(e) => {
              const powerKw = e.target.value === '' ? null : +e.target.value
              setForm({ ...form, contractPowerKw: powerKw, contractVolumeKwh: powerKw != null ? powerKw * 8760 : null })
            }} />
          <Input label="حجم قرارداد (kWh)" type="number" value={form.contractVolumeKwh ?? ''}
            disabled
            hint="خودکار از قدرت قرارداد × ۸۷۶۰ ساعت (یک سال) محاسبه می‌شود"
            onChange={() => {}} />
          <Input label="مبلغ قرارداد (ریال)" type="number" value={form.contractAmountRial ?? ''}
            placeholder="مبلغ کل قرارداد"
            onChange={(e) => setForm({ ...form, contractAmountRial: e.target.value === '' ? null : +e.target.value })} />
          <DatePicker label="مهلت پرداخت" value={form.paymentDeadline ?? null}
            onChange={(v) => setForm({ ...form, paymentDeadline: v })} />

          <Input label="مبلغ ضمانت (ریال)" type="number" value={form.amount || ''}
            onChange={(e) => setForm({ ...form, amount: +e.target.value })} />
          <DatePicker label="تاریخ شروع" value={form.startDate}
            onChange={(v) => setForm({ ...form, startDate: v, endDate: v ? addOneYear(v) : form.endDate })} />
          <DatePicker label="تاریخ پایان (خودکار = شروع + ۱ سال)" value={form.endDate} disabled
            onChange={() => {}} />
          <Select label="نوع ضمانت" value={form.typeId ?? ''} loading={guaranteeLoading}
            options={guaranteeTypes.map(t => ({ value: t.id, label: t.title }))}
            onChange={(v) => setForm({ ...form, typeId: +v })} />
        </div>
        <div className="mt-4">
          <FileUpload label="فایل ضمانت" fileId={form.fileId}
            onUploaded={(id) => setForm({ ...form, fileId: id })}
            onDeleted={() => setForm({ ...form, fileId: null })} />
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button loading={saving} onClick={handleSave}>
            {modal === 'create' ? 'ایجاد قرارداد' : 'ذخیره تغییرات'}
          </Button>
        </div>
      </Modal>

      <ContractPrintModal
        open={!!printData}
        data={printData}
        onClose={() => setPrintData(null)}
      />

      {/* Reject Confirm */}
      <Modal open={modal === 'reject'} onClose={() => setModal(null)} title="رد قرارداد" size="sm">
        <p className="text-sm text-gray-600">
          قرارداد <span className="font-bold text-gray-900">{form.contractNumber}</span> رد خواهد شد
          و وضعیت آن به «عدم تایید» تغییر می‌یابد.
        </p>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            علت رد <span className="font-normal text-gray-400">(اختیاری)</span>
          </label>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none resize-none"
            placeholder="دلیل رد قرارداد را بنویسید..."
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
          />
        </div>
        <div className="mt-4 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button variant="danger" loading={saving} onClick={handleReject}>
            <XCircle className="h-4 w-4" /> رد قرارداد
          </Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="حذف قرارداد" size="sm">
        <p className="text-sm text-gray-600">
          آیا از حذف قرارداد <span className="font-bold text-gray-900">{form.contractNumber}</span> اطمینان دارید؟
          این عملیات قابل بازگشت نیست.
        </p>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}>
            <Trash2 className="h-4 w-4" /> حذف
          </Button>
        </div>
      </Modal>
    </div>
  )
}
