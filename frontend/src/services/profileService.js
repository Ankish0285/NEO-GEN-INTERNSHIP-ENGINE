import { api } from './api';

const ProfileService = {
  // Get Current Profile
  getProfile: async () => {
    return await api.get('/profile/me');
  },

  // Update Profile
  updateProfile: async (profileData) => {
    return await api.put('/profile/update', profileData);
  },

  // Upload Resume
  uploadResume: async (formData) => {
    return await api.upload('/upload', formData);
  },

  // Upload Profile Picture
  uploadProfilePicture: async (formData) => {
    return await api.upload('/profile/upload-picture', formData);
  },

  // Delete Profile Picture
  deleteProfilePicture: async () => {
    return await api.delete('/profile/delete-picture');
  },

  // Get Dashboard Stats
  getDashboardStats: async () => {
    return await api.get('/dashboard/summary');
  }
};

export default ProfileService;
