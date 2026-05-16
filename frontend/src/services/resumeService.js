import { api } from './api';

const resumeService = {
    /**
     * Upload resume for ATS analysis
     * @param {File} file - Resume file (PDF, DOC, DOCX)
     * @param {string} [jobDescription] - Optional job description for better analysis
     * @returns {Promise<Object>} Analysis result with score and recommendations
     */
    uploadResume: async (file, jobDescription = '') => {
        try {
            const formData = new FormData();
            formData.append('resume', file);
            if (jobDescription) {
                formData.append('jobDescription', jobDescription);
            }

            const data = await api.post('/resume/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get latest resume score and analysis
     * @returns {Promise<Object>} Resume analysis data
     */
    getResumeScore: async () => {
        try {
            return await api.get('/resume/score');
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get ATS-based internship recommendations
     * @returns {Promise<Object>} List of recommended internships with match scores
     */
    getRecommendations: async () => {
        try {
            return await api.get('/resume/recommendations');
        } catch (error) {
            throw error;
        }
    },

    /**
     * Delete resume
     * @param {string} resumeId - Resume ID
     * @returns {Promise<Object>} Success message
     */
    deleteResume: async (resumeId) => {
        try {
            return await api.delete(`/resume/${resumeId}`);
        } catch (error) {
            throw error;
        }
    }
};

export default resumeService;
