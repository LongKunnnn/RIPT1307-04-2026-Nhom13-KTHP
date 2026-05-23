import type { CreateQuestionPayload } from './types';
import type { ForumRole } from './types';

const STORAGE_KEY = 'svforum_client_questions_v1';

export interface ClientStoredQuestion extends CreateQuestionPayload {
  id: string;
  /** ISO datetime */
  createdAt: string;
  /** Trước khi có đăng nhập — có thể thay bằng user từ API */
  author: string;
  role: ForumRole;
}

function readAll(): ClientStoredQuestion[] {
  if (typeof sessionStorage === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredShape);
  } catch {
    return [];
  }
}

function isStoredShape(x: unknown): x is ClientStoredQuestion {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  const tags = o.tags;
  return (
    typeof o.id === 'string' &&
    typeof o.title === 'string' &&
    typeof o.body === 'string' &&
    Array.isArray(tags) &&
    tags.every((t) => typeof t === 'string') &&
    typeof o.createdAt === 'string' &&
    typeof o.author === 'string' &&
    (o.role === 'Sinh viên' || o.role === 'Giảng viên')
  );
}

function writeAll(list: ClientStoredQuestion[]) {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** Lưu sau khi đăng câu hỏi thành công (mock hoặc API) để xem offline trong phiên trình duyệt. */
export function saveClientQuestion(record: ClientStoredQuestion) {
  const list = readAll().filter((q) => q.id !== record.id);
  list.unshift(record);
  writeAll(list);
}

export function getClientQuestionById(id: string): ClientStoredQuestion | undefined {
  return readAll().find((q) => q.id === id);
}

export function listClientQuestionsNewestFirst(): ClientStoredQuestion[] {
  return readAll();
}
