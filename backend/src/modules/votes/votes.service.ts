import { Injectable } from '@nestjs/common';
import { TargetType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { sumVoteScore } from '../../common/utils/content-moderation';
import { VoteDto } from './dto/votes.dto';
import type { AuthUserPayload } from '../../common/utils/helpers';

@Injectable()
export class VotesService {
  constructor(private prisma: PrismaService) {}

  async vote(dto: VoteDto, user: AuthUserPayload) {
    const targetType = dto.targetType as TargetType;

    const existing = await this.prisma.vote.findUnique({
      where: {
        user_id_target_id_target_type: {
          user_id: user.id,
          target_id: dto.targetId,
          target_type: targetType,
        },
      },
    });

    if (existing) {
      if (existing.vote_value === dto.value) {
        await this.prisma.vote.delete({ where: { id: existing.id } });
      } else {
        await this.prisma.vote.update({
          where: { id: existing.id },
          data: { vote_value: dto.value },
        });
      }
    } else {
      await this.prisma.vote.create({
        data: {
          user_id: user.id,
          target_id: dto.targetId,
          target_type: targetType,
          vote_value: dto.value,
        },
      });
    }

    const score = await sumVoteScore(this.prisma, dto.targetId, dto.targetType);
    return { score };
  }

  async getUserVote(targetType: 'post' | 'comment', targetId: number, userId: number) {
    const v = await this.prisma.vote.findUnique({
      where: {
        user_id_target_id_target_type: {
          user_id: userId,
          target_id: targetId,
          target_type: targetType,
        },
      },
    });
    return v ? (v.vote_value as 1 | -1) : 0;
  }
}
