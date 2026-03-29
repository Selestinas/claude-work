import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  sendCode: (email) => api.post('/auth/send-code', { email }),
  verifyCode: (email, code) => api.post('/auth/verify-code', { email, code }),
};

export const booksApi = {
  search: (q, page = 1) => api.get('/books/search', { params: { q, page } }),
};

export const userBooksApi = {
  getAll: (status) => api.get('/user/books', { params: { status } }),
  add: (book) => api.post('/user/books', book),
  updateStatus: (id, status) => api.put(`/user/books/${id}`, { status }),
  remove: (id) => api.delete(`/user/books/${id}`),
};

export default api;
