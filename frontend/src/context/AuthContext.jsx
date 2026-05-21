/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = AuthService.getToken();
      const savedUser = AuthService.getCurrentUser();
      
      if (token && savedUser) {
        setUser(savedUser);
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const persistSession = (data) => {
    const userData = { ...data };
    delete userData.token;
    delete userData.success;
    delete userData.message;
    setUser(userData);
    setIsAuthenticated(true);
    return { success: true, role: userData.role };
  };

  const login = async (email, password) => {
    try {
      const data = await AuthService.login(email, password);
      if (data.success && data.token) {
        return persistSession(data);
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch (error) {
      return { success: false, message: error.data?.message || error.message || 'Login failed' };
    }
  };

  const loginAdmin = async (email, password) => {
    try {
      const data = await AuthService.loginAdmin(email, password);
      if (data.success && data.token) {
        return persistSession(data);
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch (error) {
      return { success: false, message: error.data?.message || error.message || 'Login failed' };
    }
  };

  const loginPartner = async (email, password) => {
    try {
      const data = await AuthService.loginPartner(email, password);
      if (data.success && data.token) {
        return persistSession(data);
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch (error) {
      return { success: false, message: error.data?.message || error.message || 'Login failed' };
    }
  };

  const register = async (formData) => {
    try {
      const data = await AuthService.register(formData);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.data?.message || error.message };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      console.log('[AuthContext] Verifying OTP for:', email);
      
      const data = await AuthService.verifyOtp(email, otp);
      
      console.log('[AuthContext] OTP verification response:', { success: data.success, role: data.role, hasToken: !!data.token });
      
      if (data.token) {
        const userData = { ...data };
        delete userData.token;
        
        console.log('[AuthContext] ✅ OTP verified, user logged in:', { name: userData.name, role: userData.role });
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, role: userData.role };
      }
      
      console.error('[AuthContext] ❌ OTP verification failed');
      return { success: false, message: 'Verification failed' };
    } catch (error) {
      console.error('[AuthContext] ❌ OTP verification error:', error);
      return { success: false, message: error.data?.message || error.message };
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, loginAdmin, loginPartner, register, verifyOtp, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
