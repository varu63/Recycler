import { apiGet, apiPost } from '@/lib/api';
import type { NotificationDTO, Paginated } from '@/types';

export const notificationsService = {
  list: (query: { page?: number; limit?: number; unread?: boolean }) =>
    apiGet<Paginated<NotificationDTO>>('/notifications', { params: query }),

  unreadCount: async () => (await apiGet<{ count: number }>('/notifications/unread-count')).count,

  markRead: (id: string) => apiPost<null>(`/notifications/${id}/read`),

  markAllRead: () => apiPost<null>('/notifications/read-all'),
};
