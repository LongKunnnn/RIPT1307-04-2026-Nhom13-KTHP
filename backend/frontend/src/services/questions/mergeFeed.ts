import type { QuestionListItem } from './types';
import type { ClientStoredQuestion } from './localQuestionStore';

function formatViDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Gộp câu hỏi vừa đăng (session) lên đầu feed, không đụng mock. */
export function mergeHomeFeedQuestions(
  clientFirst: ClientStoredQuestion[],
  mockList: QuestionListItem[],
): QuestionListItem[] {
  const clientItems: QuestionListItem[] = clientFirst.map((c) => ({
    id: c.id,
    title: c.title,
    excerpt: c.body.length > 180 ? `${c.body.slice(0, 180).trim()}…` : c.body,
    tags: c.tags,
    author: c.author,
    role: c.role,
    date: formatViDate(c.createdAt),
    votes: 0,
    answers: 0,
    views: 0,
  }));

  const seen = new Set(clientItems.map((x) => x.id));
  const rest = mockList.filter((m) => !seen.has(m.id));
  return [...clientItems, ...rest];
}
