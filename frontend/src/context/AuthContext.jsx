import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const normalizeRole = (role) => String(role || '').toUpperCase();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('qc_user');
    const parsedUser = savedUser ? JSON.parse(savedUser) : null;
    return parsedUser ? { ...parsedUser, role: normalizeRole(parsedUser.role) } : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('qc_token') || '');

  const login = ({ userData, accessToken }) => {
    const nextUser = userData ? { ...userData, role: normalizeRole(userData.role) } : null;
    setUser(nextUser);
    setToken(accessToken);
    localStorage.setItem('qc_user', JSON.stringify(nextUser));
    localStorage.setItem('qc_token', accessToken);
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('qc_user');
    localStorage.removeItem('qc_token');
  };

  const hasRole = (roles) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    const currentRole = normalizeRole(user?.role);
    return allowedRoles.some((role) => normalizeRole(role) === currentRole);
  };

  const value = useMemo(
    () => ({ user, token, login, logout, hasRole, isAuthenticated: Boolean(token && user) }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
