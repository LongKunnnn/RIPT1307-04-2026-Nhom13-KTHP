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
    admin: "admin",
    ADMIN: "admin",
    teacher: "teacher",
    LECTURER: "teacher",
    student: "student",
    STUDENT: "student",
  };
  return {
    ...raw,
    id: String(raw.id),
    role: roleMap[String(raw.role)] ?? "student",
    // Backend fields
    full_name: raw.full_name || raw.displayName,
    is_active: raw.is_active !== undefined ? raw.is_active : !raw.locked,
    reward_points: raw.reward_points || raw.rewardPoints,
    created_at: raw.created_at || raw.createdAt,
    social_links: raw.social_links || raw.socialLinks,
    avatar_url: raw.avatar_url || raw.avatarUrl,
    // For backwards compatibility
    displayName: raw.displayName || raw.full_name,
    locked: raw.locked !== undefined ? raw.locked : !raw.is_active,
    rewardPoints: raw.rewardPoints || raw.reward_points,
    createdAt: raw.createdAt || raw.created_at,
    socialLinks: raw.socialLinks || raw.social_links,
    avatarUrl: raw.avatarUrl || raw.avatar_url,
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
    const data = await apiFetch<User>("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify({
        username: input.username,
        fullName:
          input.displayName ?? input.full_name ?? (input as { fullName?: string }).fullName,
        birthday: input.birthday,
        bio: input.bio,
        faculty: input.faculty,
        socialLinks: input.socialLinks ?? input.social_links,
        avatarUrl: input.avatarUrl ?? input.avatar_url,
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
