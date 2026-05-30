import type { Comment } from '@/types';
import { apiFetch, buildQuery } from '@/services/api/client';

export interface CommentNode extends Comment {
  children: CommentNode[];
}

export const commentService = {
  async listByPost(postId: string, opts?: { includeNonPublic?: boolean }): Promise<CommentNode[]> {
    // SỬA: Đổi sang gọi /api/comments và truyền postId qua Query Parameter
    return apiFetch<CommentNode[]>(
      `/api/comments${buildQuery({
        postId, // Ném postId vào đây để BE biết lấy comment của bài nào
        includeNonPublic: opts?.includeNonPublic,
      })}`,
    );
  },

  async add(
    postId: string,
    body: string,
    parentId: string | null,
    author: { id: string; displayName: string; role: Comment['authorRole'] },
  ): Promise<Comment> {
    void author;
    return apiFetch<Comment>('/api/comments', {
      method: 'POST',
      body: JSON.stringify({
        postId: Number(postId), 
        body,
        parentId: parentId ? Number(parentId) : null,
      }),
    });
  },
};