import type { BannedWord } from '@/types';
import { apiFetch } from '@/services/api/client';

export const bannedWordService = {
  async list(): Promise<BannedWord[]> {
    return apiFetch<BannedWord[]>('/api/admin/banned-words');
  },

  async add(word: string, action: BannedWord['action']): Promise<BannedWord> {
    return apiFetch<BannedWord>('/api/admin/banned-words', {
      method: 'POST',
      body: JSON.stringify({ word, action }),
    });
  },

  async update(id: string, patch: Partial<Pick<BannedWord, 'action'>>) {
    await apiFetch(`/api/admin/banned-words/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  async remove(id: string) {
    await apiFetch(`/api/admin/banned-words/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};
