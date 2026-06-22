import client from './client'
import type { ExecutionResult, LoginRequest, LoginResponse } from '../types'

export const authApi = {
  login: (data: LoginRequest) =>
    client.post<ExecutionResult<LoginResponse>>('/Auth/Login', data).then((r) => r.data),

  forgotSendOtp: (mobile: string) =>
    client.post<ExecutionResult<null>>('/ForgotPassword/SendOtp', { mobile }).then((r) => r.data),

  forgotVerifyOtp: (mobile: string, code: string) =>
    client.post<ExecutionResult<null>>('/ForgotPassword/VerifyOtp', { mobile, code }).then((r) => r.data),

  forgotResetPassword: (mobile: string, code: string, newPassword: string) =>
    client.post<ExecutionResult<null>>('/ForgotPassword/ResetPassword', { mobile, code, newPassword }).then((r) => r.data),
}
