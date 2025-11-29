import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import { Dashboard } from '@/pages/Dashboard';
import { CustomerProfile } from '@/pages/CustomerProfile';
import { PromoManagement } from '@/pages/PromoManagement';
import { ReservationManagement } from '@/pages/ReservationManagement';
import { Reporting } from '@/pages/Reporting';
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('authToken') === 'demo-admin';
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/customers/:id",
    element: <ProtectedRoute><CustomerProfile /></ProtectedRoute>,
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
]);
// Do not touch this code
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
)