import type { CreatePostInput, PaginatedResult, Post } from '@/types';
import { getComments, getPosts, newId, setComments, setPosts } from '@/services/mock/db';
import { scanContent, isPubliclyVisible } from '@/services/moderation/contentScan';

export interface ListPostsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  tag?: string;
  faculty?: string;
}

function makeExcerpt(body: string, max = 180) {
  const t = body.trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export const postService = {
  list(query: ListPostsQuery = {}): PaginatedResult<Post> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    let items = getPosts()
      .filter((p) => isPubliclyVisible(p.moderationStatus))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (query.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.body.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q),
      );
    }
    if (query.tag?.trim()) {
      const t = query.tag.trim().toLowerCase();
      items = items.filter((p) => p.tags.some((tag) => tag.toLowerCase() === t));
    }
    if (query.faculty?.trim()) {
      const f = query.faculty.trim().toLowerCase();
      items = items.filter((p) => p.tags.some((tag) => tag.toLowerCase().includes(f)));
    }

    const total = items.length;
    const start = (page - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    };
  },

  getById(id: string, opts?: { includeNonPublic?: boolean; viewerId?: string }): Post | null {
    const post = getPosts().find((p) => p.id === id);
    if (!post) return null;
    const isAuthor = opts?.viewerId && post.authorId === opts.viewerId;
    if (!opts?.includeNonPublic && !isPubliclyVisible(post.moderationStatus) && !isAuthor) return null;
    const posts = getPosts();
    const idx = posts.findIndex((p) => p.id === id);
    if (idx >= 0) {
      posts[idx] = { ...posts[idx], viewCount: posts[idx].viewCount + 1 };
      setPosts(posts);
    }
    return posts[idx] ?? post;
  },

  create(input: CreatePostInput, author: { id: string; displayName: string; role: Post['authorRole'] }): Post {
    const title = input.title.trim();
    const body = input.body.trim();
    const scan = scanContent(title, body);
    const post: Post = {
      id: newId('p'),
      title,
      body,
      excerpt: makeExcerpt(body),
      tags: input.tags.map((t) => t.trim()).filter(Boolean),
      authorId: author.id,
      authorName: author.displayName,
      authorRole: author.role,
      createdAt: new Date().toISOString(),
      voteScore: 0,
      answerCount: 0,
      viewCount: 0,
      moderationStatus: scan.status,
      moderationFlags: scan.matchedWords.length ? scan.matchedWords : undefined,
    };
    setPosts([post, ...getPosts()]);
    return post;
  },

  /** Admin: lấy bài kể cả pending/hidden */
  getByIdAdmin(id: string): Post | null {
    return getPosts().find((p) => p.id === id) ?? null;
  },

  updateModeration(id: string, status: Post['moderationStatus'], note?: string) {
    const posts = getPosts();
    const idx = posts.findIndex((p) => p.id === id);
    if (idx < 0) return;
    posts[idx] = { ...posts[idx], moderationStatus: status, moderationNote: note };
    setPosts(posts);
  },

  delete(id: string): boolean {
    const before = getPosts().length;
    const posts = getPosts().filter((p) => p.id !== id);
    if (posts.length === before) return false;
    setPosts(posts);
    const comments = getComments().filter((c) => c.postId !== id);
    setComments(comments);
    return true;
  },

  recountAnswers(postId: string) {
    const count = getComments().filter(
      (c) => c.postId === postId && c.parentId === null && isPubliclyVisible(c.moderationStatus),
    ).length;
    const posts = getPosts();
    const idx = posts.findIndex((p) => p.id === postId);
    if (idx >= 0) {
      posts[idx] = { ...posts[idx], answerCount: count };
      setPosts(posts);
    }
  },

  getAllTags(): string[] {
    const set = new Set<string>();
    getPosts().forEach((p) => p.tags.forEach((t) => set.add(t)));
    return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
  },
};
