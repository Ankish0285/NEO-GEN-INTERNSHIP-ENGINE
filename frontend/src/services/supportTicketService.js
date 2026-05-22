import { api } from './api';

const buildQuery = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
};

const friendlyError = (err) => {
  if (err.status === 404) {
    return new Error(
      'Support API not found. Restart the backend: cd backend && npm start (stop any old process on port 5000 first).'
    );
  }
  return err;
};

const SupportTicketService = {
  getTickets: async (params) => {
    try {
      return await api.get(`/support-tickets${buildQuery(params)}`);
    } catch (err) {
      throw friendlyError(err);
    }
  },
  getUnreadCount: async () => {
    try {
      return await api.get('/support-tickets/unread-count');
    } catch (err) {
      if (err.status === 404) return { success: true, count: 0 };
      throw err;
    }
  },
  getTicket: async (id) => {
    try {
      return await api.get(`/support-tickets/${id}`);
    } catch (err) {
      throw friendlyError(err);
    }
  },
  getAssignees: async () => {
    try {
      return await api.get('/support-tickets/meta/assignees');
    } catch (err) {
      throw friendlyError(err);
    }
  },
  createTicket: (formData) => api.upload('/support-tickets', formData),
  reply: (id, formData) => api.upload(`/support-tickets/${id}/reply`, formData),
  updateStatus: async (id, status) => {
    try {
      return await api.patch(`/support-tickets/${id}/status`, { status });
    } catch (err) {
      throw friendlyError(err);
    }
  },
  assignTicket: async (id, assignedTo) => {
    try {
      return await api.patch(`/support-tickets/${id}/assign`, { assignedTo });
    } catch (err) {
      throw friendlyError(err);
    }
  },
  deleteTicket: async (id) => {
    try {
      return await api.delete(`/support-tickets/${id}`);
    } catch (err) {
      throw friendlyError(err);
    }
  },
};

export default SupportTicketService;
