import { Printer, X } from 'lucide-react'
import type { AdvancedBillAnalysisResult, PortfolioOptimizationResult } from '../../types'
import { constraintLabel } from '../../utils'

interface Props {
  open: boolean
  onClose: () => void
  result: AdvancedBillAnalysisResult
  recommendation?: PortfolioOptimizationResult | null
  customerName?: string
  billIdentifier?: string
}

const rial = (n: number) => n.toLocaleString('fa-IR') + ' ریال'
const fmt  = (n: number) => n.toLocaleString('fa-IR', { maximumFractionDigits: 0 })
const smartRial = (n: number) => {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' میلیارد ریال'
  if (n >= 1e6) return Math.round(n / 1e6).toLocaleString('fa-IR') + ' میلیون ریال'
  return n.toLocaleString('fa-IR', { maximumFractionDigits: 0 }) + ' ریال'
}

const ENERGY_LABEL: Record<string, string> = {
  exchange: 'بورس برق', green: 'برق سبز', bilateral: 'دوجانبه', grid: 'شبکه',
}
const ENERGY_DOT: Record<string, string> = {
  exchange: '#7c3aed', green: '#059669', bilateral: '#2563eb', grid: '#6b7280',
}

export default function BillAnalysisPrintModal({ open, onClose, result: r, recommendation: rec, customerName, billIdentifier }: Props) {
  if (!open) return null

  const mixItems = rec ? [
    { type: 'exchange',  kwh: rec.optimalMix.exchangeKwh  },
    { type: 'green',     kwh: rec.optimalMix.greenKwh     },
    { type: 'bilateral', kwh: rec.optimalMix.bilateralKwh },
    { type: 'grid',      kwh: rec.optimalMix.gridKwh      },
  ].filter(m => m.kwh > 0) : []
  const mixTotal = mixItems.reduce((s, m) => s + m.kwh, 0)

  const today = new Date().toLocaleDateString('fa-IR')

  return (
    <>
      <style>{`
        @page { size: A4; margin: 14mm 12mm; }
        @media print {
          body * { visibility: hidden !important; }
          #bam-root { display: block !important; visibility: visible !important; position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; background: white !important; z-index: 9999 !important; }
          #bam-root * { visibility: visible !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Screen overlay */}
      <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}>
        <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl"
          onClick={e => e.stopPropagation()}>
          <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
            <h2 className="font-bold text-gray-900">پیش‌نمایش PDF — گزارش تحلیل قبض</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">
                <Printer className="h-4 w-4" /> چاپ / ذخیره PDF
              </button>
              <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto p-6">
            <PrintContent r={r} rec={rec} mixItems={mixItems} mixTotal={mixTotal}
              customerName={customerName} billIdentifier={billIdentifier} today={today} />
          </div>
        </div>
      </div>

      {/* Print target */}
      <div id="bam-root" style={{ display: 'none', direction: 'rtl', fontFamily: 'Vazirmatn, sans-serif', color: '#111', background: 'white', padding: '0 4mm' }}>
        <PrintContent r={r} rec={rec} mixItems={mixItems} mixTotal={mixTotal}
          customerName={customerName} billIdentifier={billIdentifier} today={today} />
      </div>
    </>
  )
}

function PrintContent({ r, rec, mixItems, mixTotal, customerName, billIdentifier, today }: {
  r: AdvancedBillAnalysisResult
  rec?: PortfolioOptimizationResult | null
  mixItems: { type: string; kwh: number }[]
  mixTotal: number
  customerName?: string
  billIdentifier?: string
  today: string
}) {
  return (
    <div dir="rtl" style={{ fontFamily: 'Vazirmatn, sans-serif', fontSize: 12, color: '#111', lineHeight: 1.6 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #065f46', paddingBottom: 10, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#065f46' }}>برق متین</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>سامانه مدیریت برق هوشمند</div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a' }}>گزارش تحلیل قبض برق</div>
          <div style={{ fontSize: 10, color: '#6b7280' }}>تاریخ: {today}</div>
        </div>
      </div>

      {/* ── Info strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'مشتری', value: customerName ?? '—' },
          { label: 'شناسه', value: billIdentifier ?? '—' },
          { label: 'دوره مصرف', value: `${r.monthName} ${r.year}` },
          { label: 'مصرف کل', value: `${fmt(r.totalKwh)} kWh` },
        ].map(item => (
          <div key={item.label} style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px' }}>
            <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontWeight: 700, fontSize: 11 }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* ── TOU hours + consumption breakdown ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 10 }}>
          <div style={{ fontWeight: 700, color: '#374151', marginBottom: 6 }}>ساعات TOU (روزانه)</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span>اوج: <strong>{r.peakHoursPerDay}h</strong></span>
            <span>میان: <strong>{r.midHoursPerDay}h</strong></span>
            <span>کم‌بار: <strong>{r.lowHoursPerDay}h</strong></span>
          </div>
          {r.greenPercent > 0 && (
            <div style={{ color: '#065f46', marginTop: 4 }}>مشمول جهش: <strong>{fmt(r.greenSubjectKwh)} kWh ({(r.greenPercent * 100).toFixed(0)}٪)</strong></div>
          )}
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 10 }}>
          <div style={{ fontWeight: 700, color: '#374151', marginBottom: 6 }}>توزیع مصرف (kWh)</div>
          {[
            { label: 'میان بار', kwh: r.midKwh,  color: '#f59e0b' },
            { label: 'اوج بار',  kwh: r.peakKwh, color: '#ef4444' },
            { label: 'کم بار',   kwh: r.lowKwh,  color: '#3b82f6' },
          ].map(row => {
            const pct = r.totalKwh > 0 ? ((row.kwh / r.totalKwh) * 100).toFixed(0) : '0'
            return (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ width: 52, color: '#6b7280' }}>{row.label}</span>
                <div style={{ flex: 1, background: '#e5e7eb', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: row.color, borderRadius: 4 }} />
                </div>
                <span style={{ width: 72, textAlign: 'left', fontWeight: 700 }}>{fmt(row.kwh)} ({pct}٪)</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Final summary table ── */}
      <SectionTitle>خروجی نهایی</SectionTitle>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, border: '2px solid #fbbf24' }}>
        <tbody>
          <tr style={{ background: '#fefce8' }}>
            <Td>هزینه بدون قرارداد متین</Td>
            <Td right color="#b91c1c" bold lg>{rial(r.costWithoutMatin)}</Td>
          </tr>
          <tr style={{ background: '#fefce8', borderTop: '1px solid #fde68a' }}>
            <Td>هزینه با قرارداد متین</Td>
            <Td right color="#065f46" bold lg>{rial(r.costWithMatin)}</Td>
          </tr>
          <tr style={{ background: '#fef9c3', borderTop: '1px solid #fde047' }}>
            <Td bold>صرفه‌جویی</Td>
            <Td right color="#1d4ed8" bold lg>{rial(r.netSaving)} ({r.savingPercent.toLocaleString('fa-IR')}٪)</Td>
          </tr>
        </tbody>
      </table>

      {/* ── Saving banner ── */}
      {r.netSaving > 0 && (
        <div style={{ background: 'linear-gradient(135deg,#065f46,#047857)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#a7f3d0', fontSize: 10 }}>با قرارداد برق متین صرفه‌جویی کردید:</span>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>{rial(r.netSaving)}</span>
          <span style={{ background: '#fff', color: '#065f46', fontWeight: 800, fontSize: 12, borderRadius: 20, padding: '2px 10px' }}>
            {r.savingPercent.toLocaleString('fa-IR')}٪ کاهش
          </span>
        </div>
      )}

      {/* ── Breakdown side by side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {/* Before */}
        <div style={{ border: '1px solid #fca5a5', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ background: '#fef2f2', padding: '6px 10px', fontWeight: 700, fontSize: 11, color: '#991b1b' }}>هزینه بدون قرارداد متین</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <tbody>
              <MiniRow label="بهای انرژی" value={fmt(r.energyBeforeRial)} />
              {r.article16BeforeRial > 0 && <MiniRow label="مابه‌التفاوت ماده ۱۶" value={fmt(r.article16BeforeRial)} color="#7e22ce" />}
              {r.regulatoryBeforeRial > 0 && <MiniRow label="مابه‌التفاوت اجرای مقررات" value={fmt(r.regulatoryBeforeRial)} color="#c2410c" />}
              <MiniRow label="جمع کل" value={rial(r.costWithoutMatin)} bold color="#b91c1c" border />
            </tbody>
          </table>
        </div>

        {/* After */}
        <div style={{ border: '1px solid #6ee7b7', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ background: '#ecfdf5', padding: '6px 10px', fontWeight: 700, fontSize: 11, color: '#065f46' }}>هزینه با قرارداد متین</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <tbody>
              <MiniRow label="بهای انرژی شبکه" value={fmt(r.energyAfterRial)} />
              {r.article16AfterRial > 0 && <MiniRow label="مابه‌التفاوت ماده ۱۶" value={fmt(r.article16AfterRial)} color="#7e22ce" />}
              {r.regulatoryAfterRial > 0 && <MiniRow label="مابه‌التفاوت اجرای مقررات" value={fmt(r.regulatoryAfterRial)} color="#c2410c" />}
              {r.creditRial < 0 && <MiniRow label="بستانکاری" value={fmt(r.creditRial)} color="#059669" />}
              {r.bilateralBillRial > 0 && <MiniRow label="صورتحساب دوجانبه" value={fmt(r.bilateralBillRial)} color="#1d4ed8" />}
              {r.exchangeBillRial > 0 && <MiniRow label="صورتحساب بورس" value={fmt(r.exchangeBillRial)} color="#4338ca" />}
              {r.greenBillRial > 0 && <MiniRow label="صورتحساب برق سبز" value={fmt(r.greenBillRial)} color="#92400e" />}
              <MiniRow label="جمع کل" value={rial(r.costWithMatin)} bold color="#065f46" border />
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Market energy details ── */}
      {(r.bilateralBillRial > 0 || r.exchangeBillRial > 0 || r.greenBillRial > 0) && (
        <>
          <SectionTitle>جزئیات انرژی خریداری‌شده از بازار</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 10, border: '1px solid #e5e7eb' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <Th>نوع انرژی</Th><Th right>مبلغ صورتحساب (ریال)</Th>
              </tr>
            </thead>
            <tbody>
              {r.bilateralBillRial > 0 && <TRow cells={['قرارداد دوجانبه', fmt(r.bilateralBillRial)]} />}
              {r.exchangeBillRial  > 0 && <TRow cells={['بورس برق', fmt(r.exchangeBillRial)]} />}
              {r.greenBillRial     > 0 && <TRow cells={['برق سبز (قانون جهش)', fmt(r.greenBillRial)]} />}
            </tbody>
          </table>
        </>
      )}

      {/* ── Rate table ── */}
      <SectionTitle>نرخ‌های تعرفه و بازار (ریال/kWh)</SectionTitle>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 10, border: '1px solid #e5e7eb' }}>
        <thead>
          <tr style={{ background: '#f9fafb' }}>
            <Th>بازه</Th><Th>مصرف (kWh)</Th><Th>تعرفه صنعتی</Th><Th>حداکثر بازار</Th><Th>متوسط بازار</Th>
          </tr>
        </thead>
        <tbody>
          <TRow cells={['میان بار', fmt(r.midKwh), fmt(r.tariffMidRial), fmt(r.maxWholeMid), fmt(r.avgMarket)]} />
          <TRow cells={['اوج بار', fmt(r.peakKwh), fmt(r.tariffPeakRial), fmt(r.maxWholePeak), fmt(r.avgMarket)]} />
          <TRow cells={['کم بار', fmt(r.lowKwh), fmt(r.tariffLowRial), fmt(r.maxWholeLow), fmt(r.avgMarket)]} />
        </tbody>
      </table>

      {/* ── Portfolio recommendation ── */}
      {rec && (
        <>
          <SectionTitle>پیشنهاد بهینه‌سازی ترکیب تامین انرژی (Phase 3B LP)</SectionTitle>

          {/* Mix bar */}
          {mixTotal > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', height: 16, borderRadius: 8, overflow: 'hidden', gap: 2 }}>
                {mixItems.map(m => (
                  <div key={m.type} style={{ flex: m.kwh / mixTotal, background: ENERGY_DOT[m.type] ?? '#888', minWidth: 4 }} />
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6, fontSize: 10 }}>
                {mixItems.map(m => (
                  <span key={m.type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: ENERGY_DOT[m.type] ?? '#888' }} />
                    {ENERGY_LABEL[m.type]}: <strong>{fmt(m.kwh)} kWh ({((m.kwh / mixTotal) * 100).toFixed(1)}٪)</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cost comparison 3-box */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
            <InfoBox label="بدون قرارداد" value={smartRial(rec.baselineCost)} color="#b91c1c" bg="#fef2f2" border="#fca5a5" />
            <InfoBox label="با ترکیب بهینه متین" value={smartRial(rec.totalCost)} color="#065f46" bg="#ecfdf5" border="#6ee7b7" />
            <InfoBox label="صرفه‌جویی" value={`${smartRial(rec.saving)} (${rec.savingPercent.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}٪)`} color="#1d4ed8" bg="#eff6ff" border="#93c5fd" />
          </div>

          {/* Reasoning */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, marginBottom: 12, border: '1px solid #e5e7eb' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <Th>کانال</Th><Th>وضعیت</Th><Th right>توضیح</Th>
              </tr>
            </thead>
            <tbody>
              {rec.reasoning.map((rr, i) => (
                <tr key={i} style={{ background: rr.isActive ? '#f0fdf4' : '#fff', borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '4px 8px', fontWeight: 700, color: rr.isActive ? '#065f46' : '#6b7280' }}>
                    {ENERGY_LABEL[rr.channel] ?? rr.channel}
                  </td>
                  <td style={{ padding: '4px 8px', color: rr.isActive ? '#059669' : '#9ca3af' }}>
                    {rr.isActive ? '✓ فعال' : '— غیرفعال'}
                  </td>
                  <td style={{ padding: '4px 8px', color: '#374151' }}>{rr.message}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {rec.constraintHits.length > 0 && (
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '8px 12px', fontSize: 10, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 4 }}>محدودیت‌های اعمال‌شده:</div>
              {rec.constraintHits.map((c, i) => <div key={i} style={{ color: '#78350f' }}>⚠ {constraintLabel(c)}</div>)}
            </div>
          )}
        </>
      )}

      {/* ── Footer ── */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 8, marginTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#9ca3af' }}>
        <span>این گزارش توسط سامانه برق متین تهیه شده است.</span>
        <span>تاریخ تهیه: {today}</span>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontWeight: 800, fontSize: 12, color: '#065f46', borderBottom: '1px solid #a7f3d0', paddingBottom: 4, marginBottom: 8 }}>
      {children}
    </div>
  )
}

function Td({ children, right, bold, color, lg }: {
  children: React.ReactNode; right?: boolean; bold?: boolean; color?: string; lg?: boolean
}) {
  return (
    <td style={{
      padding: '8px 12px',
      textAlign: right ? 'left' : 'right',
      fontWeight: bold ? 700 : 400,
      color: color ?? '#111',
      fontSize: lg ? 13 : 11,
    }}>
      {children}
    </td>
  )
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th style={{ padding: '6px 8px', textAlign: right ? 'left' : 'right', fontWeight: 700, fontSize: 10, color: '#374151', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
      {children}
    </th>
  )
}

function TRow({ cells }: { cells: string[] }) {
  return (
    <tr style={{ borderTop: '1px solid #f3f4f6' }}>
      {cells.map((c, i) => (
        <td key={i} style={{ padding: '5px 8px', color: '#374151', textAlign: i > 0 ? 'left' : 'right' }}>{c}</td>
      ))}
    </tr>
  )
}

function MiniRow({ label, value, bold, color, border }: { label: string; value: string; bold?: boolean; color?: string; border?: boolean }) {
  return (
    <tr style={{ borderTop: border ? '1px solid #e5e7eb' : '1px solid #f9fafb', background: border ? '#f8fafc' : 'transparent' }}>
      <td style={{ padding: '4px 8px', color: '#6b7280' }}>{label}</td>
      <td style={{ padding: '4px 8px', textAlign: 'left', fontWeight: bold ? 700 : 500, color: color ?? '#111' }}>{value}</td>
    </tr>
  )
}

function InfoBox({ label, value, color, bg, border }: { label: string; value: string; color: string; bg: string; border: string }) {
  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: 8, padding: '8px 10px', background: bg, textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 11, color }}>{value}</div>
    </div>
  )
}
