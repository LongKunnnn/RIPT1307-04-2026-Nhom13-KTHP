import type { AdminStats, User, UserRole } from '@/types';
import {
  getComments,
  getPasswords,
  getPosts,
  getSessionUserId,
  getUsers,
  newId,
  setPasswords,
  setUsers,
} from '@/services/mock/db';
import { moderationService } from '@/services/moderation/moderationService';
import { reportService } from '@/services/moderation/reportService';

export type AdminUserGuardAction = 'delete' | 'lock' | 'demote';

function countActiveAdmins(users: User[]): number {
  return users.filter((u) => u.role === 'ADMIN' && !u.locked).length;
}

/** Chặn tự xóa/khóa/hạ quyền và không để mất admin cuối cùng. */
export function assertAdminUserAction(
  targetId: string,
  action: AdminUserGuardAction,
  actorId?: string | null,
): void {
  const users = getUsers();
  const target = users.find((u) => u.id === targetId);
  if (!target) throw new Error('Không tìm thấy người dùng');

  const actor = actorId ?? getSessionUserId();

  if (actor && targetId === actor) {
    if (action === 'delete') {
      throw new Error('Không thể xóa tài khoản đang đăng nhập');
    }
    if (action === 'lock') {
      throw new Error('Không thể khóa tài khoản đang đăng nhập');
    }
    if (action === 'demote') {
      throw new Error('Không thể đổi vai trò tài khoản đang đăng nhập');
    }
  }

  if (target.role !== 'ADMIN') return;

  const isLastActiveAdmin =
    countActiveAdmins(users) <= 1 && !target.locked;

  if (!isLastActiveAdmin) return;

  if (action === 'delete') {
    throw new Error('Không thể xóa quản trị viên hoạt động cuối cùng');
  }
  if (action === 'lock') {
    throw new Error('Không thể khóa quản trị viên hoạt động cuối cùng');
  }
  if (action === 'demote') {
    throw new Error('Phải giữ ít nhất một quản trị viên đang hoạt động');
  }
}

export interface UpsertUserInput {
  id?: string;
  email: string;
  displayName: string;
  role: UserRole;
  faculty?: string;
  password?: string;
}

export const adminService = {
  getStats(): AdminStats {
    const users = getUsers();
    return {
      postCount: getPosts().length,
      userCount: users.length,
      commentCount: getComments().length,
      lockedUserCount: users.filter((u) => u.locked).length,
      moderationQueueCount: moderationService.countQueue(),
      openReportCount: reportService.countOpen(),
    };
  },

  listUsers(): User[] {
    return [...getUsers()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  createUser(input: UpsertUserInput): User {
    const user: User = {
      id: newId('u'),
      email: input.email.trim(),
      displayName: input.displayName.trim(),
      role: input.role,
      faculty: input.faculty?.trim(),
      locked: false,
      createdAt: new Date().toISOString(),
    };
    setUsers([...getUsers(), user]);
    if (input.password) {
      const passwords = getPasswords();
      passwords[user.id] = input.password;
      setPasswords(passwords);
    }
    return user;
  },

  updateUser(id: string, input: UpsertUserInput, actorId?: string | null): User {
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx < 0) throw new Error('Không tìm thấy người dùng');
    if (users[idx].role === 'ADMIN' && input.role !== 'ADMIN') {
      assertAdminUserAction(id, 'demote', actorId);
    }
    users[idx] = {
      ...users[idx],
      email: input.email.trim(),
      displayName: input.displayName.trim(),
      role: input.role,
      faculty: input.faculty?.trim(),
    };
    setUsers(users);
    if (input.password) {
      const passwords = getPasswords();
      passwords[id] = input.password;
      setPasswords(passwords);
    }
    return users[idx];
  },

  deleteUser(id: string, actorId?: string | null) {
    assertAdminUserAction(id, 'delete', actorId);
    setUsers(getUsers().filter((u) => u.id !== id));
    const passwords = getPasswords();
    delete passwords[id];
    setPasswords(passwords);
  },

  resetPassword(id: string, newPassword: string) {
    const passwords = getPasswords();
    if (!getUsers().some((u) => u.id === id)) throw new Error('Không tìm thấy người dùng');
    passwords[id] = newPassword;
    setPasswords(passwords);
  },

  setLocked(id: string, locked: boolean, actorId?: string | null) {
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx < 0) throw new Error('Không tìm thấy người dùng');
    if (locked) assertAdminUserAction(id, 'lock', actorId);
    users[idx] = { ...users[idx], locked };
    setUsers(users);
  },
};
