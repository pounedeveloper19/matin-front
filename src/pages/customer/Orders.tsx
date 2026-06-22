import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Plus, CreditCard, RefreshCw, X,
  ChevronDown, ChevronUp, Receipt, ArrowLeft, CheckCircle, Download,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { customerApi } from '../../api/customer'
import { lookupApi, type IdTitle } from '../../api/lookup'
import { uploadApi } from '../../api/upload'
import FileUpload from '../../components/ui/FileUpload'
import type { OrderResult, OrderDetailResult, SubscriptionResult, AdvancedBillAnalysisResult } from '../../types'
import { toArr } from '../../utils'

const fmt  = (n: number) => n.toLocaleString('fa-IR', { maximumFractionDigits: 0 })
const rial = (n: number) => fmt(n) + ' ریال'

const ORDER_STATUS: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'در انتظار بررسی' },
  2: { bg: 'bg-blue-100',   text: 'text-blue-800',   label: 'تایید شده' },
  3: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'تکمیل شده' },
  4: { bg: 'bg-red-100',    text: 'text-red-800',    label: 'رد شده' },
}

const PAY_STATUS: Record<number, string> = {
  1: 'bg-yellow-100 text-yellow-800',
  2: 'bg-emerald-100 text-emerald-800',
  3: 'bg-red-100 text-red-800',
}

const canPay = (o: OrderResult | OrderDetailResult) =>
  (o.statusId === 1 || o.statusId === 2) && !o.isPriceRequest

export default function Orders() {
  const location = useLocation()
  const navigate  = useNavigate()
  const navState  = location.state as { newOrderId?: number; analysis?: AdvancedBillAnalysisResult } | null

  const [orders, setOrders]         = useState<OrderResult[]>([])
  const [loading, setLoading]       = useState(false)
  const [subscriptions, setSubs]    = useState<SubscriptionResult[]>([])
  const [energyTypes, setETypes]    = useState<IdTitle[]>([])
  const [payMethods, setPayMethods] = useState<IdTitle[]>([])

  const [analysis, setAnalysis]         = useState<AdvancedBillAnalysisResult | null>(navState?.analysis ?? null)
  const [analysisOpen, setAnalysisOpen] = useState(true)

  const [showCreate, setShowCreate]   = useState(false)
  const [showPay, setShowPay]         = useState(false)
  const [detail, setDetail]           = useState<OrderDetailResult | null>(null)
  const [showDetail, setShowDetail]   = useState(false)
  const [saving, setSaving]           = useState(false)
  const [newOrderId]                  = useState<number | undefined>(navState?.newOrderId)

  const [createForm, setCreateForm] = useState({
    subscriptionId: '' as number | '',
    requestedKwh: '',
    energyTypeId: '' as number | '',
    isPriceRequest: false,
  })

  const [payForm, setPayForm] = useState({
    orderId: 0,
    amount: '',
    methodId: '' as number | '',
    referenceNumber: '',
    receiptFileId: '' as string | '',
    suggestedAmount: 0,
  })

  useEffect(() => {
    loadOrders()
    customerApi.getSubscriptions().then(r => { if (r.code === 200) setSubs(toArr(r.result)) })
    lookupApi.getEnergyTypes().then(r => { if (r.code === 200) setETypes(toArr(r.result)) })
    lookupApi.getPaymentMethods().then(r => { if (r.code === 200) setPayMethods(toArr(r.result)) })
    // Clear navigation state so refresh doesn't re-trigger
    window.history.replaceState({}, '')
  }, [])

  // Auto-open new order detail once orders load
  useEffect(() => {
    if (newOrderId && orders.length > 0) {
      const found = orders.find(o => o.id === newOrderId)
      if (found) openDetail(newOrderId)
    }
  }, [newOrderId, orders.length])

  const loadOrders = () => {
    setLoading(true)
    customerApi.getMyOrders()
      .then(r => { if (r.code === 200) setOrders(toArr(r.result)) })
      .finally(() => setLoading(false))
  }

  const openDetail = (id: number) => {
    customerApi.getOrderDetail(id)
      .then(r => {
        if (r.code === 200 && r.result) {
          setDetail(r.result as OrderDetailResult)
          setShowDetail(true)
        } else {
          toast.error(r.message ?? r.caption ?? 'خطا در بارگذاری جزئیات')
        }
      })
      .catch(() => toast.error('خطا در ارتباط با سرور'))
  }

  const openPay = (o: OrderResult) => {
    const suggested = o.priceAtMoment > 0 ? Math.round(o.requestedKwh * o.priceAtMoment) : 0
    setPayForm({ orderId: o.id, amount: suggested > 0 ? String(suggested) : '', methodId: '', referenceNumber: '', receiptFileId: '', suggestedAmount: suggested })
    setShowPay(true)
  }

  const handleCreate = () => {
    if (!createForm.subscriptionId || !createForm.requestedKwh || !createForm.energyTypeId) {
      toast.error('همه فیلدهای الزامی را وارد کنید'); return
    }
    setSaving(true)
    customerApi.createOrder({
      subscriptionId: createForm.subscriptionId as number,
      requestedKwh: parseFloat(createForm.requestedKwh),
      energyTypeId: createForm.energyTypeId as number,
      isPriceRequest: createForm.isPriceRequest,
    })
      .then(r => {
        if (r.code === 200) {
          toast.success('سفارش ثبت شد')
          setShowCreate(false)
          setCreateForm({ subscriptionId: '', requestedKwh: '', energyTypeId: '', isPriceRequest: false })
          loadOrders()
        } else { toast.error(r.message ?? r.caption ?? 'خطا در ثبت سفارش') }
      })
      .finally(() => setSaving(false))
  }

  const handlePay = () => {
    if (!payForm.amount || !payForm.methodId) {
      toast.error('مبلغ و روش پرداخت را وارد کنید'); return
    }
    setSaving(true)
    customerApi.submitPayment({
      orderId: payForm.orderId,
      amount: parseFloat(payForm.amount),
      methodId: payForm.methodId as number,
      referenceNumber: payForm.referenceNumber || undefined,
      receiptFileId: payForm.receiptFileId || undefined,
    })
      .then(r => {
        if (r.code === 200) {
          toast.success('فیش پرداخت ثبت شد — ادمین بررسی خواهد کرد')
          setShowPay(false)
          loadOrders()
          if (showDetail && detail?.id === payForm.orderId) {
            openDetail(payForm.orderId)
          }
        } else { toast.error(r.message ?? r.caption ?? 'خطا در ثبت پرداخت') }
      })
      .finally(() => setSaving(false))
  }

  return (
    <div className="space-y-5" dir="rtl">

      {/* ── Analysis context banner (when arriving from Bills) ── */}
      {analysis && (
        <div className="overflow-hidden rounded-2xl" style={{ border: '2px solid #10b981', background: 'linear-gradient(135deg,rgba(236,253,245,0.97),rgba(255,255,255,0.97))' }}>
          <button
            onClick={() => setAnalysisOpen(p => !p)}
            className="flex w-full items-center justify-between px-5 py-3 text-right transition-colors hover:bg-emerald-50/30">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-emerald-900">مبنای سفارش</span>
                <span className="mr-2 text-sm text-emerald-600">تحلیل قبض {analysis.monthName} {analysis.year}</span>
              </div>
            </div>
            {analysisOpen
              ? <ChevronUp className="h-4 w-4 text-emerald-600" />
              : <ChevronDown className="h-4 w-4 text-emerald-600" />}
          </button>
          {analysisOpen && (
            <div className="border-t border-emerald-100 px-5 pb-4 pt-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                  <p className="text-xs text-red-400">هزینه بدون قرارداد</p>
                  <p className="mt-0.5 font-bold text-red-700">{rial(analysis.costWithoutMatin)}</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-500">هزینه با قرارداد متین</p>
                  <p className="mt-0.5 font-bold text-emerald-700">{rial(analysis.costWithMatin)}</p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <p className="text-xs text-blue-400">صرفه‌جویی</p>
                  <p className="mt-0.5 font-bold text-blue-700">{rial(analysis.netSaving)}</p>
                  <p className="text-[10px] text-blue-400">{analysis.savingPercent.toFixed(1)}٪ کاهش</p>
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">مصرف کل: {fmt(analysis.totalKwh)} kWh</span>
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-700">اوج: {fmt(analysis.peakKwh)} kWh</span>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">میان: {fmt(analysis.midKwh)} kWh</span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">کم: {fmt(analysis.lowKwh)} kWh</span>
                <button onClick={() => setAnalysis(null)}
                  className="mr-auto rounded-full bg-gray-100 px-2.5 py-1 text-gray-500 hover:bg-gray-200">
                  بستن
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Orders List ── */}
      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between px-5 py-4"
          style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">سفارش‌های من</h3>
              {orders.length > 0 && <p className="text-xs text-gray-400">{orders.length} سفارش</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadOrders}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => navigate('/customer/bills')}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
              <ArrowLeft className="h-3.5 w-3.5" />
              تحلیل قبض
            </button>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
              <Plus className="h-4 w-4" />
              سفارش جدید
            </button>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex h-28 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-gray-400">
              <ShoppingCart className="mb-3 h-10 w-10 text-gray-300" />
              <p className="font-semibold text-gray-500">هنوز سفارشی ثبت نشده است</p>
              <p className="mt-1 text-xs text-gray-400">از صفحه تحلیل قبض سفارش ثبت کنید</p>
              <div className="mt-5 flex gap-3">
                <button onClick={() => navigate('/customer/bills')}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                  <ArrowLeft className="h-4 w-4" />
                  تحلیل قبض
                </button>
                <button onClick={() => setShowCreate(true)}
                  className="rounded-xl border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  ثبت مستقیم
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(o => {
                const sc      = ORDER_STATUS[o.statusId] ?? { bg: 'bg-gray-100', text: 'text-gray-700', label: o.status }
                const isNew   = o.id === newOrderId
                const payable = canPay(o)
                return (
                  <div key={o.id}
                    className={`overflow-hidden rounded-xl border transition-all ${isNew ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-gray-200 hover:border-gray-300'}`}
                    style={{ background: isNew ? 'rgba(236,253,245,0.5)' : 'rgba(255,255,255,0.95)' }}>
                    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold text-gray-900">{o.billIdentifier}</span>
                          <span className="text-xs text-gray-400">{o.orderDate ?? ''}</span>
                          {isNew && (
                            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">تازه ثبت شده</span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span className="font-semibold text-gray-700">{o.energyType}</span>
                          <span className="text-gray-300">·</span>
                          <span className="font-bold text-gray-900">{fmt(o.requestedKwh)} kWh</span>
                          {o.priceAtMoment > 0 && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span className="font-semibold text-blue-600">{fmt(o.priceAtMoment)} ریال/kWh</span>
                            </>
                          )}
                          {o.paymentCount > 0 && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span className="rounded-full bg-purple-100 px-2 py-0.5 font-semibold text-purple-700">
                                {o.paymentCount} فیش ثبت شده
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc.bg} ${sc.text}`}>
                          {o.isPriceRequest ? '(استعلام) ' : ''}{sc.label}
                        </span>
                        <button onClick={() => openDetail(o.id)}
                          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors">
                          جزئیات
                        </button>
                        {payable && (
                          <button onClick={() => openPay(o)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">
                            <Receipt className="h-3 w-3" />
                            ثبت فیش
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Status steps */}
                    {!o.isPriceRequest && o.statusId !== 4 && (
                      <div className="flex border-t border-gray-100 text-[10px] font-medium">
                        {[{ id: 1, label: 'ثبت سفارش' }, { id: 2, label: 'تایید ادمین' }, { id: 3, label: 'تکمیل' }].map((step, i) => {
                          const done   = o.statusId >= step.id
                          const active = o.statusId === step.id
                          return (
                            <div key={step.id}
                              className={`flex flex-1 items-center justify-center gap-1 py-1.5 transition-colors ${done ? 'bg-emerald-50 text-emerald-700' : 'text-gray-400'} ${active ? 'font-bold' : ''}`}>
                              {i > 0 && <div className={`h-px w-4 ${done ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
                              <span className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                              {step.label}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {o.statusId === 4 && (
                      <div className="border-t border-red-100 bg-red-50 py-1.5 text-center text-[10px] font-bold text-red-600">
                        سفارش رد شده
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Create Order Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" dir="rtl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-bold text-gray-900">ثبت سفارش جدید</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">شناسه *</label>
                <select className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  value={createForm.subscriptionId}
                  onChange={e => setCreateForm(p => ({ ...p, subscriptionId: e.target.value ? Number(e.target.value) : '' }))}>
                  <option value="">انتخاب کنید...</option>
                  {subscriptions.map(s => <option key={s.id} value={s.id}>{s.billIdentifier} — {s.powerEntity}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">نوع انرژی *</label>
                <select className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  value={createForm.energyTypeId}
                  onChange={e => setCreateForm(p => ({ ...p, energyTypeId: e.target.value ? Number(e.target.value) : '' }))}>
                  <option value="">انتخاب کنید...</option>
                  {energyTypes.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">مقدار درخواستی (kWh) *</label>
                <input type="number" min="0"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="مثال: ۱۰۰۰"
                  value={createForm.requestedKwh}
                  onChange={e => setCreateForm(p => ({ ...p, requestedKwh: e.target.value }))} />
              </div>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-gray-200 p-3 hover:bg-gray-50">
                <input type="checkbox" className="h-4 w-4 rounded accent-emerald-600"
                  checked={createForm.isPriceRequest}
                  onChange={e => setCreateForm(p => ({ ...p, isPriceRequest: e.target.checked }))} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">فقط استعلام قیمت</p>
                  <p className="text-xs text-gray-500">بدون تعهد خرید</p>
                </div>
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t px-5 py-4">
              <button onClick={() => setShowCreate(false)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">انصراف</button>
              <button onClick={handleCreate} disabled={saving}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                {saving ? 'در حال ثبت...' : 'ثبت سفارش'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Receipt Modal ── */}
      {showPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" dir="rtl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
                <h2 className="font-bold text-gray-900">ثبت فیش پرداخت</h2>
              </div>
              <button onClick={() => setShowPay(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                پس از ثبت فیش، ادمین اطلاعات را بررسی و تایید می‌کند. شماره مرجع را دقیق وارد کنید.
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">روش پرداخت *</label>
                <select className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  value={payForm.methodId}
                  onChange={e => setPayForm(p => ({ ...p, methodId: e.target.value ? Number(e.target.value) : '' }))}>
                  <option value="">انتخاب کنید...</option>
                  {payMethods.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">مبلغ واریزی (ریال) *</label>
                <input type="number" min="0"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="مبلغ را به ریال وارد کنید"
                  value={payForm.amount}
                  onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} />
                {payForm.suggestedAmount > 0 && (
                  <p className="mt-1 text-xs text-gray-400">مبلغ پیش‌فرض: {rial(payForm.suggestedAmount)}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">شماره مرجع / کد رهگیری</label>
                <input type="text"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="شماره پیگیری واریز"
                  value={payForm.referenceNumber}
                  onChange={e => setPayForm(p => ({ ...p, referenceNumber: e.target.value }))} />
              </div>
              <FileUpload
                label="فیش واریزی"
                entityType="Payment"
                entityId={payForm.orderId}
                fileId={payForm.receiptFileId || null}
                accept=".pdf,.jpg,.jpeg,.png"
                onUploaded={(fileId) => setPayForm(p => ({ ...p, receiptFileId: fileId }))}
                onDeleted={() => setPayForm(p => ({ ...p, receiptFileId: '' }))}
              />
            </div>
            <div className="flex justify-end gap-3 border-t px-5 py-4">
              <button onClick={() => setShowPay(false)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">انصراف</button>
              <button onClick={handlePay} disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                <Receipt className="h-4 w-4" />
                {saving ? 'در حال ثبت...' : 'ثبت فیش'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Order Detail Modal ── */}
      {showDetail && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl" style={{ maxHeight: '85vh' }} dir="rtl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-bold text-gray-900">جزئیات سفارش #{detail.id}</h2>
                <p className="text-xs text-gray-400">{detail.orderDate ?? ''}</p>
              </div>
              <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {/* Order fields */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'شناسه',           value: detail.billIdentifier,  mono: true },
                  { label: 'نوع انرژی',      value: detail.energyType },
                  { label: 'مقدار درخواستی', value: `${fmt(detail.requestedKwh)} kWh`, mono: true },
                  { label: 'قیمت اعلامی',    value: detail.priceAtMoment > 0 ? rial(detail.priceAtMoment) : 'در انتظار اعلام', mono: detail.priceAtMoment > 0 },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="rounded-xl bg-gray-50 p-3">
                    <p className="mb-0.5 text-xs text-gray-400">{label}</p>
                    <p className={`text-sm font-semibold text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Status */}
              <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                <span className="text-sm text-gray-600">وضعیت سفارش</span>
                <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${ORDER_STATUS[detail.statusId]?.bg ?? 'bg-gray-100'} ${ORDER_STATUS[detail.statusId]?.text ?? 'text-gray-700'}`}>
                  {detail.isPriceRequest ? '(استعلام) ' : ''}{ORDER_STATUS[detail.statusId]?.label ?? detail.status}
                </span>
              </div>

              {/* Payments */}
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-700">
                  فیش‌های پرداخت
                  {detail.payments && detail.payments.length > 0 && (
                    <span className="mr-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
                      {detail.payments.length} فیش
                    </span>
                  )}
                </p>
                {detail.payments && detail.payments.length > 0 ? (
                  <div className="space-y-2">
                    {detail.payments.map(p => (
                      <div key={p.id} className="flex items-start justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 shrink-0 text-gray-400" />
                            <span className="font-mono font-bold text-gray-900">{rial(p.amount)}</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">{p.method}</p>
                          {p.referenceNumber && (
                            <p className="mt-0.5 font-mono text-xs font-semibold text-blue-600">
                              کد رهگیری: {p.referenceNumber}
                            </p>
                          )}
                          {p.receiptFileId && (
                            <div className="mt-1">
                              <button
                                onClick={() => uploadApi.download(p.receiptFileId as string).catch(() => toast.error('خطا در دانلود فیش'))}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100">
                                <Download className="h-3.5 w-3.5" />
                                دانلود فیش
                              </button>
                            </div>
                          )}
                          <p className="mt-0.5 text-[10px] text-gray-400">{p.createdAt ?? ''}</p>
                        </div>
                        <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAY_STATUS[p.statusId] ?? 'bg-gray-100 text-gray-600'}`}>
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 py-6 text-center text-xs text-gray-400">
                    هنوز فیشی ثبت نشده — از دکمه زیر فیش پرداخت ثبت کنید
                  </div>
                )}
              </div>

              {/* Pay button */}
              {canPay(detail) && (
                <button
                  onClick={() => { setShowDetail(false); openPay(detail) }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700">
                  <Receipt className="h-4 w-4" />
                  ثبت فیش پرداخت
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
