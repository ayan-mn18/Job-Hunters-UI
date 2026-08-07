import { createContext, useContext } from 'react'
import type { KitDraft, User } from '../lib/types'

export type { KitDraft, User }

export type AuthValue = {
  user: User | null
  ready: boolean
  signIn: (email: string, password: string) => Promise<User>
  signUp: (name: string, email: string, password: string) => Promise<User>
  completeOnboarding: (kit: Partial<KitDraft>) => Promise<void>
  signOut: () => void
}

export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
