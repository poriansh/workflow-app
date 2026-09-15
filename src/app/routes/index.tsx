import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'

import { LoadingPage } from '@/shared/components/LoadingPage/Loadingpage.tsx'

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const NotFoundPage = lazy(() => import('@/shared/pages/Notfound/NotFoundPage'))

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingPage />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<LoadingPage />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
])

export function AppRoutes() {
  return <RouterProvider router={router} />
}