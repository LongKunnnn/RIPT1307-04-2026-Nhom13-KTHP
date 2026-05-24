import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeaderboard(scope: 'global' | 'tag' = 'global', tag?: string, limit: number = 10) {
    // 1. Nếu lấy Top Global (Toàn cầu) -> Dùng đúng logic gốc của mày
    if (scope === 'global' || !tag) {
      return this.prisma.user.findMany({
        take: limit,
        orderBy: {
          reward_points: 'desc', // Sắp xếp theo điểm thưởng từ cao xuống thấp
        },
        select: {
          id: true,
          username: true,
          full_name: true,
          avatar_url: true,
          faculty: true,
          reward_points: true,
        },
      });
    }

    // 2. Nếu lấy Top theo Tag (FE yêu cầu)
    // Lấy những user CÓ BÀI VIẾT thuộc Tag đó, và vẫn xếp hạng theo điểm
    return this.prisma.user.findMany({
      take: limit,
      where: {
        posts: {
          some: {
            post_tags: {
              some: {
                tag: { name: tag },
              },
            },
            deleted_at: null, // Chỉ tính bài viết chưa bị xóa
          },
        },
      },
      orderBy: {
        reward_points: 'desc',
      },
      select: {
        id: true,
        username: true,
        full_name: true,
        avatar_url: true,
        faculty: true,
        reward_points: true,
      },
    });
  }
}