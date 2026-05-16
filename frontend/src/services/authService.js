import { api } from './api';

const AuthService = {
  // Register (Step 1)
  register: async (userData) => {
    return await api.post('/auth/register', userData);
  },

  // Verify OTP (Step 2)
  verifyOtp: async (email, otp) => {
    const data = await api.post('/auth/verify-otp', { email, otp });
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      const user = { ...data };
      delete user.token;
      localStorage.setItem('user', JSON.stringify(user));
    }
    return data;
  },

  // Resend OTP
  sendOtp: async (email) => {
    return await api.post('/auth/send-otp', { email });
  },

  // Universal Login - backend determines role
  login: async (email, password) => {
    const data = await api.post('/auth/login', { email, password });

    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      const user = { ...data };
      delete user.token;
      delete user.success;
      localStorage.setItem('user', JSON.stringify(user));
    }
    return data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get Current User
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: () => {
    return localStorage.getItem('token');
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export default AuthService;
