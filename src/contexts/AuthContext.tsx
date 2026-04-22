import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { LoginResponse } from '../types'

interface AuthUser {
  token: string
  role: 'admin' | 'customer'
  fullName: string
}

interface AuthContextValue {
  user: AuthUser | null
  login: (data: LoginResponse) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', user.token)
    } else {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
  }, [user])

  const login = (data: LoginResponse) => {
    setUser({ token: data.token, role: data.role, fullName: data.fullName })
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
