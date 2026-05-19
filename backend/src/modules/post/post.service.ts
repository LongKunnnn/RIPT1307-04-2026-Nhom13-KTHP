import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

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
}