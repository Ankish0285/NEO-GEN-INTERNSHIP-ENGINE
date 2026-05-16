import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 and errors
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear invalid session but do NOT redirect automatically to avoid bounce
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    // Normalize error object to match what services expect
    const customError = new Error(error.response?.data?.message || error.message || 'Request failed');
    customError.status = error.response?.status;
    customError.data = error.response?.data;
    return Promise.reject(customError);
  }
);

export const api = {
  get: (url, config) => axiosInstance.get(url, config),
  post: (url, body, config) => axiosInstance.post(url, body, config),
  put: (url, body, config) => axiosInstance.put(url, body, config),
  delete: (url, config) => axiosInstance.delete(url, config),
  upload: (url, formData, config = {}) => axiosInstance.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config
  }),
  
  // Notifications API
  getNotifications: () => axiosInstance.get('/notifications'),
  createNotification: (data) => axiosInstance.post('/notifications', data),
  updateNotification: (id, data) => axiosInstance.put(`/notifications/${id}`, data),
  deleteNotification: (id) => axiosInstance.delete(`/notifications/${id}`),
};
