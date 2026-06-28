import { useEffect, useState, useCallback } from 'react'
import { Shield, Plus, Pencil, Trash2, CheckSquare, Square, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { lookupApi } from '../../api/lookup'
import type { AdminRole, SiteMapItem } from '../../types'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'

const toArr = (v: any): any[] => Array.isArray(v) ? v : (v?.$values ?? [])

export default function AdminRoles() {
  const [roles, setRoles]               = useState<AdminRole[]>([])
  const [siteMaps, setSiteMaps]         = useState<SiteMapItem[]>([])
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null)
  const [checkedIds, setCheckedIds]     = useState<Set<number>>(new Set())
  const [loading, setLoading]           = useState(true)
  const [permLoading, setPermLoading]   = useState(false)
  const [saving, setSaving]             = useState(false)
  const [savingPerm, setSavingPerm]     = useState(false)
  const [roleModal, setRoleModal]       = useState(false)
  const [deleteModal, setDeleteModal]   = useState(false)
  const [editTarget, setEditTarget]     = useState<AdminRole | null>(null)
  const [roleForm, setRoleForm]         = useState({ title: '', description: '' })

  const loadRoles = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getRoles()
      if (res.code === 200) setRoles(toArr(res.result))
    } finally { setLoading(false) }
  }

  useEffect(() => {
    loadRoles()
    lookupApi.getSiteMaps().then(r => { if (r.code === 200) setSiteMaps(toArr(r.result)) })
  }, [])

  const selectRole = async (role: AdminRole) => {
    setSelectedRole(role)
    setPermLoading(true)
    try {
      const res = await adminApi.getRolePermissions(role.id)
      if (res.code === 200) setCheckedIds(new Set(toArr(res.result)))
    } finally { setPermLoading(false) }
  }

  const toggleCheck = (id: number) =>
    setCheckedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const toggleGroup = (ids: number[]) => {
    setCheckedIds(prev => {
      const next = new Set(prev)
      const allChecked = ids.every(id => next.has(id))
      ids.forEach(id => allChecked ? next.delete(id) : next.add(id))
      return next
    })
  }

  // همه فرزندان یک آیتم (بازگشتی)
  const collectDescendants = useCallback((id: number): number[] => {
    const direct = siteMaps.filter(s => s.parentId === id)
    return direct.flatMap(c => [c.id, ...collectDescendants(c.id)])
  }, [siteMaps])

  const handleSavePermissions = async () => {
    if (!selectedRole) return
    setSavingPerm(true)
    try {
      const res = await adminApi.setRolePermissions({ roleId: selectedRole.id, siteMapIds: [...checkedIds] })
      if (res.type === 'Success' || res.code === 200) toast.success('دسترسی‌ها ذخیره شد')
      else toast.error(res.message ?? res.caption ?? 'خطا در ذخیره')
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSavingPerm(false) }
  }

  const openCreate = () => { setEditTarget(null); setRoleForm({ title: '', description: '' }); setRoleModal(true) }
  const openEdit   = (role: AdminRole) => { setEditTarget(role); setRoleForm({ title: role.title, description: role.description ?? '' }); setRoleModal(true) }

  const handleSaveRole = async () => {
    if (!roleForm.title.trim()) { toast.error('عنوان نقش الزامی است'); return }
    setSaving(true)
    try {
      const payload = { title: roleForm.title, description: roleForm.description || undefined }
      const res = editTarget
        ? await adminApi.updateRole({ id: editTarget.id, ...payload })
        : await adminApi.createRole(payload)
      if (res.type === 'Success' || res.code === 200) {
        toast.success(editTarget ? 'نقش ویرایش شد' : 'نقش ایجاد شد')
        setRoleModal(false); loadRoles()
      } else toast.error(res.message ?? res.caption ?? 'خطا')
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const handleDeleteRole = async () => {
    if (!editTarget) return
    setSaving(true)
    try {
      const res = await adminApi.deleteRole(editTarget.id)
      if (res.type === 'Success' || res.code === 200) {
        toast.success('نقش حذف شد')
        setDeleteModal(false)
        if (selectedRole?.id === editTarget.id) { setSelectedRole(null); setCheckedIds(new Set()) }
        loadRoles()
      } else toast.error(res.message ?? res.caption ?? 'خطا')
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  // ──── رندر بازگشتی درخت SiteMap ────
  const renderNode = (item: SiteMapItem, depth: number): React.ReactNode => {
    const children = siteMaps.filter(s => s.parentId === item.id)
    const hasChildren = children.length > 0

    if (!hasChildren) {
      const checked = checkedIds.has(item.id)
      return (
        <button key={item.id} onClick={() => toggleCheck(item.id)}
          className="flex w-full items-center gap-2 rounded-lg py-1.5 text-right transition-colors hover:bg-emerald-50"
          style={{ paddingRight: `${8 + depth * 14}px` }}>
          <span className={`shrink-0 ${checked ? 'text-emerald-600' : 'text-gray-300'}`}>
            {checked ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
          </span>
          <span className="text-sm text-gray-700">{item.title}</span>
          {item.isInMenu
            ? <span className="mr-auto rounded bg-blue-50 px-1.5 py-0.5 text-[9px] text-blue-500">منو</span>
            : item.controlKey
              ? <span className="mr-auto rounded bg-amber-50 px-1.5 py-0.5 text-[9px] text-amber-600">عملیاتی</span>
              : null}
        </button>
      )
    }

    const descIds   = collectDescendants(item.id)
    const allChecked  = descIds.length > 0 && descIds.every(id => checkedIds.has(id))
    const someChecked = descIds.some(id => checkedIds.has(id))

    return (
      <div key={item.id}>
        <button onClick={() => toggleGroup(descIds)}
          className="flex w-full items-center gap-2 rounded-lg py-1.5 text-right transition-colors hover:bg-gray-50"
          style={{ paddingRight: `${8 + depth * 14}px` }}>
          <span className={`shrink-0 ${allChecked ? 'text-emerald-600' : someChecked ? 'text-amber-500' : 'text-gray-300'}`}>
            {allChecked ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          </span>
          <span className="text-xs font-bold text-gray-600">{item.title}</span>
          <span className="mr-auto text-[10px] text-gray-400">{descIds.length} مورد</span>
        </button>
        <div className="border-r border-gray-100 mr-5">
          {children.map(c => renderNode(c, depth + 1))}
        </div>
      </div>
    )
  }

  // ریشه‌های اصلی (ParentId=null) — به ترتیب: مشتری (Id=1) بعد ادمین (Id=10)
  const roots = siteMaps.filter(s => s.parentId === null).sort((a, b) => a.id - b.id)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass-card flex items-center gap-3 rounded-2xl px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">نقش‌ها و دسترسی‌ها</h2>
          <p className="text-xs text-gray-400">مدیریت نقش‌های سیستم و تعیین دسترسی هر نقش به فرم‌ها و عملیات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* چپ: لیست نقش‌ها */}
        <div className="lg:col-span-2">
          <div className="glass-card overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between px-4 py-3"
              style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
              <span className="text-sm font-semibold text-gray-700">نقش‌ها</span>
              <Button size="sm" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> جدید</Button>
            </div>

            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {roles.map(role => (
                  <div key={role.id} onClick={() => selectRole(role)}
                    className={`group flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition-all ${
                      selectedRole?.id === role.id ? 'bg-violet-600 text-white shadow-sm' : 'hover:bg-violet-50'
                    }`}>
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-semibold ${selectedRole?.id === role.id ? 'text-white' : 'text-gray-800'}`}>
                        {role.title}
                      </p>
                      {role.description && (
                        <p className={`truncate text-[11px] ${selectedRole?.id === role.id ? 'text-violet-200' : 'text-gray-400'}`}>
                          {role.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={e => { e.stopPropagation(); openEdit(role) }}
                        className={`rounded-lg p-1 transition-colors ${selectedRole?.id === role.id ? 'hover:bg-violet-500 text-violet-100' : 'hover:bg-gray-100 text-gray-400'}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setEditTarget(role); setDeleteModal(true) }}
                        className={`rounded-lg p-1 transition-colors ${selectedRole?.id === role.id ? 'hover:bg-red-500 text-violet-100' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {roles.length === 0 && (
                  <div className="py-8 text-center text-sm text-gray-400">نقشی تعریف نشده</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* راست: درخت دسترسی‌ها */}
        <div className="lg:col-span-3">
          <div className="glass-card overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between px-4 py-3"
              style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
              <span className="text-sm font-semibold text-gray-700">
                {selectedRole ? `دسترسی‌های نقش: ${selectedRole.title}` : 'یک نقش را انتخاب کنید'}
              </span>
              {selectedRole && (
                <Button size="sm" loading={savingPerm} onClick={handleSavePermissions}>
                  <Save className="h-3.5 w-3.5" /> ذخیره
                </Button>
              )}
            </div>

            <div className="p-3" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {!selectedRole ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-gray-300">
                  <Shield className="h-10 w-10" />
                  <p className="text-sm text-gray-400">یک نقش از فهرست انتخاب کنید</p>
                </div>
              ) : permLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                </div>
              ) : roots.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">آیتمی در SiteMap تعریف نشده</div>
              ) : (
                <div className="space-y-1">
                  {/* راهنما */}
                  <div className="mb-3 flex gap-3 rounded-lg bg-gray-50 px-3 py-2 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1"><span className="rounded bg-blue-50 px-1 text-blue-500">منو</span> آیتم ناوبری</span>
                    <span className="flex items-center gap-1"><span className="rounded bg-amber-50 px-1 text-amber-600">عملیاتی</span> دسترسی عملیاتی</span>
                  </div>
                  {roots.map(root => renderNode(root, 0))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: ایجاد/ویرایش نقش */}
      <Modal open={roleModal} onClose={() => setRoleModal(false)}
        title={editTarget ? 'ویرایش نقش' : 'نقش جدید'} size="sm">
        <div className="space-y-4">
          <Input label="عنوان نقش *" value={roleForm.title}
            onChange={e => setRoleForm({ ...roleForm, title: e.target.value })}
            placeholder="مثال: مدیر فروش" />
          <Input label="توضیحات" value={roleForm.description}
            onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
            placeholder="اختیاری" />
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setRoleModal(false)}>انصراف</Button>
          <Button loading={saving} onClick={handleSaveRole}>{editTarget ? 'ذخیره' : 'ایجاد نقش'}</Button>
        </div>
      </Modal>

      {/* Modal: حذف نقش */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="حذف نقش" size="sm">
        <p className="text-sm text-gray-600">
          نقش <strong>{editTarget?.title}</strong> حذف می‌شود. تمام دسترسی‌ها و تخصیص‌های این نقش به کاربران نیز پاک خواهد شد.
        </p>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setDeleteModal(false)}>انصراف</Button>
          <Button variant="danger" loading={saving} onClick={handleDeleteRole}>
            <Trash2 className="h-4 w-4" /> حذف نقش
          </Button>
        </div>
      </Modal>
    </div>
  )
}
