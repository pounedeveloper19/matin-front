import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, FileText, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { uploadApi } from '../../api/upload'
import { lookupApi } from '../../api/lookup'
import type { SubOption, IdTitle } from '../../api/lookup'
import { Table, Pagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input, { Select, DatePicker } from '../../components/ui/Input'
import FileUpload from '../../components/ui/FileUpload'
import Badge, { contractStatusVariant } from '../../components/ui/Badge'
import type { AdminContract } from '../../types'
import { toArr } from '../../utils'

const emptyForm: AdminContract = {
  id: 0,
  contractNumber: '',
  contractRate: 0,
  statusId: 1,
  subscriptionId: 0,
  startDate: null,
  endDate: null,
  amount: 0,
  typeId: 1,
}

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
    try {
      const res = await adminApi.getContractDetail(row.id)
      setForm(res.result ?? row)
    } catch { setForm(row) }
    const sub = subscriptions.find(s => s.id === row.subscriptionId)
    setSelectedCustomer(sub?.customerName ?? '')
    setModal('edit')
  }
  const openDelete = (row: AdminContract) => { setForm(row); setModal('delete') }

  const handleSave = async () => {
    if (!form.subscriptionId) { toast.error('لطفاً انشعاب را انتخاب کنید'); return }
    setSaving(true)
    try {
      const res = modal === 'create'
        ? await adminApi.createContract(form)
        : await adminApi.updateContract(form)
      if (res.code === 200) {
        toast.success(modal === 'create' ? 'قرارداد ایجاد شد' : 'قرارداد ویرایش شد')
        setModal(null)
        fetchData(page)
      } else {
        toast.error(res.message ?? res.caption ?? 'خطا در عملیات')
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const res = await adminApi.deleteContract(form.id)
      if (res.code === 200) {
        toast.success('قرارداد حذف شد')
        setModal(null)
        fetchData(page)
      } else {
        toast.error(res.message ?? res.caption ?? 'خطا در حذف')
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'id',             header: '#',           className: 'w-16' },
    { key: 'contractNumber', header: 'شماره قرارداد' },
    { key: 'customerNationalId', header: 'شناسه مشتری' },
    {
      key: 'status',
      header: 'وضعیت',
      render: (row: AdminContract) => (
        <Badge variant={contractStatusVariant(row.status ?? '')}>{row.status ?? '—'}</Badge>
      ),
    },
    { key: 'startDate', header: 'شروع' },
    { key: 'endDate',   header: 'پایان' },
    {
      key: 'actions',
      header: 'عملیات',
      className: 'w-24',
      render: (row: AdminContract) => (
        <div className="flex items-center gap-1">
          {row.warrantyFileId && (
            <a
              href={uploadApi.downloadUrl(row.warrantyFileId)}
              target="_blank"
              rel="noreferrer"
              title="دانلود فایل تضمین"
              className="rounded p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          )}
          <button onClick={() => openEdit(row)} className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => openDelete(row)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">قراردادها ({total} رکورد)</span>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> قرارداد جدید
        </Button>
      </div>

      <Table columns={columns} data={data} loading={loading} keyField="id" emptyText="قراردادی یافت نشد" />
      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />

      {/* Create / Edit Modal */}
      <Modal
        open={modal === 'create' || modal === 'edit'}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'قرارداد جدید' : 'ویرایش قرارداد'}
        size="lg"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {modal === 'edit' && (
            <Input
              label="شماره قرارداد"
              value={form.contractNumber}
              disabled
              onChange={() => {}}
            />
          )}
          <Input
            label="نرخ قرارداد"
            type="number"
            value={form.contractRate}
            onChange={(e) => setForm({ ...form, contractRate: +e.target.value })}
          />
          <Select
            label="مشتری"
            value={selectedCustomer}
            loading={subsLoading}
            options={customerOptions.map(name => ({ value: name, label: name }))}
            onChange={(v) => {
              setSelectedCustomer(String(v))
              setForm({ ...form, subscriptionId: 0 })
            }}
          />
          <Select
            label="انشعاب"
            value={form.subscriptionId || ''}
            loading={subsLoading}
            disabled={!selectedCustomer}
            options={filteredSubs.map(s => ({
              value: s.id,
              label: `${s.billIdentifier} — ${s.address}`,
            }))}
            onChange={(v) => setForm({ ...form, subscriptionId: +v })}
          />
          <Input
            label="مبلغ ضمانت"
            type="number"
            value={form.amount || ''}
            onChange={(e) => setForm({ ...form, amount: +e.target.value })}
          />
          <DatePicker
            label="تاریخ شروع"
            value={form.startDate}
            onChange={(v) => setForm({ ...form, startDate: v })}
          />
          <DatePicker
            label="تاریخ پایان"
            value={form.endDate}
            onChange={(v) => setForm({ ...form, endDate: v })}
          />
          <Select
            label="نوع ضمانت"
            value={form.typeId ?? ''}
            loading={guaranteeLoading}
            options={guaranteeTypes.map(t => ({ value: t.id, label: t.title }))}
            onChange={(v) => setForm({ ...form, typeId: +v })}
          />
        </div>
        <div className="mt-4">
          <FileUpload
            label="فایل ضمانت"
            fileId={form.fileId}
            onUploaded={(id) => setForm({ ...form, fileId: id })}
            onDeleted={() => setForm({ ...form, fileId: null })}
          />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button loading={saving} onClick={handleSave}>
            {modal === 'create' ? 'ایجاد قرارداد' : 'ذخیره تغییرات'}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="حذف قرارداد" size="sm">
        <p className="text-sm text-gray-600">
          آیا از حذف قرارداد <span className="font-bold text-gray-900">{form.contractNumber}</span> اطمینان دارید؟
          این عملیات قابل بازگشت نیست.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}>
            <Trash2 className="h-4 w-4" /> حذف
          </Button>
        </div>
      </Modal>
    </div>
  )
}
