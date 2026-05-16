import { api } from './api';

const ApplicationService = {
  // Apply for internship
  apply: async (applicationData) => {
    return await api.post('/applications', applicationData);
  },

  applyWithForm: async (internshipId, formData) => {
    return await api.post(`/applications/apply/${internshipId}`, formData);
  },

  // Get My Applications (Student)
  getMyApplications: async () => {
    return await api.get('/applications/my');
  },

  // Get All Applications (Admin)
  getAllApplications: async () => {
    return await api.get('/applications');
  },

  getApplicationById: async (id) => {
    return await api.get(`/applications/${id}`);
  },

  // Update Status (Admin)
  updateStatus: async (id, status) => {
    return await api.put(`/applications/${id}/status`, { status });
  },

  getPartnerApplications: async () => {
    return await api.get('/applications/partner');
  },

  withdrawApplication: async (id) => {
    return await api.delete(`/applications/${id}/withdraw`);
  }
};

export default ApplicationService;
