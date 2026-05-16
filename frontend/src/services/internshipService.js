import { api } from './api';

const InternshipService = {
  // Get all internships
  getAllInternships: async (filters = {}) => {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.location) queryParams.append('location', filters.location);
    if (filters.department) queryParams.append('department', filters.department);

    return await api.get(`/internships?${queryParams.toString()}`);
  },

  // Get single internship
  getInternship: async (id) => {
    return await api.get(`/internships/${id}`);
  },

  // Create Internship (Admin)
  createInternship: async (internshipData) => {
    return await api.post('/internships', internshipData);
  },

  // Update Internship (Admin)
  updateInternship: async (id, internshipData) => {
    return await api.put(`/internships/${id}`, internshipData);
  },

  // Delete Internship (Admin)
  deleteInternship: async (id) => {
    return await api.delete(`/internships/${id}`);
  }
};

export default InternshipService;
