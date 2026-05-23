import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const POINT_UPVOTE = 10;
const POINT_DOWNVOTE = -2;

@Injectable()
export class VoteService {
  constructor(private readonly prisma: PrismaService) {}

  async handleVote(userId: number, targetId: number, targetType: 'post' | 'comment', value: number) {
    const dbTargetType = targetType.toUpperCase() as any;
    let authorId: number;

    if (targetType === 'post') {
      const post = await this.prisma.post.findUnique({
        where: { id: targetId, deleted_at: null },
        select: { author_id: true }, // Chỉ lôi đúng cái id tác giả cho nhẹ DB
      });
      if (!post) throw new NotFoundException('Bài viết không tồn tại hoặc đã bị xóa!');
      authorId = post.author_id;
    } else {
      const comment = await this.prisma.comment.findUnique({
        where: { id: targetId, deleted_at: null },
        select: { author_id: true },
      });
      if (!comment) throw new NotFoundException('Bình luận không tồn tại hoặc đã bị xóa!');
      authorId = comment.author_id;
    }

    const existingVote = await this.prisma.vote.findUnique({
      where: {
        user_id_target_id_target_type: {
          user_id: userId,
          target_id: targetId,
          target_type: dbTargetType,
        },
      },
    });

    return this.prisma.$transaction(async (tx) => {
      
      if (!existingVote) {
        await tx.vote.create({
          data: { user_id: userId, target_id: targetId, target_type: dbTargetType, vote_value: value },
        });

        await this.updateCounters(tx, targetType, targetId, value === 1 ? 'INCREMENT_UP' : 'INCREMENT_DOWN');
        await this.updateAuthorPoints(tx, authorId, value === 1 ? POINT_UPVOTE : POINT_DOWNVOTE);
        
        return { message: 'Vote thành công!', action: 'CREATED' };
      }

      if (existingVote.vote_value === value) {
        await tx.vote.delete({ where: { id: existingVote.id } });

        await this.updateCounters(tx, targetType, targetId, value === 1 ? 'DECREMENT_UP' : 'DECREMENT_DOWN');
        await this.updateAuthorPoints(tx, authorId, value === 1 ? -POINT_UPVOTE : -POINT_DOWNVOTE);

        return { message: 'Đã rút lại vote.', action: 'DELETED' };
      }

      await tx.vote.update({
        where: { id: existingVote.id },
        data: { vote_value: value },
      });

      const pointDelta = value === 1 
        ? (Math.abs(POINT_DOWNVOTE) + POINT_UPVOTE) 
        : -(POINT_UPVOTE + Math.abs(POINT_DOWNVOTE));

      await this.updateCounters(tx, targetType, targetId, value === 1 ? 'FLIP_TO_UP' : 'FLIP_TO_DOWN');
      await this.updateAuthorPoints(tx, authorId, pointDelta);

      return { message: 'Đã đảo chiều vote!', action: 'UPDATED' };
    });
  }

  private async updateCounters(tx: any, targetType: 'post' | 'comment', targetId: number, action: string) {
    const model = targetType === 'post' ? tx.post : tx.comment;
    switch (action) {
      case 'INCREMENT_UP': await model.update({ where: { id: targetId }, data: { upvote_count: { increment: 1 } } }); break;
      case 'INCREMENT_DOWN': await model.update({ where: { id: targetId }, data: { downvote_count: { increment: 1 } } }); break;
      case 'DECREMENT_UP': await model.update({ where: { id: targetId }, data: { upvote_count: { decrement: 1 } } }); break;
      case 'DECREMENT_DOWN': await model.update({ where: { id: targetId }, data: { downvote_count: { decrement: 1 } } }); break;
      case 'FLIP_TO_UP': await model.update({ where: { id: targetId }, data: { upvote_count: { increment: 1 }, downvote_count: { decrement: 1 } } }); break;
      case 'FLIP_TO_DOWN': await model.update({ where: { id: targetId }, data: { upvote_count: { decrement: 1 }, downvote_count: { increment: 1 } } }); break;
    }
  }

  private async updateAuthorPoints(tx: any, authorId: number, delta: number) {
    if (delta === 0) return;
    await tx.user.update({
      where: { id: authorId },
      data: { reward_points: { increment: delta } },
    });
  }
}