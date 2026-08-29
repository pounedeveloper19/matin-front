import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { LoginResponse } from '../types'
import { lookupApi } from '../api/lookup'

interface AuthUser {
  token: string
  role: 'admin' | 'customer'
  roleTitle: string | null
  roleId: number | null
  fullName: string
}

interface AuthContextValue {
  user: AuthUser | null
  login: (data: LoginResponse) => void
  logout: () => void
  isAuthenticated: boolean
  hasPermission: (controlKey: string) => boolean
  permissionsLoaded: boolean
  isAdminRole: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadCachedPermissions(): Set<string> {
  try {
    const raw = localStorage.getItem('permissions')
    return raw ? new Set<string>(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  const [permissions, setPermissions] = useState<Set<string>>(loadCachedPermissions)
  const [permissionsLoaded, setPermissionsLoaded] = useState(() => !!localStorage.getItem('permissions'))

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', user.token)

      lookupApi.getMyPermissions()
        .then(r => {
          if (r.code === 200 && Array.isArray(r.result)) {
            const keys = new Set<string>(r.result)
            setPermissions(keys)
            localStorage.setItem('permissions', JSON.stringify([...keys]))
          }
        })
        .catch(() => {})
        .finally(() => setPermissionsLoaded(true))
    } else {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('permissions')
      setPermissions(new Set())
      setPermissionsLoaded(false)
    }
  }, [user])

  const login = (data: LoginResponse) => {
    setUser({ token: data.token, role: data.role, roleTitle: data.roleTitle, roleId: data.roleId, fullName: data.fullName })
  }

  const logout = () => setUser(null)

  // سوپر ادمین: همه ControlKey ها از سرور می‌آید → permissions.has همیشه true
  // ادمین با نقش: فقط ControlKey های مجاز در permissions
  const hasPermission = useCallback((controlKey: string): boolean => {
    if (!user) return false
    return permissions.has(controlKey)
  }, [user, permissions])

  // نقش «ادمین» = RoleId 5 در جدول Role (طبق تایید مستقیم روی دیتابیس)
  const isAdminRole = user?.roleId === 5

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, hasPermission, permissionsLoaded, isAdminRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function usePermission(controlKey: string): boolean {
  return useAuth().hasPermission(controlKey)
}
