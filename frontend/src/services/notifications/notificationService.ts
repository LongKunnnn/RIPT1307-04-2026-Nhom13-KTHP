// Import hàm apiFetch từ cái file sếp vừa dán
import { apiFetch } from '@/services/api/client'; 

export interface NotificationItem {
  id: number;
  type: string;
  title: string | null;
  content: string;
  link_path: string | null;
  is_read: boolean;
  comment_id: number | null;
  created_at: string;
}

export const notificationService = {
  getMyNotifications: async (): Promise<NotificationItem[]> => {
    return apiFetch<NotificationItem[]>('/api/notifications', {
      method: 'GET',
    });
  },

  markAsRead: async (id: number): Promise<void> => {
    await apiFetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  markAllAsRead: async (): Promise<void> => {
    await apiFetch('/api/notifications/read-all', {
      method: 'PATCH',
    });
  },
};