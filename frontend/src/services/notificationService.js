import { api } from './api';

const NotificationService = {
  // Get All Notifications
  getNotifications: async () => {
    return await api.get('/notifications');
  },

  // Create Notification (Admin)
  createNotification: async (notificationData) => {
    return await api.post('/notifications', notificationData);
  },

  // Update Notification (Admin)
  updateNotification: async (id, notificationData) => {
    return await api.put(`/notifications/${id}`, notificationData);
  },

  // Delete Notification (Admin)
  deleteNotification: async (id) => {
    return await api.delete(`/notifications/${id}`);
  }
};

export default NotificationService;
