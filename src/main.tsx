import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { Shell } from './components/Shell'
import { Den } from './pages/Den'
import { Hunt } from './pages/Hunt'
import { Applications } from './pages/Applications'
import { Referrals } from './pages/Referrals'
import { Kit } from './pages/Kit'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      { index: true, element: <Den /> },
      { path: 'hunt', element: <Hunt /> },
      { path: 'jobs', element: <Applications /> },
      { path: 'referrals', element: <Referrals /> },
      { path: 'profile', element: <Kit /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
