import type { BannedWord, Comment, ContentReport, Post, User, VoteRecord } from '@/types';
import { readJson, writeJson } from './storage';
import {
  SEED_BANNED_WORDS,
  SEED_COMMENTS,
  SEED_PASSWORDS,
  SEED_POSTS,
  SEED_REPORTS,
  SEED_USERS,
  SEED_FOLLOWS,
  SEED_VOTES,
} from './seed';

const KEYS = {
  users: 'db_users',
  posts: 'db_posts',
  comments: 'db_comments',
  votes: 'db_votes',
  passwords: 'db_passwords',
  reports: 'db_reports',
  bannedWords: 'db_banned_words',
  follows: 'db_post_follows',
  sessionUserId: 'session_user_id',
  initialized: 'db_initialized',
  schemaVersion: 'db_schema_version',
} as const;

const CURRENT_SCHEMA = 4;

/** Mở khóa mọi tài khoản ADMIN (phục hồi khi lỡ khóa admin). */
function unlockAdminUsers() {
  const users = readJson<User[]>(KEYS.users, []);
  let changed = false;
  const next = users.map((u) => {
    if (u.role === 'ADMIN' && u.locked) {
      changed = true;
      return { ...u, locked: false };
    }
    return u;
  });
  if (changed) writeJson(KEYS.users, next);
}

function migrateSchema() {
  const ver = readJson(KEYS.schemaVersion, 1);
  if (ver >= CURRENT_SCHEMA) return;

  const posts = readJson<Post[]>(KEYS.posts, []);
  writeJson(
    KEYS.posts,
    posts.map((p) => ({
      ...p,
      moderationStatus: p.moderationStatus ?? 'published',
    })),
  );

  const comments = readJson<Comment[]>(KEYS.comments, []);
  writeJson(
    KEYS.comments,
    comments.map((c) => ({
      ...c,
      moderationStatus: c.moderationStatus ?? 'published',
    })),
  );

  if (!readJson(KEYS.bannedWords, null)) writeJson(KEYS.bannedWords, SEED_BANNED_WORDS);
  if (!readJson(KEYS.reports, null)) writeJson(KEYS.reports, SEED_REPORTS);

  writeJson(KEYS.schemaVersion, 2);
}

function migrateToV3() {
  const ver = readJson(KEYS.schemaVersion, 1);
  if (ver >= 3) return;
  if (!readJson(KEYS.follows, null)) writeJson(KEYS.follows, SEED_FOLLOWS);
  writeJson(KEYS.schemaVersion, 3);
}

function migrateToV4() {
  const ver = readJson(KEYS.schemaVersion, 1);
  if (ver >= 4) return;
  unlockAdminUsers();
  writeJson(KEYS.schemaVersion, 4);
}

function ensureSeed() {
  if (!readJson(KEYS.initialized, false)) {
    writeJson(KEYS.users, SEED_USERS);
    writeJson(KEYS.posts, SEED_POSTS);
    writeJson(KEYS.comments, SEED_COMMENTS);
    writeJson(KEYS.votes, SEED_VOTES);
    writeJson(KEYS.passwords, SEED_PASSWORDS);
    writeJson(KEYS.reports, SEED_REPORTS);
    writeJson(KEYS.bannedWords, SEED_BANNED_WORDS);
    writeJson(KEYS.follows, SEED_FOLLOWS);
    writeJson(KEYS.initialized, true);
    writeJson(KEYS.schemaVersion, CURRENT_SCHEMA);
    return;
  }
  migrateSchema();
  migrateToV3();
  migrateToV4();
}

/** Gọi thủ công nếu cần mở khóa admin ngay (console / dev). */
export function repairLockedAdminAccounts(): number {
  const users = readJson<User[]>(KEYS.users, []);
  let count = 0;
  const next = users.map((u) => {
    if (u.role === 'ADMIN' && u.locked) {
      count += 1;
      return { ...u, locked: false };
    }
    return u;
  });
  if (count > 0) writeJson(KEYS.users, next);
  return count;
}

export function getUsers(): User[] {
  ensureSeed();
  return readJson<User[]>(KEYS.users, []);
}

export function setUsers(users: User[]) {
  writeJson(KEYS.users, users);
}

export function getPosts(): Post[] {
  ensureSeed();
  return readJson<Post[]>(KEYS.posts, []);
}

export function setPosts(posts: Post[]) {
  writeJson(KEYS.posts, posts);
}

export function getComments(): Comment[] {
  ensureSeed();
  return readJson<Comment[]>(KEYS.comments, []);
}

export function setComments(comments: Comment[]) {
  writeJson(KEYS.comments, comments);
}

export function getVotes(): VoteRecord[] {
  ensureSeed();
  return readJson<VoteRecord[]>(KEYS.votes, []);
}

export function setVotes(votes: VoteRecord[]) {
  writeJson(KEYS.votes, votes);
}

export function getPasswords(): Record<string, string> {
  ensureSeed();
  return readJson<Record<string, string>>(KEYS.passwords, {});
}

export function setPasswords(map: Record<string, string>) {
  writeJson(KEYS.passwords, map);
}

export function getSessionUserId(): string | null {
  return readJson<string | null>(KEYS.sessionUserId, null);
}

export function setSessionUserId(id: string | null) {
  writeJson(KEYS.sessionUserId, id);
}

export function getReports(): ContentReport[] {
  ensureSeed();
  return readJson<ContentReport[]>(KEYS.reports, []);
}

export function setReports(reports: ContentReport[]) {
  writeJson(KEYS.reports, reports);
}

export function getBannedWords(): BannedWord[] {
  ensureSeed();
  return readJson<BannedWord[]>(KEYS.bannedWords, []);
}

export function setBannedWords(words: BannedWord[]) {
  writeJson(KEYS.bannedWords, words);
}

export function getFollows(): { userId: string; postId: string; createdAt: string }[] {
  ensureSeed();
  return readJson(KEYS.follows, []);
}

export function setFollows(
  follows: { userId: string; postId: string; createdAt: string }[],
) {
  writeJson(KEYS.follows, follows);
}

export function newId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
