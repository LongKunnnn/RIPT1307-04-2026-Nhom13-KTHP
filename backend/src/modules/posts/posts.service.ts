import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ModerationStatus, PostDifficulty, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { makeExcerpt, slugify, toFrontendRole, AuthUserPayload } from '../../common/utils/helpers';
import { scanContent, sumVoteScore } from '../../common/utils/content-moderation';
import { CreatePostDto, ListPostsQueryDto, UpdatePostDto } from './dto/posts.dto';

type PostWithRelations = Prisma.PostGetPayload<{
  include: { author: true; post_tags: { include: { tag: true } } };
}>;

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) { }

  async mapPost(post: PostWithRelations, viewerId?: number) {
    const matchedWords = Array.isArray(post.matched_words) ? (post.matched_words as string[]) : undefined;

    return {
      id: String(post.id),
      title: post.title,
      excerpt: post.excerpt ?? makeExcerpt(post.content),
      body: post.content,
      tags: post.post_tags.map((pt) => pt.tag.name),
      authorId: String(post.author_id),
      authorName: post.author.full_name,
      authorUsername: post.author.username,
      authorRole: toFrontendRole(post.author.role),
      createdAt: post.created_at.toISOString(),
      voteScore: await sumVoteScore(this.prisma, post.id, 'post'),
      answerCount: post.answer_count,
      viewCount: post.view_count,
      bounty: post.bounty > 0 ? post.bounty : undefined,
      difficulty: post.difficulty,
      avgRating: post.avg_rating,
      ratingCount: post.rating_count,
      acceptedCommentId: post.accepted_comment_id ? String(post.accepted_comment_id) : undefined,
      moderationStatus: post.moderation_status,
      moderationFlags: matchedWords?.length ? matchedWords : undefined,
      moderationNote: post.moderation_note ?? undefined,
      isAuthor: viewerId === post.author_id,
    };
  }

  async list(query: ListPostsQueryDto, viewer?: AuthUserPayload | null) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where: Prisma.PostWhereInput = { deleted_at: null };

    if (query.authorId) where.author_id = query.authorId;
    else if (!query.includeNonPublic) where.moderation_status = ModerationStatus.published;

    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [{ title: { contains: q } }, { content: { contains: q } }, { excerpt: { contains: q } }];
    }

    if (query.tag?.trim()) where.post_tags = { some: { tag: { name: { equals: query.tag.trim() } } } };
    if (query.difficulty) where.difficulty = query.difficulty as PostDifficulty;
    if (query.sort === 'unanswered') where.answer_count = 0;

    let orderBy: Prisma.PostOrderByWithRelationInput = { created_at: 'desc' };
    if (query.sort === 'rating') orderBy = { avg_rating: 'desc' };

    const include = { author: true, post_tags: { include: { tag: true } } };
    let items: PostWithRelations[];
    let total: number;

    if (query.sort === 'active') {
      const all = await this.prisma.post.findMany({ where, include });
      const withActivity = await Promise.all(
        all.map(async (p) => {
          const lastComment = await this.prisma.comment.findFirst({
            where: { post_id: p.id, deleted_at: null }, orderBy: { created_at: 'desc' },
          });
          const activity = lastComment ? Math.max(p.created_at.getTime(), lastComment.created_at.getTime()) : p.created_at.getTime();
          return { p, activity };
        }),
      );
      withActivity.sort((a, b) => b.activity - a.activity);
      total = withActivity.length;
      items = withActivity.slice((page - 1) * pageSize, page * pageSize).map((x) => x.p);
    } else if (query.sort === 'bounty') {
      where.bounty = { gt: 0 };
      [items, total] = await Promise.all([
        this.prisma.post.findMany({ where, include, orderBy: { bounty: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
        this.prisma.post.count({ where }),
      ]);
    } else {
      [items, total] = await Promise.all([
        this.prisma.post.findMany({ where, include, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
        this.prisma.post.count({ where }),
      ]);
    }

    const mapped = await Promise.all(items.map((p) => this.mapPost(p, viewer?.id)));
    return { items: mapped, total, page, pageSize };
  }

  async getById(id: number, viewer?: AuthUserPayload | null, admin = false) {
    const post = await this.prisma.post.findFirst({
      where: { id, deleted_at: null },
      include: { author: true, post_tags: { include: { tag: true } } },
    });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    const isAuthor = viewer?.id === post.author_id;
    if (!admin && post.moderation_status !== ModerationStatus.published && !isAuthor) {
      throw new NotFoundException('Bài viết đang chờ duyệt hoặc đã bị ẩn');
    }

    if (!admin) {
      await this.prisma.post.update({ where: { id }, data: { view_count: { increment: 1 } } });
      post.view_count += 1;
    }

    return this.mapPost(post, viewer?.id);
  }

  async create(dto: CreatePostDto, user: AuthUserPayload) {
    const title = dto.title.trim();
    const body = dto.body.trim();
    const scan = await scanContent(this.prisma, title, body);
    const slug = `${slugify(title)}-${Date.now().toString().slice(-4)}`;

    const tagNames = [...new Set(dto.tags.map((t) => t.trim()).filter(Boolean))];
    const bounty = dto.bounty ?? 0;

    if (bounty > 0) {
      const author = await this.prisma.user.findUnique({ where: { id: user.id } });
      if (!author || author.reward_points < bounty) {
        throw new BadRequestException(`Không đủ điểm thưởng. Cần ${bounty}, bạn có ${author?.reward_points ?? 0}.`);
      }
    }

    const post = await this.prisma.$transaction(async (tx) => {
      if (bounty > 0) {
        await tx.user.update({ where: { id: user.id }, data: { reward_points: { decrement: bounty } } });
      }

      const tagIds: number[] = [];
      for (const name of tagNames) {
        const tag = await tx.tag.upsert({ where: { name }, update: {}, create: { name, slug: slugify(name) } });
        tagIds.push(tag.id);
      }

      return tx.post.create({
        data: {
          title, slug, content: body, excerpt: makeExcerpt(body), author_id: user.id, bounty,
          difficulty: (dto.difficulty ?? 'medium') as PostDifficulty,
          moderation_status: scan.status,
          matched_words: scan.matchedWords.length ? scan.matchedWords : undefined,
          post_tags: { create: tagIds.map(id => ({ tag_id: id })) },
        },
        include: { author: true, post_tags: { include: { tag: true } } },
      });
    });

    return this.mapPost(post, user.id);
  }

  async update(id: number, userId: number, dto: UpdatePostDto) {
    const existingPost = await this.prisma.post.findUnique({ where: { id } });
    if (!existingPost) throw new NotFoundException('Bài viết không tồn tại!');
    if (existingPost.author_id !== userId) throw new ForbiddenException('Bạn không thể sửa bài của người khác!');

    const data: Prisma.PostUpdateInput = {};
    if (dto.title) {
      data.title = dto.title;
      data.slug = slugify(dto.title);
    }
    if (dto.body) {
      data.content = dto.body;
      data.excerpt = makeExcerpt(dto.body);
    }
    if (dto.difficulty) data.difficulty = dto.difficulty as PostDifficulty;

    if (dto.tags) {
      const tagNames = Array.from(new Set(dto.tags.filter((t) => t.trim().length > 0)));
      await this.prisma.postTag.deleteMany({ where: { post_id: id } });

      const tagIds: number[] = [];
      for (const name of tagNames) {
        const tag = await this.prisma.tag.upsert({ where: { name }, update: {}, create: { name, slug: slugify(name) } });
        tagIds.push(tag.id);
      }
      data.post_tags = { create: tagIds.map(tag_id => ({ tag_id })) };
    }

    const updated = await this.prisma.post.update({
      where: { id }, data, include: { author: true, post_tags: { include: { tag: true } } },
    });

    return this.mapPost(updated, updated.author_id);
  }

  async delete(id: number, userId?: number) {
    if (userId) {
      const post = await this.prisma.post.findUnique({ where: { id }, select: { author_id: true } });
      if (!post || post.author_id !== userId) throw new ForbiddenException('Bạn không có quyền xóa bài này!');
    }

    await this.prisma.post.update({ where: { id }, data: { deleted_at: new Date() } });
    await this.prisma.comment.updateMany({ where: { post_id: id }, data: { deleted_at: new Date() } });
  }

  async ratePost(postId: number, userId: number, stars: number) {
    const post = await this.prisma.post.findFirst({ where: { id: postId, deleted_at: null, moderation_status: ModerationStatus.published } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    if (post.author_id === userId) throw new BadRequestException('Không thể tự đánh giá bài của mình');

    await this.prisma.postRating.upsert({
      where: { post_id_user_id: { post_id: postId, user_id: userId } },
      create: { post_id: postId, user_id: userId, stars },
      update: { stars },
    });

    const agg = await this.prisma.postRating.aggregate({ where: { post_id: postId }, _avg: { stars: true }, _count: { stars: true } });

    await this.prisma.post.update({
      where: { id: postId },
      data: { avg_rating: agg._avg.stars ?? 0, rating_count: agg._count.stars },
    });

    return { avgRating: agg._avg.stars ?? 0, ratingCount: agg._count.stars, myStars: stars };
  }

  async getMyRating(postId: number, userId: number) {
    const row = await this.prisma.postRating.findUnique({ where: { post_id_user_id: { post_id: postId, user_id: userId } } });
    return { stars: row?.stars ?? null };
  }

  async acceptAnswer(postId: number, commentId: number, authorId: number) {
    const post = await this.prisma.post.findFirst({ where: { id: postId, deleted_at: null, author_id: authorId } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết hoặc bạn không phải tác giả');

    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, post_id: postId, deleted_at: null, parent_id: null, moderation_status: ModerationStatus.published },
    });
    if (!comment) throw new NotFoundException('Không tìm thấy câu trả lời hợp lệ');
    if (post.accepted_comment_id) throw new BadRequestException('Đã chấp nhận một câu trả lời rồi');

    const bounty = post.bounty;
    await this.prisma.$transaction(async (tx) => {
      if (bounty > 0) {
        await tx.user.update({ where: { id: comment.author_id }, data: { reward_points: { increment: bounty } } });
      }
      await tx.post.update({ where: { id: postId }, data: { bounty: 0, accepted_comment_id: commentId } });
      await tx.comment.update({ where: { id: commentId }, data: { is_accepted: true } });
    });

    return { acceptedCommentId: String(commentId), bountyAwarded: bounty, answererId: String(comment.author_id) };
  }

  async updateModeration(id: number, status: ModerationStatus, note?: string) {
    await this.prisma.post.update({ where: { id }, data: { moderation_status: status, moderation_note: note } });
  }

  async getTagsWithCount() {
    const tags = await this.prisma.tag.findMany({
      include: { post_tags: { where: { post: { moderation_status: ModerationStatus.published, deleted_at: null } } } },
    });
    return tags.map((t) => ({ name: t.name, count: t.post_tags.length })).filter((t) => t.count > 0).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'));
  }

  async getForumStats() {
    const [questionCount, answerCount, tagCount] = await Promise.all([
      this.prisma.post.count({ where: { moderation_status: ModerationStatus.published, deleted_at: null } }),
      this.prisma.comment.count({ where: { parent_id: null, moderation_status: ModerationStatus.published, deleted_at: null } }),
      this.prisma.tag.count(),
    ]);
    return { questionCount, answerCount, tagCount };
  }

  async getFeatured(limit = 3) {
    const res = await this.list({ page: 1, pageSize: limit, sort: 'active' });
    return res.items;
  }
}