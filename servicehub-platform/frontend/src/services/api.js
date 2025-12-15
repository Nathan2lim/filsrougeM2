import axios from 'axios';

const API_URL = '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
};

// Users
export const usersService = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getRoles: () => api.get('/users/roles'),
};

// Tickets
export const ticketsService = {
  getAll: (params) => api.get('/tickets', { params }),
  getMyTickets: (params) => api.get('/tickets/my-tickets', { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post('/tickets', data),
  update: (id, data) => api.put(`/tickets/${id}`, data),
  assign: (id, assignedToId) => api.put(`/tickets/${id}/assign`, { assignedToId }),
  changeStatus: (id, status) => api.put(`/tickets/${id}/status`, { status }),
  addComment: (id, data) => api.post(`/tickets/${id}/comments`, data),
  delete: (id) => api.delete(`/tickets/${id}`),
  getStats: () => api.get('/tickets/stats'),
};

// Invoices
export const invoicesService = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  send: (id) => api.put(`/invoices/${id}/send`),
  cancel: (id) => api.put(`/invoices/${id}/cancel`),
  getStats: () => api.get('/invoices/stats'),
};

// Dashboard
export const dashboardService = {
  getOverview: () => api.get('/dashboard'),
  getTicketStats: () => api.get('/dashboard/tickets'),
  getBillingStats: () => api.get('/dashboard/billing'),
  getUserStats: () => api.get('/dashboard/users'),
  getActivity: () => api.get('/dashboard/activity'),
};

export default api;
