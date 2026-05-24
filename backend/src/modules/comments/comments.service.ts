import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ModerationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toFrontendRole, AuthUserPayload } from '../../common/utils/helpers';
import { scanContent, sumVoteScore } from '../../common/utils/content-moderation';
import { CreateCommentDto, UpdateCommentDto } from './dto/comments.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  private async mapComment(c: any) {
    const matchedWords = Array.isArray(c.matched_words) ? (c.matched_words as string[]) : undefined;

    return {
      id: String(c.id),
      postId: String(c.post_id),
      parentId: c.parent_id ? String(c.parent_id) : null,
      body: c.content,
      authorId: String(c.author_id),
      authorName: c.author.full_name,
      authorUsername: c.author.username,
      authorRole: toFrontendRole(c.author.role),
      createdAt: c.created_at.toISOString(),
      voteScore: await sumVoteScore(this.prisma, c.id, 'comment'),
      isAccepted: c.is_accepted,
      moderationStatus: c.moderation_status,
      moderationFlags: matchedWords?.length ? matchedWords : undefined,
      moderationNote: c.moderation_note ?? undefined,
    };
  }

  // LẤY DANH SÁCH & RÁP CÂY (Giữ nguyên của FE)
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

    const mapped = await Promise.all(comments.map((c) => this.mapComment(c)));
    return this.buildTree(mapped);
  }

  private buildTree(comments: Awaited<ReturnType<CommentsService['mapComment']>>[]) {
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

  // TẠO MỚI (Mix kiểm duyệt của FE + Logic Reply 2 cấp của BE)
  async add(postId: number, dto: CreateCommentDto, user: AuthUserPayload) {
    const post = await this.prisma.post.findFirst({ where: { id: postId, deleted_at: null } });
    if (!post) throw new NotFoundException('Bài viết này không tồn tại hoặc đã bị bay màu!');

    let finalParentId = dto.parentId ?? null;

    // 🟢 Logic của Lead: Ép Reply về tối đa 2 cấp
    if (finalParentId) {
      const parentComment = await this.prisma.comment.findFirst({
        where: { id: finalParentId, post_id: postId, deleted_at: null },
      });
      if (!parentComment) throw new NotFoundException('Bình luận cha không tồn tại!');
      
      // Nếu thằng cha lại có cha nữa -> Bắt nó bám vào root cha để không bị thò thụt sâu vô hạn
      if (parentComment.parent_id !== null) {
        finalParentId = parentComment.parent_id;
      }
    }

    const text = dto.body.trim();
    const scan = await scanContent(this.prisma, text);

    const comment = await this.prisma.comment.create({
      data: {
        post_id: postId,
        author_id: user.id,
        parent_id: finalParentId,
        content: text,
        moderation_status: scan.status,
        matched_words: scan.matchedWords.length ? scan.matchedWords : undefined,
      },
      include: { author: true },
    });

    // Cộng lượt trả lời cho bài viết nếu là cmt gốc
    if (!finalParentId && scan.status === ModerationStatus.published) {
      await this.prisma.post.update({ where: { id: postId }, data: { answer_count: { increment: 1 } } });
    }

    return this.mapComment(comment);
  }

  // SỬA BÌNH LUẬN (Của BE)
  async update(commentId: number, userId: number, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, deleted_at: null }, include: { author: true }
    });

    if (!comment) throw new NotFoundException('Không tìm thấy bình luận!');
    if (comment.author_id !== userId) throw new ForbiddenException('Chỉ chính chủ mới được phép sửa bình luận này!');

    const text = dto.body.trim();
    const scan = await scanContent(this.prisma, text); // Quét lại từ ngữ vi phạm khi sửa

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: { 
        content: text,
        moderation_status: scan.status,
        matched_words: scan.matchedWords.length ? scan.matchedWords : undefined,
      },
      include: { author: true },
    });

    return this.mapComment(updated);
  }

  // XÓA BÌNH LUẬN (Của BE)
  async remove(commentId: number, userId: number, userRole: string) {
    const comment = await this.prisma.comment.findFirst({ where: { id: commentId, deleted_at: null } });
    if (!comment) throw new NotFoundException('Bình luận không tồn tại!');
    if (comment.author_id !== userId && userRole !== 'admin') {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này!');
    }

    await this.prisma.comment.update({ where: { id: commentId }, data: { deleted_at: new Date() } });

    // Trừ lượt trả lời của bài viết nếu xóa cmt gốc
    if (!comment.parent_id && comment.moderation_status === ModerationStatus.published) {
      await this.prisma.post.update({ where: { id: comment.post_id }, data: { answer_count: { decrement: 1 } } });
    }

    return { success: true };
  }
}