import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bolt, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Login() {
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

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
        toast.error(res.caption ?? 'خطا در ورود به سیستم')
      }
    } catch {
      toast.error('اطلاعات وارد شده صحیح نمی‌باشد')
    } finally {
      setLoading(false)
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
            <h1 className="text-2xl font-bold text-white">متین پاور</h1>
            <p className="mt-1 text-sm text-gray-400">سامانه مدیریت برق آزاد</p>
          </div>
        </div>

        {/* Form card */}
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
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute bottom-2.5 left-3 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
      </div>
    </div>
  )
}
