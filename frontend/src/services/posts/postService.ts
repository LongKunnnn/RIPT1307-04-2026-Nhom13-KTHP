import type { CreatePostInput, PaginatedResult, Post } from '@/types';
import { apiFetch, buildQuery } from '@/services/api/client';

export type PostFeedSort = 'newest' | 'active' | 'bounty' | 'unanswered' | 'rating';
export type PostDifficulty = 'easy' | 'medium' | 'hard';

export interface ListPostsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  tag?: string;
  faculty?: string;
  sort?: PostFeedSort;
  difficulty?: PostDifficulty;
}

export interface ForumStats {
  questionCount: number;
  answerCount: number;
  tagCount: number;
}

export interface TagWithCount {
  name: string;
  count: number;
}

export interface TopContributor {
  name: string;
  role: Post['authorRole'];
  points: number;
}

export const postService = {
  async list(query: ListPostsQuery = {}): Promise<PaginatedResult<Post>> {
    return apiFetch<PaginatedResult<Post>>(
      `/api/posts${buildQuery({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        tag: query.tag,
        sort: query.sort,
        difficulty: query.difficulty,
      })}`,
    );
  },

  async listByAuthor(userId: string, query: ListPostsQuery = {}): Promise<PaginatedResult<Post>> {
    return apiFetch<PaginatedResult<Post>>(
      `/api/posts${buildQuery({
        page: query.page,
        pageSize: query.pageSize,
        authorId: userId,
        sort: query.sort,
      })}`,
    );
  },

  async listFollowed(userId: string, query: ListPostsQuery = {}): Promise<PaginatedResult<Post>> {
    void userId;
    // Đã đổi sang đúng URL lấy danh sách bài đã lưu của BE
    return apiFetch<PaginatedResult<Post>>(
      `/api/follows/posts/me/list${buildQuery({
        page: query.page,
        pageSize: query.pageSize,
      })}`,
    );
  },

  async getById(id: string, opts?: { includeNonPublic?: boolean; viewerId?: string }): Promise<Post | null> {
    try {
      return await apiFetch<Post>(`/api/posts/${encodeURIComponent(id)}`);
    } catch {
      if (opts?.includeNonPublic) {
        try {
          return await apiFetch<Post>(`/api/admin/posts/${encodeURIComponent(id)}`);
        } catch {
          return null;
        }
      }
      return null;
    }
  },

  async create(
    input: CreatePostInput,
    author: { id: string; displayName: string; role: Post['authorRole'] },
  ): Promise<Post> {
    void author;
    return apiFetch<Post>('/api/posts', {
      method: 'POST', 
      body: JSON.stringify(input),
    });
  },

  async update(id: string, input: Partial<CreatePostInput>): Promise<Post> {
    return apiFetch(`/api/posts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async getByIdAdmin(id: string): Promise<Post | null> {
    try {
      return await apiFetch<Post>(`/api/admin/posts/${encodeURIComponent(id)}`);
    } catch {
      return null;
    }
  },

  async updateModeration(id: string, status: Post['moderationStatus'], note?: string) {
    void id;
    void status;
    void note;
  },

  async delete(id: string): Promise<boolean> {
    await apiFetch(`/api/admin/posts/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return true;
  },

  async getTagsWithCount(): Promise<TagWithCount[]> {
    return apiFetch<TagWithCount[]>('/api/posts/tags');
  },

  async getAllTags(): Promise<string[]> {
    const tags = await this.getTagsWithCount();
    return tags.map((t) => t.name);
  },

  async getForumStats(): Promise<ForumStats> {
    return apiFetch<ForumStats>('/api/posts/stats');
  },

  async getFeatured(limit = 3): Promise<Post[]> {
    return apiFetch<Post[]>(`/api/posts/featured${buildQuery({ limit })}`);
  },

  async getTopContributors(limit = 4): Promise<TopContributor[]> {
    try {
      const res = await apiFetch<any>(`/api/leaderboard${buildQuery({ limit })}`);
      
      const users = Array.isArray(res) ? res : (res?.data || []);

      return users.map((u: any) => ({
        // nếu null hết thì cho chữ 'Ẩn danh'
        // Đảm bảo lúc nào cũng có 1 chuỗi string để UI nó gọi được hàm charAt(0)
        name: u.full_name || u.fullName || u.username || u.userName || 'Ẩn danh',
        role: 'student',
        points: u.reward_points || u.rewardPoints || 0
      }));
    } catch (error) {
      console.error("Lỗi khi lấy Leaderboard:", error);
      return []; // Nếu sập mạng cũng không làm chết UI
    }
  },

  async rate(postId: string, stars: number) {
    return apiFetch<{ avgRating: number; ratingCount: number; myStars: number }>(
      `/api/posts/${encodeURIComponent(postId)}/rate`,
      { method: 'POST', body: JSON.stringify({ stars }) },
    );
  },

  async getMyRating(postId: string) {
    return apiFetch<{ stars: number | null }>(
      `/api/posts/${encodeURIComponent(postId)}/my-rating`,
    );
  },

  async acceptAnswer(postId: string, commentId: string) {
    return apiFetch<{ acceptedCommentId: string; bountyAwarded: number }>(
      `/api/posts/${encodeURIComponent(postId)}/accept-answer`,
      { method: 'POST', body: JSON.stringify({ commentId: Number(commentId) }) },
    );
  },
};
