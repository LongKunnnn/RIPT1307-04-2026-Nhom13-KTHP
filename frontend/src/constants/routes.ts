/** Central route paths */
export type MineSection = 'authored' | 'followed';

export const ROUTES = {
  home: '/',
  /** Bảng tin — tất cả câu hỏi cộng đồng */
  homeFeed: '/#feed',
  /** Tab cá nhân: bài của tôi / đang theo dõi */
  myQuestions: (section: MineSection = 'authored') =>
    `/?tab=mine&section=${section}#mine`,
  /** @deprecated dùng myQuestions */
  questions: '/?tab=mine&section=authored#mine',
  login: '/login',
  register: '/register',
  askQuestion: '/questions/ask',
  questionDetail: (id: string) => `/questions/${encodeURIComponent(id)}`,
  admin: {
    root: '/admin',
    posts: '/admin/posts',
    postDetail: (id: string) => `/admin/posts/${encodeURIComponent(id)}`,
    users: '/admin/users',
    moderation: '/admin/moderation',
  },
} as const;
