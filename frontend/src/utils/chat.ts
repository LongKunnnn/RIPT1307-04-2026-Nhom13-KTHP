import type { ChatConversation, ChatMessage, ChatUser } from "@/types";

export function mapChatUser(raw: Record<string, unknown>): ChatUser {
  return {
    id: String(raw.id),
    username: String(raw.username ?? ""),
    fullName: String(raw.full_name ?? raw.fullName ?? ""),
    avatarUrl: (raw.avatar_url ?? raw.avatarUrl) as string | undefined,
    role: String(raw.role ?? "student"),
  };
}

export function mapChatMessage(raw: Record<string, unknown>): ChatMessage {
  const sender = raw.sender as Record<string, unknown> | undefined;
  return {
    id: String(raw.id),
    conversationId: String(raw.conversation_id ?? raw.conversationId),
    senderId: String(raw.sender_id ?? raw.senderId),
    content: String(raw.content ?? ""),
    isRead: Boolean(raw.is_read ?? raw.isRead),
    createdAt: String(raw.created_at ?? raw.createdAt ?? ""),
    sender: sender ? mapChatUser(sender) : mapChatUser({}),
  };
}

export function mapChatConversation(raw: Record<string, unknown>): ChatConversation {
  const otherUser = raw.otherUser as Record<string, unknown> | undefined;
  const lastMessage = raw.lastMessage as Record<string, unknown> | undefined;
  return {
    id: String(raw.id),
    otherUser: otherUser ? mapChatUser(otherUser) : mapChatUser({}),
    lastMessage: lastMessage ? mapChatMessage(lastMessage) : undefined,
    unreadCount: Number(raw.unreadCount ?? 0),
    updatedAt: String(raw.updated_at ?? raw.updatedAt ?? ""),
  };
}

export function chatUserFromProfile(user: {
  id: string;
  username: string;
  full_name?: string;
  displayName?: string;
  avatar_url?: string;
  avatarUrl?: string;
  role: string;
}): ChatUser {
  return {
    id: user.id,
    username: user.username,
    fullName: user.full_name ?? user.displayName ?? user.username,
    avatarUrl: user.avatar_url ?? user.avatarUrl,
    role: user.role,
  };
}
