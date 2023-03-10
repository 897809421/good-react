import { Suspense } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import { Spinner } from '@/components/Elements'
import { MainLayout } from '@/components/Layout'
import { lazyImport } from '@/utils/lazyImport'

const { MyTest } = lazyImport(() => import('@/features/mytest'), 'MyTest')
const { Dashboard } = lazyImport(() => import('@/features/misc'), 'Dashboard')
const { DiscussionsRoutes } = lazyImport(
  () => import('@/features/discussions'),
  'DiscussionsRoutes'
)

const App = () => {
  return (
    <MainLayout>
      <Suspense
        fallback={
          <div className="h-full w-full items-center justify-center">
            <Spinner size="xl" />
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </MainLayout>
  )
}

export const protectedRoutes = [
  {
    path: '/app',
    element: <App />,
    children: [
      { path: 'discussions/*', element: <DiscussionsRoutes /> },
      { path: '*', element: <Navigate to="." /> },
      { path: 'test', element: <MyTest /> },
      { path: '', element: <Dashboard /> },
    ],
  },
]
