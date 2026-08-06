import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Mascot } from '../components/Mascot'
import { useAuth } from './context'

function Booting() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <Mascot mood="sleepy" size={110} />
      <p className="font-display font-semibold text-ink-soft">waking Hunty up…</p>
    </div>
  )
}

/** Signed in, and finished onboarding. Anything else gets redirected. */
export function RequireAuth() {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) return <Booting />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!user.onboarded) return <Navigate to="/welcome" replace />
  return <Outlet />
}

/** Signed in but still mid-setup. */
export function RequireOnboarding() {
  const { user, ready } = useAuth()

  if (!ready) return <Booting />
  if (!user) return <Navigate to="/signup" replace />
  if (user.onboarded) return <Navigate to="/app" replace />
  return <Outlet />
}

/** Landing / login / signup — bounce signed-in people straight into the app. */
export function RedirectIfSignedIn({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth()

  if (!ready) return <Booting />
  if (user) return <Navigate to={user.onboarded ? '/app' : '/welcome'} replace />
  return <>{children}</>
}
