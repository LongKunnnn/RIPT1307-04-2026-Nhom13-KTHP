import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PostsService } from '../posts/posts.service';
import type { AuthUserPayload } from '../../common/utils/helpers';
import { ListPostsQueryDto } from '../posts/dto/posts.dto';

@Injectable()
export class FollowsService {
  constructor(
    private prisma: PrismaService,
    private postsService: PostsService,
  ) {}

  async isFollowing(userId: number, postId: number): Promise<boolean> {
    const row = await this.prisma.postFollow.findUnique({
      where: { user_id_post_id: { user_id: userId, post_id: postId } },
    });
    return !!row;
  }

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
