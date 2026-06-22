import { Printer, X, FileText, Calendar, Zap, Hash } from 'lucide-react'

export interface ProformaInvoiceData {
  id: number
  requestedKwh: number
  contractRate?: number | null
  energyType?: string | null
  orderDate?: string | null
  billIdentifier?: string | null
  customerName?: string | null
  nationalId?: string | null
  registerNumber?: string | null
  ceoFullName?: string | null
  ceoNationalId?: string | null
  address?: string | null
  postalCode?: string | null
}

interface Props {
  open: boolean
  data: ProformaInvoiceData | null
  onClose: () => void
}

const _ = (v?: string | null) => v || '.....................'
const _n = (v?: number | null) => (v != null ? v.toLocaleString('fa-IR') : '.....................')

export default function ProformaInvoicePrintModal({ open, data, onClose }: Props) {
  if (!open || !data) return null

  const rate = data.contractRate ?? 0
  const totalAmount = data.requestedKwh * rate
  const invoiceNumber = `PF-${new Date().getFullYear()}-${String(data.id).padStart(5, '0')}`

  const handlePrint = () => {
    const prev = document.title
    document.title = invoiceNumber
    window.print()
    setTimeout(() => { document.title = prev }, 1500)
  }

  return (
    <>
      <style>{`
        @page { size: A4; margin: 16mm 12mm; }
        @media print {
          body * { visibility: hidden !important; }
          #pfi-root { display: block !important; visibility: visible !important; position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; background: white !important; }
          #pfi-root * { visibility: visible !important; }
          #pfi-border { position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; border: 1.5px solid #555 !important; pointer-events: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Screen preview */}
      <div
        className="no-print fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      >
        <div
          className="w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl"
          style={{ background: 'linear-gradient(150deg,#1e3a5f 0%,#1e40af 55%,#1d4ed8 100%)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 pt-6 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <FileText className="h-6 w-6 text-blue-200" />
                </div>
                <div>
                  <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-blue-300">پیش‌فاکتور برق</p>
                  <h2 className="text-xl font-bold tracking-wide text-white">{invoiceNumber}</h2>
                </div>
              </div>
              <button onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/15 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            {data.customerName && (
              <div className="mt-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: 'rgba(255,255,255,0.18)' }}>
                  {data.customerName.charAt(0)}
                </div>
                <span className="text-sm font-medium text-blue-100">{data.customerName}</span>
                {data.nationalId && <span className="text-xs text-blue-300/60">• {data.nationalId}</span>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2.5 px-6 pb-5">
            {[
              { icon: <Zap className="mb-2 h-4 w-4 text-blue-300" />, label: 'حجم (kWh)', val: _n(data.requestedKwh) },
              { icon: <Zap className="mb-2 h-4 w-4 text-blue-200" />, label: 'نرخ (ریال/kWh)', val: _n(data.contractRate) },
              { icon: <Calendar className="mb-2 h-4 w-4 text-blue-300" />, label: 'تاریخ سفارش', val: data.orderDate || '—' },
            ].map(({ icon, label, val }) => (
              <div key={label} className="rounded-xl p-3.5"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {icon}
                <p className="text-[10px] text-blue-300/60">{label}</p>
                <p className="mt-0.5 text-sm font-semibold text-white">{val}</p>
              </div>
            ))}
          </div>

          <div className="mx-4 mb-4 overflow-hidden rounded-xl"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="p-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-blue-400/80">جمع کل</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-200">مبلغ قابل پرداخت</span>
                <span className="text-xl font-black text-white">{totalAmount.toLocaleString('fa-IR')} <span className="text-sm font-medium text-blue-300">ریال</span></span>
              </div>
            </div>
            <div className="border-t p-5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {data.billIdentifier && (
                  <div className="flex items-start gap-2">
                    <Hash className="mt-0.5 h-3.5 w-3.5 text-blue-400/60" />
                    <div>
                      <p className="text-[10px] text-blue-300/50">شناسه اشتراک</p>
                      <p className="mt-0.5 text-white">{data.billIdentifier}</p>
                    </div>
                  </div>
                )}
                {data.energyType && (
                  <div className="flex items-start gap-2">
                    <Zap className="mt-0.5 h-3.5 w-3.5 text-blue-400/60" />
                    <div>
                      <p className="text-[10px] text-blue-300/50">نوع انرژی</p>
                      <p className="mt-0.5 text-white">{data.energyType}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 px-6 pb-6">
            <button onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-white/60 transition-all hover:bg-white/10 hover:text-white"
              style={{ border: '1px solid rgba(255,255,255,0.18)' }}>
              بستن
            </button>
            <button onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.25)' }}>
              <Printer className="h-4 w-4" /> چاپ پیش‌فاکتور
            </button>
          </div>
        </div>
      </div>

      {/* Print area */}
      <div id="pfi-root" style={{ display: 'none' }}>
        <div id="pfi-border" />
        <div style={{ fontFamily: "'Vazirmatn','Tahoma',sans-serif", direction: 'rtl', color: '#111', fontSize: '11.5px', lineHeight: '1.9' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #111' }}>
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '13px' }}>بسمه تعالی</p>
            <h1 style={{ margin: '0 0 10px', fontSize: '22px', fontWeight: 900 }}>پیش‌فاکتور برق</h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '8px' }}>
              <span><b>مشتری: </b>{_(data.customerName)}</span>
              <span><b>شماره پیش‌فاکتور: </b>{invoiceNumber}</span>
              <span><b>تاریخ: </b>{_(data.orderDate)}</span>
            </div>
          </div>

          {/* Customer info */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '11px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '6px 10px', fontWeight: 700, background: '#f5f5f5', width: '25%' }}>نام مشتری</td>
                <td style={{ border: '1px solid #ccc', padding: '6px 10px' }}>{_(data.customerName)}</td>
                <td style={{ border: '1px solid #ccc', padding: '6px 10px', fontWeight: 700, background: '#f5f5f5', width: '25%' }}>شناسه ملی / کد ملی</td>
                <td style={{ border: '1px solid #ccc', padding: '6px 10px' }}>{_(data.nationalId)}</td>
              </tr>
              {data.registerNumber && (
                <tr>
                  <td style={{ border: '1px solid #ccc', padding: '6px 10px', fontWeight: 700, background: '#f5f5f5' }}>شماره ثبت</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px 10px' }}>{data.registerNumber}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px 10px', fontWeight: 700, background: '#f5f5f5' }}>مدیرعامل</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px 10px' }}>{_(data.ceoFullName)}</td>
                </tr>
              )}
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '6px 10px', fontWeight: 700, background: '#f5f5f5' }}>آدرس</td>
                <td colSpan={3} style={{ border: '1px solid #ccc', padding: '6px 10px' }}>{_(data.address)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '6px 10px', fontWeight: 700, background: '#f5f5f5' }}>کد پستی</td>
                <td style={{ border: '1px solid #ccc', padding: '6px 10px' }}>{_(data.postalCode)}</td>
                <td style={{ border: '1px solid #ccc', padding: '6px 10px', fontWeight: 700, background: '#f5f5f5' }}>شناسه اشتراک</td>
                <td style={{ border: '1px solid #ccc', padding: '6px 10px' }}>{_(data.billIdentifier)}</td>
              </tr>
            </tbody>
          </table>

          {/* Invoice items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#1e3a5f', color: 'white' }}>
                <th style={{ border: '1px solid #1e3a5f', padding: '8px 10px', textAlign: 'right' }}>ردیف</th>
                <th style={{ border: '1px solid #1e3a5f', padding: '8px 10px', textAlign: 'right' }}>شرح</th>
                <th style={{ border: '1px solid #1e3a5f', padding: '8px 10px', textAlign: 'right' }}>نوع انرژی</th>
                <th style={{ border: '1px solid #1e3a5f', padding: '8px 10px', textAlign: 'right' }}>حجم (kWh)</th>
                <th style={{ border: '1px solid #1e3a5f', padding: '8px 10px', textAlign: 'right' }}>نرخ (ریال/kWh)</th>
                <th style={{ border: '1px solid #1e3a5f', padding: '8px 10px', textAlign: 'right' }}>مبلغ (ریال)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '7px 10px', textAlign: 'center' }}>۱</td>
                <td style={{ border: '1px solid #ccc', padding: '7px 10px' }}>برق مصرفی</td>
                <td style={{ border: '1px solid #ccc', padding: '7px 10px' }}>{_(data.energyType)}</td>
                <td style={{ border: '1px solid #ccc', padding: '7px 10px', textAlign: 'center', fontWeight: 700 }}>{_n(data.requestedKwh)}</td>
                <td style={{ border: '1px solid #ccc', padding: '7px 10px', textAlign: 'center', fontWeight: 700 }}>{_n(data.contractRate)}</td>
                <td style={{ border: '1px solid #ccc', padding: '7px 10px', textAlign: 'center', fontWeight: 700 }}>{totalAmount.toLocaleString('fa-IR')}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: '#f0f4ff' }}>
                <td colSpan={5} style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'left', fontWeight: 800 }}>جمع کل (ریال)</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 10px', textAlign: 'center', fontWeight: 900, fontSize: '13px' }}>{totalAmount.toLocaleString('fa-IR')}</td>
              </tr>
            </tfoot>
          </table>

          {/* Notes */}
          <p style={{ fontSize: '10.5px', color: '#555', margin: '0 0 24px', textAlign: 'justify' }}>
            این پیش‌فاکتور توسط سیستم سامانه متین پاور صادر شده و معتبر می‌باشد.
            پرداخت وجه به حساب شماره 5078821-1-767 366 شبای <b>IR800590036676705078821001</b> نزد بانک سینا صورت می‌پذیرد.
          </p>

          {/* Signatures */}
          <div style={{ display: 'flex', gap: '24px', marginTop: '40px' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ fontWeight: 800, fontSize: '13px', margin: '0 0 3px' }}>فروشنده</p>
              <p style={{ fontWeight: 700, margin: '0 0 2px' }}>شرکت توسعه انرژی متین</p>
              <div style={{ marginTop: '60px', borderTop: '1px solid #777', paddingTop: '5px', fontSize: '10px', color: '#777' }}>امضا و مهر</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ fontWeight: 800, fontSize: '13px', margin: '0 0 3px' }}>خریدار</p>
              <p style={{ fontWeight: 700, margin: '0 0 2px' }}>{_(data.customerName)}</p>
              <div style={{ marginTop: '60px', borderTop: '1px solid #777', paddingTop: '5px', fontSize: '10px', color: '#777' }}>امضا و مهر</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#bbb', borderTop: '1px solid #e5e5e5', paddingTop: '7px' }}>
            <span>تاریخ چاپ: {new Date().toLocaleDateString('fa-IR')}</span>
            <span>شرکت توسعه انرژی متین</span>
            <span>شماره: {invoiceNumber}</span>
          </div>
        </div>
      </div>
    </>
  )
}
