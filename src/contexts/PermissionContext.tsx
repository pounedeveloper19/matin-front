import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { lookupApi } from '../api/lookup'
import { useAuth } from './AuthContext'

interface PermissionCtx {
  permittedIds:  Set<number>
  permittedKeys: Set<string>
  /** آیا دسترسی به یه SiteMap ID خاص داره */
  hasId:  (id: number)  => boolean
  /** آیا دسترسی به یه ControlKey خاص داره (مثلا 'AdminUserManagement') */
  hasKey: (key: string) => boolean
  loading: boolean
}

const Ctx = createContext<PermissionCtx>({
  permittedIds:  new Set(),
  permittedKeys: new Set(),
  hasId:  () => true,
  hasKey: () => true,
  loading: true,
})

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [permittedIds,  setPermittedIds]  = useState<Set<number>>(new Set())
  const [permittedKeys, setPermittedKeys] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }

    lookupApi.getMyPermissions()
      .then(r => {
        const items = Array.isArray(r.result) ? r.result : (r.result as any)?.$values ?? []
        const ids  = new Set<number>(items.map((i: any) => i.siteMapId as number))
        const keys = new Set<string>(items.filter((i: any) => i.controlKey).map((i: any) => i.controlKey as string))
        setPermittedIds(ids)
        setPermittedKeys(keys)
      })
      .catch(() => { /* در صورت خطا همه دسترسی‌ها باز می‌مونه */ })
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  return (
    <Ctx.Provider value={{
      permittedIds,
      permittedKeys,
      hasId:  (id)  => permittedIds.size  === 0 || permittedIds.has(id),
      hasKey: (key) => permittedKeys.size === 0 || permittedKeys.has(key),
      loading,
    }}>
      {children}
    </Ctx.Provider>
  )
}

/** هوک استفاده از دسترسی‌های درون‌فرمی */
export function usePermissions() {
  return useContext(Ctx)
}
