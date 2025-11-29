import { useState, useEffect } from 'react';
// Mock roles and permissions
const permissions = {
  admin: ['/dashboard', '/customers', '/promos', '/reservations', '/reports'],
  manager: ['/dashboard', '/promos', '/reports'],
  staff: ['/dashboard', '/customers', '/reservations'],
};
type Role = keyof typeof permissions;
export const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      // In a real app, you'd decode the JWT here to get the role
      const mockRole: Role = storedToken === 'demo-admin-jwt' ? 'admin' : 'staff';
      setToken(storedToken);
      setRole(mockRole);
      setIsAuthenticated(true);
    } else {
      setToken(null);
      setRole(null);
      setIsAuthenticated(false);
    }
  }, []);
  const hasAccess = (path: string) => {
    if (!role) return false;
    // Special case for customer profile pages
    if (path.startsWith('/customers/')) {
        return permissions[role].includes('/customers');
    }
    return permissions[role].some(p => path.startsWith(p));
  };
  return { token, role, isAuthenticated, isAdmin: role === 'admin', hasAccess };
};
export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};