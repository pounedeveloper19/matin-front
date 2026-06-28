import type { ReactNode } from 'react'
import { Printer, X, FileText, Calendar, Zap, Shield, MapPin, Hash } from 'lucide-react'
import PreviewDownloadButton from './FilePreviewModal'

export interface PrintableContract {
  contractNumber?: string | null
  customerName?: string | null
  customerIdentifier?: string | null
  registerNumber?: string | null
  ceoFullName?: string | null
  ceoNationalId?: string | null
  gazetteDate?: string | null
  subscription?: string | null
  address?: string | null
  postalCode?: string | null
  province?: string | null
  startDate?: string | null
  endDate?: string | null
  contractRate?: number | null
  status?: string | null
  warrantyAmount?: number | null
  warrantyType?: string | null
  warrantyFileId?: string | null
  contractPowerKw?: number | null
  contractVolumeKwh?: number | null
  contractAmountRial?: number | null
  paymentDeadline?: string | null
}

interface Props {
  open: boolean
  data: PrintableContract | null
  onClose: () => void
}

const _ = (v?: string | null) => v || '.....................'
const _n = (v?: number | null) => (v != null ? v.toLocaleString('fa-IR') : '.....................')

export default function ContractPrintModal({ open, data, onClose }: Props) {
  if (!open || !data) return null

  const powerKw = data.contractPowerKw
  const powerMw = powerKw ? (powerKw / 1000).toFixed(3) : null

  const handlePrint = () => {
    const prev = document.title
    document.title = data.contractNumber ?? 'قرارداد'
    window.print()
    setTimeout(() => { document.title = prev }, 1500)
  }

  const warrantyLabel = (() => {
    const t = data.warrantyType
    if (!t) return '.....................'
    if (t.includes('چک')) return 'یک فقره چک'
    if (t.includes('سفته')) return 'سفته'
    return t
  })()

  return (
    <>
      <style>{`
        @page { size: A4; margin: 10mm 10mm; }
        @media print {
          body * { visibility: hidden !important; }
          #cpm-root { display: block !important; visibility: visible !important; position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; background: white !important; }
          #cpm-root * { visibility: visible !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ── Screen preview ─────────────────────────────────── */}
      <div
        className="no-print fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(3,40,24,0.75)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      >
        <div
          className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl"
          style={{ background: 'linear-gradient(150deg,#064e3b 0%,#065f46 55%,#047857 100%)', maxHeight: 'calc(100vh - 2rem)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="shrink-0 px-6 pt-6 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <FileText className="h-6 w-6 text-emerald-200" />
                </div>
                <div>
                  <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-400">قرارداد فروش برق</p>
                  <h2 className="text-xl font-bold tracking-wide text-white">{data.contractNumber}</h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {data.status && (
                  <span className="rounded-full px-3 py-1 text-xs font-semibold text-emerald-100"
                    style={{ background: 'rgba(255,255,255,0.15)' }}>
                    {data.status}
                  </span>
                )}
                <button onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/15 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {data.customerName && (
              <div className="mt-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: 'rgba(255,255,255,0.18)' }}>
                  {data.customerName.charAt(0)}
                </div>
                <span className="text-sm font-medium text-emerald-100">{data.customerName}</span>
                {data.customerIdentifier && <span className="text-xs text-emerald-300/60">• {data.customerIdentifier}</span>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2.5 px-6 pb-5">
            {[
              { icon: <Calendar className="mb-2 h-4 w-4 text-emerald-300" />, label: 'تاریخ شروع', val: data.startDate || '—' },
              { icon: <Calendar className="mb-2 h-4 w-4 text-emerald-300" />, label: 'تاریخ پایان', val: data.endDate || '—' },
              { icon: <Zap className="mb-2 h-4 w-4 text-emerald-200" />, label: 'نرخ (ریال/kWh)', val: data.contractRate ? data.contractRate.toLocaleString('fa-IR') : '—' },
            ].map(({ icon, label, val }) => (
              <div key={label} className="rounded-xl p-3.5"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {icon}
                <p className="text-[10px] text-emerald-300/60">{label}</p>
                <p className="mt-0.5 text-sm font-semibold text-white">{val}</p>
              </div>
            ))}
          </div>

          <div className="mx-4 mb-4 overflow-hidden rounded-xl"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="p-5">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">جزئیات قرارداد</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {data.subscription && (
                  <div className="flex items-start gap-2.5">
                    <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/60" />
                    <div>
                      <p className="text-[10px] text-emerald-300/50">شناسه</p>
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
                {powerKw != null && (
                  <div className="flex items-start gap-2.5">
                    <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/60" />
                    <div>
                      <p className="text-[10px] text-emerald-300/50">قدرت قرارداد</p>
                      <p className="mt-0.5 text-sm font-medium text-white">{powerKw.toLocaleString('fa-IR')} kW</p>
                    </div>
                  </div>
                )}
                {data.contractVolumeKwh != null && (
                  <div className="flex items-start gap-2.5">
                    <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/60" />
                    <div>
                      <p className="text-[10px] text-emerald-300/50">حجم قرارداد</p>
                      <p className="mt-0.5 text-sm font-medium text-white">{data.contractVolumeKwh.toLocaleString('fa-IR')} kWh</p>
                    </div>
                  </div>
                )}
                {data.contractAmountRial != null && (
                  <div className="flex items-start gap-2.5">
                    <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/60" />
                    <div>
                      <p className="text-[10px] text-emerald-300/50">مبلغ قرارداد</p>
                      <p className="mt-0.5 text-sm font-medium text-white">{data.contractAmountRial.toLocaleString('fa-IR')} ریال</p>
                    </div>
                  </div>
                )}
                {data.paymentDeadline && (
                  <div className="flex items-start gap-2.5">
                    <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/60" />
                    <div>
                      <p className="text-[10px] text-emerald-300/50">مهلت پرداخت</p>
                      <p className="mt-0.5 text-sm font-medium text-white">{data.paymentDeadline}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {(data.warrantyAmount || data.warrantyType || data.warrantyFileId) && (
              <div className="border-t p-5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">ضمانت‌نامه</p>
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(52,211,153,0.15)' }}>
                    <Shield className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-2 gap-x-6">
                      {data.warrantyType && <div><p className="text-[10px] text-emerald-300/50">نوع ضمانت</p><p className="mt-0.5 text-sm font-medium text-white">{data.warrantyType}</p></div>}
                      {data.warrantyAmount ? <div><p className="text-[10px] text-emerald-300/50">مبلغ</p><p className="mt-0.5 text-sm font-medium text-white">{data.warrantyAmount.toLocaleString('fa-IR')} <span className="text-[10px] text-emerald-300">ریال</span></p></div> : null}
                    </div>
                    {data.warrantyFileId && (
                      <PreviewDownloadButton
                        fileId={data.warrantyFileId}
                        label="مشاهده فایل ضمانت‌نامه"
                        className="no-print mt-3 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                        style={{ background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.3)' }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 px-6 pb-6">
            <button onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-white/60 transition-all hover:bg-white/10 hover:text-white"
              style={{ border: '1px solid rgba(255,255,255,0.18)' }}>
              بستن
            </button>
            {!data.status?.includes('عدم تایید') && (
              <button onClick={handlePrint}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.25)' }}>
                <Printer className="h-4 w-4" /> چاپ قرارداد
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Print area ─────────────────────────────────────── */}
      <div id="cpm-root" style={{ display: 'none' }}>
        <div style={{ border: '2px solid #222', padding: '7mm 14mm', boxSizing: 'border-box', minHeight: '257mm', fontFamily: "'Vazirmatn','Tahoma',sans-serif", direction: 'rtl', color: '#111', fontSize: '11.5px', lineHeight: '1.9' }}>

          {/* Cover header */}
          <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #111' }}>
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '13px' }}>بسمه تعالی</p>
            <h1 style={{ margin: '0 0 16px', fontSize: '22px', fontWeight: 900 }}>قرارداد فروش برق</h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span><b>خریدار: </b>{_(data.customerName)}</span>
              <span><b>شماره قرارداد: </b>{_(data.contractNumber)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', fontSize: '12px', marginBottom: '4px' }}>
              <span><b>تاریخ: </b>{_(data.startDate)}</span>
            </div>
            <p style={{ margin: '8px 0 2px', fontWeight: 700, fontSize: '13px' }}>فروشنده: شرکت توسعه انرژی متین</p>
            <p style={{ margin: 0, fontSize: '10px', color: '#555' }}>MATIN Energy Development Company</p>
          </div>

          {/* Preamble */}
          <p style={{ textAlign: 'justify', margin: '0 0 14px' }}>
            این قرارداد فیمابین «<b>{_(data.customerName)}</b>» با شناسه ملی <b>{_(data.customerIdentifier)}</b> و شماره ثبت
            <b> {_(data.registerNumber)}</b> از اداره ثبت شرکت‌ها با نمایندگی <b>{_(data.ceoFullName)}</b> با کد ملی
            <b> {_(data.ceoNationalId)}</b> (با سمت مدیرعامل) و ........................... (رئیس هیئت مدیره) با کد ملی ...........................
            که طبق آگهی منتشره در روزنامه رسمی مورخ <b>{_(data.gazetteDate)}</b> اختیار امضای این قرارداد را دارند به نشانی:
            <b> {_(data.address)}</b>، کد پستی <b>{_(data.postalCode)}</b>، دارنده شماره پرونده (شناسه قبض)
            <b> {_(data.subscription)}</b> با شرکت توزیع برق / برق منطقه‌ای استان <b>{_(data.province)}</b>
            که از این پس «خریدار» نامیده می‌شود از یک طرف و شرکت توسعه انرژی متین به شناسه ملی <b>10103303952</b> و شماره ثبت
            293423 از اداره ثبت شرکت‌های استان تهران دارای پروانه خرده‌فروشی برق به شماره 421-99-1526-2 مورخ 1403/10/01 با
            نمایندگی آقایان جواد محمودی به شماره ملی 2900111706 (مدیرعامل) و حمید زرگرپور به شماره ملی 1286493978 (رئیس هیئت
            مدیره) که طبق آگهی منتشره در روزنامه رسمی مورخ 1402/06/08 اختیار امضای این قرارداد را دارند به نشانی: تهران،
            خیابان ملاصدرا، ابتدای شیخ بهایی شمالی، کوچه سلمان، پلاک ۹ که از این پس «فروشنده» نامیده می‌شود، از طرف دیگر
            منعقد می‌گردد.
          </p>

          <Art title="ماده ۱ – موضوع قرارداد">
            <Row n="۱">
              تأمین برق مصرفی خریدار به ظرفیت <b>{_n(powerKw)}</b> کیلووات
              {powerMw && <> (<b>{powerMw}</b> مگاوات)</>}
              {' '}بار پایه (قدرت در ساعت)
              {data.contractVolumeKwh != null && <> و حجم <b>{_n(data.contractVolumeKwh)}</b> کیلووات‌ساعت ماهانه</>}{' '}
              توسط فروشنده طبق شرایط مندرج در قرارداد، به استناد پرونده شماره (شناسه قبض)
              <b> {_(data.subscription)}</b> خریدار نزد شرکت توزیع برق / برق منطقه‌ای استان <b>{_(data.province)}</b>.
            </Row>
            <Row n="۲">تأمین برق تجدیدپذیر مورد نیاز خریدار مطابق با «آیین‌نامه اجرایی ماده ۱۶ قانون جهش تولید دانش بنیان».</Row>
          </Art>

          <Art title="ماده ۲ – مدت و تاریخ شروع قرارداد">
            <Row n="۱">
              مدت قرارداد از تاریخ <b>{_(data.startDate)}</b> لغایت <b>{_(data.endDate)}</b> به مدت ۱۲ ماه شمسی بوده که این
              مدت با ارائه درخواست کتبی خریدار و در صورت توافق طرفین قابل تمدید است.
            </Row>
            <Row n="۲">قرارداد پس از امضاء طرفین و دریافت تأییدیه شرکت توزیع برق/ برق منطقه‌ای مربوطه از سوی فروشنده به خریدار جهت اجرا ابلاغ خواهد گردید.</Row>
          </Art>

          <Art title="ماده ۳ – مبلغ قرارداد، نرخ فروش برق و قدرت قراردادی">
            <Row n="۱">
              مبلغ اولیه قرارداد (موضوع بند ۱ ماده ۱) معادل <b>{_n(data.contractAmountRial)}</b> ریال می‌باشد. نرخ فروش برق
              به ازاء هر کیلووات‌ساعت برق مصرفی بار پایه برابر با <b>{_n(data.contractRate)}</b> ریال می‌باشد که این نرخ
              بابت تغییر در نقطه تحویل، تغییرات فصلی، ساعات میانباری و کمباری و اوج بار و سطح ولتاژ هیچگونه تغییری
              نخواهد داشت. صورتحساب‌های ماهانه از سوی فروشنده و براساس فرمول زیر صادر می‌گردد:
              <div style={{ textAlign: 'center', fontWeight: 700, margin: '6px 0', padding: '5px 8px', border: '1px solid #bbb', borderRadius: '3px', background: '#f8f8f8', fontSize: '11px' }}>
                قدرت خریداری‌شده ماهیانه موضوع بند ۲ ماده ۶ (kW) × تعداد ساعات دوره × نرخ = مبلغ صورتحساب دوره (ریال)
              </div>
            </Row>
            <Row n="۲">نرخ فروش برق تجدیدپذیر (بند ۲ ماده ۱) براساس توافقات صورت‌گرفته با خریدار در هر ماه تعیین و در محاسبات فاکتور ارسالی از سمت فروشنده اعمال خواهد شد.</Row>
            <Row n="۳">میزان قدرت درخواستی ماهانه (موضوع بند ۱ ماده ۱) می‌تواند از ................ تا .................. کیلووات در هر ساعت در نوسان باشد. افزایش سقف قدرت قراردادی منوط به توافق طرفین و بر اساس نرخ ارائه‌شده توسط فروشنده با تنظیم الحاقیه می‌باشد.</Row>
            <Row n="۴">
              چنانچه خریدار در مهلت مقرر نسبت به پرداخت وجه صورتحساب خود اقدام ننماید، مبلغ صورتحساب مطابق فرمول دیرکرد زیر تعدیل خواهد گردید:
              <div style={{ textAlign: 'center', fontWeight: 700, margin: '6px 0', padding: '5px 8px', border: '1px solid #bbb', borderRadius: '3px', background: '#f8f8f8', fontSize: '11px' }}>
                [(تعداد روزهای فاصله بین آخرین مهلت پرداخت صورتحساب تا تاریخ پرداخت صورتحساب) ÷ ۵۰۰ + ۱] = ضریب تعدیل (۶ درصد در ماه)
              </div>
            </Row>
            <Row n="۵">پرداخت مالیات بر ارزش افزوده مطابق با قانون بر عهده «خریدار» می‌باشد. فروشنده موظف است در سامانه مالیات بر ارزش افزوده ثبت‌نام کرده و گواهی مربوطه را دریافت نماید و در صورتحساب‌های ماهیانه، مالیات بر ارزش افزوده را به مبلغ صورتحساب افزوده و پس از دریافت از خریدار، به سازمان امور مالیاتی پرداخت نماید.</Row>
            <Row n="۶">کلیه پرداخت‌ها به فروشنده به شماره حساب 366-868-5078821-1 با شماره شبای <b>IR800590036676705078821001</b> نزد بانک سینا به نام شرکت توسعه انرژی متین تام صورت می‌پذیرد.</Row>
            <Row n="۷">نرخ و حجم فروش برق تجدیدپذیر (موضوع بند ۲ ماده ۱) براساس توافقات صورت‌گرفته با خریدار برای هر دوره مصرف، ۱۰ روز قبل از شروع دوره تعیین، و پس از ارسال صورتحساب از سمت فروشنده پرداخت می‌گردد. در صورت عدم توافق در خصوص نرخ فروش برق تجدیدپذیر، خریدار مجاز خواهد بود برق تجدیدپذیر خود را از منبع دیگری تأمین نماید.</Row>
          </Art>

          <Art title="ماده ۴ – تضامین">
            <p style={{ margin: '4px 0', textAlign: 'justify' }}>
              خریدار حداکثر تا یک هفته پس از امضا و مبادله قرارداد نسبت به ارائه <b>{warrantyLabel}</b> مورد درخواست
              فروشنده معادل ۲۰ درصد مبلغ اولیه قرارداد به میزان <b> {_n(data.warrantyAmount)}</b> ریال برای بند ۱ ماده ۳
              به عنوان تضمین پرداخت صورتحساب، اقدام خواهد نمود. فروشنده پس از پایان مدت قرارداد و یا خاتمه پیش از مدت
              آن به هر علت، پس از تسویه کامل بدهی از طرف خریدار، متعهد به استرداد تضامین بر اساس درخواست کتبی خریدار
              خواهد بود.
            </p>
          </Art>

          <Art title="ماده ۵ – تعهدات و مسئولیت فروشنده">
            <Row n="۱">فروشنده متعهد است اصل و همچنین تصویر صورتحساب برق مصرفی ماهیانه را به نشانی پستی و پست الکترونیکی اعلام‌شده توسط خریدار ارسال نماید.</Row>
            <Row n="۲">فروشنده موظف به تأمین انرژی مورد درخواست خریدار (موضوع بند ۱ ماده ۱) می‌باشد. این درخواست از سوی نماینده خریدار در قالب بسته‌های انرژی بار پایه حداکثر تا تاریخ ۲۸ هر ماه (دوره مصرف جاری) به صورت مکتوب به فروشنده اعلام می‌گردد. بدیهی است این میزان برق ماهیانه تأمین‌شده توسط فروشنده در قبوض صادره توسط شرکت توزیع برق/ برق منطقه‌ای لحاظ نخواهد گردید. در صورت عدم اعلام انرژی درخواستی تا تاریخ مزبور، انرژی تخصیص‌داده‌شده معادل ماه گذشته ملاک عمل قرار خواهد گرفت.</Row>
            <Row n="۳">در صورت عدم اعمال آن میزان از برق خریداری‌شده از فروشنده در صورتحساب‌های مالک شبکه، فروشنده موظف به همکاری با خریدار و انجام پیگیری‌های مربوطه در جهت اصلاح قبض صادره می‌باشد.</Row>
            <Row n="۴">در صورت درخواست خریدار، خدمات و همکاری لازم در زمینه خرید گواهی ظرفیت، دریافت کد بورسی، دریافت الحاقیه ویژه مشترکین بالای ۵ مگاوات، مشاوره در مورد چگونگی برآورد مصرف ماهیانه و همچنین کلیه محاسبات مربوط به صورتحساب از سوی فروشنده در ازای دریافت حق‌الزحمه به خریدار ارائه خواهد شد.</Row>
            <Row n="۵">فروشنده مکلف به ارائه بار پایه درخواستی خریدار تا سقف قدرت قراردادی (موضوع بند ۳ ماده ۳) بدون تغییر در نرخ توافقی قرارداد می‌باشد. پذیرش درخواست خریدار مبنی بر خرید انرژی مازاد بر سقف قدرت قراردادی منوط به توافق قیمتی با فروشنده است.</Row>
            <Row n="۶">کلیه مقررات و ضوابط مصوب وزارت نیرو از سوی فروشنده لازم‌الرعایه بوده و مسئولیت عدم رعایت آن‌ها به عهده فروشنده می‌باشد.</Row>
            <Row n="۷">فروشنده با امضای این قرارداد اقرار می‌نماید که توانایی لازم و کافی جهت اجرای تعهدات قانونی و قراردادی را تا پایان مدت قرارداد دارا بوده و با علم و آگاهی به شرایط و مفاد قرارداد، اقدام به امضای آن می‌نماید.</Row>
          </Art>

          <Art title="ماده ۶ – تعهدات و مسئولیت خریدار">
            <Row n="۱">خریدار متعهد می‌گردد میزان انرژی درخواستی ماهیانه خود (موضوع بند ۲ ماده ۵) را حداکثر تا تاریخ ۲۸ هر ماه به صورت مکتوب به فروشنده اعلام نماید. به عنوان مثال انرژی درخواستی جهت دوره مصرف آذرماه می‌بایست تا تاریخ ۲۸ آذر به فروشنده اعلام گردد. در صورت عدم اعلام انرژی درخواستی تا تاریخ مزبور، انرژی تخصیص‌داده‌شده معادل ماه قبل ملاک عمل قرار خواهد گرفت.</Row>
            <Row n="۲">با توجه به ویژگی انجام معاملات در بورس انرژی (پیش خرید بودن معاملات) خریدار متعهد می‌گردد میزان انرژی درخواستی تجدیدپذیر (موضوع بند ۲ ماده ۱) خود را، ۱۰ روز پیش از اتمام ماه قبل اعلام نماید تا امکان خرید برق تجدیدپذیر از بورس انرژی برای فروشنده میسر باشد. به عنوان مثال انرژی درخواستی تجدیدپذیر جهت دوره مصرف آذرماه، می‌بایست تا تاریخ ۳۰ آبان ماه به فروشنده اعلام گردد. عدم اعلام انرژی درخواستی تا تاریخ مزبور به معنی عدم درخواست خرید برق تجدیدپذیر می‌باشد.</Row>
            <Row n="۳">
              خریدار موظف به پرداخت صورتحساب‌های ماهانه صادرشده از سوی فروشنده (موضوع بند ۱ ماده ۳) ظرف مدت ۳۰ روز از اتمام دوره مصرف
              {data.paymentDeadline && <> (مهلت پرداخت: <b>{data.paymentDeadline}</b>)</>} می‌باشد.
            </Row>
            <Row n="۴">خریدار کماکان مشترک شرکت توزیع برق/ برق منطقه‌ای خواهد بود و کلیه درخواست‌های خود را که مرتبط با بخش سیم‌داری، انشعاب و نوع انشعاب می‌باشد از شرکت توزیع برق/ برق منطقه‌ای درخواست خواهد نمود. انجام اقداماتی نظیر خرید گواهی ظرفیت، دریافت الحاقیه نیابتی و دریافت کد بورسی مستقیماً توسط خریدار با شرکت توزیع برق/ برق منطقه‌ای انجام خواهد شد. فروشنده می‌تواند بنا به درخواست خریدار نسبت به انجام موارد فوق‌الذکر به نمایندگی از جانب خریدار و به هزینه خریدار اقدام نماید.</Row>
            <Row n="۵">پرداخت بهای ترانزیت مندرج در قبوض صادره از سوی شرکت توزیع برق/ برق منطقه‌ای بر عهده خریدار می‌باشد.</Row>
            <Row n="۶">خریدار موظف به پرداخت مبالغ درج‌شده در قبوض صادره از سوی شرکت توزیع برق/ برق منطقه‌ای (غیر از بهای برق تأمین‌شده توسط فروشنده) به شرکت توزیع برق/ برق منطقه‌ای می‌باشد.</Row>
            <Row n="۷">خریدار تصویر الحاقیه‌ای مربوط به شرکت توزیع برق/ برق منطقه‌ای که به امضا رسیده را جهت پیگیری اجرای قرارداد در اختیار فروشنده قرار خواهد داد.</Row>
            <Row n="۸">در صورتی که خریدار اقدام به خرید برق خود تا سقف قدرت قراردادی (موضوع بند ۱ ماده ۱) از منبع دیگری بجز شرکت توسعه انرژی متین نماید، آخرین صورتحساب با افزایش ۱۵٪ محاسبه خواهد شد و خریدار ملزم به پرداخت آن خواهد بود.</Row>
          </Art>

          <Art title="ماده ۷ – تعهدات مشترک طرفین">
            <Row n="۱">در زمان امضاء قرارداد، متوسط نرخ آمادگی ................... ریال به ازای هر کیلووات ساعت و سقف نرخ انرژی بازار عمده‌فروشی ................... ریال به ازای هر کیلووات ساعت و جمعاً برابر با ................... ریال به ازای هر کیلووات ساعت می‌باشد. در صورت هرگونه افزایش در نرخ خرید برق از نیروگاه‌ها توسط دولت، این تغییرات به نرخ مندرج در ماده ۳ این قرارداد اعمال می‌گردد.</Row>
            <Row n="۲">در زمان امضاء قرارداد هزینه سوخت نیروگاهی ۷۴۵ ریال به ازای هر کیلووات ساعت با احتساب قیمت سوخت ۲۷۰۰ ریال به ازای هر متر مکعب می‌باشد و در صورت تغییر در محاسبات هزینه سوخت در سقف قیمت انرژی، میزان تغییرات در نرخ قرارداد اعمال می‌گردد.</Row>
            <Row n="۳">طرفین متعهد می‌گردند حداکثر ظرف ۷ روز کاری پس از امضای قرارداد، نسبت به معرفی نمایندگان ذیربط خود همراه با آدرس ایمیل و شماره تماس جهت اجرای مفاد قرارداد اقدام نمایند.</Row>
            <Row n="۴">در صورتی که در صورتحساب ارسالی توسط فروشنده مغایرتی مشاهده شود، بعد از اعلام کتبی خریدار، فروشنده موظف است نسبت به بررسی و رفع مغایرت (در صورت لزوم) اقدام و نسبت به ارسال مجدد صورتحساب اقدام نماید.</Row>
            <Row n="۵">در صورت تغییرات عمده در ساختار قوانین عرضه و تقاضای برق براساس سیاست‌های اقتصادی دولت و ابلاغ وزارت نیرو، قرارداد مذکور براساس توافق طرفین اصلاح خواهد شد و در صورت عدم توافق طرفین، قرارداد خاتمه خواهد گردید.</Row>
          </Art>

          <Art title="ماده ۸ – حل اختلاف">
            <Row n="۱">در صورت بروز اختلاف که از طریق مذاکره حل نگردد، موضوع از طریق مراجع قضایی حل خواهد گردید.</Row>
            <Row n="۲">در طول رسیدگی به اختلافات، طرفین موظف به ادامه ایفاد تعهدات قراردادی خود خواهند بود.</Row>
          </Art>

          <Art title="ماده ۹ – خاتمه قرارداد">
            <p style={{ margin: '4px 0 6px', textAlign: 'justify' }}>وقوع هر یک از شرایط زیر، می‌تواند منجر به خاتمه پیمان گردد:</p>
            <Row n="۱">در صورتی که خریدار صورتحساب‌های صادرشده توسط فروشنده را در موعد مقرر پرداخت ننماید، فروشنده پس از یک اخطار ۲۵ روزه می‌تواند خاتمه قرارداد را ابلاغ و از محل ماده ۴ (تضمین) نسبت به برداشت مطالبات صورتحساب خود اقدام نماید.</Row>
            <Row n="۲">در صورت عدم تأمین انرژی توافق‌شده ماهیانه موضوع بند ۲ ماده ۵ قرارداد از سوی فروشنده، خریدار با یک اخطار ۲۰ روزه مجاز به خاتمه قرارداد خواهد بود.</Row>
            <Row n="۳">در صورت ورشکستگی و یا انحلال هر یک از طرفین.</Row>
            <Row n="۴">در صورت عدم ارائه تضامین موضوع ماده ۴ قرارداد حداکثر تا یک هفته پس از امضا و مبادله قرارداد از سوی خریدار.</Row>
            <Row n="۵">در صورت تحقق شرایط قوه قاهره.</Row>
            <p style={{ margin: '8px 0', textAlign: 'justify' }}>
              در صورت تحقق هر یک از موارد فوق و پس از اعلام خاتمه قرارداد توسط هر یک از طرفین، خریدار موظف به پرداخت فوری بهای انرژی خریداری‌شده تا زمان ابلاغ خاتمه قرارداد و سایر مطالبات فروشنده طبق مفاد قرارداد می‌باشد و در صورت عدم پرداخت، فروشنده می‌تواند چک مندرج در ماده ۴ خریدار را بدون نیاز به تشریفات قضایی و اداری به نفع خود وصول کند و پس از کسر مطالبات خود اعم از بهای قرارداد یا وجه التزام و سایر هزینه‌ها، مازاد آن را به خریدار عودت دهد. در صورتی که چک مذکور تکافوی جبران مطالبات فوق را ننماید، خریدار مکلف به پرداخت آن می‌باشد و فروشنده از سایر طرق قانونی حقوق خویش را استیفا خواهد نمود.
            </p>
            <p style={{ margin: '4px 0', textAlign: 'justify' }}>
              طرفین مراتب خاتمه قرارداد را به شرکت توزیع برق / برق منطقه‌ای و مدیریت شبکه اطلاع خواهند داد تا هیچ‌گونه خدشه‌ای در صورتحساب‌های برق مصرفی خریدار ایجاد نگردد.
            </p>
          </Art>

          <Art title="ماده ۱۰ – نشانی طرفین">
            <p style={{ margin: '2px 0' }}><b>خریدار: </b>{_(data.customerName)}</p>
            <p style={{ margin: '2px 0' }}><b>آدرس: </b>{_(data.address)} &nbsp; <b>کد پستی: </b>{_(data.postalCode)}</p>
            <p style={{ margin: '8px 0 2px' }}><b>فروشنده: </b>توسعه انرژی متین</p>
            <p style={{ margin: '2px 0' }}><b>آدرس: </b>تهران، خیابان ملاصدرا، ابتدای شیخ بهایی شمالی، کوچه سلمان، پلاک ۹ &nbsp; کد پستی: 1517883611</p>
            <p style={{ margin: '2px 0' }}><b>تلفن: </b>021-88211483 &nbsp; <b>نمابر: </b>021-88211485</p>
            <p style={{ margin: '8px 0 2px', textAlign: 'justify', fontSize: '10.5px', color: '#555' }}>
              نشانی طرفین قرارداد به‌شرح فوق است و در صورت تغییر نشانی هریک از طرفین می‌بایست حداکثر ظرف مدت ۴۸ ساعت کتباً به طرف مقابل اطلاع دهد و تا وقتی که نشانی جدید به طرف دیگر اعلام نشده، کلیه نامه‌ها، صورتحساب‌ها، اوراق و اظهارنامه‌ها به نشانی قبلی ارسال می‌شود و تمام آن‌ها دریافت‌شده تلقی می‌گردد.
            </p>
          </Art>

          <p style={{ margin: '12px 0', fontSize: '10.5px', color: '#555', textAlign: 'justify' }}>
            این قرارداد که در چهار صفحه و ده ماده و در دو نسخه تهیه گردیده و کلیه نسخ آن دارای اعتبار یکسان است.
          </p>

          {/* Signatures */}
          <div style={{ display: 'flex', gap: '24px', marginTop: '36px', pageBreakInside: 'avoid' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ fontWeight: 800, fontSize: '13px', margin: '0 0 3px' }}>فروشنده</p>
              <p style={{ fontWeight: 700, margin: '0 0 3px' }}>شرکت توسعه انرژی متین</p>
              <p style={{ margin: '2px 0' }}>جواد محمودی</p>
              <p style={{ margin: '1px 0', fontSize: '10px', color: '#555' }}>سمت: مدیر عامل</p>
              <div style={{ marginTop: '40px', borderTop: '1px solid #777', paddingTop: '5px', fontSize: '10px', color: '#777' }}>امضا:</div>
              <p style={{ margin: '14px 0 2px' }}>حمید زرگرپور</p>
              <p style={{ margin: '1px 0', fontSize: '10px', color: '#555' }}>سمت: رئیس هیئت مدیره</p>
              <div style={{ marginTop: '40px', borderTop: '1px solid #777', paddingTop: '5px', fontSize: '10px', color: '#777' }}>امضا:</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ fontWeight: 800, fontSize: '13px', margin: '0 0 3px' }}>خریدار</p>
              <p style={{ fontWeight: 700, margin: '0 0 3px' }}>{_(data.customerName)}</p>
              <p style={{ margin: '2px 0' }}>آقای {data.ceoFullName || '.....................'}</p>
              <p style={{ margin: '1px 0', fontSize: '10px', color: '#555' }}>سمت: مدیر عامل</p>
              <div style={{ marginTop: '40px', borderTop: '1px solid #777', paddingTop: '5px', fontSize: '10px', color: '#777' }}>امضا:</div>
              <p style={{ margin: '14px 0 2px' }}>آقای .............................</p>
              <p style={{ margin: '1px 0', fontSize: '10px', color: '#555' }}>سمت: رئیس هیئت مدیره</p>
              <div style={{ marginTop: '40px', borderTop: '1px solid #777', paddingTop: '5px', fontSize: '10px', color: '#777' }}>امضا:</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#bbb', borderTop: '1px solid #e5e5e5', paddingTop: '7px' }}>
            <span>تاریخ چاپ: {new Date().toLocaleDateString('fa-IR')}</span>
            <span>شرکت توسعه انرژی متین</span>
            <span>شماره قرارداد: {data.contractNumber}</span>
          </div>

        </div>
      </div>
    </>
  )
}

function Art({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <p style={{ fontWeight: 800, fontSize: '12px', margin: '0 0 5px', borderBottom: '1px solid #ddd', paddingBottom: '3px' }}>{title}</p>
      <div style={{ paddingRight: '6px' }}>{children}</div>
    </div>
  )
}

function Row({ n, children }: { n: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '6px', marginBottom: '3px', textAlign: 'justify' }}>
      <span style={{ fontWeight: 700, minWidth: '18px', flexShrink: 0 }}>{n}.</span>
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  )
}
