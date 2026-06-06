import { Injectable, NotFoundException } from '@nestjs/common';
import { TargetType, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { AuthUserPayload } from '../../common/utils/helpers';
import { VoteDto } from './dto/votes.dto';

const POINT_UPVOTE = 10;
const POINT_DOWNVOTE = -2;

@Injectable()
export class VotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notiService: NotificationsService,
  ) {}

  async getUserVote(targetType: 'post' | 'comment', targetId: number, userId: number) {
    const v = await this.prisma.vote.findUnique({
      where: {
        user_id_target_id_target_type: {
          user_id: userId,
          target_id: targetId,
          target_type: targetType as TargetType,
        },
      },
    });
    return v ? (v.vote_value as 1 | -1) : 0;
  }

  async vote(dto: VoteDto, user: AuthUserPayload) {
    const { targetId, value } = dto;
    const targetType = dto.targetType as TargetType;
    let authorId: number;

    // 1. Lấy thông tin tác giả
    if (targetType === 'post') {
      const post = await this.prisma.post.findUnique({
        where: { id: targetId, deleted_at: null },
        select: { author_id: true },
      });
      if (!post) throw new NotFoundException('Bài viết không tồn tại!');
      authorId = post.author_id;
    } else {
      const comment = await this.prisma.comment.findUnique({
        where: { id: targetId, deleted_at: null },
        select: { author_id: true },
      });
      if (!comment) throw new NotFoundException('Bình luận không tồn tại!');
      authorId = comment.author_id;
    }

    const existingVote = await this.prisma.vote.findUnique({
      where: {
        user_id_target_id_target_type: {
          user_id: user.id,
          target_id: targetId,
          target_type: targetType,
        },
      },
    });

    // 2. Transaction xử lý dữ liệu
    const finalScore = await this.prisma.$transaction(async (tx) => {
      if (!existingVote) {
        await tx.vote.create({
          data: { user_id: user.id, target_id: targetId, target_type: targetType, vote_value: value },
        });
        await this.updateAuthorPoints(tx, authorId, value === 1 ? POINT_UPVOTE : POINT_DOWNVOTE);
        return this.updateVoteScore(tx, targetType, targetId);
      }

      if (existingVote.vote_value === value) {
        await tx.vote.delete({ where: { id: existingVote.id } });
        await this.updateAuthorPoints(tx, authorId, value === 1 ? -POINT_UPVOTE : -POINT_DOWNVOTE);
        return this.updateVoteScore(tx, targetType, targetId);
      }

      await tx.vote.update({
        where: { id: existingVote.id },
        data: { vote_value: value },
      });
      const pointDelta = value === 1 
        ? (Math.abs(POINT_DOWNVOTE) + POINT_UPVOTE) 
        : -(POINT_UPVOTE + Math.abs(POINT_DOWNVOTE));
      await this.updateAuthorPoints(tx, authorId, pointDelta);
      return this.updateVoteScore(tx, targetType, targetId);
    }, { timeout: 30000 });

    // 3. Bắn thông báo (Ngoài transaction để đảm bảo performance)
    if (value === 1 && authorId !== user.id) {
      this.notiService.createNotification({
        userId: authorId,
        senderId: user.id,
        postId: targetType === 'post' ? targetId : undefined,
        commentId: targetType === 'comment' ? targetId : undefined,
        type: NotificationType.vote, // Dùng đúng Enum trong schema
        title: 'Đánh giá hữu ích',
        content: `Có người vừa Upvote ${targetType === 'post' ? 'bài viết' : 'bình luận'} của bạn.`,
        linkPath: targetType === 'post' ? `/questions/${targetId}` : `/questions/${targetId}`,
      }).catch(err => console.error("DEBUG [NOTI ERROR]:", err));
    }

    return { score: finalScore };
  }

  private async updateAuthorPoints(tx: any, authorId: number, delta: number) {
    if (delta === 0) return;
    await tx.user.update({
      where: { id: authorId },
      data: { reward_points: { increment: delta } },
    });
  }

  private async updateVoteScore(tx: any, targetType: TargetType, targetId: number): Promise<number> {
    const agg = await tx.vote.aggregate({
      where: { target_id: targetId, target_type: targetType },
      _sum: { vote_value: true },
    });
    const newScore = agg._sum.vote_value ?? 0;
    
    if (targetType === TargetType.post) {
      await tx.post.update({ where: { id: targetId }, data: { vote_score: newScore } });
    } else {
      await tx.comment.update({ where: { id: targetId }, data: { vote_score: newScore } });
    }
    return newScore;
  }
}