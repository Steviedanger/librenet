import api from './api.js';

export const authService = {
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  refresh: () => api.post('/auth/refresh').then((r) => r.data),
  verifyEmail: (token, email) =>
    api
      .get('/auth/verify-email', { params: { token, email } })
      .then((r) => r.data),
  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (data) =>
    api.post('/auth/reset-password', data).then((r) => r.data),
};

export default authService;
