import api from './api.js';

const reviewService = {
  getByBook: async (bookId) => {
    const res = await api.get(`/reviews/book/${bookId}`);
    return res.data;
  },

  addOrUpdate: async (bookId, { rating, comment }) => {
    const res = await api.post(`/reviews/book/${bookId}`, { rating, comment });
    return res.data;
  },

  remove: async (reviewId) => {
    const res = await api.delete(`/reviews/${reviewId}`);
    return res.data;
  },
};

export default reviewService;