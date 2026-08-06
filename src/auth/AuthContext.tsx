import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type KitDraft, type User } from './context'

/**
 * Demo auth. There is no server yet — any email + password gets you in.
 * The session lives in localStorage so a refresh keeps you signed in and
 * the first-run onboarding only fires once per account.
 */

const STORAGE_KEY = 'jobhunters.demo.user'

const avatars = ['🧑‍🚀', '🦝', '🐼', '🦊', '🐙', '🦉', '🐝', '🦄']

function avatarFor(email: string) {
  const sum = [...email].reduce((n, c) => n + c.charCodeAt(0), 0)
  return avatars[sum % avatars.length]
}

function nameFromEmail(email: string) {
  const handle = email.split('@')[0].replace(/[._-]+/g, ' ').trim()
  return (
    handle
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(' ') || 'Hunter'
  )
}

function load(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function save(user: User | null) {
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  else localStorage.removeItem(STORAGE_KEY)
}

/** Pretend the network is doing something, so the buttons get to show a state. */
const fakeDelay = (ms = 700) => new Promise((r) => setTimeout(r, ms))

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setUser(load())
    setReady(true)
  }, [])

  const signIn = useCallback(async (email: string, _password: string) => {
    await fakeDelay()
    // A returning account keeps its onboarding; anything else is treated as known.
    const existing = load()
    const next: User =
      existing && existing.email.toLowerCase() === email.toLowerCase()
        ? existing
        : {
            name: nameFromEmail(email),
            email,
            avatar: avatarFor(email),
            onboarded: true,
            kit: {},
            joinedAt: new Date().toISOString(),
          }
    save(next)
    setUser(next)
    return next
  }, [])

  const signUp = useCallback(async (name: string, email: string, _password: string) => {
    await fakeDelay(900)
    const next: User = {
      name: name.trim() || nameFromEmail(email),
      email,
      avatar: avatarFor(email),
      onboarded: false,
      kit: {},
      joinedAt: new Date().toISOString(),
    }
    save(next)
    setUser(next)
    return next
  }, [])

  const completeOnboarding = useCallback((kit: Partial<KitDraft>) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, onboarded: true, kit: { ...prev.kit, ...kit } }
      save(next)
      return next
    })
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
    save(null)
  }, [])

  const resetDemo = useCallback(() => {
    localStorage.clear()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, ready, signIn, signUp, completeOnboarding, signOut, resetDemo }),
    [user, ready, signIn, signUp, completeOnboarding, signOut, resetDemo],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
