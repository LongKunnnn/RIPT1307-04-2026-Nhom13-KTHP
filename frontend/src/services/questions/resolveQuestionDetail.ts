import { getMockQuestionById } from '@/data/mockForumQuestions';
import type { MockQuestionFull } from '@/data/mockForumQuestions';
import { getClientQuestionById } from './localQuestionStore';

function formatViDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Chi tiết hiển thị — mock hoặc câu hỏi vừa lưu trong session. */
export type ResolvedQuestionDetail = MockQuestionFull;

export function resolveQuestionDetail(id: string): ResolvedQuestionDetail | null {
  const stored = getClientQuestionById(id);
  if (stored) {
    return {
      id: stored.id,
      title: stored.title,
      excerpt:
        stored.body.length > 200 ? `${stored.body.slice(0, 200).trim()}…` : stored.body,
      body: stored.body,
      tags: stored.tags,
      author: stored.author,
      role: stored.role,
      date: formatViDate(stored.createdAt),
      votes: 0,
      answers: 0,
      views: 0,
    };
  }

  const mock = getMockQuestionById(id);
  return mock ?? null;
}
