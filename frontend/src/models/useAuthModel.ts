import { useState, useCallback } from 'react';

/**
 * Model quản lý trạng thái đăng nhập của người dùng.
 * Sử dụng plugin-model của UmiJS để chia sẻ state toàn cục.
 */
export default function useAuthModel() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const login = useCallback((user: any) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    // Có thể lưu token vào localStorage tại đây
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    // Xóa token khỏi localStorage
  }, []);

  return {
    currentUser,
    isAuthenticated,
    login,
    logout,
  };
}
