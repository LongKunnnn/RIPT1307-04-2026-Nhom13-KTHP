import type { PostDifficulty, UserRole } from '@/types';

export function formatViDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatViews(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return 'Quản trị';
    case 'LECTURER':
      return 'Giảng viên';
    case 'STUDENT':
      return 'Sinh viên';
    default:
      return role;
  }
}

export function roleColor(role: UserRole) {
  switch (role) {
    case 'ADMIN':
      return 'red';
    case 'LECTURER':
      return 'blue';
    default:
      return 'default';
  }
}

export function difficultyLabel(d: PostDifficulty): string {
  switch (d) {
    case 'easy':
      return 'Dễ';
    case 'hard':
      return 'Khó';
    default:
      return 'Trung bình';
  }
}

export function difficultyColor(d: PostDifficulty): string {
  switch (d) {
    case 'easy':
      return 'green';
    case 'hard':
      return 'red';
    default:
      return 'blue';
  }
}
