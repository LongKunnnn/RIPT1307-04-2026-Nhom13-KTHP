import type { CreateQuestionPayload, CreateQuestionResult, QuestionService } from './types';

function randomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `q_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/** Giả lập độ trễ mạng; trả về id giả để UI redirect / hiển thị thành công. */
export const mockQuestionService: QuestionService = {
  async createQuestion(_payload: CreateQuestionPayload): Promise<CreateQuestionResult> {
    await new Promise((r) => setTimeout(r, 550));
    return { id: randomId() };
  },
};
