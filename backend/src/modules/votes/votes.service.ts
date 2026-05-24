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

    // 1. Lấy thông tin tác giả để cộng/trừ điểm thưởng (Bỏ upvote_count và downvote_count đi vì DB không có)
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

    const existingVote = await this.prisma.vote.findUnique({
      where: {
        user_id_target_id_target_type: {
          user_id: user.id,
          target_id: targetId,
          target_type: targetType,
        },
      },
    });

    // 2. Dùng Transaction để xử lý Vote và Điểm uy tín
    await this.prisma.$transaction(async (tx) => {
      // TH1: Chưa vote bao giờ
      if (!existingVote) {
        await tx.vote.create({
          data: { user_id: user.id, target_id: targetId, target_type: targetType, vote_value: value },
        });
        await this.updateAuthorPoints(tx, authorId, value === 1 ? POINT_UPVOTE : POINT_DOWNVOTE);
        return;
      }

      // TH2: Bấm lại nút cũ -> Hủy vote
      if (existingVote.vote_value === value) {
        await tx.vote.delete({ where: { id: existingVote.id } });
        await this.updateAuthorPoints(tx, authorId, value === 1 ? -POINT_UPVOTE : -POINT_DOWNVOTE);
        return;
      }

      // TH3: Đảo chiều vote
      await tx.vote.update({
        where: { id: existingVote.id },
        data: { vote_value: value },
      });
      const pointDelta = value === 1 
        ? (Math.abs(POINT_DOWNVOTE) + POINT_UPVOTE) 
        : -(POINT_UPVOTE + Math.abs(POINT_DOWNVOTE));
      await this.updateAuthorPoints(tx, authorId, pointDelta);
    });

    // 3. Tính điểm thực tế trả về cho FE bằng hàm chuẩn
    const score = await sumVoteScore(this.prisma, targetId, dto.targetType);
    return { score };
  }

  private async updateAuthorPoints(tx: any, authorId: number, delta: number) {
    if (delta === 0) return;
    await tx.user.update({
      where: { id: authorId },
      data: { reward_points: { increment: delta } },
    });
  }
}