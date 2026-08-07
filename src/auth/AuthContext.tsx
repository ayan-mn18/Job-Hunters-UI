import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  api,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  SESSION_EXPIRED_EVENT,
  storeTokens,
} from '../lib/api'
import type { AuthSession } from '../lib/types'
import { AuthContext, type KitDraft, type User } from './context'

/**
 * Real auth against Job-Hunters-api.
 *
 * Tokens live in localStorage (see `lib/api.ts`). On boot, a stored access
 * token is validated with `GET /me` — which also quietly refreshes it via the
 * client's 401 → /auth/refresh path — and the returned user becomes the
 * session. No token, no request: straight to the landing page.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function boot() {
      if (!getAccessToken()) {
        setReady(true)
        return
      }
      try {
        const { data } = await api.get<User>('/me')
        if (!cancelled) setUser(data)
      } catch {
        // The refresh attempt already ran inside the client. Still failed —
        // so the session is gone and the guards will route to /login.
        clearTokens()
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    void boot()

    const onExpired = () => setUser(null)
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => {
      cancelled = true
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
    }
  }, [])

  const applySession = useCallback((session: AuthSession): User => {
    storeTokens(session)
    setUser(session.user)
    return session.user
  }, [])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<AuthSession>('/auth/login', { email, password })
      return applySession(data)
    },
    [applySession],
  )

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const { data } = await api.post<AuthSession>('/auth/signup', { name, email, password })
      return applySession(data)
    },
    [applySession],
  )

  const completeOnboarding = useCallback(async (kit: Partial<KitDraft>) => {
    const { data } = await api.post<User>('/me/onboarding', kit)
    setUser(data)
  }, [])

  const signOut = useCallback(() => {
    // Best effort: even if the request fails, this device forgets everything.
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      void api.post('/auth/logout', { refreshToken }).catch(() => undefined)
    }
    clearTokens()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, ready, signIn, signUp, completeOnboarding, signOut }),
    [user, ready, signIn, signUp, completeOnboarding, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
