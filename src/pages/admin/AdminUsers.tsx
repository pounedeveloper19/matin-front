import { useEffect, useState } from 'react'
import { Users, Plus, Search, ShieldCheck, UserX, UserCheck, Pencil, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { lookupApi } from '../../api/lookup'
import type { AdminUser, AdminRole } from '../../types'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input, { Select } from '../../components/ui/Input'

const toArr = (v: any): any[] => Array.isArray(v) ? v : (v?.$values ?? [])

const roleBadge = (roleTitle: string | null, customerProfileId: number | null) => {
  if (roleTitle) {
    const isAdmin = roleTitle.toLowerCase().includes('admin') || roleTitle.includes('مدیر')
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${isAdmin ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
        <Shield className="h-3 w-3" />{roleTitle}
      </span>
    )
  }
  if (customerProfileId)
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">مشتری</span>
  return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">بدون نقش</span>
}

export default function AdminUsers() {
  const [users, setUsers]       = useState<AdminUser[]>([])
  const [roles, setRoles]       = useState<AdminRole[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [search, setSearch]     = useState('')
  const [totalRecords, setTotalRecords] = useState(0)
  const [page, setPage]         = useState(1)
  const pageSize = 20

  const [roleModal, setRoleModal]     = useState(false)
  const [editModal, setEditModal]     = useState(false)
  const [createModal, setCreateModal] = useState(false)
  const [selected, setSelected]       = useState<AdminUser | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('')

  const [editForm, setEditForm] = useState({ fullName: '', mobile: '', password: '' })
  const [createForm, setCreateForm] = useState({ fullName: '', mobile: '', password: '', roleId: '' as number | '' })

  const loadUsers = async (p = page, q = search) => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { pageNumber: p, pageSize }
      if (q.trim()) params.search = q.trim()
      const res = await adminApi.getUsers(params)
      if (res.code === 200 && res.result) {
        const r = res.result as any
        setUsers(toArr(r.data))
        setTotalRecords(r.totalRecords ?? 0)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => {
    loadUsers()
    lookupApi.getRoles().then(r => { if (r.code === 200) setRoles(toArr(r.result)) })
  }, [])

  const handleSearch = () => { setPage(1); loadUsers(1, search) }

  const openRoleModal = (u: AdminUser) => {
    setSelected(u); setSelectedRoleId(u.roleId ?? ''); setRoleModal(true)
  }

  const openEditModal = (u: AdminUser) => {
    setSelected(u)
    setEditForm({ fullName: u.fullName, mobile: u.mobile, password: '' })
    setEditModal(true)
  }

  const handleSetRole = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await adminApi.setUserRole({ userId: selected.id, roleId: selectedRoleId || null })
      if (res.type === 'Success' || res.code === 200) {
        toast.success('نقش ذخیره شد'); setRoleModal(false); loadUsers()
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const handleEditUser = async () => {
    if (!selected) return
    if (!editForm.fullName.trim()) { toast.error('نام کامل الزامی است'); return }
    if (!editForm.mobile.trim()) { toast.error('موبایل الزامی است'); return }
    setSaving(true)
    try {
      const res = await adminApi.updateUser({
        id: selected.id,
        fullName: editForm.fullName,
        mobile: editForm.mobile,
        password: editForm.password || undefined,
      })
      if (res.type === 'Success' || res.code === 200) {
        toast.success('کاربر ویرایش شد'); setEditModal(false); loadUsers()
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const handleToggleActive = async (u: AdminUser) => {
    try {
      const res = await adminApi.toggleUserActive(u.id)
      if (res.type === 'Success' || res.code === 200) {
        toast.success(u.isActive ? 'کاربر غیرفعال شد' : 'کاربر فعال شد'); loadUsers()
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
  }

  const handleCreateAdmin = async () => {
    if (!createForm.mobile.trim()) { toast.error('موبایل الزامی است'); return }
    if (!createForm.password.trim()) { toast.error('رمز عبور الزامی است'); return }
    setSaving(true)
    try {
      const res = await adminApi.createAdminUser({
        fullName: createForm.fullName,
        mobile: createForm.mobile,
        password: createForm.password,
        roleId: createForm.roleId || null,
      })
      if (res.type === 'Success' || res.code === 200) {
        toast.success('کاربر ادمین ساخته شد')
        setCreateModal(false); setCreateForm({ fullName: '', mobile: '', password: '', roleId: '' }); loadUsers()
      } else { toast.error(res.message ?? res.caption ?? 'خطا') }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const totalPages = Math.ceil(totalRecords / pageSize)

  return (
    <div className="space-y-5">
      <div className="glass-card flex items-center justify-between rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">مدیریت کاربران</h2>
            <p className="text-xs text-gray-400">{totalRecords.toLocaleString('fa-IR')} کاربر در سیستم</p>
          </div>
        </div>
        <Button onClick={() => setCreateModal(true)}><Plus className="h-4 w-4" /> کاربر ادمین جدید</Button>
      </div>

      <div className="glass-card rounded-2xl px-5 py-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input placeholder="جستجو با نام یا موبایل..." value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          </div>
          <Button variant="secondary" onClick={handleSearch}><Search className="h-4 w-4" /> جستجو</Button>
        </div>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-gray-400">
            <Users className="h-8 w-8 text-gray-300" />
            <p className="text-sm">کاربری یافت نشد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                  {['نام کامل', 'موبایل', 'نقش', 'نوع', 'وضعیت', 'عملیات'].map(h => (
                    <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="transition-colors hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-medium text-gray-800">{u.fullName || '—'}</td>
                    <td className="px-4 py-3 font-mono text-gray-600">{u.mobile}</td>
                    <td className="px-4 py-3">{roleBadge(u.roleTitle, u.customerProfileId)}</td>
                    <td className="px-4 py-3">
                      {u.customerProfileId
                        ? <span className="text-xs text-emerald-600">{u.customerName ? `مشتری — ${u.customerName}` : 'مشتری'}</span>
                        : <span className="text-xs text-violet-600">کاربر سیستمی</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleActive(u)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${u.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                        title="کلیک برای تغییر وضعیت">
                        {u.isActive ? <><UserCheck className="h-3 w-3" /> فعال</> : <><UserX className="h-3 w-3" /> غیرفعال</>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal(u)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-700">
                          <Pencil className="h-3 w-3" /> ویرایش
                        </button>
                        <button onClick={() => openRoleModal(u)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-violet-50 hover:text-violet-700">
                          <Shield className="h-3 w-3" /> نقش
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <p className="text-xs text-gray-400">صفحه {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1}
                onClick={() => { const p = page - 1; setPage(p); loadUsers(p) }}>قبلی</Button>
              <Button variant="secondary" size="sm" disabled={page >= totalPages}
                onClick={() => { const p = page + 1; setPage(p); loadUsers(p) }}>بعدی</Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: ویرایش کاربر */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="ویرایش کاربر" size="sm">
        {selected && (
          <div className="space-y-4">
            <Input label="نام کامل *" value={editForm.fullName}
              onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} />
            <Input label="موبایل *" value={editForm.mobile}
              onChange={e => setEditForm({ ...editForm, mobile: e.target.value.replace(/\D/g, '') })}
              inputMode="numeric" maxLength={11} />
            <Input label="رمز عبور جدید" type="password" value={editForm.password}
              onChange={e => setEditForm({ ...editForm, password: e.target.value })}
              placeholder="خالی بگذارید تا تغییر نکند" maxLength={15} />
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setEditModal(false)}>انصراف</Button>
          <Button loading={saving} onClick={handleEditUser}>ذخیره تغییرات</Button>
        </div>
      </Modal>

      {/* Modal: تغییر نقش */}
      <Modal open={roleModal} onClose={() => setRoleModal(false)} title="تغییر نقش کاربر" size="sm">
        {selected && (
          <div className="space-y-4">
            <div className="rounded-xl px-4 py-3" style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}>
              <p className="text-[10px] text-gray-400">کاربر</p>
              <p className="mt-0.5 font-semibold text-gray-800">{selected.fullName}</p>
              <p className="text-xs text-gray-400">{selected.mobile}</p>
            </div>
            <Select label="نقش" value={selectedRoleId}
              options={[{ value: '', label: '— بدون نقش —' }, ...roles.map(r => ({ value: r.id, label: r.title + (r.description ? ` (${r.description})` : '') }))]}
              onChange={v => setSelectedRoleId(v === '' ? '' : +v)} />
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3">
              <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-xs text-amber-700">نقش روی دسترسی کاربر هنگام ورود بعدی تأثیر می‌گذارد.</p>
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setRoleModal(false)}>انصراف</Button>
          <Button loading={saving} onClick={handleSetRole}>ذخیره نقش</Button>
        </div>
      </Modal>

      {/* Modal: کاربر ادمین جدید */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="کاربر ادمین جدید" size="sm">
        <div className="space-y-4">
          <Input label="نام کامل" value={createForm.fullName}
            onChange={e => setCreateForm({ ...createForm, fullName: e.target.value })} placeholder="مثال: علی رضایی" />
          <Input label="موبایل *" value={createForm.mobile}
            onChange={e => setCreateForm({ ...createForm, mobile: e.target.value.replace(/\D/g, '') })}
            inputMode="numeric" maxLength={11} placeholder="09..." />
          <Input label="رمز عبور *" type="password" value={createForm.password}
            onChange={e => setCreateForm({ ...createForm, password: e.target.value })} maxLength={15} />
          <Select label="نقش" value={createForm.roleId}
            options={[{ value: '', label: '— بدون نقش —' }, ...roles.map(r => ({ value: r.id, label: r.title }))]}
            onChange={v => setCreateForm({ ...createForm, roleId: v === '' ? '' : +v })} />
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={() => setCreateModal(false)}>انصراف</Button>
          <Button loading={saving} onClick={handleCreateAdmin}>ایجاد کاربر</Button>
        </div>
      </Modal>
    </div>
  )
}
