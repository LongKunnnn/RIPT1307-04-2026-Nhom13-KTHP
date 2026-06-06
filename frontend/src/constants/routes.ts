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
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  askQuestion: '/questions/ask',
  questionDetail: (id: string) => `/questions/${encodeURIComponent(id)}`,
  profile: '/profile',
  publicProfile: (username: string) => `/profile/${encodeURIComponent(username)}`,
  admin: {
    root: '/admin',
    posts: '/admin/posts',
    postDetail: (id: string) => `/admin/posts/${encodeURIComponent(id)}`,
    users: '/admin/users',
    moderation: '/admin/moderation',
    checkVar: '/admin/suspicious-users'
  },
} as const;