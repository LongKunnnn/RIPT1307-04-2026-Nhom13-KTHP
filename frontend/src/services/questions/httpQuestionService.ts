import type { CreateQuestionPayload, CreateQuestionResult, QuestionService } from './types';

/**
 * Gọi API thật. Kỳ vọng backend:
 * POST {baseUrl}/questions
 * Body JSON: CreateQuestionPayload
 * Response JSON: CreateQuestionResult (ít nhất { id: string })
 */
export function createHttpQuestionService(baseUrl: string): QuestionService {
  const root = baseUrl.replace(/\/$/, '');

  return {
    async createQuestion(payload: CreateQuestionPayload): Promise<CreateQuestionResult> {
      const res = await fetch(`${root}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as CreateQuestionResult;
      if (!data || typeof data.id !== 'string') {
        throw new Error('Response không có id hợp lệ');
      }
      return data;
    },
  };
}
