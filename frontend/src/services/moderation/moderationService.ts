import type {
  Comment,
  ModerationQueueItem,
  ModerationResolveAction,
  ModerationStatus,
  Post,
  ReportTargetType,
} from '@/types';
import { getComments, getPosts, getReports, setComments, setPosts } from '@/services/mock/db';
import { reportService } from './reportService';
import { postService } from '@/services/posts/postService';

function getTarget(
  type: ReportTargetType,
  id: string,
): { post?: Post; comment?: Comment } {
  if (type === 'post') {
    const post = getPosts().find((p) => p.id === id);
    return { post };
  }
  const comment = getComments().find((c) => c.id === id);
  return { comment };
}

function previewText(type: ReportTargetType, post?: Post, comment?: Comment): { title: string; preview: string; authorName: string; createdAt: string; status: ModerationStatus; flags?: string[] } {
  if (type === 'post' && post) {
    return {
      title: post.title,
      preview: post.excerpt,
      authorName: post.authorName,
      createdAt: post.createdAt,
      status: post.moderationStatus,
      flags: post.moderationFlags,
    };
  }
  if (comment) {
    return {
      title: 'Bình luận',
      preview: comment.body.slice(0, 200),
      authorName: comment.authorName,
      createdAt: comment.createdAt,
      status: comment.moderationStatus,
      flags: comment.moderationFlags,
    };
  }
  return { title: '(đã xóa)', preview: '', authorName: '—', createdAt: new Date().toISOString(), status: 'hidden' };
}

export const moderationService = {
  /** Hàng đợi: báo cáo mở + nội dung pending/hidden chưa xử lý (auto-mod) */
  getQueue(): ModerationQueueItem[] {
    const items: ModerationQueueItem[] = [];
    const seen = new Set<string>();

    for (const r of reportService.listOpen()) {
      const key = `${r.targetType}:${r.targetId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const { post, comment } = getTarget(r.targetType, r.targetId);
      const meta = previewText(r.targetType, post, comment);
      items.push({
        id: `q_rep_${r.id}`,
        source: 'report',
        targetType: r.targetType,
        targetId: r.targetId,
        reportId: r.id,
        title: meta.title,
        preview: meta.preview,
        authorName: meta.authorName,
        createdAt: r.createdAt,
        moderationStatus: meta.status,
        matchedWords: meta.flags,
        reportReason: r.reason,
        reporterName: r.reporterName,
      });
    }

    getPosts()
      .filter((p) => p.moderationStatus !== 'published')
      .forEach((p) => {
        const key = `post:${p.id}`;
        if (seen.has(key)) return;
        seen.add(key);
        items.push({
          id: `q_auto_p_${p.id}`,
          source: 'automod',
          targetType: 'post',
          targetId: p.id,
          title: p.title,
          preview: p.excerpt,
          authorName: p.authorName,
          createdAt: p.createdAt,
          moderationStatus: p.moderationStatus,
          matchedWords: p.moderationFlags,
        });
      });

    getComments()
      .filter((c) => c.moderationStatus !== 'published')
      .forEach((c) => {
        const key = `comment:${c.id}`;
        if (seen.has(key)) return;
        seen.add(key);
        items.push({
          id: `q_auto_c_${c.id}`,
          source: 'automod',
          targetType: 'comment',
          targetId: c.id,
          title: 'Bình luận',
          preview: c.body.slice(0, 200),
          authorName: c.authorName,
          createdAt: c.createdAt,
          moderationStatus: c.moderationStatus,
          matchedWords: c.moderationFlags,
        });
      });

    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  countQueue(): number {
    return this.getQueue().length;
  },

  setTargetStatus(type: ReportTargetType, id: string, status: ModerationStatus, note?: string) {
    if (type === 'post') {
      const posts = getPosts();
      const idx = posts.findIndex((p) => p.id === id);
      if (idx < 0) return;
      posts[idx] = { ...posts[idx], moderationStatus: status, moderationNote: note };
      setPosts(posts);
    } else {
      const comments = getComments();
      const idx = comments.findIndex((c) => c.id === id);
      if (idx < 0) return;
      comments[idx] = { ...comments[idx], moderationStatus: status, moderationNote: note };
      setComments(comments);
    }
  },

  /** Giữ lại | Nhắc nhở | Xóa vĩnh viễn */
  resolve(item: ModerationQueueItem, action: ModerationResolveAction, warnMessage?: string) {
    if (action === 'delete') {
      if (item.targetType === 'post') postService.delete(item.targetId);
      else {
        const comments = getComments().filter((c) => c.id !== item.targetId);
        setComments(comments);
      }
    } else if (action === 'keep') {
      this.setTargetStatus(item.targetType, item.targetId, 'published');
    } else if (action === 'warn') {
      this.setTargetStatus(
        item.targetType,
        item.targetId,
        'published',
        warnMessage?.trim() || 'Nội dung vi phạm quy tắc cộng đồng. Vui lòng chỉnh sửa hành vi đăng bài.',
      );
    }

    if (item.reportId) {
      reportService.resolve(item.reportId, action);
    } else if (item.source === 'automod' && action !== 'delete') {
      // đã set status ở trên
    }
  },
};
