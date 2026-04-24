import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, User, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { customerApi } from '../../api/customer'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

type CustomerType = 'real' | 'legal'

const familiarityOptions = [
  { value: 0, label: '-- نحوه آشنایی --' },
  { value: 1, label: 'معرفی دوستان' },
  { value: 2, label: 'فضای مجازی' },
  { value: 3, label: 'تبلیغات' },
  { value: 4, label: 'سایر' },
]

export default function CustomerRegister() {
  const [type, setType] = useState<CustomerType | null>(null)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const [real, setReal] = useState({ firstName: '', lastName: '', nationalCode: '', mobile: '', familiarityType: 0 })
  const [legal, setLegal] = useState({ companyName: '', nationalId: '', economicCode: '', ceo_FullName: '', ceo_Mobile: '', familiarityType: 0 })

  const handleSubmitReal = async (e: FormEvent) => {
    e.preventDefault()
    if (!real.firstName || !real.lastName || !real.nationalCode || !real.mobile) {
      toast.error('لطفاً تمام فیلدهای اجباری را پر کنید')
      return
    }
    setSaving(true)
    try {
      const res = await customerApi.registerReal({ ...real, customerTypeId: 1 })
      if (res.code === 200) {
        setDone(true)
      } else {
        toast.error(res.message ?? res.caption ?? 'خطا در ثبت اطلاعات')
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  const handleSubmitLegal = async (e: FormEvent) => {
    e.preventDefault()
    if (!legal.companyName || !legal.nationalId || !legal.ceo_FullName) {
      toast.error('لطفاً تمام فیلدهای اجباری را پر کنید')
      return
    }
    setSaving(true)
    try {
      const res = await customerApi.registerLegal({ ...legal, customerTypeId: 2 })
      if (res.code === 200) {
        setDone(true)
      } else {
        toast.error(res.message ?? res.caption ?? 'خطا در ثبت اطلاعات')
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setSaving(false) }
  }

  if (done) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">پروفایل با موفقیت ثبت شد</h2>
        <p className="mt-2 text-sm text-gray-500">اطلاعات شما ذخیره شد. اکنون می‌توانید از امکانات سامانه استفاده کنید.</p>
        <Button className="mt-6" onClick={() => navigate('/customer/dashboard')}>
          رفتن به داشبورد
        </Button>
      </div>
    )
  }

  // Step 1: choose type
  if (!type) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">تکمیل پروفایل</h2>
          <p className="mt-2 text-sm text-gray-500">برای استفاده از سامانه، ابتدا نوع مشتری خود را انتخاب کنید</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button onClick={() => setType('real')}
            className="group flex flex-col items-center rounded-2xl border-2 border-gray-200 bg-white p-8 text-center transition-all hover:border-primary-400 hover:shadow-md">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <User className="h-7 w-7" />
            </div>
            <p className="text-lg font-bold text-gray-900">شخص حقیقی</p>
            <p className="mt-1 text-sm text-gray-500">ثبت‌نام به عنوان فرد</p>
          </button>
          <button onClick={() => setType('legal')}
            className="group flex flex-col items-center rounded-2xl border-2 border-gray-200 bg-white p-8 text-center transition-all hover:border-primary-400 hover:shadow-md">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Building2 className="h-7 w-7" />
            </div>
            <p className="text-lg font-bold text-gray-900">شخص حقوقی</p>
            <p className="mt-1 text-sm text-gray-500">ثبت‌نام به عنوان شرکت</p>
          </button>
        </div>
      </div>
    )
  }

  // Step 2: form
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => setType(null)} className="text-sm text-primary-600 hover:underline">
          ← تغییر نوع
        </button>
        <span className="text-gray-300">|</span>
        <div className="flex items-center gap-2">
          {type === 'real'
            ? <><User className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">شخص حقیقی</span></>
            : <><Building2 className="h-4 w-4 text-emerald-600" /><span className="text-sm font-medium">شخص حقوقی</span></>
          }
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {type === 'real' ? (
          <form onSubmit={handleSubmitReal} className="space-y-4">
            <h3 className="mb-4 text-base font-semibold text-gray-900">اطلاعات فردی</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="نام *" value={real.firstName} onChange={e => setReal(p => ({ ...p, firstName: e.target.value }))} placeholder="نام" />
              <Input label="نام خانوادگی *" value={real.lastName} onChange={e => setReal(p => ({ ...p, lastName: e.target.value }))} placeholder="نام خانوادگی" />
              <Input label="کد ملی *" value={real.nationalCode} onChange={e => setReal(p => ({ ...p, nationalCode: e.target.value }))} placeholder="۱۰ رقم" maxLength={10} inputMode="numeric" />
              <Input label="موبایل *" value={real.mobile} onChange={e => setReal(p => ({ ...p, mobile: e.target.value }))} placeholder="09xxxxxxxxx" maxLength={11} inputMode="numeric" />
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">نحوه آشنایی</label>
                <select value={real.familiarityType}
                  onChange={e => setReal(p => ({ ...p, familiarityType: +e.target.value }))}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  {familiarityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setType(null)}>انصراف</Button>
              <Button type="submit" loading={saving}>ثبت اطلاعات</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmitLegal} className="space-y-4">
            <h3 className="mb-4 text-base font-semibold text-gray-900">اطلاعات شرکت</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="نام شرکت *" value={legal.companyName} onChange={e => setLegal(p => ({ ...p, companyName: e.target.value }))} placeholder="نام کامل شرکت" />
              <Input label="شناسه ملی *" value={legal.nationalId} onChange={e => setLegal(p => ({ ...p, nationalId: e.target.value }))} placeholder="۱۱ رقم" maxLength={12} inputMode="numeric" />
              <Input label="کد اقتصادی" value={legal.economicCode} onChange={e => setLegal(p => ({ ...p, economicCode: e.target.value }))} placeholder="کد اقتصادی" />
              <Input label="نام مدیرعامل *" value={legal.ceo_FullName} onChange={e => setLegal(p => ({ ...p, ceo_FullName: e.target.value }))} placeholder="نام و نام خانوادگی" />
              <Input label="موبایل مدیرعامل" value={legal.ceo_Mobile} onChange={e => setLegal(p => ({ ...p, ceo_Mobile: e.target.value }))} placeholder="09xxxxxxxxx" maxLength={11} inputMode="numeric" />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">نحوه آشنایی</label>
                <select value={legal.familiarityType}
                  onChange={e => setLegal(p => ({ ...p, familiarityType: +e.target.value }))}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  {familiarityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setType(null)}>انصراف</Button>
              <Button type="submit" loading={saving}>ثبت اطلاعات</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
