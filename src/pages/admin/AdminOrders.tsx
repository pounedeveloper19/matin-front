import { useEffect, useState, useCallback } from 'react'
import { ShoppingCart, RefreshCw, ChevronLeft, ChevronRight, X, CreditCard, CheckCircle, XCircle, Download, Upload, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { lookupApi, type IdTitle } from '../../api/lookup'
import { uploadApi } from '../../api/upload'
import FileUpload from '../../components/ui/FileUpload'
import ProformaInvoicePrintModal, { type ProformaInvoiceData } from '../../components/ui/ProformaInvoicePrintModal'
import type { AdminOrderResult } from '../../types'
import { toArr } from '../../utils'

const STATUS_COLOR: Record<number, string> = {
  1: 'bg-yellow-100 text-yellow-800',
  2: 'bg-blue-100 text-blue-800',
  3: 'bg-emerald-100 text-emerald-800',
  4: 'bg-red-100 text-red-800',
}

const PAY_STATUS_COLOR: Record<number, string> = {
  1: 'bg-yellow-100 text-yellow-800',
  2: 'bg-emerald-100 text-emerald-800',
  3: 'bg-red-100 text-red-800',
}

export default function AdminOrders() {
  const [orders, setOrders]         = useState<AdminOrderResult[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const PAGE_SIZE                   = 20
  const [loading, setLoading]       = useState(false)
  const [filterStatus, setFilter]   = useState<string>('')
  const [statuses, setStatuses]     = useState<IdTitle[]>([])

  const [detail, setDetail]         = useState<AdminOrderResult | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showStatus, setShowStatus] = useState(false)

  const [statusForm, setStatusForm] = useState({ statusId: '', priceAtMoment: '' })
  const [saving, setSaving]         = useState(false)

  const [payMethods, setPayMethods] = useState<IdTitle[]>([])
  const [payForm, setPayForm]       = useState({ methodId: '', amount: '', referenceNumber: '', receiptFileId: '' })
  const [paySubmitting, setPaySubmitting] = useState(false)

  const [proformaData, setProformaData] = useState<ProformaInvoiceData | null>(null)

  const openProforma = async (orderId: number) => {
    try {
      const res = await adminApi.getProformaInvoice(orderId)
      if (res.code === 200 && res.result) setProformaData(res.result as ProformaInvoiceData)
      else toast.error('خطا در دریافت اطلاعات پیش‌فاکتور')
    } catch { toast.error('خطا در ارتباط با سرور') }
  }

  const load = useCallback(() => {
    setLoading(true)
    adminApi.getAdminOrders({
      pageNumber: page,
      pageSize: PAGE_SIZE,
      ...(filterStatus ? { statusId: filterStatus } : {}),
    })
      .then(r => {
        if (r.code === 200 && r.result) {
          setOrders(r.result.data)
          setTotal(r.result.totalRecords)
        }
      })
      .finally(() => setLoading(false))
  }, [page, filterStatus])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    lookupApi.getOrderStatuses().then(r => { if (r.code === 200) setStatuses(toArr(r.result)) })
    lookupApi.getPaymentMethods().then(r => { if (r.code === 200) setPayMethods(toArr(r.result)) })
  }, [])

  const openDetail = (id: number) => {
    adminApi.getAdminOrderDetail(id)
      .then(r => {
        if (r.code === 200 && r.result) {
          setDetail(r.result)
          setShowDetail(true)
          const d = r.result
          const autoAmount = d.priceAtMoment > 0 ? String(Math.round(d.priceAtMoment * d.requestedKwh)) : ''
          setPayForm(p => ({ ...p, amount: autoAmount }))
        } else {
          toast.error(r.message ?? r.caption ?? 'خطا در بارگذاری جزئیات')
        }
      })
      .catch(() => toast.error('خطا در ارتباط با سرور'))
  }

  const openStatus = (order: AdminOrderResult) => {
    setDetail(order)
    setStatusForm({ statusId: String(order.statusId), priceAtMoment: order.priceAtMoment > 0 ? String(order.priceAtMoment) : '' })
    setShowStatus(true)
  }

  const handleUpdateStatus = () => {
    if (!detail || !statusForm.statusId) return
    setSaving(true)
    adminApi.updateOrderStatus({
      orderId: detail.id,
      statusId: Number(statusForm.statusId),
      priceAtMoment: statusForm.priceAtMoment ? Number(statusForm.priceAtMoment) : undefined,
    })
      .then(r => {
        if (r.code === 200) { setShowStatus(false); load() }
        else alert(r.message || 'خطا')
      })
      .finally(() => setSaving(false))
  }

  const handleConfirmPayment = (paymentId: number, statusId: number) => {
    setSaving(true)
    adminApi.confirmPayment({ paymentId, statusId })
      .then(r => {
        if (r.code === 200) {
          if (detail) openDetail(detail.id)
        } else alert(r.message || 'خطا')
      })
      .finally(() => setSaving(false))
  }

  const handleSubmitPayment = () => {
    if (!detail) return
    if (!payForm.methodId) { toast.error('روش پرداخت را انتخاب کنید'); return }
    if (!payForm.amount || Number(payForm.amount) <= 0) { toast.error('مبلغ پرداخت را وارد کنید'); return }
    setPaySubmitting(true)
    adminApi.submitPaymentForOrder({
      orderId: detail.id,
      amount: Number(payForm.amount),
      methodId: Number(payForm.methodId),
      referenceNumber: payForm.referenceNumber || undefined,
      receiptFileId: payForm.receiptFileId || undefined,
    })
      .then(r => {
        if (r.code === 200) {
          toast.success('فیش پرداخت ثبت شد')
          setPayForm({ methodId: '', amount: '', referenceNumber: '', receiptFileId: '' })
          openDetail(detail.id)
        } else {
          toast.error(r.message ?? r.caption ?? 'خطا در ثبت فیش')
        }
      })
      .catch(() => toast.error('خطا در ارتباط با سرور'))
      .finally(() => setPaySubmitting(false))
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6" dir="rtl">
      {/* Toolbar */}
      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
          style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-gray-900">مدیریت سفارش‌ها</h3>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">
              {total.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              value={filterStatus}
              onChange={e => { setFilter(e.target.value); setPage(1) }}>
              <option value="">همه وضعیت‌ها</option>
              {statuses.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <button onClick={load}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-emerald-100 hover:text-emerald-600">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex h-24 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <ShoppingCart className="mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm">سفارشی یافت نشد</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-gray-400" style={{ borderColor: 'rgba(209,250,229,0.5)' }}>
                      <th className="pb-3 text-right font-semibold">تاریخ</th>
                      <th className="pb-3 text-right font-semibold">مشتری</th>
                      <th className="pb-3 text-right font-semibold">شناسه</th>
                      <th className="pb-3 text-left font-semibold">نوع انرژی</th>
                      <th className="pb-3 text-left font-semibold">مقدار (kWh)</th>
                      <th className="pb-3 text-left font-semibold">قیمت (ریال/kWh)</th>
                      <th className="pb-3 text-center font-semibold">وضعیت</th>
                      <th className="pb-3 text-center font-semibold">پرداخت</th>
                      <th className="pb-3 text-center font-semibold">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'rgba(209,250,229,0.3)' }}>
                    {orders.map(o => (
                      <tr key={o.id} className="transition-colors hover:bg-emerald-50/30">
                        <td className="py-3 text-xs text-gray-500">{o.orderDate ?? '—'}</td>
                        <td className="py-3 text-xs font-semibold text-gray-800">{o.customerName || '—'}</td>
                        <td className="py-3 font-mono text-xs text-gray-600">{o.billIdentifier}</td>
                        <td className="py-3 text-left text-xs">{o.energyType}</td>
                        <td className="py-3 text-left font-mono font-semibold text-gray-900">
                          {o.requestedKwh.toLocaleString('fa-IR')}
                        </td>
                        <td className="py-3 text-left font-mono text-gray-600">
                          {o.priceAtMoment > 0 ? o.priceAtMoment.toLocaleString('fa-IR') : '—'}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[o.statusId] ?? 'bg-gray-100 text-gray-700'}`}>
                            {o.isPriceRequest ? '(استعلام) ' : ''}{o.status}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span className="text-xs text-gray-500">
                            {o.paymentCount > 0 ? `${o.paymentCount} پرداخت` : '—'}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openDetail(o.id)}
                              className="rounded-lg px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">
                              جزئیات
                            </button>
                            <button onClick={() => openStatus(o)}
                              className="rounded-lg px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50">
                              وضعیت
                            </button>
                            {!o.isPriceRequest && (
                              <button onClick={() => openProforma(o.id)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                title="پیش‌فاکتور">
                                <Printer className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <span>نمایش {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} از {total.toLocaleString('fa-IR')}</span>
                  <div className="flex items-center gap-1">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                      className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-40">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <span className="px-2 font-semibold text-gray-700">{page} / {totalPages}</span>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                      className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-40">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {showDetail && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl" style={{ maxHeight: '90vh' }}>
            <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
              <h2 className="font-bold text-gray-900">جزئیات سفارش #{detail.id}</h2>
              <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500 mb-0.5">مشتری</p>
                  <p className="font-semibold text-gray-900">{detail.customerName || '—'}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500 mb-0.5">شناسه</p>
                  <p className="font-mono font-semibold text-gray-900">{detail.billIdentifier}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500 mb-0.5">نوع انرژی</p>
                  <p className="font-semibold text-gray-900">{detail.energyType}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500 mb-0.5">مقدار</p>
                  <p className="font-mono font-semibold text-gray-900">{detail.requestedKwh.toLocaleString('fa-IR')} kWh</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500 mb-0.5">قیمت اعلامی</p>
                  <p className="font-mono font-semibold text-gray-900">
                    {detail.priceAtMoment > 0 ? detail.priceAtMoment.toLocaleString('fa-IR') + ' ر' : 'تعیین نشده'}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500 mb-0.5">وضعیت</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[detail.statusId] ?? 'bg-gray-100 text-gray-700'}`}>
                    {detail.status}
                  </span>
                </div>
              </div>

              {detail.payments && detail.payments.length > 0 ? (
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    فیش‌های پرداخت
                    <span className="mr-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
                      {detail.payments.length} فیش
                    </span>
                  </p>
                  <div className="space-y-2">
                    {detail.payments.map(p => (
                      <div key={p.id} className={`overflow-hidden rounded-xl border ${p.statusId === 1 ? 'border-amber-200 bg-amber-50/60' : 'border-gray-100 bg-gray-50'}`}>
                        <div className="flex items-start justify-between px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 shrink-0 text-gray-400" />
                              <span className="font-mono font-bold text-gray-900">{p.amount.toLocaleString('fa-IR')} ریال</span>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PAY_STATUS_COLOR[p.statusId] ?? 'bg-gray-100 text-gray-600'}`}>
                                {p.status}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">{p.method}</p>
                            {p.referenceNumber && (
                              <p className="mt-0.5 font-mono text-xs font-semibold text-blue-700 bg-blue-50 inline-block rounded px-2 py-0.5">
                                کد رهگیری: {p.referenceNumber}
                              </p>
                            )}
                            {p.receiptFileId && (
                              <div className="mt-1">
                                <button
                                  onClick={() => uploadApi.download(p.receiptFileId as string).catch(() => alert('خطا در دانلود فیش'))}
                                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  دانلود فیش
                                </button>
                              </div>
                            )}
                            <p className="mt-0.5 text-[10px] text-gray-400">{p.createdAt ?? ''}</p>
                          </div>
                        </div>
                        {p.statusId === 1 && (
                          <div className="flex items-center gap-2 border-t border-amber-200 bg-amber-50 px-4 py-2.5">
                            <span className="flex-1 text-xs font-semibold text-amber-800">در انتظار تایید فیش</span>
                            <button
                              onClick={() => handleConfirmPayment(p.id, 2)}
                              disabled={saving}
                              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
                              <CheckCircle className="h-3.5 w-3.5" />
                              تایید فیش
                            </button>
                            <button
                              onClick={() => handleConfirmPayment(p.id, 3)}
                              disabled={saving}
                              className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-60">
                              <XCircle className="h-3.5 w-3.5" />
                              رد فیش
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 py-5 text-center text-xs text-gray-400">
                  هنوز فیش پرداختی ثبت نشده
                </div>
              )}

              {/* Admin payment slip upload */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Upload className="h-4 w-4 text-blue-500" />
                  <p className="text-sm font-semibold text-blue-800">ثبت فیش پرداخت (ادمین)</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">روش پرداخت</label>
                    <select
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={payForm.methodId}
                      onChange={e => setPayForm(p => ({ ...p, methodId: e.target.value }))}>
                      <option value="">انتخاب کنید...</option>
                      {payMethods.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">مبلغ (ریال)</label>
                    <input
                      type="number" min="0"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="مبلغ پرداختی"
                      value={payForm.amount}
                      onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">کد رهگیری (اختیاری)</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="شماره رهگیری یا مرجع"
                    value={payForm.referenceNumber}
                    onChange={e => setPayForm(p => ({ ...p, referenceNumber: e.target.value }))}
                  />
                </div>
                <FileUpload
                  label="فایل فیش (اختیاری)"
                  fileId={payForm.receiptFileId || null}
                  onUploaded={id => setPayForm(p => ({ ...p, receiptFileId: id }))}
                  onDeleted={() => setPayForm(p => ({ ...p, receiptFileId: '' }))}
                />
                <button
                  onClick={handleSubmitPayment}
                  disabled={paySubmitting}
                  className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
                  {paySubmitting
                    ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> در حال ثبت...</>
                    : <><Upload className="h-4 w-4" /> ثبت فیش پرداخت</>
                  }
                </button>
              </div>

              <button onClick={() => { setShowDetail(false); openStatus(detail) }}
                className="w-full rounded-xl border border-emerald-300 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
                تغییر وضعیت / قیمت
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatus && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-bold text-gray-900">تغییر وضعیت سفارش #{detail.id}</h2>
              <button onClick={() => setShowStatus(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">وضعیت</label>
                <select
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  value={statusForm.statusId}
                  onChange={e => setStatusForm(p => ({ ...p, statusId: e.target.value }))}>
                  <option value="">انتخاب کنید...</option>
                  {statuses.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">قیمت (ریال/kWh)</label>
                <input
                  type="number" min="0"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="اختیاری — در صورت تایید وارد کنید"
                  value={statusForm.priceAtMoment}
                  onChange={e => setStatusForm(p => ({ ...p, priceAtMoment: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t px-5 py-4">
              <button onClick={() => setShowStatus(false)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                انصراف
              </button>
              <button onClick={handleUpdateStatus} disabled={saving || !statusForm.statusId}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                {saving ? 'در حال ذخیره...' : 'ذخیره'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ProformaInvoicePrintModal
        open={!!proformaData}
        data={proformaData}
        onClose={() => setProformaData(null)}
      />
    </div>
  )
}
