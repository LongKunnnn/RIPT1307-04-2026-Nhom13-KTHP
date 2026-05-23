import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Mày nhớ trỏ đúng đường dẫn Prisma của dự án
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  // 🟢 1. TẠO MỚI COMMENT / REPLY
  async create(userId: number, data: CreateCommentDto) {
    // Check xem Bài viết có tồn tại (hoặc chưa bị xóa) không
    const post = await this.prisma.post.findFirst({
      where: { id: data.post_id, deleted_at: null },
    });
    if (!post) throw new NotFoundException('Bài viết này không tồn tại hoặc đã bị bay màu!');

    let finalParentId = data.parent_id;

    // Check logic Reply 2 cấp
    if (finalParentId) {
      const parentComment = await this.prisma.comment.findFirst({
        where: { id: finalParentId, post_id: data.post_id, deleted_at: null },
      });
      
      if (!parentComment) {
        throw new NotFoundException('Bình luận cha không tồn tại!');
      }

    
    
      if (parentComment.parent_id !== null) {
        finalParentId = parentComment.parent_id;
      }
    }

    return this.prisma.comment.create({
      data: {
        content: data.content,
        post_id: data.post_id,
        author_id: userId,
        parent_id: finalParentId || null,
      },
    });
  }

  async getCommentsByPost(postId: number) {
    return this.prisma.comment.findMany({
      where: {
        post_id: postId,
        parent_id: null, // Chỉ bốc những thằng làm gốc (cấp 1) lên trước
        deleted_at: null, // Không lấy đồ đã xóa
      },
      orderBy: { created_at: 'desc' }, // Cấp 1: Thằng nào cmt mới nhất cho lên đầu
      include: {
        author: {
          select: { id: true, username: true, full_name: true, avatar_url: true, role: true },
        },
        replies: {
          where: { deleted_at: null },
          orderBy: { created_at: 'asc' }, // Cấp 2: Reply thì phải đọc từ cũ tới mới nó mới thuận logic
          include: {
            author: {
              select: { id: true, username: true, full_name: true, avatar_url: true, role: true },
            },
          },
        },
      },
    });
  }

  // SỬA BÌNH LUẬN (Chỉ tác giả mới được sửa)
  async update(commentId: number, userId: number, data: UpdateCommentDto) {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, deleted_at: null },
    });

    if (!comment) throw new NotFoundException('Không tìm thấy bình luận!');
    
    // Check quyền chính chủ
    if (comment.author_id !== userId) {
      throw new ForbiddenException('Chỉ chính chủ mới được phép sửa bình luận này!');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content: data.content },
    });
  }

  async remove(commentId: number, userId: number, userRole: string) {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, deleted_at: null },
    });

    if (!comment) throw new NotFoundException('Bình luận không tồn tại!');

    if (comment.author_id !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Mày không có quyền xóa bình luận này!');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { deleted_at: new Date() },
    });
  }
}