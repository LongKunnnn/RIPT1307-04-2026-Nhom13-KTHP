import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUserPayload } from '../../common/utils/helpers';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private userSelect = {
    id: true,
    username: true,
    full_name: true,
    avatar_url: true,
    role: true,
  } as const;

  // Tìm kiếm người dùng (username, họ tên) và người đã từng nhắn tin
  async searchUsers(query: string, currentUserId: number) {
    const q = query?.trim();
    if (!q) return [];

    const byProfile = await this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          { is_active: true },
          {
            OR: [
              { username: { contains: q } },
              { full_name: { contains: q } },
            ],
          },
        ],
      },
      select: this.userSelect,
      take: 20,
    });

    const conversations = await this.prisma.conversation.findMany({
      where: { OR: [{ user1_id: currentUserId }, { user2_id: currentUserId }] },
      include: {
        user1: { select: this.userSelect },
        user2: { select: this.userSelect },
      },
    });

    const fromChats = conversations
      .map((conv) =>
        conv.user1_id === currentUserId ? conv.user2 : conv.user1,
      )
      .filter(
        (u) =>
          u.id !== currentUserId &&
          (u.username.toLowerCase().includes(q.toLowerCase()) ||
            u.full_name.toLowerCase().includes(q.toLowerCase())),
      );

    const merged = new Map<number, (typeof byProfile)[0]>();
    for (const u of [...fromChats, ...byProfile]) {
      merged.set(u.id, u);
    }
    return Array.from(merged.values()).slice(0, 20);
  }

  // Lấy hoặc tạo cuộc trò chuyện mới với 1 người dùng
  async getOrCreateConversation(userId1: number, userId2: number) {
    if (userId1 === userId2) {
      throw new BadRequestException('Không thể chat với chính mình!');
    }

    const user2 = await this.prisma.user.findUnique({
      where: { id: userId2 },
      select: { id: true },
    });
    if (!user2) {
      throw new NotFoundException('Người dùng không tồn tại!');
    }

    // Sắp xếp id để đảm bảo user1 luôn < user2, tránh tạo trùng
    const [minId, maxId] = [
      Math.min(userId1, userId2),
      Math.max(userId1, userId2),
    ];

    let conversation = await this.prisma.conversation.findFirst({
      where: { user1_id: minId, user2_id: maxId },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            full_name: true,
            avatar_url: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            full_name: true,
            avatar_url: true,
          },
        },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { user1_id: minId, user2_id: maxId },
        include: {
          user1: {
            select: {
              id: true,
              username: true,
              full_name: true,
              avatar_url: true,
            },
          },
          user2: {
            select: {
              id: true,
              username: true,
              full_name: true,
              avatar_url: true,
            },
          },
          messages: {
            orderBy: { created_at: 'desc' },
            take: 1,
          },
        },
      });
    }

    const otherUser =
      conversation.user1_id === userId1 ? conversation.user2 : conversation.user1;
    const lastMessage = conversation.messages[0];
    return {
      id: conversation.id,
      otherUser,
      lastMessage,
      unreadCount: 0,
      updatedAt: conversation.updated_at,
      user1_id: conversation.user1_id,
      user2_id: conversation.user2_id,
    };
  }

  // Lấy tất cả cuộc trò chuyện của người dùng hiện tại
  async getMyConversations(userId: number) {
    const conversations = await this.prisma.conversation.findMany({
      where: { OR: [{ user1_id: userId }, { user2_id: userId }] },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            full_name: true,
            avatar_url: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            full_name: true,
            avatar_url: true,
          },
        },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updated_at: 'desc' },
    });

    return conversations.map((conv) => {
      const otherUser = conv.user1_id === userId ? conv.user2 : conv.user1;
      const lastMessage = conv.messages[0];
      return {
        id: conv.id,
        otherUser,
        lastMessage,
        unreadCount: 0, // Tạm thời để 0, sau có thể tính
        updatedAt: conv.updated_at,
      };
    });
  }

  // Lấy tin nhắn trong cuộc trò chuyện
  async getMessages(
    conversationId: number,
    userId: number,
    page: number = 1,
    pageSize: number = 30,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Cuộc trò chuyện không tồn tại!');
    }
    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      throw new BadRequestException(
        'Bạn không có quyền truy cập cuộc trò chuyện này!',
      );
    }

    const messages = await this.prisma.message.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            full_name: true,
            avatar_url: true,
          },
        },
      },
    });

    return messages.reverse(); // Đảo lại để tin nhắn cũ nhất ở đầu
  }

  // Gửi tin nhắn
  async sendMessage(conversationId: number, userId: number, content: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Cuộc trò chuyện không tồn tại!');
    }
    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      throw new BadRequestException(
        'Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này!',
      );
    }
    if (!content.trim()) {
      throw new BadRequestException('Nội dung tin nhắn không được để trống!');
    }

    const message = await this.prisma.message.create({
      data: { conversation_id: conversationId, sender_id: userId, content },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            full_name: true,
            avatar_url: true,
          },
        },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updated_at: new Date() },
    });

    return message;
  }
}
