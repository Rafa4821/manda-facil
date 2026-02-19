import { createBrowserRouter } from 'react-router-dom'
import { PublicLayout, AppLayout, AdminLayout } from './layouts'
import { LoginPage, RegisterPage } from '../auth/pages'
import { CustomerHomePage, NewOrderPage, MyOrdersPage, OrderDetailPage } from '../orders/pages'
import { AdminHomePage, AdminOrdersPage, AdminOrderDetailPage } from '../admin/pages'
import { RateManagementPage } from '../rates/pages'
import { HomePage } from '../landing/pages'
import { PublicRoute, RequireAdmin, RequireCustomer } from '../auth/components'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/login',
        element: (
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        ),
      },
      {
        path: '/register',
        element: (
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        ),
      },
    ],
  },
  {
    path: '/app',
    element: (
      <RequireCustomer>
        <AppLayout />
      </RequireCustomer>
    ),
    children: [
      {
        index: true,
        element: <CustomerHomePage />,
      },
      {
        path: 'new-order',
        element: <NewOrderPage />,
      },
      {
        path: 'orders',
        element: <MyOrdersPage />,
      },
      {
        path: 'orders/:orderId',
        element: <OrderDetailPage />,
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      {
        index: true,
        element: <AdminHomePage />,
      },
      {
        path: 'rate',
        element: <RateManagementPage />,
      },
      {
        path: 'orders',
        element: <AdminOrdersPage />,
      },
      {
        path: 'orders/:orderId',
        element: <AdminOrderDetailPage />,
      },
    ],
  },
])
