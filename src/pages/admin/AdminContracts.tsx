import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { Table, Pagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Badge, { contractStatusVariant } from '../../components/ui/Badge'
import type { AdminContract } from '../../types'

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
  const pageSize = 10

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

  const openCreate = () => { setForm(emptyForm); setModal('create') }
  const openEdit = async (row: AdminContract) => {
    try {
      const res = await adminApi.getContractDetail(row.id)
      setForm(res.result ?? row)
    } catch { setForm(row) }
    setModal('edit')
  }
  const openDelete = (row: AdminContract) => { setForm(row); setModal('delete') }

  const handleSave = async () => {
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
        toast.error(res.caption ?? 'خطا در عملیات')
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
        toast.error(res.caption ?? 'خطا در حذف')
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
          <Input
            label="شماره قرارداد"
            value={form.contractNumber}
            onChange={(e) => setForm({ ...form, contractNumber: e.target.value })}
          />
          <Input
            label="نرخ قرارداد"
            type="number"
            value={form.contractRate}
            onChange={(e) => setForm({ ...form, contractRate: +e.target.value })}
          />
          <Input
            label="شناسه اشتراک"
            type="number"
            value={form.subscriptionId || ''}
            onChange={(e) => setForm({ ...form, subscriptionId: +e.target.value })}
          />
          <Input
            label="مبلغ ضمانت"
            type="number"
            value={form.amount || ''}
            onChange={(e) => setForm({ ...form, amount: +e.target.value })}
          />
          <Input
            label="تاریخ شروع"
            type="date"
            value={form.startDate ?? ''}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <Input
            label="تاریخ پایان"
            type="date"
            value={form.endDate ?? ''}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
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
