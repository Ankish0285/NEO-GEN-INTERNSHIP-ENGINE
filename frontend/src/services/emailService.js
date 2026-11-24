import { api } from './api';

export const getEmailLogs = (params) => api.get('/admin/email-logs', { params });
export const getEmailStats = () => api.get('/admin/email-stats');
export const retryEmailLog = (id) => api.post(`/admin/email-logs/${id}/retry`);
export const sendAnnouncement = (data) => api.post('/admin/announcements', data);
export const getEmailSettings = () => api.get('/admin/email-settings');
export const updateEmailSettings = (data) => api.put('/admin/email-settings', data);
