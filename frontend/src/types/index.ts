export type UserRole = "admin" | "teacher" | "student";

export type PostDifficulty = "easy" | "medium" | "hard";

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  faculty?: string;
  is_active: boolean;
  reward_points?: number;
  created_at: string;
  birthday?: string;
  bio?: string;
  social_links?: Record<string, string>;
  avatar_url?: string;
  // For backwards compatibility
  displayName?: string;
  locked?: boolean;
  rewardPoints?: number;
  createdAt?: string;
  socialLinks?: Record<string, string>;
  avatarUrl?: string;
}

export interface RegisterInput {
  email: string;
  displayName: string;
  password: string;
  role: UserRole;
  faculty?: string;
}

/** published = hiển thị công khai; pending = chờ admin duyệt; hidden = ẩn khỏi diễn đàn */
export type ModerationStatus = "published" | "pending" | "hidden";

export interface UserVoucher {
  id: string;
  itemId: string;
  itemTitle: string;
  itemDescription?: string;
  cost: number;
  voucherCode: string;
  isUsed: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorRole: UserRole;
  createdAt: string;
  voteScore: number;
  answerCount: number;
  viewCount: number;
  /** Điểm thưởng (tab "Có thưởng") — 0 hoặc không có = không có bounty */
  bounty?: number;
  difficulty?: PostDifficulty;
  avgRating?: number;
  ratingCount?: number;
  acceptedCommentId?: string;
  moderationStatus: ModerationStatus;
  /** Từ khóa cấm khớp (nếu có) */
  moderationFlags?: string[];
  /** Ghi chú admin sau khi xử lý (nhắc nhở, v.v.) */
  moderationNote?: string;
  isAuthor?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  body: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorRole: UserRole;
  createdAt: string;
  voteScore: number;
  isAccepted?: boolean;
  moderationStatus: ModerationStatus;
  moderationFlags?: string[];
  moderationNote?: string;
}

export type ReportTargetType = "post" | "comment";

export type ReportStatus = "open" | "resolved";

/** Hành động admin khi xử lý báo cáo / hàng đợi */
export type ModerationResolveAction = "keep" | "warn" | "delete";

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
  action: "pending" | "hidden";
  createdAt: string;
}

export interface ModerationQueueItem {
  id: string;
  source: "report" | "automod";
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

export type VoteTargetType = "post" | "comment";

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
  difficulty?: PostDifficulty;
  bounty?: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  role: UserRole;
  points: number;
  rewardPoints?: number;
  reputation?: number;
  acceptedAnswers?: number;
  ratedPosts?: number;
}

export interface RewardItem {
  id: string;
  title: string;
  description?: string;
  cost: number;
  stock: number;
}

// Chat Types
export interface ChatUser {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  role: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: ChatUser;
}

export interface ChatConversation {
  id: string;
  otherUser: ChatUser;
  lastMessage?: ChatMessage;
  unreadCount: number;
  updatedAt: string;
}
