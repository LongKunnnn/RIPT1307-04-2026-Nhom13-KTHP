import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ModerationStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toFrontendRole, AuthUserPayload } from '../../common/utils/helpers';
import { scanContent } from '../../common/utils/content-moderation';
import { CreateCommentDto, UpdateCommentDto } from './dto/comments.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private notiService: NotificationsService,
  ) {}

  private mapComment(c: any) {
    const matchedWords = Array.isArray(c.matched_words) ? (c.matched_words as string[]) : undefined;

    return {
      id: String(c.id),
      postId: String(c.post_id),
      parentId: c.parent_id ? String(c.parent_id) : null,
      body: c.content,
      authorId: String(c.author_id),
      authorName: c.author?.full_name || 'Người dùng ẩn danh',
      authorUsername: c.author?.username || 'unknown',
      authorRole: toFrontendRole(c.author?.role),
      createdAt: c.created_at.toISOString(),
      voteScore: c.vote_score,
      isAccepted: c.is_accepted,
      moderationStatus: c.moderation_status,
      moderationFlags: matchedWords?.length ? matchedWords : undefined,
      moderationNote: c.moderation_note ?? undefined,
    };
  }

  async listByPost(postId: number, includeNonPublic = false) {
    const post = await this.prisma.post.findFirst({ where: { id: postId, deleted_at: null } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    const comments = await this.prisma.comment.findMany({
      where: {
        post_id: postId, deleted_at: null,
        ...(includeNonPublic ? {} : { moderation_status: ModerationStatus.published }),
      },
      include: { author: true },
      orderBy: { created_at: 'asc' },
    });

    const mapped = comments.map((c) => this.mapComment(c));
    return this.buildTree(mapped);
  }

  private buildTree(comments: ReturnType<CommentsService['mapComment']>[]) {
    type Node = (typeof comments)[0] & { children: Node[] };
    const map = new Map<string, Node>();
    const roots: Node[] = [];

    comments.forEach((c) => map.set(c.id, { ...c, children: [] }));
    map.forEach((node) => {
      if (node.parentId && map.has(node.parentId)) map.get(node.parentId)!.children.push(node);
      else if (!node.parentId) roots.push(node);
    });
    return roots;
  }

  async add(postId: number, dto: CreateCommentDto, user: AuthUserPayload) {
    const post = await this.prisma.post.findFirst({ 
      where: { id: postId, deleted_at: null },
      select: { id: true, author_id: true, title: true }
    });
    if (!post) throw new NotFoundException('Bài viết không tồn tại');

    let finalParentId = dto.parentId ?? null;
    let targetAuthorId: number | null = null;

    if (finalParentId) {
      const parent = await this.prisma.comment.findFirst({
        where: { id: finalParentId, post_id: postId, deleted_at: null, moderation_status: ModerationStatus.published },
      });
      if (!parent) throw new NotFoundException('Bình luận cha không tồn tại');
      targetAuthorId = parent.author_id;
      if (parent.parent_id !== null) finalParentId = parent.parent_id;
    }

    const scan = await scanContent(this.prisma, dto.body.trim());

    const comment = await this.prisma.$transaction(async (tx) => {
      const c = await tx.comment.create({
        data: {
          post_id: postId,
          author_id: user.id,
          parent_id: finalParentId,
          content: dto.body.trim(),
          moderation_status: scan.status,
          matched_words: scan.matchedWords.length ? scan.matchedWords : [],
        },
        include: { author: true }, 
      });

      if (!finalParentId && scan.status === ModerationStatus.published) {
        await tx.post.update({ where: { id: postId }, data: { answer_count: { increment: 1 } } });
      }
      return c;
    });

    if (scan.status === ModerationStatus.published) {
      if (targetAuthorId && targetAuthorId !== user.id) {
         await this.notiService.createNotification({
           userId: targetAuthorId,
           senderId: user.id,
           postId: postId,
           commentId: comment.id,
           type: 'reply' as any,
           title: 'Có người trả lời bình luận',
           content: `${comment.author.full_name} vừa trả lời bình luận của bạn.`,
           linkPath: `/questions/${postId}#comment-${comment.id}`,
         });
      } else if (!finalParentId && post.author_id !== user.id) {
         await this.notiService.createNotification({
           userId: post.author_id,
           senderId: user.id,
           postId: postId,
           commentId: comment.id,
           type: 'comment' as any,
           title: 'Bình luận mới',
           content: `${comment.author.full_name} vừa bình luận bài viết "${post.title}".`,
           linkPath: `/questions/${postId}#comment-${comment.id}`,
         });
      }
    }
    return this.mapComment(comment);
  }

  async update(commentId: number, userId: number, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findFirst({ 
      where: { id: commentId, deleted_at: null }, include: { author: true } 
    });
    if (!comment) throw new NotFoundException('Không tìm thấy bình luận!');
    if (comment.author_id !== userId) throw new ForbiddenException('Không có quyền sửa!');

    const oldStatus = comment.moderation_status;
    const scan = await scanContent(this.prisma, dto.body.trim());
    const newStatus = scan.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      const c = await tx.comment.update({
        where: { id: commentId },
        data: { 
          content: dto.body.trim(),
          moderation_status: newStatus,
          matched_words: scan.matchedWords.length ? scan.matchedWords : [],
        },
        include: { author: true },
      });

      if (!comment.parent_id) {
        if (oldStatus === ModerationStatus.published && newStatus !== ModerationStatus.published) {
          await tx.post.update({ where: { id: comment.post_id }, data: { answer_count: { decrement: 1 } } });
        } else if (oldStatus !== ModerationStatus.published && newStatus === ModerationStatus.published) {
          await tx.post.update({ where: { id: comment.post_id }, data: { answer_count: { increment: 1 } } });
        }
      }
      return c;
    });

    return this.mapComment(updated);
  }

  async remove(commentId: number, userId: number, userRole: string) {
    const comment = await this.prisma.comment.findFirst({ where: { id: commentId, deleted_at: null } });
    if (!comment) throw new NotFoundException('Bình luận không tồn tại!');
    if (comment.author_id !== userId && userRole !== 'admin') throw new ForbiddenException('Không có quyền xóa!');

    await this.prisma.$transaction(async (tx) => {
      await tx.comment.update({ where: { id: commentId }, data: { deleted_at: new Date() } });
      if (!comment.parent_id && comment.moderation_status === ModerationStatus.published) {
        await tx.post.update({ where: { id: comment.post_id }, data: { answer_count: { decrement: 1 } } });
      }
    });
    return { success: true };
  }
}