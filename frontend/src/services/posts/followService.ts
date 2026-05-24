import { apiFetch } from '@/services/api/client';

export const followService = {
  // Đã gắn thêm /posts/ vào URL
  async isFollowing(userId: string, postId: string): Promise<boolean> {
    void userId;
    try {
      const res = await apiFetch<{ isFollowing: boolean }>(`/api/follows/posts/${encodeURIComponent(postId)}/check`);
      return res.isFollowing;
    } catch {
      return false;
    }
  },

  async toggle(userId: string, postId: string): Promise<boolean> {
    void userId;
    return apiFetch<boolean>(`/api/follows/posts/${encodeURIComponent(postId)}/toggle`, { method: 'POST' });
  },

  async getFollowedPostIds(userId: string): Promise<string[]> {
    void userId;
    try {
      const res = await apiFetch<{ followedPostIds: string[] }>('/api/follows/posts/me/ids');
      return res.followedPostIds;
    } catch {
      return [];
    }
  },

  async countFollowed(userId: string): Promise<number> {
    void userId;
    try {
      const res = await apiFetch<{ totalFollowed: number }>('/api/follows/posts/me/count');
      return res.totalFollowed;
    } catch {
      return 0;
    }
  },
};