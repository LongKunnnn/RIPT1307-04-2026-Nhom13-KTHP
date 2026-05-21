import type { ModerationQueueItem, ModerationResolveAction } from '@/types';
import { apiFetch } from '@/services/api/client';

export const moderationService = {
  async getQueue(): Promise<ModerationQueueItem[]> {
    return apiFetch<ModerationQueueItem[]>('/api/admin/moderation/queue');
  },

  async countQueue(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  },

  async resolve(item: ModerationQueueItem, action: ModerationResolveAction, warnMessage?: string) {
    await apiFetch('/api/admin/moderation/resolve', {
      method: 'POST',
      body: JSON.stringify({ item, action, warnMessage }),
    });
  },
};
