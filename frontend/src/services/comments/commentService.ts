import type { Comment } from '@/types';
import { apiFetch, buildQuery } from '@/services/api/client';

export interface CommentNode extends Comment {
  children: CommentNode[];
}

export const commentService = {
  async listByPost(postId: string, opts?: { includeNonPublic?: boolean }): Promise<CommentNode[]> {
    return apiFetch<CommentNode[]>(
      `/api/posts/${encodeURIComponent(postId)}/comments${buildQuery({
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
    return apiFetch<Comment>(`/api/posts/${encodeURIComponent(postId)}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        body,
        parentId: parentId ? Number(parentId) : null,
      }),
    });
  },
};
