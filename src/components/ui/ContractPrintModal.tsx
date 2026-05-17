import type { ReactNode } from 'react'
import { Printer, X, FileText, Calendar, Zap, Shield, MapPin, Hash } from 'lucide-react'

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
  startDate?: string | null
  endDate?: string | null
  contractRate?: number | null
  status?: string | null
  warrantyAmount?: number | null
  warrantyType?: string | null
  contractPowerKw?: number | null
  contractVolumeKwh?: number | null
  contractAmountRial?: number | null
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

  return (
    <>
      <style>{`
        @page { size: A4; margin: 16mm 12mm; }
        @media print {
          body * { visibility: hidden !important; }
          #cpm-root { display: block !important; visibility: visible !important; position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; background: white !important; }
          #cpm-root * { visibility: visible !important; }
          #print-border { position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; border: 1.5px solid #555 !important; pointer-events: none !important; }
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
          className="w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl"
          style={{ background: 'linear-gradient(150deg,#064e3b 0%,#065f46 55%,#047857 100%)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 pt-6 pb-5">
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
                      <p className="text-[10px] text-emerald-300/50">شناسه انشعاب</p>
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
                {data.contractAmountRial != null && (
                  <div className="flex items-start gap-2.5">
                    <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/60" />
                    <div>
                      <p className="text-[10px] text-emerald-300/50">مبلغ قرارداد</p>
                      <p className="mt-0.5 text-sm font-medium text-white">{data.contractAmountRial.toLocaleString('fa-IR')} ریال</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {(data.warrantyAmount || data.warrantyType) && (
              <div className="border-t p-5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">ضمانت‌نامه</p>
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(52,211,153,0.15)' }}>
                    <Shield className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div className="grid flex-1 grid-cols-2 gap-x-6">
                    {data.warrantyType && <div><p className="text-[10px] text-emerald-300/50">نوع ضمانت</p><p className="mt-0.5 text-sm font-medium text-white">{data.warrantyType}</p></div>}
                    {data.warrantyAmount ? <div><p className="text-[10px] text-emerald-300/50">مبلغ</p><p className="mt-0.5 text-sm font-medium text-white">{data.warrantyAmount.toLocaleString('fa-IR')} <span className="text-[10px] text-emerald-300">ریال</span></p></div> : null}
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
            <button onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.25)' }}>
              <Printer className="h-4 w-4" /> چاپ قرارداد
            </button>
          </div>
        </div>
      </div>

      {/* ── Print area ─────────────────────────────────────── */}
      <div id="cpm-root" style={{ display: 'none' }}>
        <div id="print-border" />
        <div style={{ fontFamily: "'Vazirmatn','Tahoma',sans-serif", direction: 'rtl', color: '#111', fontSize: '11.5px', lineHeight: '1.9' }}>

          {/* Cover header */}
          <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #111' }}>
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '13px' }}>بسمه تعالی</p>
            <h1 style={{ margin: '0 0 16px', fontSize: '22px', fontWeight: 900 }}>قرارداد فروش برق</h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span><b>خریدار: </b>{_(data.customerName)}</span>
              <span><b>شماره قرارداد: </b>{_(data.contractNumber)}</span>
            </div>
            <p style={{ margin: '8px 0 2px', fontWeight: 700, fontSize: '13px' }}>فروشنده: شرکت توسعه انرژی متین</p>
            <p style={{ margin: 0, fontSize: '10px', color: '#555' }}>MATIN Energy Development Company</p>
          </div>

          {/* Preamble */}
          <p style={{ textAlign: 'justify', margin: '0 0 14px' }}>
            این قرارداد فیمابین شرکت «<b>{_(data.customerName)}</b>» با شناسه ملی <b>{_(data.customerIdentifier)}</b> و شماره ثبت
            <b> {_(data.registerNumber)}</b> از اداره ثبت شرکت‌ها با نمایندگی <b>{_(data.ceoFullName)}</b> با کد ملی
            <b> {_(data.ceoNationalId)}</b> (با سمت مدیرعامل) که طبق آگهی منتشره در روزنامه رسمی مورخ
            <b> {_(data.gazetteDate)}</b> اختیار امضای این قرارداد را دارند به نشانی: <b>{_(data.address)}</b>، کد پستی
            <b> {_(data.postalCode)}</b> (دارنده شناسه قبض شماره <b>{_(data.subscription)}</b> با شرکت توزیع برق استان تهران
            که از این پس «خریدار» نامیده می‌شود) از یک طرف و شرکت توسعه انرژی متین به شناسه ملی <b>10103303952</b> شماره ثبت
            293423 از اداره ثبت شرکت‌های استان تهران دارای پروانه خرده‌فروشی برق به شماره 421-99-1526-2 مورخ 1403/10/01 با
            نمایندگی آقایان جواد محمودی به شماره ملی 2900111706 (مدیرعامل) و حمید زرگرپور به شماره ملی 1286493978 (رئیس هیات
            مدیره) که طبق آگهی منتشره در روزنامه رسمی مورخ 1402/06/08 اختیار امضای این قرارداد را دارند به نشانی: تهران،
            خیابان ملاصدرا، ابتدای شیخ بهایی شمالی، کوچه سلمان، پلاک ۹ که از این پس «فروشنده» نامیده می‌شود، از طرف دیگر
            منعقد می‌گردد.
          </p>

          <Art title="ماده ۱ – موضوع قرارداد">
            <Row n="۱">
              تأمین برق مصرفی خریدار به ظرفیت <b>{_n(powerKw)}</b> کیلووات
              {powerMw && <> (<b>{powerMw}</b> مگاوات)</>} بار پایه توسط فروشنده طبق شرایط مندرج در قرارداد، به استناد
              پرونده شماره .................... خریدار نزد شرکت توزیع برق استان تهران.
            </Row>
            <Row n="۲">تأمین برق تجدیدپذیر مورد نیاز خریدار مطابق با «آیین‌نامه اجرایی ماده ۱۶ قانون جهش تولید دانش بنیان».</Row>
          </Art>

          <Art title="ماده ۲ – مدت و تاریخ شروع قرارداد">
            <Row n="۱">
              مدت قرارداد از تاریخ <b>{_(data.startDate)}</b> لغایت <b>{_(data.endDate)}</b> به مدت ۱۲ ماه شمسی بوده که این
              مدت در صورت توافق طرفین قابل تمدید است.
            </Row>
            <Row n="۲">قرارداد پس از امضاء طرفین و دریافت تأییدیه شرکت مدیریت شبکه برق ایران و مالک شبکه از سوی فروشنده به خریدار جهت اجرا ابلاغ خواهد گردید.</Row>
          </Art>

          <Art title="ماده ۳ – مبلغ قرارداد، نرخ فروش برق و قدرت قراردادی">
            <Row n="۱">
              مبلغ اولیه قرارداد برای بند ۱ ماده ۱ معادل <b>{_n(data.contractAmountRial)}</b> ریال می‌باشد. نرخ فروش برق
              به ازاء هر کیلووات‌ساعت برق مصرفی بار پایه برابر با <b>{_n(data.contractRate)}</b> ریال می‌باشد که این نرخ
              بابت تغییر در نقطه تحویل، تغییرات فصلی، ساعات میانباری و کمباری و اوج بار و سطح ولتاژ هیچگونه تغییری
              نخواهد داشت. صورتحساب‌های ماهانه از سوی فروشنده براساس فرمول زیر صادر می‌گردد:
              <div style={{ textAlign: 'center', fontWeight: 700, margin: '6px 0', padding: '5px 8px', border: '1px solid #bbb', borderRadius: '3px', background: '#f8f8f8', fontSize: '11px' }}>
                مبلغ صورتحساب (ریال) = نرخ × تعداد ساعات دوره × قدرت خریداری‌شده ماهیانه (kW)
              </div>
            </Row>
            <Row n="۲">نرخ فروش برق تجدیدپذیر براساس توافقات صورت‌گرفته با خریدار در هر ماه تعیین و در محاسبات فاکتور ارسالی اعمال خواهد شد.</Row>
            <Row n="۳">میزان قدرت درخواستی ماهانه می‌تواند از ................ تا .................. کیلووات در هر ساعت در نوسان باشد. افزایش سقف قدرت منوط به توافق طرفین و تنظیم الحاقیه می‌باشد.</Row>
            <Row n="۴">
              چنانچه خریدار در مهلت مقرر نسبت به پرداخت وجه صورتحساب اقدام ننماید، مبلغ صورتحساب مطابق فرمول زیر تعدیل خواهد گردید:
              <div style={{ textAlign: 'center', fontWeight: 700, margin: '6px 0', padding: '5px 8px', border: '1px solid #bbb', borderRadius: '3px', background: '#f8f8f8', fontSize: '11px' }}>
                ضریب تعدیل = [۱ + (تعداد روزهای تأخیر ÷ ۵۰۰)]
              </div>
            </Row>
            <Row n="۵">پرداخت مالیات بر ارزش افزوده مطابق با قانون بر عهده «خریدار» می‌باشد. فروشنده موظف به ثبت در سامانه مالیاتی و دریافت گواهی مربوطه می‌باشد.</Row>
            <Row n="۶">کلیه پرداخت‌ها به فروشنده به حساب شماره 5078821-1-767 366 شبای <b>IR800590036676705078821001</b> نزد بانک سینا صورت می‌پذیرد.</Row>
          </Art>

          <Art title="ماده ۴ – تضامین">
            <p style={{ margin: '4px 0', textAlign: 'justify' }}>
              خریدار نسبت به ارائه یک فقره چک مورد درخواست فروشنده معادل ۲۰ درصد مبلغ اولیه به میزان
              <b> {_n(data.warrantyAmount)}</b> ریال به عنوان تضمین پرداخت صورتحساب اقدام خواهد نمود. فروشنده پس از پایان
              مدت قرارداد و تسویه کامل بدهی، متعهد به استرداد تضامین براساس درخواست کتبی خریدار خواهد بود.
            </p>
          </Art>

          <Art title="ماده ۵ – تعهدات و مسئولیت فروشنده">
            <Row n="۱">فروشنده متعهد است اصل و تصویر صورتحساب برق مصرفی ماهیانه را به نشانی پستی و الکترونیکی اعلام‌شده توسط خریدار ارسال نماید.</Row>
            <Row n="۲">فروشنده موظف به تأمین انرژی مورد درخواست خریدار در قالب بسته‌های انرژی بار پایه حداکثر تا تاریخ ۲۸ هر ماه می‌باشد.</Row>
            <Row n="۳">در صورت عدم اعمال برق خریداری‌شده در صورتحساب‌های مالک شبکه، فروشنده موظف به پیگیری و اصلاح قبض صادره می‌باشد.</Row>
            <Row n="۴">در صورت درخواست خریدار، فروشنده خدماتی نظیر خرید گواهی ظرفیت، دریافت کد بورسی و مشاوره برآورد مصرف ارائه خواهد داد.</Row>
            <Row n="۵">فروشنده مکلف به ارائه بار درخواستی خریدار تا سقف قدرت قراردادی بدون تغییر در نرخ توافقی می‌باشد.</Row>
            <Row n="۶">کلیه مقررات مصوب وزارت نیرو از سوی فروشنده لازم‌الرعایه بوده و مسئولیت عدم رعایت آن‌ها به عهده فروشنده است.</Row>
            <Row n="۷">فروشنده با امضای این قرارداد اقرار می‌نماید توانایی لازم جهت اجرای تعهدات قانونی و قراردادی را تا پایان مدت قرارداد دارا بوده است.</Row>
          </Art>

          <Art title="ماده ۶ – تعهدات و مسئولیت خریدار">
            <Row n="۱">خریدار متعهد می‌گردد میزان انرژی درخواستی ماهیانه را حداکثر تا ۲۸ هر ماه به صورت مکتوب به فروشنده اعلام نماید.</Row>
            <Row n="۲">خریدار متعهد می‌گردد انرژی درخواستی تجدیدپذیر را ۱۰ روز پیش از اتمام ماه اعلام نماید تا خرید از بورس انرژی میسر باشد.</Row>
            <Row n="۳">خریدار موظف به پرداخت صورتحساب‌های ماهانه ظرف مدت ۳۰ روز از اتمام دوره مصرف می‌باشد.</Row>
            <Row n="۴">خریدار کماکان مشترک مالک شبکه خواهد بود و درخواست‌های سیم‌داری، انشعاب و نوع انشعاب را از مالک شبکه درخواست خواهد نمود.</Row>
            <Row n="۵">پرداخت بهای ترانزیت مندرج در قبوض مالک شبکه بر عهده خریدار می‌باشد.</Row>
            <Row n="۶">خریدار موظف به پرداخت مبالغ قبوض مالک شبکه (غیر از بهای برق تأمین‌شده توسط فروشنده) به مالک شبکه می‌باشد.</Row>
            <Row n="۷">خریدار تصویر الحاقیه قراردادهای بورس انرژی و دوجانبه را در اختیار فروشنده قرار خواهد داد.</Row>
            <Row n="۸">در صورت عدم رعایت موارد ماده ۲ توسط خریدار، آخرین صورتحساب با افزایش ۱۵٪ محاسبه خواهد شد.</Row>
          </Art>

          <Art title="ماده ۷ – تعهدات مشترک طرفین">
            <Row n="۱">در صورت افزایش نرخ خرید برق از نیروگاه‌ها توسط دولت، موضوع تعدیل نرخ توسط طرفین بررسی و توافق خواهد شد و عدم توافق به منزله فسخ قرارداد می‌باشد.</Row>
            <Row n="۲">در زمان امضاء قرارداد هزینه سوخت نیروگاهی ۷۴۵ ریال به ازای هر kWh با احتساب قیمت سوخت (۲۷۰۰ ریال/مترمکعب) می‌باشد.</Row>
            <Row n="۳">طرفین متعهد می‌گردند حداکثر ظرف ۷ روز کاری پس از امضا، نمایندگان ذیربط خود را با آدرس ایمیل و شماره تماس معرفی نمایند.</Row>
            <Row n="۴">در صورت مغایرت صورتحساب، فروشنده موظف به بررسی و رفع مغایرت پس از اعلام کتبی خریدار می‌باشد.</Row>
            <Row n="۵">در صورت تغییرات عمده در ساختار قوانین برق، قرارداد براساس توافق اصلاح و در صورت عدم توافق فسخ خواهد گردید.</Row>
          </Art>

          <Art title="ماده ۸ – حل اختلاف">
            <Row n="۱">در صورت بروز اختلاف که از طریق مذاکره حل نگردد، موضوع از طریق مراجع قضایی حل خواهد گردید.</Row>
            <Row n="۲">در طول رسیدگی به اختلافات، طرفین موظف به ادامه ایفاد تعهدات قراردادی خود خواهند بود.</Row>
          </Art>

          <Art title="ماده ۹ – فسخ قرارداد">
            <Row n="۱">در صورت عدم پرداخت صورتحساب در موعد مقرر، فروشنده با یک اخطار ۲۵ روزه می‌تواند از محل ماده ۴ نسبت به برداشت مطالبات اقدام نماید.</Row>
            <Row n="۲">در صورت عدم تأمین انرژی توافق‌شده، خریدار با یک اخطار ۲۰ روزه مجاز به فسخ قرارداد خواهد بود.</Row>
            <Row n="۳">در صورت ورشکستگی یا انحلال هر یک از طرفین.</Row>
            <Row n="۴">در صورت عدم ارائه تضامین موضوع ماده ۴ حداکثر تا یک هفته پس از امضا و مبادله قرارداد.</Row>
            <Row n="۵">در صورت تحقق شرایط قوه قاهره.</Row>
            <Row n="۶">پس از اعلام فسخ، خریدار موظف به پرداخت فوری بهای انرژی خریداری‌شده تا زمان ابلاغ فسخ و سایر مطالبات فروشنده می‌باشد.</Row>
            <Row n="۷">طرفین مراتب فسخ یا خاتمه را به مالک شبکه و مدیریت شبکه اطلاع خواهند داد.</Row>
          </Art>

          <Art title="ماده ۱۰ – نشانی طرفین">
            <p style={{ margin: '2px 0' }}><b>خریدار: </b>{_(data.customerName)}</p>
            <p style={{ margin: '2px 0' }}><b>آدرس: </b>{_(data.address)} &nbsp; <b>کد پستی: </b>{_(data.postalCode)}</p>
            <p style={{ margin: '8px 0 2px' }}><b>فروشنده: </b>توسعه انرژی متین</p>
            <p style={{ margin: '2px 0' }}><b>آدرس: </b>تهران، خیابان ملاصدرا، ابتدای شیخ بهایی شمالی، کوچه سلمان، پلاک ۹ &nbsp; کد پستی: 1517883611</p>
            <p style={{ margin: '2px 0' }}><b>تلفن: </b>021-88211483 &nbsp; <b>نمابر: </b>021-88211485</p>
          </Art>

          <p style={{ margin: '12px 0', fontSize: '10.5px', color: '#555', textAlign: 'justify' }}>
            این قرارداد که در چهار صفحه و ده ماده و در دو نسخه تهیه گردیده و کلیه نسخ آن دارای اعتبار یکسان است.
          </p>

          {/* Signatures */}
          <div style={{ display: 'flex', gap: '24px', marginTop: '36px' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ fontWeight: 800, fontSize: '13px', margin: '0 0 3px' }}>فروشنده</p>
              <p style={{ fontWeight: 700, margin: '0 0 3px' }}>شرکت توسعه انرژی متین</p>
              <p style={{ margin: '2px 0' }}>جواد محمودی</p>
              <p style={{ margin: '1px 0', fontSize: '10px', color: '#555' }}>سمت: مدیرعامل</p>
              <div style={{ marginTop: '40px', borderTop: '1px solid #777', paddingTop: '5px', fontSize: '10px', color: '#777' }}>امضا و مهر</div>
              <p style={{ margin: '14px 0 2px' }}>حمید زرگرپور</p>
              <p style={{ margin: '1px 0', fontSize: '10px', color: '#555' }}>سمت: رئیس هیات مدیره</p>
              <div style={{ marginTop: '40px', borderTop: '1px solid #777', paddingTop: '5px', fontSize: '10px', color: '#777' }}>امضا و مهر</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ fontWeight: 800, fontSize: '13px', margin: '0 0 3px' }}>خریدار</p>
              <p style={{ fontWeight: 700, margin: '0 0 3px' }}>{_(data.customerName)}</p>
              <p style={{ margin: '2px 0', color: '#888' }}>{_(data.ceoFullName)}</p>
              <p style={{ margin: '1px 0', fontSize: '10px', color: '#555' }}>سمت: مدیرعامل</p>
              <div style={{ marginTop: '40px', borderTop: '1px solid #777', paddingTop: '5px', fontSize: '10px', color: '#777' }}>امضا و مهر</div>
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
