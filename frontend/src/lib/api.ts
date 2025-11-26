import axios from 'axios';

// Smart backend URL detection
const getApiUrl = () => {
  // 1. Use explicit environment variable if set
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 2. In production (Vercel), use Railway backend
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return 'https://audit-portal-production.up.railway.app/api';
  }
  
  // 3. Local development fallback
  return 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  getMe: () => api.get('/auth/me'),
};

// Projects API
export const projectsAPI = {
  getAll: (sort?: string) =>
    api.get('/projects', { params: { sort } }),
  getBySlug: (slug: string) =>
    api.get(`/projects/${slug}`),
  getAllAdmin: () =>
    api.get('/projects/admin/all'),
  getById: (id: string) =>
    api.get(`/projects/admin/${id}`),
  create: (data: any) =>
    api.post('/projects', data),
  update: (id: string, data: any) =>
    api.put(`/projects/${id}`, data),
  delete: (id: string) =>
    api.delete(`/projects/${id}`),
  publish: (id: string, published: boolean) =>
    api.patch(`/projects/${id}/publish`, { published }),
  generateSlug: (name: string) =>
    api.post('/projects/generate-slug', { name }),
  fetchGoPlus: (id: string) =>
    api.post(`/projects/${id}/fetch-goplus`),
  getStats: () =>
    api.get('/projects/stats/portfolio'),
};

// Blockchains API
export const blockchainsAPI = {
  getList: () =>
    api.get('/blockchains/list'),
};

// Advertisements API
export const advertisementsAPI = {
  getAll: (publishedOnly?: boolean) =>
    api.get('/advertisements', { params: { published: publishedOnly } }),
  getById: (id: string) =>
    api.get(`/advertisements/${id}`),
  getRandom: () =>
    api.get('/advertisements/random'),
  create: (data: any) =>
    api.post('/advertisements', data),
  update: (id: string, data: any) =>
    api.put(`/advertisements/${id}`, data),
  delete: (id: string) =>
    api.delete(`/advertisements/${id}`),
  duplicate: (id: string) =>
    api.post(`/advertisements/${id}/duplicate`),
};

// Market Cap API
export const marketCapAPI = {
  getSecured: () =>
    api.get('/marketcap/secured'),
  refresh: () =>
    api.post('/marketcap/refresh'),
};

// Settings API
export const settingsAPI = {
  getAll: () =>
    api.get('/settings'),
  get: (key: string) =>
    api.get(`/settings/${key}`),
  update: (key: string, value: any, description?: string) =>
    api.put(`/settings/${key}`, { value, description }),
  delete: (key: string) =>
    api.delete(`/settings/${key}`),
  bulkUpdate: (settings: Record<string, { value: any; description?: string }>) =>
    api.post('/settings/bulk', { settings }),
};

export default api;
