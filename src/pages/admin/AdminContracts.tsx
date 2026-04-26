import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, FileText, Download, Printer, CheckCircle, Clock, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { uploadApi } from '../../api/upload'
import { lookupApi } from '../../api/lookup'
import type { SubOption, IdTitle } from '../../api/lookup'
import { Table, Pagination } from '../../components/ui/Table'
import { StatCard } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input, { Select, DatePicker } from '../../components/ui/Input'
import FileUpload from '../../components/ui/FileUpload'
import Badge, { contractStatusVariant } from '../../components/ui/Badge'
import ContractPrintModal, { type PrintableContract } from '../../components/ui/ContractPrintModal'
import type { AdminContract } from '../../types'
import { toArr } from '../../utils'

const emptyForm: AdminContract = {
  id: 0, contractNumber: '', contractRate: 0, statusId: 1,
  subscriptionId: 0, startDate: null, endDate: null, amount: 0, typeId: 1,
}

const avatarColors = [
  'bg-emerald-100 text-emerald-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]

export default function AdminContracts() {
  const [data, setData] = useState<AdminContract[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [form, setForm] = useState<AdminContract>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [subscriptions, setSubscriptions] = useState<SubOption[]>([])
  const [subsLoading, setSubsLoading] = useState(true)
  const [guaranteeTypes, setGuaranteeTypes] = useState<IdTitle[]>([])
  const [guaranteeLoading, setGuaranteeLoading] = useState(true)
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
    try { const res = await adminApi.getContractDetail(row.id); setForm(res.result ?? row) }
    catch { setForm(row) }
    setSelectedCustomer(subscriptions.find(s => s.id === row.subscriptionId)?.customerName ?? '')
    setModal('edit')
  }
  const openDelete = (row: AdminContract) => { setForm(row); setModal('delete') }

  const handleSave = async () => {
    if (!form.subscriptionId) { toast.error('لطفاً انشعاب را انتخاب کنید'); return }
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

  const handleDelete = async () => {
    setSaving(true)
    try {
      const res = await adminApi.deleteContract(form.id)
      if (res.code === 200) {
        toast.success('قرارداد حذف شد'); setModal(null); fetchData(page)
      } else { toast.error(res.message ?? res.caption ?? 'خطا در حذف') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const activeCount  = data.filter(c => c.status?.includes('فعال') || c.status?.includes('تایید')).length
  const pendingCount = data.filter(c => c.status?.includes('انتظار') || c.status?.includes('بررسی')).length
  const expiredCount = data.filter(c => c.status?.includes('منقضی') || c.status?.includes('لغو') || c.status?.includes('رد')).length

  const filteredData =
    statusFilter === 'active'  ? data.filter(c => c.status?.includes('فعال') || c.status?.includes('تایید')) :
    statusFilter === 'pending' ? data.filter(c => c.status?.includes('انتظار') || c.status?.includes('بررسی')) :
    statusFilter === 'expired' ? data.filter(c => c.status?.includes('منقضی') || c.status?.includes('لغو') || c.status?.includes('رد')) :
    data

  const filterTabs = [
    { key: 'all' as const,     label: 'همه',         count: data.length },
    { key: 'active' as const,  label: 'فعال',         count: activeCount },
    { key: 'pending' as const, label: 'در انتظار',    count: pendingCount },
    { key: 'expired' as const, label: 'منقضی / لغو',  count: expiredCount },
  ]

  const columns = [
    { key: 'contractNumber', header: 'شماره قرارداد', render: (row: AdminContract) => (
      <span className="font-mono text-xs font-semibold text-primary-700">{row.contractNumber}</span>
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
        <Badge variant={contractStatusVariant(row.status ?? '')}>{row.status ?? '—'}</Badge>
      ),
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
            onClick={() => setPrintData({
              contractNumber: row.contractNumber,
              customerName: row.customerName,
              customerIdentifier: row.customerNationalId,
              startDate: row.startDate,
              endDate: row.endDate,
              contractRate: row.contractRate,
              status: row.status,
              warrantyAmount: row.amount,
            })}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-purple-50 hover:text-purple-600 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
          </button>
          {row.warrantyFileId && (
            <button
              onClick={() => uploadApi.download(row.warrantyFileId!).catch(() => toast.error('خطا در دانلود فایل'))}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => openEdit(row)} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => openDelete(row)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="مجموع قراردادها" value={total.toLocaleString('fa-IR')} icon={<FileText className="h-5 w-5" />} color="green" />
        <StatCard title="فعال / تأیید شده" value={activeCount.toLocaleString('fa-IR')} icon={<CheckCircle className="h-5 w-5" />} color="blue" subtitle="در صفحه جاری" />
        <StatCard title="در انتظار تأیید" value={pendingCount.toLocaleString('fa-IR')} icon={<Clock className="h-5 w-5" />} color="amber" subtitle="در صفحه جاری" />
        <StatCard title="لغو / رد شده" value={data.filter(c => c.status?.includes('لغو') || c.status?.includes('رد')).length.toLocaleString('fa-IR')} icon={<XCircle className="h-5 w-5" />} color="red" subtitle="در صفحه جاری" />
      </div>

      {/* Filter tabs + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-2xl p-1" style={{ background: 'rgba(0,0,0,0.05)' }}>
          {filterTabs.map(tab => (
            <button key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                statusFilter === tab.key
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                statusFilter === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-500'
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
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
          <Input label="نرخ قرارداد" type="number" value={form.contractRate}
            onChange={(e) => setForm({ ...form, contractRate: +e.target.value })} />
          <Select label="مشتری" value={selectedCustomer} loading={subsLoading}
            options={customerOptions.map(name => ({ value: name, label: name }))}
            onChange={(v) => { setSelectedCustomer(String(v)); setForm({ ...form, subscriptionId: 0 }) }} />
          <Select label="انشعاب" value={form.subscriptionId || ''} loading={subsLoading}
            disabled={!selectedCustomer}
            options={filteredSubs.map(s => ({ value: s.id, label: `${s.billIdentifier} — ${s.address}` }))}
            onChange={(v) => setForm({ ...form, subscriptionId: +v })} />
          <Input label="مبلغ ضمانت" type="number" value={form.amount || ''}
            onChange={(e) => setForm({ ...form, amount: +e.target.value })} />
          <DatePicker label="تاریخ شروع" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
          <DatePicker label="تاریخ پایان" value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} />
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

      <ContractPrintModal open={!!printData} data={printData} onClose={() => setPrintData(null)} />

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
