import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ChatProvider } from '@/contexts/ChatContext';

export function rootContainer(container: React.ReactNode) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ChatProvider>{container}</ChatProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
