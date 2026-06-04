import type { ChatConversation, ChatMessage, ChatUser } from '@/types';
import { apiFetch, buildQuery } from '@/services/api/client';
import { mapChatConversation, mapChatMessage, mapChatUser } from '@/utils/chat';

export const chatService = {
  async searchUsers(query: string): Promise<ChatUser[]> {
    const rows = await apiFetch<Record<string, unknown>[]>(
      `/api/chat/search-users${buildQuery({ q: query })}`,
    );
    return rows.map((r) => mapChatUser(r));
  },

  async getOrCreateConversation(userId: string): Promise<ChatConversation> {
    const conv = await apiFetch<Record<string, unknown>>('/api/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ userId: Number(userId) }),
    });
    return mapChatConversation(conv);
  },

  async getMyConversations(): Promise<ChatConversation[]> {
    const rows = await apiFetch<Record<string, unknown>[]>('/api/chat/conversations');
    return rows.map((r) => mapChatConversation(r));
  },

  async getMessages(
    conversationId: string,
    page?: number,
    pageSize?: number,
  ): Promise<ChatMessage[]> {
    const rows = await apiFetch<Record<string, unknown>[]>(
      `/api/chat/conversations/${conversationId}/messages${buildQuery({
        page,
        pageSize,
      })}`,
    );
    return rows.map((r) => mapChatMessage(r));
  },

  async sendMessage(
    conversationId: string,
    content: string,
  ): Promise<ChatMessage> {
    const row = await apiFetch<Record<string, unknown>>(
      `/api/chat/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      },
    );
    return mapChatMessage(row);
  },
};
