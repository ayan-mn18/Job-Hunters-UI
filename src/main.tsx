import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './auth/AuthContext'
import { RedirectIfSignedIn, RequireAuth, RequireOnboarding } from './auth/guards'
import { Shell } from './components/Shell'
import { Landing } from './pages/Landing'
import { AuthPage } from './pages/AuthPage'
import { Onboarding } from './pages/Onboarding'
import { Den } from './pages/Den'
import { Hunt } from './pages/Hunt'
import { Applications } from './pages/Applications'
import { Referrals } from './pages/Referrals'
import { Kit } from './pages/Kit'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RedirectIfSignedIn>
        <Landing />
      </RedirectIfSignedIn>
    ),
  },
  {
    path: '/login',
    element: (
      <RedirectIfSignedIn>
        <AuthPage mode="login" />
      </RedirectIfSignedIn>
    ),
  },
  {
    path: '/signup',
    element: (
      <RedirectIfSignedIn>
        <AuthPage mode="signup" />
      </RedirectIfSignedIn>
    ),
  },
  {
    element: <RequireOnboarding />,
    children: [{ path: '/welcome', element: <Onboarding /> }],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/app',
        element: <Shell />,
        children: [
          { index: true, element: <Den /> },
          { path: 'hunt', element: <Hunt /> },
          { path: 'jobs', element: <Applications /> },
          { path: 'referrals', element: <Referrals /> },
          { path: 'profile', element: <Kit /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
