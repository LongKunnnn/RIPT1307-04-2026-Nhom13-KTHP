import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { UpdatePostDto } from './dto/update-post.dto';
import { Injectable } from '@nestjs/common';
@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) { }

  // Hàm chuyển đổi tiếng Việt có dấu thành Slug chuẩn SEO
  private convertToSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '') // Xóa ký tự đặc biệt
      .replace(/(\s+)/g, '-')         // Thay khoảng trắng bằng dấu -
      .replace(/-+/g, '-')            // Thu gọn nhiều dấu - liên tiếp
      .replace(/^-+|-+$/g, '');       // Cắt dấu - ở đầu và cuối
  }

  async create(createPostDto: CreatePostDto, authorId: number) {
    const { title, content, excerpt, tags } = createPostDto;

    const baseSlug = this.convertToSlug(title);
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    return this.prisma.$transaction(async (tx) => {
      // Tạo bài viết mới
      const post = await tx.post.create({
        data: {
          title,
          slug,
          content,
          excerpt,
          author_id: authorId,
          moderation_status: 'published',
        },
      });

      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          const tagSlug = this.convertToSlug(tagName);

          const tag = await tx.tag.upsert({
            where: { name: tagName },
            update: {},
            create: {
              name: tagName,
              slug: tagSlug,
            },
          });

          await tx.postTag.create({
            data: {
              post_id: post.id,
              tag_id: tag.id,
            },
          });
        }
      }

      return tx.post.findUnique({
        where: { id: post.id },
        include: {
          post_tags: {
            include: {
              tag: true,
            },
          },
          author: {
            select: {
              id: true,
              full_name: true,
              username: true,
              avatar_url: true,
              role: true,
            },
          },
        },
      });
    });
  }

  async findAll(page: number = 1, limit: number = 10, tag?: string) {
    // Tính toán vị trí bắt đầu lấy (dành cho phân trang)
    const skip = (page - 1) * limit;

    const whereCondition: any = {};
    if (tag) {
      whereCondition.post_tags = {
        some: {
          tag: { name: tag },
        },
      };
    }

    const posts = await this.prisma.post.findMany({
      skip,
      take: limit,
      where: whereCondition,
      orderBy: { created_at: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            full_name: true,
            username: true,
            avatar_url: true,
            role: true,
          },
        },
        post_tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    const total = await this.prisma.post.count({ where: whereCondition });
    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit), // Tính ra tổng số trang
      },
    };
  }

  async findOne(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, full_name: true, username: true, avatar_url: true },
        },
        post_tags: {
          include: { tag: true },
        },
        comments: {
          orderBy: { created_at: 'asc' },
          include: {
            author: {
              select: { id: true, full_name: true, avatar_url: true },
            },
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Bài viết không tồn tại hoặc đã bị xóa!');
    }

    return post;
  }

  async update(id: number, userId: number, updateData: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { author_id: true }
    });

    if (!post) {
      throw new NotFoundException('Bài viết này không tồn tại hoặc đã bị xóa!');
    }

    if (post.author_id !== userId) {
      throw new ForbiddenException('Bạn không thể sửa bài của người khác!');
    }

    const { tags, ...scalarFields } = updateData;

    const dataToUpdate: Prisma.PostUpdateInput = {
      ...scalarFields,
    };

    if (tags !== undefined) {

      const normalizedTags = [...new Set(
        tags
          .map(tag => tag.trim().toLowerCase())
          .filter(Boolean)
      )];

      dataToUpdate.post_tags = {
        deleteMany: {},
        create: normalizedTags.map((tagName) => ({
          tag: {
            connectOrCreate: {
              where: { name: tagName },
              create: {
                name: tagName,
                slug: tagName.replace(/\s+/g, '-')
              },
            },
          },
        })),
      };
    }

    try {
      const updatedPost = await this.prisma.post.update({
        where: { id },
        data: dataToUpdate,
        include: {
          post_tags: {
            include: { tag: true },
          },
        },
      });
      return updatedPost;

    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Bài viết không tồn tại!');
        }
      }
      throw new InternalServerErrorException('Lỗi hệ thống khi cập nhật bài viết!');
    }
  }

  async remove(id: number, userId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { author_id: true, deleted_at: true }, 
    });

    if (!post || post.deleted_at !== null) { 
      throw new NotFoundException('Bài viết này không tồn tại!');
    }

    if (post.author_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa bài của người khác!');
    }

    return this.prisma.post.update({
      where: { id },
      data: { 
        deleted_at: new Date() 
      },
    });
  }
}