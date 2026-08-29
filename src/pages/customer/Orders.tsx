import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Plus, CreditCard, RefreshCw, X,
  ChevronDown, ChevronUp, Receipt, ArrowLeft, CheckCircle, FileText, Printer,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { customerApi } from '../../api/customer'
import { lookupApi, type IdTitle } from '../../api/lookup'
import PreviewDownloadButton from '../../components/ui/FilePreviewModal'
import FileUpload from '../../components/ui/FileUpload'
import type { OrderResult, OrderDetailResult, SubscriptionResult, AdvancedBillAnalysisResult, ProformaData } from '../../types'
import { toArr, MONTHS } from '../../utils'

const fmt  = (n: number) => n.toLocaleString('fa-IR', { maximumFractionDigits: 0 })
const rial = (n: number) => fmt(n) + ' ریال'

function jalaliYear(): number {
  const d = new Date(), m = d.getMonth() + 1, day = d.getDate()
  return (m > 3 || (m === 3 && day >= 20)) ? d.getFullYear() - 621 : d.getFullYear() - 622
}
const YEAR_OPTIONS = Array.from({ length: 3 }, (_, i) => jalaliYear() - 2 + i)

type BillHistoryItem = {
  year: number | null
  month: number | null
  peakCons: number | null
  midCons: number | null
  lowCons: number | null
  costWithMatin: number | null
}

// اگر برق سبز درخواست شده باشد: ۴٪ انرژی با نرخ برق سبز و ۹۶٪ با نرخ عادی محاسبه می‌شود
function splitEnergyAmount(kwh: number, normalRate: number, isGreen?: boolean, greenRate?: number | null) {
  if (!isGreen) {
    const amount = Math.round(kwh * normalRate)
    return { normalKwh: kwh, greenKwh: 0, normalRate, greenRate: normalRate, normalAmount: amount, greenAmount: 0, subtotal: amount }
  }
  const normalKwh = kwh * 0.96
  const greenKwh  = kwh * 0.04
  const effGreenRate = greenRate && greenRate > 0 ? greenRate : normalRate
  const normalAmount = Math.round(normalKwh * normalRate)
  const greenAmount  = Math.round(greenKwh * effGreenRate)
  return { normalKwh, greenKwh, normalRate, greenRate: effGreenRate, normalAmount, greenAmount, subtotal: normalAmount + greenAmount }
}

function ProformaModal({ data, onClose }: { data: ProformaData; onClose: () => void }) {
  const split    = splitEnergyAmount(data.requestedKwh, data.priceAtMoment, data.isGreenEnergy, data.greenRate)
  const subtotal = split.subtotal
  const vat      = Math.round(subtotal * 0.10)
  const total    = subtotal + vat
  const num      = `PF-${String(data.id).padStart(5, '0')}`

  const tdStyle = (center?: boolean): React.CSSProperties => ({
    border: '1px solid #bbb', padding: '6px 8px', fontSize: '10px',
    textAlign: center ? 'center' : 'right',
  })
  const thStyle = (center?: boolean): React.CSSProperties => ({
    border: '1px solid #888', padding: '6px 8px', fontSize: '10px',
    background: '#1e3a5f', color: '#fff', textAlign: center ? 'center' : 'right',
  })
  const infoRow = (label: string, value: string | null | undefined) => (
    <span style={{ fontSize: '10px' }}><strong>{label}: </strong>{value ?? '—'}</span>
  )

  return createPortal(
    <>
      <style>{`@media print { body * { visibility: hidden !important; } #proforma-print, #proforma-print * { visibility: visible !important; } #proforma-print { display: block !important; position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; width: 100% !important; } }`}</style>

      {/* Screen modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" dir="rtl">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <h2 className="font-bold text-gray-900">پیش فاکتور {num}</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-3 p-5">
            <div className="divide-y divide-gray-100 rounded-xl bg-gray-50 p-4 text-sm">
              {([
                ['خریدار',    data.buyerName ?? data.billIdentifier, false],
                ['نوع انرژی', data.energyType,                      false],
                ['تاریخ',     data.orderDate ?? '—',                false],
              ] as [string, string, boolean][]).map(([label, value, mono]) => (
                <div key={label} className="flex justify-between py-1.5">
                  <span className="text-gray-500">{label}</span>
                  <span className={`font-semibold ${mono ? 'font-mono' : ''}`}>{value}</span>
                </div>
              ))}
              {data.isGreenEnergy ? (
                <>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-500">برق عادی (۹۶٪)</span>
                    <span className="font-mono font-semibold">{fmt(split.normalKwh)} kWh × {fmt(split.normalRate)} ر</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-500">برق سبز (۴٪)</span>
                    <span className="font-mono font-semibold">{fmt(split.greenKwh)} kWh × {fmt(split.greenRate)} ر</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-500">مقدار</span>
                    <span className="font-mono font-semibold">{fmt(data.requestedKwh)} kWh</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-500">نرخ واحد</span>
                    <span className="font-mono font-semibold">{fmt(data.priceAtMoment)} ریال/kWh</span>
                  </div>
                </>
              )}
            </div>
            <div className="space-y-1.5 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">جمع کل</span>
                <span className="font-mono font-semibold">{rial(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">مالیات ارزش افزوده ۱۰٪</span>
                <span className="font-mono font-semibold">{rial(vat)}</span>
              </div>
              <div className="flex justify-between border-t border-indigo-200 pt-2 text-indigo-900">
                <span className="font-bold">مبلغ قابل پرداخت</span>
                <span className="font-mono font-bold text-base">{rial(total)}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t px-5 py-4">
            <button onClick={onClose}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">بستن</button>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              <Printer className="h-4 w-4" />
              چاپ پیش فاکتور
            </button>
          </div>
        </div>
      </div>

      {/* ── Print area — matches original template ── */}
      <div id="proforma-print" style={{ display: 'none', direction: 'rtl', fontFamily: 'Tahoma, Arial, sans-serif', padding: '30px 40px', background: '#fff', color: '#000' }}>

        {/* Title + serial */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1e3a5f', paddingBottom: '10px', marginBottom: '12px' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ fontSize: '9px', margin: '0 0 3px' }}>بسمه تعالی</p>
            <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 2px' }}>شرکت توسعه انرژی متین تام</p>
            <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '0', color: '#1e3a5f' }}>پیش فاکتور فروش کالا و خدمات</p>
          </div>
          <div style={{ fontSize: '10px', minWidth: '140px', textAlign: 'right' }}>
            <div style={{ marginBottom: '4px' }}>شماره سریال: <strong>{num}</strong></div>
            <div style={{ marginBottom: '4px' }}>تاریخ: <strong>{data.orderDate ?? '—'}</strong></div>
            <div style={{ color: '#b91c1c', fontWeight: 'bold' }}>مدت اعتبار ۲۴ ساعت</div>
          </div>
        </div>

        {/* Seller */}
        <div style={{ border: '1px solid #bbb', marginBottom: '8px' }}>
          <div style={{ background: '#f0f4f8', padding: '4px 8px', fontSize: '10px', fontWeight: 'bold', borderBottom: '1px solid #bbb' }}>مشخصات فروشنده</div>
          <div style={{ padding: '6px 8px', display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
            {infoRow('نام شخص حقوقی', 'شرکت توسعه انرژی متین تام')}
            {infoRow('شماره اقتصادی', '411114955475')}
            {infoRow('شناسه ملی / شماره ثبت', '10103303952')}
          </div>
          <div style={{ padding: '0 8px 6px', display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
            {infoRow('نشانی', 'تهران، خیابان ملاصدرا، ابتدای شیخ بهایی شمالی، کوچه سلمان، پلاک ۹')}
            {infoRow('شماره تلفن / نمابر', '021-88211483 تا 4 / 021-88211485')}
            {infoRow('کدپستی', '1991716764')}
          </div>
        </div>

        {/* Buyer */}
        <div style={{ border: '1px solid #bbb', marginBottom: '10px' }}>
          <div style={{ background: '#f0f4f8', padding: '4px 8px', fontSize: '10px', fontWeight: 'bold', borderBottom: '1px solid #bbb' }}>مشخصات خریدار</div>
          <div style={{ padding: '6px 8px', display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
            {infoRow('نام شخص حقیقی/حقوقی', data.buyerName)}
            {infoRow('شماره اقتصادی', data.economicCode)}
            {infoRow('شماره ثبت/شماره ملی', data.nationalId)}
          </div>
          <div style={{ padding: '0 8px 6px', display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
            {infoRow('استان', data.province)}
            {infoRow('شهر', data.city)}
            {infoRow('کدپستی', data.postalCode)}
            {infoRow('شماره تلفن', data.phone)}
          </div>
          {data.address && (
            <div style={{ padding: '0 8px 6px' }}>{infoRow('نشانی', data.address)}</div>
          )}
        </div>

        {/* Items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
          <thead>
            <tr>
              <th style={thStyle(true)}>ردیف</th>
              <th style={thStyle(true)}>کد کالا</th>
              <th style={thStyle()}>شرح کالا یا خدمات</th>
              <th style={thStyle(true)}>تعداد/<br/>مقدار</th>
              <th style={thStyle(true)}>واحد</th>
              <th style={thStyle(true)}>مبلغ واحد<br/>(ریال)</th>
              <th style={thStyle(true)}>مبلغ کل<br/>(ریال)</th>
              <th style={thStyle(true)}>تخفیف<br/>(ریال)</th>
              <th style={thStyle(true)}>مبلغ پس از<br/>تخفیف (ریال)</th>
              <th style={thStyle(true)}>مالیات و<br/>عوارض (ریال)</th>
              <th style={thStyle(true)}>جمع کل<br/>(ریال)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle(true)}>۱</td>
              <td style={tdStyle(true)}>—</td>
              <td style={tdStyle()}>انرژی الکتریکی{data.isGreenEnergy ? ' (برق عادی ۹۶٪)' : ''}</td>
              <td style={tdStyle(true)}>{fmt(split.normalKwh)}</td>
              <td style={tdStyle(true)}>کیلووات ساعت</td>
              <td style={tdStyle(true)}>{fmt(split.normalRate)}</td>
              <td style={tdStyle(true)}>{fmt(split.normalAmount)}</td>
              <td style={tdStyle(true)}>—</td>
              <td style={tdStyle(true)}>{fmt(split.normalAmount)}</td>
              <td style={tdStyle(true)}>{fmt(Math.round(split.normalAmount * 0.10))}</td>
              <td style={tdStyle(true)}>{fmt(split.normalAmount + Math.round(split.normalAmount * 0.10))}</td>
            </tr>
            {data.isGreenEnergy && (
              <tr>
                <td style={tdStyle(true)}>۲</td>
                <td style={tdStyle(true)}>—</td>
                <td style={tdStyle()}>انرژی الکتریکی (برق سبز ۴٪)</td>
                <td style={tdStyle(true)}>{fmt(split.greenKwh)}</td>
                <td style={tdStyle(true)}>کیلووات ساعت</td>
                <td style={tdStyle(true)}>{fmt(split.greenRate)}</td>
                <td style={tdStyle(true)}>{fmt(split.greenAmount)}</td>
                <td style={tdStyle(true)}>—</td>
                <td style={tdStyle(true)}>{fmt(split.greenAmount)}</td>
                <td style={tdStyle(true)}>{fmt(Math.round(split.greenAmount * 0.10))}</td>
                <td style={tdStyle(true)}>{fmt(split.greenAmount + Math.round(split.greenAmount * 0.10))}</td>
              </tr>
            )}
            {/* Totals row */}
            <tr style={{ background: '#f8f8f8', fontWeight: 'bold' }}>
              <td colSpan={8} style={{ ...tdStyle(), textAlign: 'center', fontSize: '10px' }}>جمع کل</td>
              <td style={tdStyle(true)}>{fmt(subtotal)}</td>
              <td style={tdStyle(true)}>{fmt(vat)}</td>
              <td style={tdStyle(true)}>{fmt(total)}</td>
            </tr>
          </tbody>
        </table>

        {/* Payment terms */}
        <div style={{ fontSize: '10px', marginBottom: '8px' }}>
          <strong>شرایط و نحوه فروش: </strong>نقدی ☐ &nbsp;&nbsp; غیر نقدی ☐
        </div>

        {/* Description line */}
        <div style={{ fontSize: '10px', border: '1px solid #bbb', padding: '6px 8px', marginBottom: '8px' }}>
          بابت فروش برق {data.orderDate?.split('/').slice(0, 2).join('/')} به {data.buyerName ?? data.billIdentifier}
        </div>

        {/* Payment instructions */}
        <div style={{ fontSize: '10px', border: '1px solid #bbb', padding: '6px 8px', marginBottom: '16px', lineHeight: '1.8' }}>
          خواهشمند است، صورتحساب مذکور را به شماره حساب <strong>1-5078821-767-366</strong> با شماره شبای{' '}
          <strong>IR800590036676705078821001</strong> نزد بانک سینا پرداخت نمایید.
        </div>

        {/* Signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', fontSize: '10px' }}>
          <div style={{ textAlign: 'center', minWidth: '180px' }}>
            <div style={{ borderTop: '1px solid #999', paddingTop: '8px' }}>مهر و امضاء فروشنده: شرکت توسعه انرژی متین تام</div>
          </div>
          <div style={{ textAlign: 'center', minWidth: '180px' }}>
            <div style={{ borderTop: '1px solid #999', paddingTop: '8px' }}>مهر و امضاء خریدار</div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

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
  const navState  = location.state as { newOrderId?: number; analysis?: AdvancedBillAnalysisResult; openCreate?: boolean } | null

  const [orders, setOrders]         = useState<OrderResult[]>([])
  const [loading, setLoading]       = useState(false)
  const [subscriptions, setSubs]    = useState<SubscriptionResult[]>([])
  const [energyTypes, setETypes]    = useState<IdTitle[]>([])
  const [payMethods, setPayMethods] = useState<IdTitle[]>([])

  const [analysis, setAnalysis]         = useState<AdvancedBillAnalysisResult | null>(navState?.analysis ?? null)
  const [analysisOpen, setAnalysisOpen] = useState(true)

  const [showCreate, setShowCreate]   = useState(navState?.openCreate ?? false)
  const [showPay, setShowPay]         = useState(false)
  const [detail, setDetail]           = useState<OrderDetailResult | null>(null)
  const [showDetail, setShowDetail]   = useState(false)
  const [saving, setSaving]           = useState(false)
  const [proformaData, setProformaData]   = useState<ProformaData | null>(null)
  const [proformaLoading, setProformaLoading] = useState(false)
  const [payProforma, setPayProforma]           = useState<ProformaData | null>(null)
  const [payProformaLoading, setPayProformaLoading] = useState(false)
  const [newOrderId]                  = useState<number | undefined>(navState?.newOrderId)

  // وقتی از هدر روی «خرید برق» کلیک می‌شود در حالی که کاربر از قبل در همین صفحه است،
  // مسیر عوض نمی‌شود (فقط state جدید push می‌شود) پس مقداردهی اولیه‌ی useState بالا
  // دوباره اجرا نمی‌شود — این افکت آن حالت را هم می‌گیرد و state ناوبری را پاک می‌کند
  useEffect(() => {
    if (navState?.openCreate) {
      setShowCreate(true)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state]) // eslint-disable-line react-hooks/exhaustive-deps

  const [createForm, setCreateForm] = useState({
    subscriptionId: '' as number | '',
    requestedKwh: '',
    energyTypeId: '' as number | '',
    isPriceRequest: false,
    isGreenEnergy: false,
    year: jalaliYear(),
    month: 1,
  })
  const [billHistory, setBillHistory] = useState<BillHistoryItem[]>([])
  const [billHistoryLoading, setBillHistoryLoading] = useState(false)

  useEffect(() => {
    if (!createForm.subscriptionId) { setBillHistory([]); return }
    setBillHistoryLoading(true)
    customerApi.getBillHistory(createForm.subscriptionId as number)
      .then(r => { if (r.code === 200) setBillHistory(toArr(r.result) as BillHistoryItem[]) })
      .catch(() => {})
      .finally(() => setBillHistoryLoading(false))
  }, [createForm.subscriptionId])

  const matchedBill = billHistory.find(h => h.year === createForm.year && h.month === createForm.month) ?? null
  const matchedBillKwh = matchedBill ? (matchedBill.peakCons ?? 0) + (matchedBill.midCons ?? 0) + (matchedBill.lowCons ?? 0) : 0

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
    customerApi.getSubscriptions().then(r => { if (r.code === 200) setSubs(toArr(r.result)) }).catch(() => {})
    lookupApi.getEnergyTypes().then(r => { if (r.code === 200) setETypes(toArr(r.result)) }).catch(() => {})
    lookupApi.getPaymentMethods().then(r => { if (r.code === 200) setPayMethods(toArr(r.result)) }).catch(() => {})
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
      .then(r => {
        if (r.code === 200) setOrders(toArr(r.result))
        else toast.error(r.caption ?? 'خطا در دریافت سفارش‌ها')
      })
      .catch(() => toast.error('خطا در ارتباط با سرور'))
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
    setPayForm({ orderId: o.id, amount: '', methodId: '', referenceNumber: '', receiptFileId: '', suggestedAmount: 0 })
    setPayProforma(null)
    setShowPay(true)

    // نرخ همیشه از سرور خواسته می‌شود، نه فقط وقتی priceAtMoment خام سفارش پر باشد؛
    // چون سرور خودش نرخ پیش‌فرض را از قرارداد فعال یا آخرین قبض محاسبه می‌کند
    setPayProformaLoading(true)
    customerApi.getProformaData(o.id)
      .then(r => {
        if (r.code === 200 && r.result) {
          setPayProforma(r.result)
          if (r.result.priceAtMoment > 0) {
            const suggested = splitEnergyAmount(o.requestedKwh, r.result.priceAtMoment, r.result.isGreenEnergy, r.result.greenRate).subtotal
            setPayForm(p => ({ ...p, amount: String(suggested), suggestedAmount: suggested }))
          }
        }
      })
      .catch(() => {})
      .finally(() => setPayProformaLoading(false))
  }

  const closePay = () => { setShowPay(false); setPayProforma(null) }

  const handleCreate = () => {
    if (!createForm.subscriptionId) { toast.error('اشتراک را انتخاب کنید'); return }
    if (!createForm.energyTypeId) { toast.error('نوع انرژی را انتخاب کنید'); return }
    const kwh = parseFloat(createForm.requestedKwh)
    if (!createForm.requestedKwh || isNaN(kwh) || kwh <= 0) { toast.error('مقدار kWh درخواستی باید بزرگتر از صفر باشد'); return }
    setSaving(true)
    customerApi.createOrder({
      subscriptionId: createForm.subscriptionId as number,
      requestedKwh: kwh,
      energyTypeId: createForm.energyTypeId as number,
      isPriceRequest: createForm.isPriceRequest,
      isGreenEnergy: createForm.isGreenEnergy,
      year: createForm.year,
      month: createForm.month,
    })
      .then(r => {
        if (r.code === 200) {
          toast.success('سفارش ثبت شد')
          setShowCreate(false)
          setCreateForm({ subscriptionId: '', requestedKwh: '', energyTypeId: '', isPriceRequest: false, isGreenEnergy: false, year: jalaliYear(), month: 1 })
          loadOrders()
        } else { toast.error(r.message ?? r.caption ?? 'خطا در ثبت سفارش') }
      })
      .catch(() => toast.error('خطا در ارتباط با سرور'))
      .finally(() => setSaving(false))
  }

  const handlePay = () => {
    if (!payForm.methodId) { toast.error('روش پرداخت را انتخاب کنید'); return }
    const amount = parseFloat(payForm.amount)
    if (!payForm.amount || isNaN(amount) || amount <= 0) { toast.error('مبلغ پرداخت باید بزرگتر از صفر باشد'); return }
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
          closePay()
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
                          {o.isGreenEnergy && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">۴٪ برق سبز</span>
                          )}
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
                        <button
                          disabled={proformaLoading}
                          onClick={() => {
                            setProformaLoading(true)
                            customerApi.getProformaData(o.id)
                              .then(r => {
                                if (r.code === 200 && r.result && r.result.priceAtMoment > 0) setProformaData(r.result)
                                else toast.error('نرخی برای این سفارش پیدا نشد — نه قرارداد فعالی هست، نه سابقه‌ی تحلیل قبض')
                              })
                              .catch(() => toast.error('خطا در ارتباط با سرور'))
                              .finally(() => setProformaLoading(false))
                          }}
                          className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50">
                          {proformaLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                          پیش فاکتور
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">سال شمسی</label>
                  <select className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                    value={createForm.year}
                    onChange={e => setCreateForm(p => ({ ...p, year: Number(e.target.value) }))}>
                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">ماه</label>
                  <select className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                    value={createForm.month}
                    onChange={e => setCreateForm(p => ({ ...p, month: Number(e.target.value) }))}>
                    {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              </div>
              {createForm.subscriptionId && (
                billHistoryLoading ? (
                  <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 py-4">
                    <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                ) : matchedBill ? (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-bold text-emerald-800">اطلاعات قبض این ماه</span>
                      <button type="button"
                        onClick={() => setCreateForm(p => ({ ...p, requestedKwh: String(Math.round(matchedBillKwh)) }))}
                        className="text-[11px] font-semibold text-emerald-700 hover:underline">
                        استفاده از این مقدار
                      </button>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>میزان مصرف</span>
                      <span className="font-mono font-semibold">{fmt(matchedBillKwh)} kWh</span>
                    </div>
                    {matchedBill.costWithMatin != null && (
                      <div className="mt-1 flex justify-between text-gray-600">
                        <span>قیمت قبض</span>
                        <span className="font-mono font-semibold">{rial(matchedBill.costWithMatin)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">برای این ماه، تحلیل قبضی ثبت نشده است.</p>
                )
              )}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">نوع انرژی *</label>
                <select className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  value={createForm.energyTypeId}
                  onChange={e => {
                    const id = e.target.value ? Number(e.target.value) : ''
                    const isGreenType = energyTypes.find(t => t.id === id)?.title?.includes('سبز') ?? false
                    setCreateForm(p => ({ ...p, energyTypeId: id, isGreenEnergy: isGreenType ? false : p.isGreenEnergy }))
                  }}>
                  <option value="">انتخاب کنید...</option>
                  {energyTypes.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">مقدار انرژی (kWh) *</label>
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
              {!(energyTypes.find(t => t.id === createForm.energyTypeId)?.title?.includes('سبز') ?? false) && (
                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 hover:bg-emerald-50">
                  <input type="checkbox" className="h-4 w-4 rounded accent-emerald-600"
                    checked={createForm.isGreenEnergy}
                    onChange={e => setCreateForm(p => ({ ...p, isGreenEnergy: e.target.checked }))} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">برق سبز می‌خواهم</p>
                    <p className="text-xs text-gray-500">۴٪ از انرژی درخواستی به‌عنوان برق سبز و ۹۶٪ برق عادی محاسبه می‌شود</p>
                  </div>
                </label>
              )}
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
              <button onClick={closePay} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-5">
              {/* پیش‌فاکتور — قبل از ثبت فیش باید به مشتری نمایش داده شود */}
              {payProformaLoading ? (
                <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 py-6">
                  <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              ) : payProforma && payProforma.priceAtMoment > 0 ? (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-indigo-600" />
                      <span className="text-xs font-bold text-indigo-900">پیش فاکتور این سفارش</span>
                    </div>
                    <button
                      onClick={() => setProformaData(payProforma)}
                      className="text-[11px] font-semibold text-indigo-600 hover:underline">
                      مشاهده کامل
                    </button>
                  </div>
                  <div className="space-y-1 text-xs">
                    {payProforma.isGreenEnergy ? (
                      <>
                        <div className="flex justify-between text-gray-600">
                          <span>برق عادی (۹۶٪)</span>
                          <span className="font-mono font-semibold">
                            {fmt(splitEnergyAmount(payProforma.requestedKwh, payProforma.priceAtMoment, true, payProforma.greenRate).normalKwh)} kWh ×{' '}
                            {rial(payProforma.priceAtMoment)}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>برق سبز (۴٪)</span>
                          <span className="font-mono font-semibold">
                            {fmt(splitEnergyAmount(payProforma.requestedKwh, payProforma.priceAtMoment, true, payProforma.greenRate).greenKwh)} kWh ×{' '}
                            {rial(splitEnergyAmount(payProforma.requestedKwh, payProforma.priceAtMoment, true, payProforma.greenRate).greenRate)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-gray-600">
                        <span>مقدار</span>
                        <span className="font-mono font-semibold">{fmt(payProforma.requestedKwh)} kWh</span>
                      </div>
                    )}
                    {!payProforma.isGreenEnergy && (
                      <div className="flex justify-between text-gray-600">
                        <span>نرخ واحد</span>
                        <span className="font-mono font-semibold">{rial(payProforma.priceAtMoment)}/kWh</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600">
                      <span>جمع کل</span>
                      <span className="font-mono font-semibold">
                        {rial(splitEnergyAmount(payProforma.requestedKwh, payProforma.priceAtMoment, payProforma.isGreenEnergy, payProforma.greenRate).subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>مالیات ارزش افزوده ۱۰٪</span>
                      <span className="font-mono font-semibold">
                        {rial(Math.round(splitEnergyAmount(payProforma.requestedKwh, payProforma.priceAtMoment, payProforma.isGreenEnergy, payProforma.greenRate).subtotal * 0.10))}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-indigo-200 pt-1.5 text-indigo-900">
                      <span className="font-bold">مبلغ قابل پرداخت</span>
                      <span className="font-mono font-bold">
                        {(() => {
                          const s = splitEnergyAmount(payProforma.requestedKwh, payProforma.priceAtMoment, payProforma.isGreenEnergy, payProforma.greenRate).subtotal
                          return rial(s + Math.round(s * 0.10))
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  نرخی برای این سفارش پیدا نشد (نه قرارداد فعالی برای این اشتراک هست، نه سابقه‌ی تحلیل قبض). با پشتیبانی تماس بگیرید یا منتظر اعلام نرخ توسط ادمین بمانید.
                </div>
              )}

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
              <button onClick={closePay}
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

      {/* ── Proforma Invoice Modal ── */}
      {proformaData && (
        <ProformaModal data={proformaData} onClose={() => setProformaData(null)} />
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
                  { label: 'مقدار انرژی', value: `${fmt(detail.requestedKwh)} kWh`, mono: true },
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
                              <PreviewDownloadButton
                                fileId={p.receiptFileId as string}
                                label="مشاهده فیش"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                              />
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
