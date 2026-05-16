import { api } from './api';

const ReviewService = {
  // Get all verified reviews
  getReviews: async () => {
    return await api.get('/reviews');
  },

  // Create a review
  createReview: async (reviewData) => {
    return await api.post('/reviews', reviewData);
  }
};

export default ReviewService;
