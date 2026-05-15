/** Central route paths */
export const ROUTES = {
  home: '/',
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
