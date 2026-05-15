import type { BannedWord, Comment, ContentReport, Post, User, VoteRecord } from '@/types';
import { readJson, writeJson } from './storage';
import {
  SEED_BANNED_WORDS,
  SEED_COMMENTS,
  SEED_PASSWORDS,
  SEED_POSTS,
  SEED_REPORTS,
  SEED_USERS,
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
  sessionUserId: 'session_user_id',
  initialized: 'db_initialized',
  schemaVersion: 'db_schema_version',
} as const;

const CURRENT_SCHEMA = 2;

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

  writeJson(KEYS.schemaVersion, CURRENT_SCHEMA);
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
    writeJson(KEYS.initialized, true);
    writeJson(KEYS.schemaVersion, CURRENT_SCHEMA);
    return;
  }
  migrateSchema();
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

export function newId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
