export type { ForumRole, CreateQuestionPayload, CreateQuestionResult, QuestionListItem, QuestionService } from './types';
export { mockQuestionService } from './mockQuestionService';
export { createHttpQuestionService } from './httpQuestionService';

import { createHttpQuestionService } from './httpQuestionService';
import { mockQuestionService } from './mockQuestionService';
import type { QuestionService } from './types';

function resolveBaseUrl(): string | undefined {
  const v = process.env.UMI_APP_API_BASE_URL;
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;
}

/**
 * Mặc định dùng mock. Khi deploy cùng backend, set biến môi trường:
 * UMI_APP_API_BASE_URL=https://api.example.com
 * (không có dấu / ở cuối cũng được)
 */
export function getQuestionService(): QuestionService {
  const base = resolveBaseUrl();
  return base ? createHttpQuestionService(base) : mockQuestionService;
}
