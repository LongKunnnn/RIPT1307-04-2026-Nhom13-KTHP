import type { BannedWord, ModerationStatus } from '@/types';
import { getBannedWords } from '@/services/mock/db';

export interface ScanResult {
  status: ModerationStatus;
  matchedWords: string[];
}

/** Quét nội dung với danh sách từ cấm — ưu tiên ẩn ngay hơn chờ duyệt. */
export function scanContent(...texts: string[]): ScanResult {
  const combined = texts.join(' ').toLowerCase();
  const words = getBannedWords();
  const matched: BannedWord[] = [];

  for (const bw of words) {
    const w = bw.word.trim().toLowerCase();
    if (!w) continue;
    if (combined.includes(w)) matched.push(bw);
  }

  if (matched.length === 0) {
    return { status: 'published', matchedWords: [] };
  }

  const hasHidden = matched.some((m) => m.action === 'hidden');
  return {
    status: hasHidden ? 'hidden' : 'pending',
    matchedWords: matched.map((m) => m.word),
  };
}

export function isPubliclyVisible(status: ModerationStatus): boolean {
  return status === 'published';
}
