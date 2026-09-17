import { api } from './api';
import AuthService from './authService';

const SiteSettingsService = {
  getPublic: async () => {
    const data = await api.get('/site-settings');
    return data.settings;
  },

  update: async (settings) => {
    const data = await api.put('/site-settings', { settings });
    if (!data?.success) {
      const err = new Error(data?.message || 'Failed to save website settings');
      err.data = data;
      throw err;
    }
    return data;
  },

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = AuthService.getToken();
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    return await api.upload('/site-settings/upload', formData, {
      headers,
    });
  },
};

export default SiteSettingsService;
