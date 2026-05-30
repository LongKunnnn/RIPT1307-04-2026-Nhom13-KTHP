import { Injectable, NotFoundException } from '@nestjs/common';
import { TargetType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { sumVoteScore } from '../../common/utils/content-moderation';
import type { AuthUserPayload } from '../../common/utils/helpers';
import { VoteDto } from './dto/votes.dto';

const POINT_UPVOTE = 10;
const POINT_DOWNVOTE = -2;

@Injectable()
export class VotesService {
  constructor(private readonly prisma: PrismaService) {}

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

    if (targetType === 'post') {
      const post = await this.prisma.post.findUnique({
        where: { id: targetId, deleted_at: null },
        select: { author_id: true },
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

    //Tự vote cho chính mình -> Khóa điểm
    let isShadowBanned = user.id === authorId; 

    // 2. Thuật toán Check Var: Quét xem có phải nick clone bơm điểm không
    if (!isShadowBanned) {
      isShadowBanned = await this.checkCloneActivity(user.id, authorId);
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

    await this.prisma.$transaction(async (tx) => {
      // TH1: Chưa vote bao giờ
      if (!existingVote) {
        await tx.vote.create({
          data: { user_id: user.id, target_id: targetId, target_type: targetType, vote_value: value },
        });
        
        const delta = isShadowBanned ? 0 : (value === 1 ? POINT_UPVOTE : POINT_DOWNVOTE);
        await this.updateAuthorPoints(tx, authorId, delta);
        return;
      }

      if (existingVote.vote_value === value) {
        await tx.vote.delete({ where: { id: existingVote.id } });
        const delta = isShadowBanned ? 0 : (value === 1 ? -POINT_UPVOTE : -POINT_DOWNVOTE);
        await this.updateAuthorPoints(tx, authorId, delta);
        return;
      }

      await tx.vote.update({
        where: { id: existingVote.id },
        data: { vote_value: value },
      });
      
      let pointDelta = value === 1 
        ? (Math.abs(POINT_DOWNVOTE) + POINT_UPVOTE) 
        : -(POINT_UPVOTE + Math.abs(POINT_DOWNVOTE));
      
      if (isShadowBanned) pointDelta = 0; // Đóng băng điểm nếu là clone

      await this.updateAuthorPoints(tx, authorId, pointDelta);
    });

    const score = await sumVoteScore(this.prisma, targetId, dto.targetType);
    return { score };
  }

  // ==========================================
  // HÀM KIỂM TRA GIAN LẬN: THE CLONE DETECTOR
  // ==========================================
  private async checkCloneActivity(voterId: number, authorId: number): Promise<boolean> {
    const totalVotes = await this.prisma.vote.count({
      where: { user_id: voterId }
    });

    // Nếu mới đi vote dạo dưới 5 lần thì cho qua
    if (totalVotes <= 5) return false; 


    const [authorPosts, authorComments] = await Promise.all([
      this.prisma.post.findMany({ where: { author_id: authorId }, select: { id: true } }),
      this.prisma.comment.findMany({ where: { author_id: authorId }, select: { id: true } })
    ]);

    const postIds = authorPosts.map(p => p.id);
    const commentIds = authorComments.map(c => c.id);

    const votesForThisAuthor = await this.prisma.vote.count({
      where: {
        user_id: voterId,
        OR: [
          { target_type: 'post', target_id: { in: postIds } },
          { target_type: 'comment', target_id: { in: commentIds } }
        ]
      }
    });

    return (votesForThisAuthor / totalVotes) >= 0.8;
  }
  private async updateAuthorPoints(tx: any, authorId: number, delta: number) {
    if (delta === 0) return; 
    await tx.user.update({
      where: { id: authorId },
      data: { reward_points: { increment: delta } },
    });
  }
}