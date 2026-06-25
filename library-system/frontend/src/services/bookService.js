import api from './api.js';

export const bookService = {
  // Catalogue
  list: (params) => api.get('/books', { params }).then((r) => r.data),
  genres: () => api.get('/books/genres').then((r) => r.data),
  get: (id) => api.get(`/books/${id}`).then((r) => r.data),
  read: (id) => api.get(`/books/${id}/read`).then((r) => r.data),

  // Admin CRUD (FormData for file uploads)
  create: (formData) =>
    api
      .post('/books', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
  update: (id, formData) =>
    api
      .put(`/books/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
  remove: (id) => api.delete(`/books/${id}`).then((r) => r.data),

  // Borrowing
  borrow: (bookId) => api.post(`/borrow/${bookId}`).then((r) => r.data),
  returnBook: (recordId) =>
    api.post(`/borrow/${recordId}/return`).then((r) => r.data),
  myBorrows: () => api.get('/borrow/me').then((r) => r.data),
  allBorrows: () => api.get('/borrow').then((r) => r.data),

  // Bookmarks & progress
  bookmarks: () => api.get('/users/bookmarks').then((r) => r.data),
  toggleBookmark: (bookId) =>
    api.post(`/users/bookmarks/${bookId}`).then((r) => r.data),
  progress: () => api.get('/users/progress').then((r) => r.data),
  saveProgress: (bookId, currentPage) =>
    api.put(`/users/progress/${bookId}`, { currentPage }).then((r) => r.data),

  // Admin users & stats
  users: () => api.get('/users').then((r) => r.data),
  setUserStatus: (id, isActive) =>
    api.patch(`/users/${id}/status`, { isActive }).then((r) => r.data),
  verifyUser: (id) =>
    api.patch(`/users/${id}/verify`).then((r) => r.data),
  setUserRole: (id, role) =>
    api.patch(`/users/${id}/role`, { role }).then((r) => r.data),
  stats: () => api.get('/users/stats').then((r) => r.data),

  // Profile
  updateProfile: (formData) =>
    api
      .put('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
};

export default bookService;
