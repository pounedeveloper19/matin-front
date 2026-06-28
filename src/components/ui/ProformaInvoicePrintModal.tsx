import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Printer, X, AlertTriangle } from 'lucide-react'

export interface ProformaInvoiceData {
  id: number
  requestedKwh: number
  contractRate?: number | null
  energyType?: string | null
  orderDate?: string | null
  billIdentifier?: string | null
  customerName?: string | null
  nationalId?: string | null
  economicCode?: string | null
  registerNumber?: string | null
  ceoFullName?: string | null
  ceoNationalId?: string | null
  address?: string | null
  city?: string | null
  province?: string | null
  postalCode?: string | null
}

interface Props {
  open: boolean
  data: ProformaInvoiceData | null
  onClose: () => void
}

const _ = (v?: string | null, fb = '.....................') => v || fb
const num = (v?: number | null) => (v != null ? v.toLocaleString('fa-IR') : '۰')
const rial = (v: number) => v.toLocaleString('fa-IR')

// ─── cell style helpers ──────────────────────────────────────────────────────
const TH: React.CSSProperties = {
  border: '1px solid #222', padding: '5px 7px', background: '#d9d9d9',
  fontWeight: 700, textAlign: 'center', fontSize: '10px',
}
const TD: React.CSSProperties = {
  border: '1px solid #222', padding: '5px 7px',
  textAlign: 'center', fontSize: '10.5px',
}
const TDL: React.CSSProperties = { ...TD, textAlign: 'right' }
const LBL: React.CSSProperties = {
  border: '1px solid #222', padding: '5px 8px', background: '#e8e8e8',
  fontWeight: 700, fontSize: '10.5px', whiteSpace: 'nowrap',
}
const VAL: React.CSSProperties = {
  border: '1px solid #222', padding: '5px 8px', fontSize: '10.5px',
}

export default function ProformaInvoicePrintModal({ open, data, onClose }: Props) {
  const [manualRate, setManualRate] = useState<string>('')

  if (!open || !data) return null

  const hasContract = data.contractRate != null && data.contractRate > 0
  const rate        = hasContract ? data.contractRate! : (parseFloat(manualRate) || 0)
  const total       = data.requestedKwh * rate
  const vat         = Math.round(total * 0.1)
  const grandTotal  = total + vat
  const invoiceNo   = `PF-${new Date().getFullYear()}-${String(data.id).padStart(5, '0')}`
  const printDate   = new Date().toLocaleDateString('fa-IR')

  const handlePrint = () => {
    const prev = document.title
    document.title = `پیش‌فاکتور-${invoiceNo}`
    window.print()
    setTimeout(() => { document.title = prev }, 1500)
  }

  // ─── shared print content ────────────────────────────────────────────────
  const PrintContent = () => (
    <div style={{ fontFamily: "'Vazirmatn','Tahoma',sans-serif", direction: 'rtl', color: '#111', fontSize: '11px', lineHeight: '1.7', padding: '4mm' }}>

      {/* ── بسمه تعالی ── */}
      <p style={{ textAlign: 'center', margin: '0 0 2px', fontSize: '12px', fontWeight: 700 }}>بسمه تعالی</p>

      {/* ── عنوان + شماره/تاریخ ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px' }}>
        <tbody>
          <tr>
            <td style={{ width: '25%', border: '1px solid #222', padding: '4px 8px', verticalAlign: 'middle' }}>
              <div style={{ fontSize: '9px' }}>شرکت توسعه انرژی متین</div>
              <div style={{ fontSize: '8px', color: '#555' }}>ارائه‌دهنده خدمات انرژی</div>
            </td>
            <td style={{ textAlign: 'center', border: '1px solid #222', padding: '6px', verticalAlign: 'middle' }}>
              <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '1px' }}>پیش فاکتور فروش کالا و خدمات</div>
            </td>
            <td style={{ width: '22%', border: '1px solid #222', padding: '4px 8px', fontSize: '10px' }}>
              <div><b>شماره:</b> {invoiceNo}</div>
              <div><b>تاریخ:</b> {_(data.orderDate, printDate)}</div>
              <div><b>تاریخ چاپ:</b> {printDate}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── مشخصات فروشنده و خریدار ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px' }}>
        <tbody>
          {/* فروشنده */}
          <tr>
            <td colSpan={4} style={{ ...LBL, background: '#c0c0c0', fontSize: '11px', textAlign: 'center' }}>مشخصات فروشنده</td>
          </tr>
          <tr>
            <td style={LBL}>نام شخص حقوقی:</td>
            <td style={VAL}>شرکت توسعه انرژی متین</td>
            <td style={LBL}>شناسه ملی:</td>
            <td style={VAL}>۱۴۰۰۴۸۱۵۲۲۰</td>
          </tr>
          <tr>
            <td style={LBL}>نشانی:</td>
            <td colSpan={3} style={VAL}>تهران، ...</td>
          </tr>
          <tr>
            <td style={LBL}>شماره تلفن / نمابر:</td>
            <td style={VAL}>۰۲۱-XXXXXXXX</td>
            <td style={LBL}>کد پستی:</td>
            <td style={VAL}>XXXXXXXXXX</td>
          </tr>

          {/* خریدار */}
          <tr>
            <td colSpan={4} style={{ ...LBL, background: '#c0c0c0', fontSize: '11px', textAlign: 'center', paddingTop: '7px' }}>مشخصات خریدار</td>
          </tr>
          <tr>
            <td style={LBL}>نام شخص حقیقی / حقوقی:</td>
            <td style={VAL}>{_(data.customerName)}</td>
            <td style={LBL}>شناسه ملی / کد ملی:</td>
            <td style={VAL}>{_(data.nationalId)}</td>
          </tr>
          {data.economicCode && (
            <tr>
              <td style={LBL}>کد اقتصادی:</td>
              <td colSpan={3} style={VAL}>{data.economicCode}</td>
            </tr>
          )}
          {(data.registerNumber || data.ceoFullName) && (
            <tr>
              <td style={LBL}>شماره ثبت:</td>
              <td style={VAL}>{_(data.registerNumber)}</td>
              <td style={LBL}>نام مدیرعامل:</td>
              <td style={VAL}>{_(data.ceoFullName)}{data.ceoNationalId ? ` — ک.م: ${data.ceoNationalId}` : ''}</td>
            </tr>
          )}
          <tr>
            <td style={LBL}>نشانی کامل:</td>
            <td colSpan={3} style={VAL}>
              {data.province ? `استان ${data.province} — ` : ''}
              {data.city ? `شهرستان ${data.city} — ` : ''}
              {_(data.address)}
            </td>
          </tr>
          <tr>
            <td style={LBL}>کد پستی:</td>
            <td style={VAL}>{_(data.postalCode)}</td>
            <td style={LBL}>شناسه اشتراک:</td>
            <td style={VAL}>{_(data.billIdentifier)}</td>
          </tr>
        </tbody>
      </table>

      {/* ── جدول کالا / خدمات ── */}
      <div style={{ fontSize: '10px', fontWeight: 700, background: '#c0c0c0', border: '1px solid #222', borderBottom: 'none', padding: '4px 8px' }}>
        مشخصات کالا یا خدمات مورد معامله
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px' }}>
        <thead>
          {/* شماره ستون */}
          <tr>
            {['۱','۲','۳','۴','۵','۶','۷','۸','۹','۱۰','۱۱'].map(n => (
              <th key={n} style={{ ...TH, background: '#e8e8e8', fontSize: '9px', padding: '2px 4px' }}>{n}</th>
            ))}
          </tr>
          {/* عنوان ستون */}
          <tr>
            <th style={TH}>ردیف</th>
            <th style={TH}>کد کالا</th>
            <th style={{ ...TH, minWidth: '90px' }}>شرح کالا یا خدمات</th>
            <th style={TH}>تعداد/<br/>مقدار</th>
            <th style={TH}>واحد<br/>اندازه‌گیری</th>
            <th style={TH}>مبلغ واحد<br/>(ریال)</th>
            <th style={TH}>مبلغ کل<br/>(ریال)</th>
            <th style={TH}>مبلغ<br/>تخفیف</th>
            <th style={TH}>مبلغ کل پس<br/>از تخفیف (ریال)</th>
            <th style={TH}>جمع مالیات<br/>و عوارض (ریال)</th>
            <th style={TH}>جمع مبلغ کل<br/>+ مالیات (ریال)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={TD}>۱</td>
            <td style={TD}>—</td>
            <td style={TDL}>انرژی الکتریکی ({_(data.energyType)})</td>
            <td style={{ ...TD, fontWeight: 700 }}>{num(data.requestedKwh)}</td>
            <td style={TD}>کیلووات ساعت</td>
            <td style={{ ...TD, fontWeight: 700 }}>{num(data.contractRate)}</td>
            <td style={{ ...TD, fontWeight: 700 }}>{rial(total)}</td>
            <td style={TD}>—</td>
            <td style={{ ...TD, fontWeight: 700 }}>{rial(total)}</td>
            <td style={{ ...TD, fontWeight: 700 }}>{rial(vat)}</td>
            <td style={{ ...TD, fontWeight: 900 }}>{rial(grandTotal)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={6} style={{ ...TD, fontWeight: 800, background: '#e8e8e8', textAlign: 'right' }}>جمع کل</td>
            <td style={{ ...TD, fontWeight: 900, background: '#e8e8e8' }}>{rial(total)}</td>
            <td style={{ ...TD, background: '#e8e8e8' }}>—</td>
            <td style={{ ...TD, fontWeight: 900, background: '#e8e8e8' }}>{rial(total)}</td>
            <td style={{ ...TD, fontWeight: 900, background: '#e8e8e8' }}>{rial(vat)}</td>
            <td style={{ ...TD, fontWeight: 900, background: '#d0d0d0', fontSize: '11.5px' }}>{rial(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>

      {/* ── شرح ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px' }}>
        <tbody>
          <tr>
            <td style={{ ...LBL, width: '1%', whiteSpace: 'nowrap' }}>بابت:</td>
            <td style={VAL}>
              فروش انرژی الکتریکی ({_(data.energyType)}) به میزان {num(data.requestedKwh)} کیلووات ساعت
              {data.orderDate ? ` در تاریخ ${data.orderDate}` : ''} به {_(data.customerName)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── توضیحات ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
        <tbody>
          <tr>
            <td style={{ ...LBL, verticalAlign: 'top', width: '1%' }}>توضیحات:</td>
            <td style={{ ...VAL, lineHeight: '1.9', fontSize: '10px' }}>
              خواهشمند است، صورتحساب مذکور را به شماره حساب <b>1-5078821-767-366</b> با شماره شبای <b>IR800590036676705078821001</b> نزد بانک سینا پرداخت نمایید.
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── امضاها ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '4px' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #222', padding: '6px 10px', textAlign: 'center', width: '50%' }}>
              <div style={{ fontWeight: 800, marginBottom: '3px' }}>مشخصات، امضا و مهر فروشنده</div>
              <div style={{ fontSize: '10px' }}>شرکت توسعه انرژی متین</div>
              <div style={{ marginTop: '55px', borderTop: '1px solid #999', paddingTop: '4px', fontSize: '9px', color: '#777' }}>امضا و مهر</div>
            </td>
            <td style={{ border: '1px solid #222', padding: '6px 10px', textAlign: 'center', width: '50%' }}>
              <div style={{ fontWeight: 800, marginBottom: '3px' }}>مشخصات، امضا و مهر خریدار</div>
              <div style={{ fontSize: '10px' }}>{_(data.customerName)}</div>
              {data.nationalId && <div style={{ fontSize: '9px', color: '#555' }}>ک.م / ش.ث: {data.nationalId}</div>}
              <div style={{ marginTop: '45px', borderTop: '1px solid #999', paddingTop: '4px', fontSize: '9px', color: '#777' }}>امضا و مهر</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── فوتر ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '9px', color: '#888', borderTop: '1px dashed #ccc', paddingTop: '5px' }}>
        <span>شرکت توسعه انرژی متین</span>
        <span>شماره: {invoiceNo}</span>
        <span>تاریخ چاپ: {printDate}</span>
      </div>
    </div>
  )

  return createPortal(
    <>
      <style>{`
        @page { size: A4 portrait; margin: 10mm 12mm; }
        @media print {
          body * { visibility: hidden !important; }
          #pfi-root, #pfi-root * { visibility: visible !important; }
          #pfi-root {
            display: block !important;
            position: fixed !important; inset: 0 !important;
            background: white !important; z-index: 9999 !important;
            overflow: visible !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ── Screen Preview ── */}
      <div
        className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6"
        style={{ background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-4xl rounded-2xl shadow-2xl"
          style={{ background: '#f3f4f6' }}
          onClick={e => e.stopPropagation()}
        >
          {/* toolbar */}
          <div className="rounded-t-2xl" style={{ background: '#1e3a5f' }}>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm font-bold text-white">پیش‌نمایش پیش‌فاکتور — {invoiceNo}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  disabled={!hasContract && !parseFloat(manualRate)}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: '#2563eb' }}
                >
                  <Printer className="h-4 w-4" /> چاپ
                </button>
                <button onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {!hasContract && (
              <div className="flex items-center gap-3 border-t border-white/10 px-5 py-3">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                <span className="text-xs text-amber-300">قرارداد فعالی برای این اشتراک یافت نشد — نرخ واحد را دستی وارد کنید:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={manualRate}
                  onChange={e => setManualRate(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="نرخ (ریال)"
                  className="w-36 rounded-lg border border-amber-400/50 bg-white/10 px-3 py-1.5 text-right text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                {parseFloat(manualRate) > 0 && (
                  <span className="text-xs text-white/60">{parseFloat(manualRate).toLocaleString('fa-IR')} ریال</span>
                )}
              </div>
            )}
          </div>

          {/* A4 preview */}
          <div className="p-4">
            <div style={{
              background: 'white', boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
              border: '1.5px solid #333', borderRadius: '2px',
              minHeight: '297mm', overflow: 'hidden',
            }}>
              <PrintContent />
            </div>
          </div>
        </div>
      </div>

      {/* ── Print Area ── */}
      <div id="pfi-root" style={{ display: 'none', background: 'white' }}>
        <PrintContent />
      </div>
    </>,
    document.body
  )
}
