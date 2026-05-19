export type UserRole = 'ADMIN' | 'LECTURER' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  faculty?: string;
  locked: boolean;
  createdAt: string;
}

/** published = hiển thị công khai; pending = chờ admin duyệt; hidden = ẩn khỏi diễn đàn */
export type ModerationStatus = 'published' | 'pending' | 'hidden';

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: string;
  voteScore: number;
  answerCount: number;
  viewCount: number;
  /** Điểm thưởng (tab "Có thưởng") — 0 hoặc không có = không có bounty */
  bounty?: number;
  moderationStatus: ModerationStatus;
  /** Từ khóa cấm khớp (nếu có) */
  moderationFlags?: string[];
  /** Ghi chú admin sau khi xử lý (nhắc nhở, v.v.) */
  moderationNote?: string;
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  body: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: string;
  voteScore: number;
  moderationStatus: ModerationStatus;
  moderationFlags?: string[];
  moderationNote?: string;
}

export type ReportTargetType = 'post' | 'comment';

export type ReportStatus = 'open' | 'resolved';

/** Hành động admin khi xử lý báo cáo / hàng đợi */
export type ModerationResolveAction = 'keep' | 'warn' | 'delete';

export interface ContentReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedAction?: ModerationResolveAction;
}

/** Từ khóa cấm — action quyết định chờ duyệt hay ẩn ngay */
export interface BannedWord {
  id: string;
  word: string;
  action: 'pending' | 'hidden';
  createdAt: string;
}

export interface ModerationQueueItem {
  id: string;
  source: 'report' | 'automod';
  targetType: ReportTargetType;
  targetId: string;
  reportId?: string;
  title: string;
  preview: string;
  authorName: string;
  createdAt: string;
  moderationStatus: ModerationStatus;
  matchedWords?: string[];
  reportReason?: string;
  reporterName?: string;
}

export type VoteTargetType = 'post' | 'comment';

export interface VoteRecord {
  targetType: VoteTargetType;
  targetId: string;
  userId: string;
  value: 1 | -1;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminStats {
  postCount: number;
  userCount: number;
  commentCount: number;
  lockedUserCount: number;
  moderationQueueCount: number;
  openReportCount: number;
}

export interface CreatePostInput {
  title: string;
  body: string;
  tags: string[];
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  role: 'STUDENT' | 'LECTURER';
  faculty?: string;
}
