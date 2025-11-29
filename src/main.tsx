import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import { Dashboard } from '@/pages/Dashboard';
import { Customers } from '@/pages/Customers';
import { CustomerProfile as AdminCustomerProfile } from '@/pages/CustomerProfile';
import { PromoManagement } from '@/pages/PromoManagement';
import { ReservationManagement } from '@/pages/ReservationManagement';
import { Reporting } from '@/pages/Reporting';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CustomerLogin } from '@/pages/CustomerLogin';
import { CustomerDashboard } from '@/pages/CustomerDashboard';
import { CustomerProfile } from '@/pages/CustomerProfile';
import { CustomerReservations } from '@/pages/CustomerReservations';
import { CustomerPromos } from '@/pages/CustomerPromos';
import { Toaster } from '@/components/ui/sonner';
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  // Admin/Staff Routes
  {
    path: "/dashboard",
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/customers",
    element: <ProtectedRoute><Customers /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/customers/:id",
    element: <ProtectedRoute><AdminCustomerProfile /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/promos",
    element: <ProtectedRoute><PromoManagement /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/reservations",
    element: <ProtectedRoute><ReservationManagement /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/reports",
    element: <ProtectedRoute><Reporting /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
  },
  // Customer Routes
  {
    path: "/customer/login",
    element: <CustomerLogin />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/customer",
    element: <ProtectedRoute><Outlet /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: 'dashboard', element: <CustomerDashboard /> },
      { path: 'profile', element: <CustomerProfile /> },
      { path: 'reservations', element: <CustomerReservations /> },
      { path: 'promos', element: <CustomerPromos /> },
    ]
  },
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster richColors closeButton />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)