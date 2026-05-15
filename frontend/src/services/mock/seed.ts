import type { BannedWord, Comment, ContentReport, Post, User, VoteRecord } from '@/types';

export const DEMO_PASSWORD = '123456';

export const SEED_USERS: User[] = [
  {
    id: 'u_admin',
    email: 'admin@svforum.vn',
    displayName: 'Quản trị viên',
    role: 'ADMIN',
    locked: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'u_lecturer',
    email: 'giangvien@svforum.vn',
    displayName: 'PGS. Lê Thu Hà',
    role: 'LECTURER',
    faculty: 'Khoa CNTT',
    locked: false,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'u_student',
    email: 'sinhvien@svforum.vn',
    displayName: 'Nguyễn Minh An',
    role: 'STUDENT',
    faculty: 'Khoa CNTT',
    locked: false,
    createdAt: '2026-01-03T00:00:00.000Z',
  },
];

export const SEED_POSTS: Post[] = [
  {
    id: 'p1',
    title: 'Giải thích Big-O notation với ví dụ từ thuật toán sắp xếp',
    excerpt:
      'Mình đang học Cấu trúc dữ liệu và thấy khó phân biệt O(n log n) với O(n²). Có ai có ví dụ trực quan không ạ?',
    body:
      'Mình đang học Cấu trúc dữ liệu và thấy khó phân biệt O(n log n) với O(n²).\n\nVí dụ mình đang so sánh merge sort với bubble sort. Cảm ơn mọi người!',
    tags: ['Cấu trúc dữ liệu', 'Khoa CNTT', 'RIPT'],
    authorId: 'u_student',
    authorName: 'Nguyễn Minh An',
    authorRole: 'STUDENT',
    createdAt: '2026-05-12T08:00:00.000Z',
    voteScore: 24,
    answerCount: 2,
    viewCount: 842,
    moderationStatus: 'published',
  },
  {
    id: 'p2',
    title: 'REST vs GraphQL: khi nào nên chọn cho đồ án tốt nghiệp?',
    excerpt:
      'Nhóm em làm API cho hệ thống đặt phòng. Backend NestJS, mobile Flutter. Mong thầy cô góp ý.',
    body: 'Nhóm em làm API cho hệ thống đặt phòng. Backend NestJS, mobile Flutter.\n\nEm đang phân vân REST vs GraphQL.',
    tags: ['Phát triển Web', 'Đồ án', 'Backend'],
    authorId: 'u_student',
    authorName: 'Trần Hoàng Nam',
    authorRole: 'STUDENT',
    createdAt: '2026-05-11T10:00:00.000Z',
    voteScore: 18,
    answerCount: 1,
    viewCount: 1204,
    moderationStatus: 'published',
  },
  {
    id: 'p3',
    title: 'Tài liệu tham khảo chuẩn hóa ERD cho hệ thống đa tenant',
    excerpt: 'Mình cần mô hình tenant_id trên mọi bảng nghiệp vụ. Có pattern nào đáng đọc không?',
    body: 'Stack: PostgreSQL, ưu tiên row-level tenant. Cảm ơn.',
    tags: ['Cơ sở dữ liệu', 'Thiết kế hệ thống'],
    authorId: 'u_lecturer',
    authorName: 'PGS. Lê Thu Hà',
    authorRole: 'LECTURER',
    createdAt: '2026-05-10T14:00:00.000Z',
    voteScore: 42,
    answerCount: 0,
    viewCount: 3102,
    moderationStatus: 'published',
  },
];

export const SEED_COMMENTS: Comment[] = [
  {
    id: 'c1',
    postId: 'p1',
    parentId: null,
    body: 'Bạn có thể vẽ biểu đồ n vs n log n với cùng trục để so sánh trực quan.',
    authorId: 'u_lecturer',
    authorName: 'PGS. Lê Thu Hà',
    authorRole: 'LECTURER',
    createdAt: '2026-05-12T09:00:00.000Z',
    voteScore: 8,
    moderationStatus: 'published',
  },
  {
    id: 'c2',
    postId: 'p1',
    parentId: 'c1',
    body: 'Cảm ơn thầy, em sẽ thử với Python matplotlib.',
    authorId: 'u_student',
    authorName: 'Nguyễn Minh An',
    authorRole: 'STUDENT',
    createdAt: '2026-05-12T10:00:00.000Z',
    voteScore: 3,
    moderationStatus: 'published',
  },
];

export const SEED_BANNED_WORDS: BannedWord[] = [
  { id: 'bw1', word: 'spam', action: 'hidden', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'bw2', word: 'tục', action: 'pending', createdAt: '2026-01-01T00:00:00.000Z' },
];

export const SEED_REPORTS: ContentReport[] = [];

export const SEED_VOTES: VoteRecord[] = [];

export const SEED_PASSWORDS: Record<string, string> = {
  u_admin: DEMO_PASSWORD,
  u_lecturer: DEMO_PASSWORD,
  u_student: DEMO_PASSWORD,
};
