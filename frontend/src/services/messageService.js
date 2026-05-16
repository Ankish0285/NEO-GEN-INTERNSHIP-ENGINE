import { api } from './api';

const MessageService = {
  // Create Message (Support)
  createMessage: async (messageData) => {
    return await api.post('/messages', messageData);
  },

  // Get All Messages (Admin)
  getMessages: async () => {
    return await api.get('/messages');
  },

  // Update Message Status (Admin)
  updateStatus: async (id, status) => {
    return await api.put(`/messages/${id}`, { status });
  },

  // Delete Message (Admin)
  deleteMessage: async (id) => {
    return await api.delete(`/messages/${id}`);
  }
};

export default MessageService;
