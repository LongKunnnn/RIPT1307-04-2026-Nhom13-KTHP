import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { history } from "umi";
import type { RegisterInput, User, UserRole } from "@/types";
import { authService } from "@/services/auth/authService";
import { ROUTES } from "@/constants/routes";

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLecturer: boolean;
  isStudent: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput & { birthday?: string }) => Promise<User>;
  updateProfile: (input: Partial<User>) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() =>
    authService.getCurrentUser(),
  );

  const refreshProfile = useCallback(async () => {
    const profile = await authService.refreshProfile();
    setUser(profile ?? authService.getCurrentUser());
  }, []);

  useEffect(() => {
    if (authService.getCurrentUser()) {
      void refreshProfile();
    }
  }, [refreshProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const u = await authService.login(email, password);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(
    async (input: RegisterInput & { birthday?: string }) => {
      const u = await authService.register(input);
      setUser(u);
      return u;
    },
    [],
  );

  const updateProfile = useCallback(async (input: Partial<User>) => {
    const u = await authService.updateProfile(input);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    history.push(ROUTES.login);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: !!user,
      isAdmin: user?.role === "ADMIN",
      isLecturer: user?.role === "LECTURER",
      isStudent: user?.role === "STUDENT",
      login,
      register,
      updateProfile,
      logout,
      refreshProfile,
    }),
    [user, login, register, updateProfile, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
