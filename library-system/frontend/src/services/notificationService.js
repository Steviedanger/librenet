import api from './api.js';

const notificationService = {
  /**
   * Fetch logged-in user's recent notifications (limit 10)
   */
  getMyNotifications: async () => {
    const res = await api.get('/notifications/my-notifications');
    return res.data;
  },

  /**
   * Fetch unread notification count
   */
  getUnreadCount: async () => {
    const res = await api.get('/notifications/unread-count');
    return res.data;
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    const res = await api.patch('/notifications/mark-all-read');
    return res.data;
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (id) => {
    const res = await api.delete(`/notifications/${id}`);
    return res.data;
  },
};

export default notificationService;