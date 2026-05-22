import type { RegisterInput, User, UserRole } from "@/types";
import {
  apiFetch,
  clearTokens,
  getStoredUser,
  setStoredUser,
  setTokens,
} from "@/services/api/client";

interface AuthResponse {
  user: any;
  accessToken: string;
  refreshToken: string;
}

function normalizeUser(raw: any): User {
  const roleMap: Record<string, UserRole> = {
    admin: "ADMIN",
    ADMIN: "ADMIN",
    teacher: "LECTURER",
    LECTURER: "LECTURER",
    student: "STUDENT",
    STUDENT: "STUDENT",
  };
  return {
    ...raw,
    role: roleMap[String(raw.role)] ?? "STUDENT",
  };
}

export const authService = {
  getCurrentUser(): User | null {
    const raw = getStoredUser<User>();
    return raw ? normalizeUser(raw) : null;
  },

  async login(email: string, password: string): Promise<User> {
    const data = await apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setTokens(data.accessToken, data.refreshToken);
    setStoredUser(normalizeUser(data.user));
    return normalizeUser(data.user);
  },

  async register(input: RegisterInput & { birthday?: string }): Promise<User> {
    const data = await apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        fullName: input.displayName,
        role: input.role,
        faculty: input.faculty,
        birthday: input.birthday,
      }),
    });
    setTokens(data.accessToken, data.refreshToken);
    setStoredUser(normalizeUser(data.user));
    return normalizeUser(data.user);
  },

  async updateProfile(input: Partial<User>): Promise<User> {
    const { displayName, ...rest } = input;
    const data = await apiFetch<User>("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify({
        ...rest,
        fullName: displayName,
      }),
    });
    const user = normalizeUser(data);
    setStoredUser(user);
    return user;
  },

  async getPublicProfile(username: string): Promise<User> {
    const data = await apiFetch<User>(
      `/api/auth/users/${encodeURIComponent(username)}`,
    );
    return normalizeUser(data);
  },

  async refreshProfile(): Promise<User | null> {
    try {
      const user = normalizeUser(await apiFetch<User>("/api/auth/me"));
      setStoredUser(user);
      return user;
    } catch {
      return null;
    }
  },

  logout() {
    clearTokens();
  },

  async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    return apiFetch<{ message: string; resetToken?: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  },
};
