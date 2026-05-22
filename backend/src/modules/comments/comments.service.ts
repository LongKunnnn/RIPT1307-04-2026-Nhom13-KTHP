import { Injectable, NotFoundException } from '@nestjs/common';
import { ModerationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toFrontendRole, AuthUserPayload } from '../../common/utils/helpers';
import { scanContent, sumVoteScore } from '../../common/utils/content-moderation';
import { CreateCommentDto } from './dto/comments.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  private async mapComment(c: {
    id: number;
    post_id: number;
    parent_id: number | null;
    content: string;
    author_id: number;
    is_accepted: boolean;
    created_at: Date;
    moderation_status: ModerationStatus;
    moderation_note: string | null;
    matched_words: unknown;
    author: { full_name: string; username: string; role: string };
  }) {
    const matchedWords = Array.isArray(c.matched_words)
      ? (c.matched_words as string[])
      : undefined;

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

  async listByPost(postId: number, includeNonPublic = false) {
    const post = await this.prisma.post.findFirst({ where: { id: postId, deleted_at: null } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    const comments = await this.prisma.comment.findMany({
      where: {
        post_id: postId,
        deleted_at: null,
        ...(includeNonPublic ? {} : { moderation_status: ModerationStatus.published }),
      },
      include: { author: true },
      orderBy: { created_at: 'asc' },
    });

    const mapped = await Promise.all(comments.map((c) => this.mapComment(c)));
    return this.buildTree(mapped);
  }

  private buildTree(
    comments: Awaited<ReturnType<CommentsService['mapComment']>>[],
  ) {
    type Node = (typeof comments)[0] & { children: Node[] };
    const map = new Map<string, Node>();
    const roots: Node[] = [];

    comments.forEach((c) => map.set(c.id, { ...c, children: [] }));
    map.forEach((node) => {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node);
      } else if (!node.parentId) {
        roots.push(node);
      }
    });

    return roots;
  }

  async add(postId: number, dto: CreateCommentDto, user: AuthUserPayload) {
    const post = await this.prisma.post.findFirst({ where: { id: postId, deleted_at: null } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    const text = dto.body.trim();
    const scan = await scanContent(this.prisma, text);

    const comment = await this.prisma.comment.create({
      data: {
        post_id: postId,
        author_id: user.id,
        parent_id: dto.parentId ?? null,
        content: text,
        moderation_status: scan.status,
        matched_words: scan.matchedWords.length ? scan.matchedWords : undefined,
      },
      include: { author: true },
    });

    if (!dto.parentId && scan.status === ModerationStatus.published) {
      await this.prisma.post.update({
        where: { id: postId },
        data: { answer_count: { increment: 1 } },
      });
    }

    return this.mapComment(comment);
  }
}
