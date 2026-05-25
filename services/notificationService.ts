import { apiClient } from './apiClient';
import { Notification } from '../types';

export const notificationService = {
  async getNotifications(_userId: string): Promise<Notification[]> {
    // userId ignored — backend derives it from JWT
    const data = await apiClient.get<{ notifications: any[] }>('/notifications');
    return (data.notifications || []).map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.is_read,
      createdAt: n.created_at,
    }));
  },

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.patch(`/notifications/${notificationId}/read`);
  },

  async markAllAsRead(_userId: string): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  },

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
  ): Promise<void> {
    // Admin broadcast to a single user
    await apiClient.post('/notifications', { userIds: [userId], title, message, type });
  },
};
