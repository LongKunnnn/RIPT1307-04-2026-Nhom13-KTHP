import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { RegisterInput, User, UserRole } from '@/types';
import { authService } from '@/services/auth/authService';

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLecturer: boolean;
  isStudent: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());

  const refresh = useCallback(() => {
    setUser(authService.getCurrentUser());
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = authService.login(email, password);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const u = authService.register(input);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN',
      isLecturer: user?.role === 'LECTURER',
      isStudent: user?.role === 'STUDENT',
      login,
      register,
      logout,
      refresh,
    }),
    [user, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
