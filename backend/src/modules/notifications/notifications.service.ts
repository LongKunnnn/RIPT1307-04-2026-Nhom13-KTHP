import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 
import { NotificationsGateway } from './notifications.gateway';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway, // Gọi thằng Socket vào đây
  ) {}

  async getUserNotifications(userId: number) {
    return this.prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: { id, user_id: userId },
      data: { is_read: true },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
  }

  async createNotification(data: {
    userId: number;
    senderId?: number;
    postId?: number;
    commentId?: number;
    type: NotificationType;
    title?: string;
    content: string;
    linkPath?: string;
  }) {
    // Lưu thẳng xuống DB
    const noti = await this.prisma.notification.create({
      data: {
        user_id: data.userId,
        sender_id: data.senderId,
        post_id: data.postId,
        comment_id: data.commentId,
        type: data.type,
        title: data.title,
        content: data.content,
        link_path: data.linkPath,
        is_read: false, 
      },
    });

    this.gateway.sendToUser(data.userId, noti);

    return noti;
  }
}