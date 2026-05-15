import type { AdminStats, User, UserRole } from '@/types';
import {
  getComments,
  getPasswords,
  getPosts,
  getUsers,
  newId,
  setPasswords,
  setUsers,
} from '@/services/mock/db';
import { moderationService } from '@/services/moderation/moderationService';
import { reportService } from '@/services/moderation/reportService';

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

  updateUser(id: string, input: UpsertUserInput): User {
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx < 0) throw new Error('Không tìm thấy người dùng');
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

  deleteUser(id: string) {
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

  setLocked(id: string, locked: boolean) {
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx < 0) throw new Error('Không tìm thấy người dùng');
    users[idx] = { ...users[idx], locked };
    setUsers(users);
  },
};
