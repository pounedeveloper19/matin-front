import { Printer, X, FileText, Calendar, Zap, Shield, MapPin, Hash } from 'lucide-react'

export interface PrintableContract {
  contractNumber: string
  customerName?: string
  customerIdentifier?: string
  subscription?: string
  address?: string
  startDate?: string | null
  endDate?: string | null
  contractRate?: number
  status?: string
  warrantyAmount?: number
  warrantyType?: string
}

interface Props {
  open: boolean
  data: PrintableContract | null
  onClose: () => void
}

export default function ContractPrintModal({ open, data, onClose }: Props) {
  if (!open || !data) return null

  const printRows = [
    { label: 'شماره قرارداد', value: data.contractNumber },
    { label: 'نام مشتری', value: data.customerName },
    { label: 'شناسه / کد ملی', value: data.customerIdentifier },
    { label: 'انشعاب', value: data.subscription },
    { label: 'آدرس', value: data.address },
    { label: 'تاریخ شروع', value: data.startDate },
    { label: 'تاریخ پایان', value: data.endDate },
    { label: 'نرخ قرارداد (ریال)', value: data.contractRate ? data.contractRate.toLocaleString('fa-IR') : null },
    { label: 'وضعیت', value: data.status },
    { label: 'نوع ضمانت', value: data.warrantyType },
    { label: 'مبلغ ضمانت (ریال)', value: data.warrantyAmount ? data.warrantyAmount.toLocaleString('fa-IR') : null },
  ].filter(r => r.value != null && r.value !== '')

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #contract-print-area {
            display: block !important;
            visibility: visible !important;
            position: fixed !important;
            inset: 0 !important;
            background: white !important;
            padding: 48px !important;
            direction: rtl !important;
          }
          #contract-print-area * { visibility: visible !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ── Screen view ─────────────────────────────────────── */}
      <div
        className="no-print fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(3, 40, 24, 0.75)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      >
        <div
          className="w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl"
          style={{
            background: 'linear-gradient(150deg, #064e3b 0%, #065f46 55%, #047857 100%)',
            boxShadow: '0 32px 64px rgba(3,50,32,0.5)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="px-6 pt-6 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
                >
                  <FileText className="h-6 w-6 text-emerald-200" />
                </div>
                <div>
                  <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-400">
                    قرارداد فروش برق
                  </p>
                  <h2 className="text-xl font-bold tracking-wide text-white">
                    {data.contractNumber}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {data.status && (
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold text-emerald-100"
                    style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}
                  >
                    {data.status}
                  </span>
                )}
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Customer pill */}
            {data.customerName && (
              <div className="mt-4 flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: 'rgba(255,255,255,0.18)' }}
                >
                  {data.customerName.charAt(0)}
                </div>
                <span className="text-sm font-medium text-emerald-100">{data.customerName}</span>
                {data.customerIdentifier && (
                  <span className="text-xs text-emerald-300/60">• {data.customerIdentifier}</span>
                )}
              </div>
            )}
          </div>

          {/* ── Bento stats ── */}
          <div className="grid grid-cols-3 gap-2.5 px-6 pb-5">
            <div
              className="rounded-xl p-3.5"
              style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Calendar className="mb-2 h-4 w-4 text-emerald-300" />
              <p className="text-[10px] text-emerald-300/60">تاریخ شروع</p>
              <p className="mt-0.5 text-sm font-semibold text-white">{data.startDate || '—'}</p>
            </div>
            <div
              className="rounded-xl p-3.5"
              style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Calendar className="mb-2 h-4 w-4 text-emerald-300" />
              <p className="text-[10px] text-emerald-300/60">تاریخ پایان</p>
              <p className="mt-0.5 text-sm font-semibold text-white">{data.endDate || '—'}</p>
            </div>
            <div
              className="rounded-xl p-3.5"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <Zap className="mb-2 h-4 w-4 text-emerald-200" />
              <p className="text-[10px] text-emerald-300/60">نرخ قرارداد</p>
              <p className="mt-0.5 text-sm font-bold text-white">
                {data.contractRate ? data.contractRate.toLocaleString('fa-IR') : '—'}
                {data.contractRate ? <span className="mr-0.5 text-[10px] font-normal text-emerald-300"> ریال</span> : null}
              </p>
            </div>
          </div>

          {/* ── Glass card: details + warranty ── */}
          <div
            className="mx-4 mb-4 overflow-hidden rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.07)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {/* Contract details section */}
            <div className="p-5">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">
                جزئیات قرارداد
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {data.subscription && (
                  <div className="flex items-start gap-2.5">
                    <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/60" />
                    <div>
                      <p className="text-[10px] text-emerald-300/50">انشعاب</p>
                      <p className="mt-0.5 text-sm font-medium text-white">{data.subscription}</p>
                    </div>
                  </div>
                )}
                {data.address && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/60" />
                    <div>
                      <p className="text-[10px] text-emerald-300/50">آدرس</p>
                      <p className="mt-0.5 text-sm font-medium text-white">{data.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Warranty section */}
            {(data.warrantyAmount || data.warrantyType) && (
              <div className="border-t p-5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">
                  ضمانت‌نامه
                </p>
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(52,211,153,0.15)' }}
                  >
                    <Shield className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div className="grid flex-1 grid-cols-2 gap-x-6">
                    {data.warrantyType && (
                      <div>
                        <p className="text-[10px] text-emerald-300/50">نوع ضمانت</p>
                        <p className="mt-0.5 text-sm font-medium text-white">{data.warrantyType}</p>
                      </div>
                    )}
                    {data.warrantyAmount ? (
                      <div>
                        <p className="text-[10px] text-emerald-300/50">مبلغ</p>
                        <p className="mt-0.5 text-sm font-medium text-white">
                          {data.warrantyAmount.toLocaleString('fa-IR')}
                          <span className="mr-0.5 text-[10px] text-emerald-300"> ریال</span>
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-2.5 px-6 pb-6">
            <button
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-white/60 transition-all hover:bg-white/10 hover:text-white"
              style={{ border: '1px solid rgba(255,255,255,0.18)' }}
            >
              بستن
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}
            >
              <Printer className="h-4 w-4" />
              چاپ قرارداد
            </button>
          </div>
        </div>
      </div>

      {/* ── Print area (hidden on screen, shown on print) ─── */}
      <div id="contract-print-area" style={{ display: 'none' }} dir="rtl">
        <div style={{ fontFamily: 'Vazirmatn, sans-serif', color: '#111', background: '#fff' }}>
          {/* Print header */}
          <div style={{ textAlign: 'center', marginBottom: '36px', paddingBottom: '20px', borderBottom: '2px solid #111' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>
              قرارداد فروش برق
            </h1>
            <p style={{ fontSize: '13px', color: '#666', margin: '6px 0 0' }}>سامانه مدیریت برق متین</p>
          </div>

          {/* Print table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', lineHeight: '1.6' }}>
            <tbody>
              {printRows.map(({ label, value }) => (
                <tr key={label} style={{ borderBottom: '1px solid #e5e5e5' }}>
                  <td style={{
                    padding: '11px 14px',
                    fontWeight: 600,
                    color: '#555',
                    width: '170px',
                    background: '#f7f7f7',
                    whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </td>
                  <td style={{ padding: '11px 14px', color: '#111' }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Signature area */}
          <div style={{ marginTop: '64px', display: 'flex', justifyContent: 'space-between', gap: '32px' }}>
            {['مهر و امضاء فروشنده', 'مهر و امضاء خریدار'].map((title) => (
              <div key={title} style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#444', marginBottom: '48px' }}>{title}</p>
                <div style={{ borderTop: '1px solid #aaa', paddingTop: '8px' }} />
              </div>
            ))}
          </div>

          {/* Print footer */}
          <div style={{
            marginTop: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#aaa',
            borderTop: '1px solid #e5e5e5',
            paddingTop: '12px',
          }}>
            <span>تاریخ چاپ: {new Date().toLocaleDateString('fa-IR')}</span>
            <span>شماره قرارداد: {data.contractNumber}</span>
          </div>
        </div>
      </div>
    </>
  )
}
