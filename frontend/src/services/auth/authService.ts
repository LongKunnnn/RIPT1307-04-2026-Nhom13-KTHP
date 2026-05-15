import type { RegisterInput, User } from '@/types';
import {
  getPasswords,
  getSessionUserId,
  getUsers,
  newId,
  setPasswords,
  setSessionUserId,
  setUsers,
} from '@/services/mock/db';

export const authService = {
  getCurrentUser(): User | null {
    const id = getSessionUserId();
    if (!id) return null;
    return getUsers().find((u) => u.id === id) ?? null;
  },

  login(email: string, password: string): User {
    const user = getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('Email hoặc mật khẩu không đúng');
    if (user.locked) throw new Error('Tài khoản đã bị khóa. Liên hệ quản trị viên.');
    const passwords = getPasswords();
    if (passwords[user.id] !== password) throw new Error('Email hoặc mật khẩu không đúng');
    setSessionUserId(user.id);
    return user;
  },

  register(input: RegisterInput): User {
    const exists = getUsers().some((u) => u.email.toLowerCase() === input.email.toLowerCase());
    if (exists) throw new Error('Email đã được sử dụng');
    const user: User = {
      id: newId('u'),
      email: input.email.trim(),
      displayName: input.displayName.trim(),
      role: input.role,
      faculty: input.faculty?.trim(),
      locked: false,
      createdAt: new Date().toISOString(),
    };
    const users = [...getUsers(), user];
    setUsers(users);
    const passwords = getPasswords();
    passwords[user.id] = input.password;
    setPasswords(passwords);
    setSessionUserId(user.id);
    return user;
  },

  logout() {
    setSessionUserId(null);
  },
};
