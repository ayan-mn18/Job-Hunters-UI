import { createContext, useContext } from 'react'

export type KitDraft = {
  roles: string
  locations: string
  companies: string
  dailyTarget: number
  portals: string[]
  phone: string
  city: string
  noticePeriod: string
  resumeName: string
}

export type User = {
  name: string
  email: string
  avatar: string
  onboarded: boolean
  kit: Partial<KitDraft>
  joinedAt: string
}

export type AuthValue = {
  user: User | null
  ready: boolean
  signIn: (email: string, password: string) => Promise<User>
  signUp: (name: string, email: string, password: string) => Promise<User>
  completeOnboarding: (kit: Partial<KitDraft>) => void
  signOut: () => void
  resetDemo: () => void
}

export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
