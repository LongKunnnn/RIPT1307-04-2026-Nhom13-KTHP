import type { AdminStats, PaginatedResult, Post, User, UserRole } from '@/types';
import { apiFetch } from '@/services/api/client';

export type AdminUserGuardAction = 'delete' | 'lock' | 'demote';

export function assertAdminUserAction(
  _targetId: string,
  _action: AdminUserGuardAction,
  _actorId?: string | null,
): void {
  // Guard logic enforced on backend
}

export interface UpsertUserInput {
  id?: string;
  email: string;
  displayName: string;
  role: UserRole;
  faculty?: string;
  password?: string;
}

export const adminService = {
  async getStats(): Promise<AdminStats> {
    return apiFetch<AdminStats>('/api/admin/stats');
  },

  /** Danh sách bài (kể cả chờ duyệt / ẩn) — dùng endpoint admin. */
  async listPosts(): Promise<Post[]> {
    const res = await apiFetch<PaginatedResult<Post>>('/api/admin/posts');
    return res.items ?? [];
  },

  async deletePost(id: string) {
    await apiFetch(`/api/admin/posts/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async listUsers(): Promise<User[]> {
    return apiFetch<User[]>('/api/admin/users');
  },

  async createUser(input: UpsertUserInput): Promise<User> {
    return apiFetch<User>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateUser(id: string, input: UpsertUserInput, _actorId?: string | null): Promise<User> {
    return apiFetch<User>(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async deleteUser(id: string, _actorId?: string | null) {
    await apiFetch(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async resetPassword(id: string, newPassword: string) {
    await apiFetch(`/api/admin/users/${encodeURIComponent(id)}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password: newPassword }),
    });
  },

  async setLocked(id: string, locked: boolean, _actorId?: string | null) {
    await apiFetch(`/api/admin/users/${encodeURIComponent(id)}/lock`, {
      method: 'PATCH',
      body: JSON.stringify({ locked }),
    });
  },
};
