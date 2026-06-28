import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Attach JWT token + disable browser caching for all API calls
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['Cache-Control'] = 'no-cache'
  config.headers['Pragma'] = 'no-cache'
  return config
})

// Normalize all responses to ExecutionResult shape so page-level error handling
// always goes through the same `if (r.code === 200)` path instead of two separate paths.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 → redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // If server returned a body that looks like ExecutionResult, resolve with it
    // so that `toast.error(r.message ?? r.caption)` in the caller works correctly.
    const data = error.response?.data
    if (data && (data.type !== undefined || data.code !== undefined || data.caption !== undefined)) {
      return Promise.resolve({ ...error.response, data })
    }

    // Network error or server returned no body — reject with a synthetic ExecutionResult
    const status = error.response?.status
    const synthetic = {
      type: 'Danger',
      code: status ?? 0,
      caption: 'خطا در ارتباط با سرور',
      message: status
        ? `سرور با کد ${status} پاسخ داد. لطفاً دوباره تلاش کنید.`
        : 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.',
      result: null,
    }
    return Promise.resolve({ data: synthetic })
  }
)

export default client
