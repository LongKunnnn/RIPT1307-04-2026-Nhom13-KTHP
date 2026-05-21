import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ModerationStatus, ModerationResolveAction, ReportStatus, TargetType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { PostsService } from '../posts/posts.service';
import { toFrontendRole, toBackendRole, AuthUserPayload } from '../../common/utils/helpers';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private postsService: PostsService,
  ) {}

  async getStats() {
    const [postCount, userCount, commentCount, lockedUserCount, pendingPosts, pendingComments, openReportCount] =
      await Promise.all([
        this.prisma.post.count({ where: { deleted_at: null } }),
        this.prisma.user.count(),
        this.prisma.comment.count({ where: { deleted_at: null } }),
        this.prisma.user.count({ where: { is_active: false } }),
        this.prisma.post.count({
          where: { moderation_status: { not: ModerationStatus.published }, deleted_at: null },
        }),
        this.prisma.comment.count({
          where: { moderation_status: { not: ModerationStatus.published }, deleted_at: null },
        }),
        this.prisma.contentReport.count({ where: { status: ReportStatus.open } }),
      ]);

    return {
      postCount,
      userCount,
      commentCount,
      lockedUserCount,
      moderationQueueCount: pendingPosts + pendingComments + openReportCount,
      openReportCount,
    };
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({ orderBy: { created_at: 'desc' } });
    return users.map((u) => ({
      id: String(u.id),
      email: u.email,
      displayName: u.full_name,
      role: toFrontendRole(u.role),
      faculty: u.faculty ?? undefined,
      locked: !u.is_active,
      createdAt: u.created_at.toISOString(),
    }));
  }

  async createUser(input: {
    email: string;
    displayName: string;
    role: string;
    faculty?: string;
    password?: string;
  }) {
    const username = input.email.split('@')[0].slice(0, 100);
    const hash = await bcrypt.hash(input.password || '123456', 10);
    const user = await this.prisma.user.create({
      data: {
        email: input.email.trim(),
        username,
        full_name: input.displayName.trim(),
        role: toBackendRole(input.role) as UserRole,
        faculty: input.faculty?.trim(),
        password_hash: hash,
      },
    });
    return {
      id: String(user.id),
      email: user.email,
      displayName: user.full_name,
      role: toFrontendRole(user.role),
      faculty: user.faculty ?? undefined,
      locked: !user.is_active,
      createdAt: user.created_at.toISOString(),
    };
  }

  async updateUser(
    id: number,
    input: { email: string; displayName: string; role: string; faculty?: string; password?: string },
    actorId?: number,
  ) {
    if (actorId === id && toBackendRole(input.role) !== 'admin') {
      const current = await this.prisma.user.findUnique({ where: { id } });
      if (current?.role === UserRole.admin) {
        throw new BadRequestException('Không thể đổi vai trò tài khoản đang đăng nhập');
      }
    }

    const data: Record<string, unknown> = {
      email: input.email.trim(),
      full_name: input.displayName.trim(),
      role: toBackendRole(input.role),
      faculty: input.faculty?.trim(),
    };
    if (input.password) {
      data.password_hash = await bcrypt.hash(input.password, 10);
    }

    const user = await this.prisma.user.update({ where: { id }, data });
    return {
      id: String(user.id),
      email: user.email,
      displayName: user.full_name,
      role: toFrontendRole(user.role),
      faculty: user.faculty ?? undefined,
      locked: !user.is_active,
      createdAt: user.created_at.toISOString(),
    };
  }

  async deleteUser(id: number, actorId?: number) {
    if (actorId === id) throw new BadRequestException('Không thể xóa tài khoản đang đăng nhập');
    await this.prisma.user.delete({ where: { id } });
  }

  async setLocked(id: number, locked: boolean, actorId?: number) {
    if (locked && actorId === id) {
      throw new BadRequestException('Không thể khóa tài khoản đang đăng nhập');
    }
    await this.prisma.user.update({ where: { id }, data: { is_active: !locked } });
  }

  async resetPassword(id: number, password: string) {
    const hash = await bcrypt.hash(password, 10);
    await this.prisma.user.update({ where: { id }, data: { password_hash: hash } });
  }

  async getTopContributors(limit = 4) {
    const users = await this.prisma.user.findMany({
      where: { is_active: true },
      include: {
        posts: { where: { deleted_at: null } },
        comments: { where: { deleted_at: null } },
        votes: true,
      },
    });

    const scored = users.map((u) => {
      const points = u.posts.length * 10 + u.comments.length * 5 + u.votes.length * 2;
      return {
        name: u.full_name,
        role: toFrontendRole(u.role),
        points,
      };
    });

    return scored.filter((u) => u.points > 0).sort((a, b) => b.points - a.points).slice(0, limit);
  }

  async getModerationQueue() {
    const items: Array<Record<string, unknown>> = [];
    const seen = new Set<string>();

    const openReports = await this.prisma.contentReport.findMany({
      where: { status: ReportStatus.open },
      include: { reporter: true },
      orderBy: { created_at: 'desc' },
    });

    for (const r of openReports) {
      const key = `${r.target_type}:${r.target_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const meta = await this.getTargetMeta(r.target_type, r.target_id);
      items.push({
        id: `q_rep_${r.id}`,
        source: 'report',
        targetType: r.target_type,
        targetId: String(r.target_id),
        reportId: String(r.id),
        title: meta.title,
        preview: meta.preview,
        authorName: meta.authorName,
        createdAt: r.created_at.toISOString(),
        moderationStatus: meta.status,
        matchedWords: meta.flags,
        reportReason: r.reason,
        reporterName: r.reporter.full_name,
      });
    }

    const pendingPosts = await this.prisma.post.findMany({
      where: { moderation_status: { not: ModerationStatus.published }, deleted_at: null },
      include: { author: true },
    });
    for (const p of pendingPosts) {
      const key = `post:${p.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        id: `q_auto_p_${p.id}`,
        source: 'automod',
        targetType: 'post',
        targetId: String(p.id),
        title: p.title,
        preview: p.excerpt ?? p.content.slice(0, 200),
        authorName: p.author.full_name,
        createdAt: p.created_at.toISOString(),
        moderationStatus: p.moderation_status,
        matchedWords: p.matched_words,
      });
    }

    const pendingComments = await this.prisma.comment.findMany({
      where: { moderation_status: { not: ModerationStatus.published }, deleted_at: null },
      include: { author: true },
    });
    for (const c of pendingComments) {
      const key = `comment:${c.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        id: `q_auto_c_${c.id}`,
        source: 'automod',
        targetType: 'comment',
        targetId: String(c.id),
        title: 'Bình luận',
        preview: c.content.slice(0, 200),
        authorName: c.author.full_name,
        createdAt: c.created_at.toISOString(),
        moderationStatus: c.moderation_status,
        matchedWords: c.matched_words,
      });
    }

    return items.sort(
      (a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime(),
    );
  }

  private async getTargetMeta(type: TargetType, id: number) {
    if (type === TargetType.post) {
      const post = await this.prisma.post.findUnique({ where: { id }, include: { author: true } });
      if (!post) return { title: '(đã xóa)', preview: '', authorName: '—', status: ModerationStatus.hidden, flags: [] };
      return {
        title: post.title,
        preview: post.excerpt ?? post.content.slice(0, 200),
        authorName: post.author.full_name,
        status: post.moderation_status,
        flags: post.matched_words,
      };
    }
    const comment = await this.prisma.comment.findUnique({ where: { id }, include: { author: true } });
    if (!comment) return { title: 'Bình luận', preview: '', authorName: '—', status: ModerationStatus.hidden, flags: [] };
    return {
      title: 'Bình luận',
      preview: comment.content.slice(0, 200),
      authorName: comment.author.full_name,
      status: comment.moderation_status,
      flags: comment.matched_words,
    };
  }

  async resolveModeration(
    item: {
      targetType: 'post' | 'comment';
      targetId: string;
      reportId?: string;
    },
    action: ModerationResolveAction,
    warnMessage?: string,
  ) {
    const targetId = Number(item.targetId);

    if (action === 'delete') {
      if (item.targetType === 'post') await this.postsService.delete(targetId);
      else {
        await this.prisma.comment.update({
          where: { id: targetId },
          data: { deleted_at: new Date() },
        });
      }
    } else if (action === 'keep') {
      await this.setTargetStatus(item.targetType, targetId, ModerationStatus.published);
    } else if (action === 'warn') {
      await this.setTargetStatus(
        item.targetType,
        targetId,
        ModerationStatus.published,
        warnMessage?.trim() || 'Nội dung vi phạm quy tắc cộng đồng. Vui lòng chỉnh sửa hành vi đăng bài.',
      );
    }

    if (item.reportId) {
      await this.prisma.contentReport.update({
        where: { id: Number(item.reportId) },
        data: {
          status: ReportStatus.resolved,
          resolved_action: action,
          resolved_at: new Date(),
        },
      });
    }
  }

  private async setTargetStatus(
    type: 'post' | 'comment',
    id: number,
    status: ModerationStatus,
    note?: string,
  ) {
    if (type === 'post') {
      await this.postsService.updateModeration(id, status, note);
    } else {
      await this.prisma.comment.update({
        where: { id },
        data: { moderation_status: status, moderation_note: note },
      });
    }
  }

  async listBannedWords() {
    const words = await this.prisma.bannedWord.findMany({ orderBy: { word: 'asc' } });
    return words.map((w) => ({
      id: String(w.id),
      word: w.word,
      action: w.action,
      createdAt: w.created_at.toISOString(),
    }));
  }

  async addBannedWord(word: string, action: 'pending' | 'hidden', userId: number) {
    const w = await this.prisma.bannedWord.create({
      data: { word: word.trim().toLowerCase(), action, created_by: userId },
    });
    return { id: String(w.id), word: w.word, action: w.action, createdAt: w.created_at.toISOString() };
  }

  async updateBannedWord(id: number, action: 'pending' | 'hidden') {
    await this.prisma.bannedWord.update({ where: { id }, data: { action } });
  }

  async removeBannedWord(id: number) {
    await this.prisma.bannedWord.delete({ where: { id } });
  }

  async createReport(
    targetType: 'post' | 'comment',
    targetId: number,
    reporterId: number,
    reason: string,
  ) {
    await this.prisma.contentReport.create({
      data: {
        target_type: targetType,
        target_id: targetId,
        reporter_id: reporterId,
        reason: reason.trim(),
      },
    });
  }

  async listPostsAdmin() {
    return this.postsService.list({ page: 1, pageSize: 100, includeNonPublic: true, sort: 'newest' });
  }

  async getPostAdmin(id: number) {
    return this.postsService.getById(id, null, true);
  }

  async deletePost(id: number) {
    await this.postsService.delete(id);
    return { success: true };
  }
}
