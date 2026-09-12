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

  verifyLoginOtp: async (email, otp) => {
    const data = await api.post('/auth/verify-login-otp', { email, otp });
    if (data.token) {
      localStorage.setItem('token', data.token);
      const user = { ...data };
      delete user.token;
      delete user.success;
      delete user.message;
      localStorage.setItem('user', JSON.stringify(user));
    }
    return data;
  },

  sendLoginOtp: async (email) => {
    return await api.post('/auth/resend-login-otp', { email });
  },

  // Resend OTP
  sendOtp: async (email) => {
    return await api.post('/auth/send-otp', { email });
  },

  // Unified login — student, partner, and admin use the same endpoint
  login: async (email, password) => {
    const data = await api.post('/auth/login', { email, password });

    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      const user = { ...data };
      delete user.token;
      delete user.success;
      delete user.message;
      localStorage.setItem('user', JSON.stringify(user));
    }
    return data;
  },

  loginAdmin: (email, password) => AuthService.login(email, password),

  loginPartner: (email, password) => AuthService.login(email, password),

  // Forgot Password - send reset link to email
  forgotPassword: async (email) => {
    return await api.post('/auth/forgot-password', { email });
  },

  // Reset Password - using secure token from email link
  resetPassword: async (token, newPassword, confirmPassword) => {
    return await api.put(`/auth/reset-password/${token}`, { newPassword, confirmPassword });
  },

  // Google OAuth login - credential (ID token) posted to backend for verification
  googleLogin: async (credentialIdToken) => {
    const data = await api.post('/auth/google', { token: credentialIdToken });

    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      const user = { ...data };
      delete user.token;
      delete user.success;
      delete user.message;
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
