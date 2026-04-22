import client from './client'
import type { ExecutionResult, LoginRequest, LoginResponse } from '../types'

export const authApi = {
  login: (data: LoginRequest) =>
    client.post<ExecutionResult<LoginResponse>>('/User/Login', data).then((r) => r.data),
}
