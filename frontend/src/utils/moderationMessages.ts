import type { ModerationStatus } from '@/types';

export function moderationUserMessage(status: ModerationStatus, matchedWords?: string[]): string {
  const words = matchedWords?.length ? ` (phát hiện: ${matchedWords.join(', ')})` : '';
  if (status === 'pending') {
    return `Bài đăng đang chờ kiểm duyệt${words}. Admin sẽ xem xét sớm nhất.`;
  }
  if (status === 'hidden') {
    return `Nội dung đã bị ẩn tự động do vi phạm từ khóa cấm${words}.`;
  }
  return 'Đã đăng thành công.';
}
