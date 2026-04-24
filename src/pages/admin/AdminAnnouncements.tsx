import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Megaphone } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { Table, Pagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input, { DatePicker } from '../../components/ui/Input'
import type { AdminAnnouncement } from '../../types'

const empty: AdminAnnouncement = { id: 0, title: '', contents: '', publishDate: null, finishDate: null }

export default function AdminAnnouncements() {
  const [data, setData]           = useState<AdminAnnouncement[]>([])
  const [total, setTotal]         = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState<'create' | 'edit' | 'delete' | null>(null)
  const [form, setForm]           = useState<AdminAnnouncement>(empty)
  const [saving, setSaving]       = useState(false)
  const pageSize = 10

  const fetchData = useCallback((p: number) => {
    setLoading(true)
    adminApi.getAnnouncements({ pageNumber: p, pageSize })
      .then((r) => {
        const res = r.result as any
        setData(res?.data ?? [])
        setTotal(res?.totalRecords ?? 0)
        setTotalPages(res?.totalPages ?? 1)
      })
      .catch(() => toast.error('خطا در دریافت اطلاعات'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData(page) }, [page, fetchData])

  const openCreate = () => { setForm(empty); setModal('create') }
  const openEdit = async (row: AdminAnnouncement) => {
    try { const r = await adminApi.getAnnouncementDetail(row.id); setForm(r.result ?? row) }
    catch { setForm(row) }
    setModal('edit')
  }
  const openDelete = (row: AdminAnnouncement) => { setForm(row); setModal('delete') }

  const handleSave = async () => {
    if (!form.title || !form.contents) { toast.error('عنوان و متن الزامی است'); return }
    setSaving(true)
    try {
      const res = modal === 'create'
        ? await adminApi.createAnnouncement(form)
        : await adminApi.updateAnnouncement(form)
      if (res.code === 200) {
        toast.success(modal === 'create' ? 'اعلان ثبت شد' : 'اعلان ویرایش شد')
        setModal(null); fetchData(page)
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const res = await adminApi.deleteAnnouncement(form.id)
      if (res.code === 200) { toast.success('اعلان حذف شد'); setModal(null); fetchData(page) }
      else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'id',          header: '#',          className: 'w-16' },
    { key: 'title',       header: 'عنوان' },
    { key: 'publishDate', header: 'تاریخ انتشار' },
    { key: 'finishDate',  header: 'تاریخ پایان', render: (r: AdminAnnouncement) => r.finishDate ?? '—' },
    {
      key: 'actions', header: 'عملیات', className: 'w-24',
      render: (row: AdminAnnouncement) => (
        <div className="flex gap-1">
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">اعلانات ({total} رکورد)</span>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> اعلان جدید</Button>
      </div>

      <Table columns={columns} data={data} loading={loading} keyField="id" emptyText="اعلانی ثبت نشده" />
      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />

      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'create' ? 'اعلان جدید' : 'ویرایش اعلان'} size="lg">
        <div className="space-y-4">
          <Input label="عنوان *" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="عنوان اعلان" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">متن اعلان *</label>
            <textarea
              rows={5}
              value={form.contents}
              onChange={(e) => setForm({ ...form, contents: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="متن کامل اعلان..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DatePicker label="تاریخ انتشار" value={form.publishDate}
              onChange={(v) => setForm({ ...form, publishDate: v })} />
            <DatePicker label="تاریخ پایان (اختیاری)" value={form.finishDate}
              onChange={(v) => setForm({ ...form, finishDate: v })} />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button loading={saving} onClick={handleSave}>
            {modal === 'create' ? 'ثبت اعلان' : 'ذخیره تغییرات'}
          </Button>
        </div>
      </Modal>

      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="حذف اعلان" size="sm">
        <p className="text-sm text-gray-600 mb-5">
          آیا از حذف اعلان <span className="font-bold text-gray-900">«{form.title}»</span> اطمینان دارید؟
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModal(null)}>انصراف</Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}>
            <Trash2 className="h-4 w-4" /> حذف
          </Button>
        </div>
      </Modal>
    </div>
  )
}
