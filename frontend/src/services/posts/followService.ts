import { apiFetch, buildQuery } from '@/services/api/client';

export const followService = {
  async isFollowing(userId: string, postId: string): Promise<boolean> {
    void userId;
    try {
      return await apiFetch<boolean>(`/api/follows/${encodeURIComponent(postId)}/status`);
    } catch {
      return false;
    }
  },

  async toggle(userId: string, postId: string): Promise<boolean> {
    void userId;
    return apiFetch<boolean>(`/api/follows/${encodeURIComponent(postId)}/toggle`, { method: 'POST' });
  },

  async getFollowedPostIds(userId: string): Promise<string[]> {
    void userId;
    try {
      return await apiFetch<string[]>('/api/follows/mine/ids');
    } catch {
      return [];
    }
  },

  async countFollowed(userId: string): Promise<number> {
    void userId;
    try {
      return await apiFetch<number>('/api/follows/mine/count');
    } catch {
      return 0;
    }
  },
};
