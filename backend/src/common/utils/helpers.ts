export function toFrontendRole(role: string): 'admin' | 'teacher' | 'student' {
  const map: Record<string, 'admin' | 'teacher' | 'student'> = {
    admin: 'admin',
    teacher: 'teacher',
    student: 'student',
  };
  return map[role] ?? 'student';
}

export function toBackendRole(role: string): 'admin' | 'teacher' | 'student' {
  const map: Record<string, 'admin' | 'teacher' | 'student'> = {
    ADMIN: 'admin',
    LECTURER: 'teacher',
    STUDENT: 'student',
  };
  return map[role] ?? 'student';
}

export function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
  return base || `post-${Date.now()}`;
}

export function makeExcerpt(body: string, max = 180): string {
  const t = body.trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export interface AuthUserPayload {
  id: number;
  email: string;
  role: string;
}
