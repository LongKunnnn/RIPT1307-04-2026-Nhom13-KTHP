import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConversationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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

  private conversationInclude = {
    user1: { select: this.userSelect },
    user2: { select: this.userSelect },
    messages: {
      orderBy: { created_at: 'desc' as const },
      take: 1,
      include: { sender: { select: this.userSelect } },
    },
    _count: { select: { messages: true } },
  };

  private isPendingForUser(conv: any, userId: number): boolean {
    if (conv.accepted_at) return false;
    if (!conv.initiated_by_id) return false;
    return conv.initiated_by_id !== userId;
  }

  private mapConversation(conv: any, userId: number) {
    const otherUser = conv.user1_id === userId ? conv.user2 : conv.user1;
    const lastMessage = conv.messages[0];
    const pendingForMe = this.isPendingForUser(conv, userId);
    return {
      id: conv.id,
      otherUser,
      lastMessage: lastMessage ?? undefined,
      unreadCount: 0,
      updatedAt: conv.updated_at,
      pendingForMe,
      messageCount: conv._count.messages,
    };
  }

  /** Chỉ tìm trong danh sách đã từng nhắn tin (hộp thư chính). */
  async searchInboxPartners(query: string, currentUserId: number) {
    const q = query?.trim().toLowerCase();
    if (!q) return [];

    const { active } = await this.getMyConversations(currentUserId);
    return active
      .filter(
        (c) =>
          c.otherUser.username.toLowerCase().includes(q) ||
          c.otherUser.full_name.toLowerCase().includes(q),
      )
      .map((c) => c.otherUser)
      .slice(0, 20);
  }

  private async findConversationsBetween(userA: number, userB: number) {
    const [minId, maxId] = [Math.min(userA, userB), Math.max(userA, userB)];
    return this.prisma.conversation.findMany({
      where: {
        OR: [
          { user1_id: minId, user2_id: maxId },
          { user1_id: maxId, user2_id: minId },
        ],
      },
      include: this.conversationInclude,
      orderBy: { updated_at: 'desc' },
    });
  }

  private async consolidateConversations(userA: number, userB: number) {
    const rows = await this.findConversationsBetween(userA, userB);
    if (rows.length <= 1) return rows[0] ?? null;

    const [minId, maxId] = [Math.min(userA, userB), Math.max(userA, userB)];
    let canonical =
      rows.find((c) => c.user1_id === minId && c.user2_id === maxId) ?? rows[0];

    const duplicateIds = rows
      .filter((c) => c.id !== canonical.id)
      .map((c) => c.id);

    if (duplicateIds.length > 0) {
      await this.prisma.message.updateMany({
        where: { conversation_id: { in: duplicateIds } },
        data: { conversation_id: canonical.id },
      });
      await this.prisma.conversation.deleteMany({
        where: { id: { in: duplicateIds } },
      });
      canonical = (await this.prisma.conversation.findUnique({
        where: { id: canonical.id },
        include: this.conversationInclude,
      }))!;
    }

    if (canonical.user1_id !== minId || canonical.user2_id !== maxId) {
      canonical = await this.prisma.conversation.update({
        where: { id: canonical.id },
        data: { user1_id: minId, user2_id: maxId },
        include: this.conversationInclude,
      });
    }

    return canonical;
  }

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

    const [minId, maxId] = [
      Math.min(userId1, userId2),
      Math.max(userId1, userId2),
    ];

    let conversation = await this.consolidateConversations(userId1, userId2);

    if (!conversation) {
      try {
        conversation = await this.prisma.conversation.create({
          data: { user1_id: minId, user2_id: maxId },
          include: this.conversationInclude,
        });
      } catch {
        conversation = await this.consolidateConversations(userId1, userId2);
        if (!conversation) {
          throw new BadRequestException('Không thể tạo cuộc trò chuyện.');
        }
      }
    }

    return this.mapConversation(conversation, userId1);
  }

  async getMyConversations(userId: number) {
    let conversations = await this.prisma.conversation.findMany({
      where: { OR: [{ user1_id: userId }, { user2_id: userId }] },
      include: this.conversationInclude,
      orderBy: { updated_at: 'desc' },
    });

    const otherCounts = new Map<number, number>();
    for (const conv of conversations) {
      const otherId = conv.user1_id === userId ? conv.user2.id : conv.user1.id;
      otherCounts.set(otherId, (otherCounts.get(otherId) ?? 0) + 1);
    }
    for (const [otherId, count] of otherCounts) {
      if (count > 1) {
        await this.consolidateConversations(userId, otherId);
      }
    }

    if ([...otherCounts.values()].some((n) => n > 1)) {
      conversations = await this.prisma.conversation.findMany({
        where: { OR: [{ user1_id: userId }, { user2_id: userId }] },
        include: this.conversationInclude,
        orderBy: { updated_at: 'desc' },
      });
    }

    const seenOther = new Set<number>();
    const mapped: ReturnType<ChatService['mapConversation']>[] = [];

    for (const conv of conversations) {
      const otherUser = conv.user1_id === userId ? conv.user2 : conv.user1;
      if (seenOther.has(otherUser.id)) continue;
      seenOther.add(otherUser.id);
      if (conv._count.messages === 0) continue;
      mapped.push(this.mapConversation(conv, userId));
    }

    const active = mapped.filter((c) => !c.pendingForMe);
    const pending = mapped.filter((c) => c.pendingForMe);

    return { active, pending };
  }

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
        sender: { select: this.userSelect },
      },
    });

    return messages.reverse();
  }

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
        sender: { select: this.userSelect },
      },
    });

    const convUpdate: any = { updated_at: new Date() };

    if (!conversation.initiated_by_id) {
      convUpdate.initiated_by_id = userId;
      convUpdate.status = ConversationStatus.pending;
    } else if (
      !conversation.accepted_at &&
      conversation.initiated_by_id !== userId
    ) {
      convUpdate.accepted_at = new Date();
      convUpdate.status = ConversationStatus.active;
    }

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: convUpdate,
    });

    return message;
  }
}
