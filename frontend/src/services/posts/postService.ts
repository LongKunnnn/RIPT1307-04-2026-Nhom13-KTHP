import type { CreatePostInput, PaginatedResult, Post } from '@/types';
import { getComments, getPosts, newId, setComments, setPosts } from '@/services/mock/db';
import { scanContent, isPubliclyVisible } from '@/services/moderation/contentScan';
import { followService } from '@/services/posts/followService';

export type PostFeedSort = 'newest' | 'active' | 'bounty' | 'unanswered';

export interface ListPostsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  tag?: string;
  faculty?: string;
  sort?: PostFeedSort;
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

function lastActivityAt(postId: string, postCreatedAt: string): number {
  const base = new Date(postCreatedAt).getTime();
  const fromComments = getComments()
    .filter((c) => c.postId === postId)
    .map((c) => new Date(c.createdAt).getTime());
  return fromComments.length ? Math.max(base, ...fromComments) : base;
}

function sortPosts(items: Post[], sort: PostFeedSort): Post[] {
  const list = [...items];
  switch (sort) {
    case 'active':
      return list.sort(
        (a, b) => lastActivityAt(b.id, b.createdAt) - lastActivityAt(a.id, a.createdAt),
      );
    case 'bounty':
      return list
        .filter((p) => (p.bounty ?? 0) > 0)
        .sort((a, b) => (b.bounty ?? 0) - (a.bounty ?? 0));
    case 'unanswered':
      return list
        .filter((p) => p.answerCount === 0)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    default:
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

function makeExcerpt(body: string, max = 180) {
  const t = body.trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function paginate(items: Post[], query: ListPostsQuery): PaginatedResult<Post> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;
  const total = items.length;
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page, pageSize };
}

export const postService = {
  list(query: ListPostsQuery = {}): PaginatedResult<Post> {
    let items = getPosts().filter((p) => isPubliclyVisible(p.moderationStatus));

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

    items = sortPosts(items, query.sort ?? 'newest');

    return paginate(items, query);
  },

  /** Bài do user đăng (kể cả chờ duyệt / ẩn) */
  listByAuthor(userId: string, query: ListPostsQuery = {}): PaginatedResult<Post> {
    let items = getPosts().filter((p) => p.authorId === userId);
    items = sortPosts(items, query.sort ?? 'newest');
    return paginate(items, query);
  },

  /** Bài user đang theo dõi */
  listFollowed(userId: string, query: ListPostsQuery = {}): PaginatedResult<Post> {
    const ids = followService.getFollowedPostIds(userId);
    let items = getPosts().filter(
      (p) => ids.includes(p.id) && isPubliclyVisible(p.moderationStatus),
    );
    items.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    if (query.sort && query.sort !== 'newest') {
      items = sortPosts(items, query.sort);
    }
    return paginate(items, query);
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
    return this.getTagsWithCount().map((t) => t.name);
  },

  getTagsWithCount(): TagWithCount[] {
    const counts = new Map<string, number>();
    getPosts()
      .filter((p) => isPubliclyVisible(p.moderationStatus))
      .forEach((p) => {
        p.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
      });
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'));
  },

  getForumStats(): ForumStats {
    const posts = getPosts().filter((p) => isPubliclyVisible(p.moderationStatus));
    const answerCount = getComments().filter(
      (c) => c.parentId === null && isPubliclyVisible(c.moderationStatus),
    ).length;
    return {
      questionCount: posts.length,
      answerCount,
      tagCount: this.getAllTags().length,
    };
  },

  /** Vài bài nổi bật cho trang chủ */
  getFeatured(limit = 3): Post[] {
    return sortPosts(
      getPosts().filter((p) => isPubliclyVisible(p.moderationStatus)),
      'active',
    ).slice(0, limit);
  },
};
