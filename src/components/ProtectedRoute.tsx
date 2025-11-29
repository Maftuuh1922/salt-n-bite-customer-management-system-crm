import React from 'react';
import { useAuth } from '@/lib/auth';
import { Navigate, useLocation } from 'react-router-dom';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, hasAccess } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    // Redirect them to the home page if they are not authenticated.
    return <Navigate to="/" replace />;
  }
  if (!hasAccess(location.pathname)) {
    // If they are authenticated but don't have access, send them to the dashboard.
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}