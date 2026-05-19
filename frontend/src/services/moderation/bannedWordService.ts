import type { BannedWord } from '@/types';
import { getBannedWords, newId, setBannedWords } from '@/services/mock/db';

export const bannedWordService = {
  list(): BannedWord[] {
    return [...getBannedWords()].sort((a, b) => a.word.localeCompare(b.word, 'vi'));
  },

  add(word: string, action: BannedWord['action']): BannedWord {
    const w = word.trim().toLowerCase();
    if (!w) throw new Error('Từ khóa không được trống');
    const list = getBannedWords();
    if (list.some((x) => x.word.toLowerCase() === w)) throw new Error('Từ này đã có trong danh sách');
    const item: BannedWord = {
      id: newId('bw'),
      word: w,
      action,
      createdAt: new Date().toISOString(),
    };
    setBannedWords([...list, item]);
    return item;
  },

  remove(id: string) {
    setBannedWords(getBannedWords().filter((x) => x.id !== id));
  },

  update(id: string, patch: Partial<Pick<BannedWord, 'word' | 'action'>>) {
    const list = getBannedWords();
    const idx = list.findIndex((x) => x.id === id);
    if (idx < 0) throw new Error('Không tìm thấy từ khóa');
    list[idx] = {
      ...list[idx],
      ...(patch.word !== undefined ? { word: patch.word.trim().toLowerCase() } : {}),
      ...(patch.action !== undefined ? { action: patch.action } : {}),
    };
    setBannedWords(list);
    return list[idx];
  },
};
