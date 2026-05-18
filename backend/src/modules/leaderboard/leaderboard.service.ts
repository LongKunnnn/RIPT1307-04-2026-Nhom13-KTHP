import { Injectable } from '@nestjs/common';
import { ModerationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { difficultyWeight } from '../../common/utils/difficulty';
import { toFrontendRole } from '../../common/utils/helpers';

export type LeaderboardScope = 'global' | 'tag';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getLeaderboard(scope: LeaderboardScope, tag?: string, limit = 8) {
    const users = await this.prisma.user.findMany({
      where: { is_active: true },
      select: {
        id: true,
        full_name: true,
        role: true,
        reward_points: true,
        posts: {
          where: { deleted_at: null, moderation_status: ModerationStatus.published },
          select: {
            avg_rating: true,
            rating_count: true,
            difficulty: true,
            post_tags: { select: { tag: { select: { name: true } } } },
          },
        },
        comments: {
          where: { deleted_at: null, parent_id: null, is_accepted: true },
          select: { id: true },
        },
      },
    });

    const scored = users.map((u) => {
      const postsInScope =
        scope === 'tag' && tag?.trim()
          ? u.posts.filter((p) => p.post_tags.some((pt) => pt.tag.name === tag.trim()))
          : u.posts;

      const reputation = postsInScope.reduce((sum, p) => {
        const w = difficultyWeight(p.difficulty);
        return sum + p.avg_rating * p.rating_count * w;
      }, 0);

      const acceptedAnswers = scope === 'global' ? u.comments.length : 0;
      const points = Math.round(
        (scope === 'global' ? u.reward_points : 0) + reputation + acceptedAnswers * 12,
      );

      return {
        userId: String(u.id),
        name: u.full_name,
        role: toFrontendRole(u.role),
        points,
        rewardPoints: u.reward_points,
        reputation: Math.round(reputation),
        acceptedAnswers,
        ratedPosts: postsInScope.filter((p) => p.rating_count > 0).length,
      };
    });

    return scored
      .filter((u) => u.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
  }
}
