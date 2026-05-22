import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

export function rootContainer(container: React.ReactNode) {
  return (
    <AuthProvider>
      <NotificationProvider>{container}</NotificationProvider>
    </AuthProvider>
  );
}
