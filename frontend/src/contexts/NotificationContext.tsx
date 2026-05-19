import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { message, notification } from 'antd';

interface NotificationContextValue {
  notifyEmail: (title: string, description: string) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const notifyEmail = useCallback((title: string, description: string) => {
    notification.info({
      message: `📧 Email (giả lập): ${title}`,
      description,
      placement: 'topRight',
      duration: 5,
    });
  }, []);

  const success = useCallback((msg: string) => message.success(msg), []);
  const error = useCallback((msg: string) => message.error(msg), []);

  return (
    <NotificationContext.Provider value={{ notifyEmail, success, error }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotify must be used within NotificationProvider');
  return ctx;
}
