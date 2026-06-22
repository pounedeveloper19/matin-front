import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bolt, Eye, EyeOff, ArrowRight, KeyRound, ShieldCheck, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

type ForgotStep = 'mobile' | 'otp' | 'password'

export default function Login() {
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false)
  const [forgotStep, setForgotStep] = useState<ForgotStep>('mobile')
  const [forgotMobile, setForgotMobile] = useState('')
  const [forgotCode, setForgotCode] = useState('')
  const [forgotNewPass, setForgotNewPass] = useState('')
  const [forgotNewPass2, setForgotNewPass2] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!mobile || !password) {
      toast.error('لطفاً تمام فیلدها را پر کنید')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.login({ mobile, password })
      if (res.code === 200 && res.result) {
        login(res.result)
        const role = res.result.role
        navigate(role === 'admin' ? '/admin/dashboard' : '/customer/dashboard', { replace: true })
        toast.success(`خوش آمدید، ${res.result.fullName}`)
      } else {
        toast.error(res.message ?? res.caption ?? 'خطا در ورود به سیستم')
      }
    } catch {
      toast.error('اطلاعات وارد شده صحیح نمی‌باشد')
    } finally {
      setLoading(false)
    }
  }

  const openForgot = () => {
    setForgotMobile('')
    setForgotCode('')
    setForgotNewPass('')
    setForgotNewPass2('')
    setForgotStep('mobile')
    setShowForgot(true)
  }

  const handleForgotSendOtp = async (e: FormEvent) => {
    e.preventDefault()
    if (!forgotMobile) { toast.error('شماره موبایل را وارد کنید'); return }
    setForgotLoading(true)
    try {
      const res = await authApi.forgotSendOtp(forgotMobile)
      if (res.code === 200) {
        toast.success(res.message ?? 'کد تأیید ارسال شد')
        setForgotStep('otp')
      } else {
        toast.error(res.message ?? res.caption ?? 'خطا در ارسال کد')
      }
    } catch {
      toast.error('خطا در ارسال کد')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleForgotVerifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    if (!forgotCode) { toast.error('کد تأیید را وارد کنید'); return }
    setForgotLoading(true)
    try {
      const res = await authApi.forgotVerifyOtp(forgotMobile, forgotCode)
      if (res.code === 200) {
        setForgotStep('password')
      } else {
        toast.error(res.message ?? res.caption ?? 'کد نادرست است')
      }
    } catch {
      toast.error('خطا در تأیید کد')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleForgotReset = async (e: FormEvent) => {
    e.preventDefault()
    if (!forgotNewPass) { toast.error('رمز عبور جدید را وارد کنید'); return }
    if (forgotNewPass !== forgotNewPass2) { toast.error('رمز عبور و تکرار آن یکسان نیستند'); return }
    setForgotLoading(true)
    try {
      const res = await authApi.forgotResetPassword(forgotMobile, forgotCode, forgotNewPass)
      if (res.code === 200) {
        toast.success('رمز عبور با موفقیت تغییر یافت')
        setShowForgot(false)
      } else {
        toast.error(res.message ?? res.caption ?? 'خطا در تغییر رمز عبور')
      }
    } catch {
      toast.error('خطا در تغییر رمز عبور')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-primary-900 p-4">
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
      />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500 shadow-lg shadow-primary-500/30">
            <Bolt className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">برق متین</h1>
            <p className="mt-1 text-sm text-gray-400">سامانه مدیریت برق آزاد</p>
          </div>
        </div>

        {/* Form card */}
        {!showForgot ? (
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">ورود به سیستم</h2>
              <p className="mt-1 text-sm text-gray-500">لطفاً اطلاعات خود را وارد کنید</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="شماره موبایل"
                type="tel"
                placeholder="09xxxxxxxxx"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                maxLength={11}
                autoComplete="username"
                inputMode="numeric"
              />

              <div className="relative">
                <Input
                  label="رمز عبور"
                  type={showPass ? 'text' : 'password'}
                  placeholder="رمز عبور خود را وارد کنید"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pl-10"
                  maxLength={15}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute bottom-2.5 left-3 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={openForgot}
                  className="text-sm text-primary-600 hover:underline"
                >
                  فراموشی رمز عبور؟
                </button>
              </div>

              <Button type="submit" loading={loading} className="mt-2 w-full" size="lg">
                ورود
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              حساب کاربری ندارید؟{' '}
              <button onClick={() => navigate('/register')} className="font-medium text-primary-600 hover:underline">
                ثبت‌نام کنید
              </button>
            </p>

            <p className="mt-4 text-center text-xs text-gray-400">
              نسخه ۱.۰ · متین تام
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => forgotStep === 'mobile' ? setShowForgot(false) : setForgotStep(forgotStep === 'otp' ? 'mobile' : 'otp')}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">بازیابی رمز عبور</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  {forgotStep === 'mobile' && 'شماره موبایل خود را وارد کنید'}
                  {forgotStep === 'otp' && 'کد تأیید ارسال‌شده را وارد کنید'}
                  {forgotStep === 'password' && 'رمز عبور جدید را تعیین کنید'}
                </p>
              </div>
            </div>

            {/* Step indicators */}
            <div className="mb-6 flex items-center gap-2">
              {(['mobile', 'otp', 'password'] as ForgotStep[]).map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    forgotStep === step ? 'bg-primary-600 text-white' :
                    (['mobile', 'otp', 'password'].indexOf(forgotStep) > i) ? 'bg-green-500 text-white' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {(['mobile', 'otp', 'password'].indexOf(forgotStep) > i) ? '✓' : i + 1}
                  </div>
                  {i < 2 && <div className={`h-0.5 w-8 rounded ${(['mobile', 'otp', 'password'].indexOf(forgotStep) > i) ? 'bg-green-400' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            {/* Step 1: Username */}
            {forgotStep === 'mobile' && (
              <form onSubmit={handleForgotSendOtp} className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
                  <ShieldCheck className="h-5 w-5 shrink-0" />
                  <span>کد تأیید به شماره مدیرعامل ارسال می‌شود.</span>
                </div>
                <Input
                  label="نام کاربری"
                  type="text"
                  placeholder="نام کاربری خود را وارد کنید"
                  value={forgotMobile}
                  onChange={(e) => setForgotMobile(e.target.value)}
                  autoFocus
                />
                <Button type="submit" loading={forgotLoading} className="w-full" size="lg">
                  ارسال کد تأیید
                </Button>
              </form>
            )}

            {/* Step 2: OTP */}
            {forgotStep === 'otp' && (
              <form onSubmit={handleForgotVerifyOtp} className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
                  <KeyRound className="h-5 w-5 shrink-0" />
                  <span>کد ۶ رقمی ارسال‌شده را وارد کنید. اعتبار کد ۵ دقیقه است.</span>
                </div>
                <Input
                  label="کد تأیید"
                  type="text"
                  placeholder="کد ۶ رقمی"
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                />
                <Button type="submit" loading={forgotLoading} className="w-full" size="lg">
                  تأیید کد
                </Button>
                <button
                  type="button"
                  onClick={() => setForgotStep('mobile')}
                  className="w-full text-center text-sm text-gray-500 hover:text-primary-600"
                >
                  دریافت مجدد کد
                </button>
              </form>
            )}

            {/* Step 3: New password */}
            {forgotStep === 'password' && (
              <form onSubmit={handleForgotReset} className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-green-50 p-3 text-sm text-green-700">
                  <Lock className="h-5 w-5 shrink-0" />
                  <span>رمز عبور جدید خود را وارد کنید.</span>
                </div>
                <Input
                  label="رمز عبور جدید"
                  type="password"
                  placeholder="۴ تا ۱۵ کاراکتر"
                  value={forgotNewPass}
                  onChange={(e) => setForgotNewPass(e.target.value)}
                  maxLength={15}
                  autoFocus
                />
                <Input
                  label="تکرار رمز عبور"
                  type="password"
                  placeholder="رمز عبور را مجدداً وارد کنید"
                  value={forgotNewPass2}
                  onChange={(e) => setForgotNewPass2(e.target.value)}
                  maxLength={15}
                />
                <Button type="submit" loading={forgotLoading} className="w-full" size="lg">
                  تغییر رمز عبور
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
