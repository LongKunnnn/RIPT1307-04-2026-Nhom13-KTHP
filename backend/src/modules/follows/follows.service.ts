import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PostsService } from '../posts/posts.service';
import type { AuthUserPayload } from '../../common/utils/helpers';
import { ListPostsQueryDto } from '../posts/dto/posts.dto';

@Injectable()
export class FollowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postsService: PostsService,
  ) {}

  // ==============================================================
  // 🟢 PHẦN 1: TÍNH NĂNG THEO DÕI NGƯỜI DÙNG
  // ==============================================================

  async toggleFollow(currentUserId: number, targetUserId: number) {
    if (currentUserId === targetUserId) throw new BadRequestException('Không thể tự follow mình!');

    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('Người dùng không tồn tại!');

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

    return dataList.map((item) => ({
      ...item[relationField],
      isFollowing: followingSet.has(item[relationField].id),
    }));
  }

  // ==============================================================
  // 🔵 PHẦN 2: TÍNH NĂNG THEO DÕI BÀI VIẾT 
  // ==============================================================

  async isFollowing(userId: number, postId: number): Promise<boolean> {
    const row = await this.prisma.postFollow.findUnique({
      where: { user_id_post_id: { user_id: userId, post_id: postId } },
    });
    return !!row;
  }

  // Tên gốc FE đặt là toggle, tao giữ nguyên để UI nó không lỗi
  async toggle(userId: number, postId: number): Promise<boolean> {
    const post = await this.prisma.post.findFirst({ where: { id: postId, deleted_at: null } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    const existing = await this.prisma.postFollow.findUnique({
      where: { user_id_post_id: { user_id: userId, post_id: postId } },
    });

    if (existing) {
      await this.prisma.postFollow.delete({
        where: { user_id_post_id: { user_id: userId, post_id: postId } },
      });
      return false;
    }

    await this.prisma.postFollow.create({
      data: { user_id: userId, post_id: postId },
    });
    return true;
  }

  async getFollowedPostIds(userId: number): Promise<string[]> {
    const rows = await this.prisma.postFollow.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
    return rows.map((r) => String(r.post_id));
  }

  async countFollowed(userId: number): Promise<number> {
    return this.prisma.postFollow.count({ where: { user_id: userId } });
  }

  async listFollowedPosts(userId: number, query: ListPostsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const follows = await this.prisma.postFollow.findMany({
      where: {
        user_id: userId,
        post: { moderation_status: 'published', deleted_at: null },
      },
      include: {
        post: {
          include: { author: true, post_tags: { include: { tag: true } } },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const total = follows.length;
    const slice = follows.slice((page - 1) * pageSize, page * pageSize);
    const items = await Promise.all(
      slice.map((f) => this.postsService.mapPost(f.post, userId)),
    );

    return { items, total, page, pageSize };
  }
}