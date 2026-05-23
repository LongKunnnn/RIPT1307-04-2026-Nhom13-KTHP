import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowsService {
  constructor(private readonly prisma: PrismaService) {}

  // 🔄 1. TOGGLE: Đã refactor Clean Code
  async toggleFollow(currentUserId: number, targetUserId: number) {
    if (currentUserId === targetUserId) throw new BadRequestException('Không thể tự follow mình!');

    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('Người dùng không tồn tại!');

    // Gom key lại cho sạch theo đúng feedback
    const followKey = {
      follower_id_following_id: {
        follower_id: currentUserId,
        following_id: targetUserId,
      },
    };

    const existingFollow = await this.prisma.userFollow.findUnique({ where: followKey });

    if (existingFollow) {
      await this.prisma.userFollow.delete({ where: followKey });
      return { message: 'Đã hủy theo dõi!', isFollowing: false };
    }

    await this.prisma.userFollow.create({
      data: { follower_id: currentUserId, following_id: targetUserId },
    });
    return { message: 'Đã theo dõi thành công!', isFollowing: true };
  }

  async getFollowers(targetUserId: number, currentUserId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const followers = await this.prisma.userFollow.findMany({
      where: { following_id: targetUserId },
      skip,
      take: limit,
      include: {
        follower: { select: { id: true, username: true, full_name: true, avatar_url: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return this.mapIsFollowing(followers, currentUserId, 'follower');
  }

  async getFollowings(targetUserId: number, currentUserId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const followings = await this.prisma.userFollow.findMany({
      where: { follower_id: targetUserId },
      skip,
      take: limit,
      include: {
        following: { select: { id: true, username: true, full_name: true, avatar_url: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return this.mapIsFollowing(followings, currentUserId, 'following');
  }

  private async mapIsFollowing(dataList: any[], currentUserId: number, relationField: 'follower' | 'following') {
    if (!dataList.length) return [];

    const userIdsToCheck = dataList.map((item) => item[relationField].id);

    const currentUserFollowings = await this.prisma.userFollow.findMany({
      where: {
        follower_id: currentUserId,
        following_id: { in: userIdsToCheck },
      },
      select: { following_id: true },
    });

    const followingSet = new Set(currentUserFollowings.map((f) => f.following_id));

    // Map kết quả trả về cho FE
    return dataList.map((item) => ({
      ...item[relationField],
      isFollowing: followingSet.has(item[relationField].id),
    }));
  }
}