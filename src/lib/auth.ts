import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
const permissions = {
  admin: ['/dashboard', '/customers', '/promos', '/reservations', '/reports'],
  manager: ['/dashboard', '/promos', '/reports'],
  staff: ['/dashboard', '/customers', '/reservations'],
  customer: ['/customer/dashboard', '/customer/profile', '/customer/reservations', '/customer/promos'],
};
type Role = keyof typeof permissions;
export const useAuth = () => {
  const navigate = useNavigate();
  const getInitialAuth = () => {
    if (typeof window === 'undefined') {
      return { token: null, role: null, customerId: null, isAuthenticated: false };
    }
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      if (storedToken.startsWith('customer-jwt-')) {
        const customerId = storedToken.split('-')[2];
        return { token: storedToken, role: 'customer' as Role, customerId, isAuthenticated: true };
      }
      if (storedToken === 'demo-admin-jwt') {
        return { token: storedToken, role: 'admin' as Role, customerId: null, isAuthenticated: true };
      }
      return { token: storedToken, role: 'staff' as Role, customerId: null, isAuthenticated: true };
    }
    return { token: null, role: null, customerId: null, isAuthenticated: false };
  };
  const [authState, setAuthState] = useState(getInitialAuth);
  useEffect(() => {
    setAuthState(getInitialAuth());
  }, []);
  const hasAccess = (path: string) => {
    const { role, customerId } = authState;
    if (!role) return false;
    if (role === 'customer') {
      if (path.startsWith('/customer/profile')) return true; // Allow base path
      if (path.startsWith('/customer/')) return permissions.customer.some(p => path.startsWith(p));
    } else {
      if (path.startsWith('/customers/')) return permissions[role].includes('/customers');
      return permissions[role].some(p => path.startsWith(p));
    }
    return false;
  };
  const logout = useCallback(() => {
    setAuthToken(null);
    setAuthState({ token: null, role: null, customerId: null, isAuthenticated: false });
    navigate('/customer/login');
  }, [navigate]);
  return {
    ...authState,
    isAdmin: authState.role === 'admin',
    isCustomer: authState.role === 'customer',
    hasAccess,
    logout,
  };
};
export const setAuthToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
  // This is a simple way to trigger a re-check in useAuth hooks across the app
  window.dispatchEvent(new Event('storage'));
};