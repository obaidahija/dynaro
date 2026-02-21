import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('dynaro_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Redirect to login on 401 (but not when already on the login page)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login')
    ) {
      localStorage.removeItem('dynaro_token');
      localStorage.removeItem('dynaro_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// ── Stores ────────────────────────────────────────────
export const storeApi = {
  getMyStore: () => api.get('/stores/my-store'),
  updateStore: (data: Record<string, unknown>) => api.put('/stores/my-store', data),
  updateBranding: (data: Record<string, unknown>) => api.put('/stores/my-store/branding', data),
  updateLayoutOverrides: (data: { template_id: string; display_item_ids: string[] }) =>
    api.patch('/stores/my-store/layout-overrides', data),
};

// ── Playlists ─────────────────────────────────────────
export const playlistApi = {
  getAll:  ()                                                            => api.get('/playlists'),
  create:  (name: string)                                                => api.post('/playlists', { name }),
  getOne:  (id: string)                                                  => api.get(`/playlists/${id}`),
  update:  (id: string, data: { name?: string; slides: unknown[] })      => api.put(`/playlists/${id}`, data),
  remove:  (id: string)                                                  => api.delete(`/playlists/${id}`),
};

// ── Store Types ───────────────────────────────────────
export const storeTypeApi = {
  getAll: () => api.get('/stores/store-types'),
  setMyStoreType: (store_type: string) =>
    api.patch('/stores/my-store/store-type', { store_type }),
};

// ── Categories ────────────────────────────────────────
export const categoryApi = {
  getAll: () => api.get('/stores/my-store/categories'),
  add: (name: string) => api.post('/stores/my-store/categories', { name }),
  update: (id: string, data: { name: string }) =>
    api.patch(`/stores/my-store/categories/${id}`, data),
  remove: (id: string) =>
    api.delete(`/stores/my-store/categories/${id}`),
};

// ── Menu ──────────────────────────────────────────────
export const menuApi = {
  getItems: () => api.get('/menu'),
  createItem: (data: Record<string, unknown>) => api.post('/menu', data),
  updateItem: (id: string, data: Record<string, unknown>) => api.put(`/menu/${id}`, data),
  deleteItem: (id: string) => api.delete(`/menu/${id}`),
};

// ── Promotions ────────────────────────────────────────
export const promotionApi = {
  getAll: () => api.get('/promotions'),
  create: (data: Record<string, unknown>) => api.post('/promotions', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/promotions/${id}`, data),
  toggle: (id: string) => api.patch(`/promotions/${id}/toggle`),
  delete: (id: string) => api.delete(`/promotions/${id}`),
};

// ── Superadmin ────────────────────────────────────────
export const superadminApi = {
  getStores: () => api.get('/superadmin/stores'),
  createStore: (data: Record<string, unknown>) => api.post('/superadmin/stores', data),
  updateStore: (id: string, data: Record<string, unknown>) => api.patch(`/superadmin/stores/${id}`, data),
  toggleStoreActive: (id: string) => api.patch(`/superadmin/stores/${id}/toggle-active`),
  deleteStore: (id: string) => api.delete(`/superadmin/stores/${id}`),
  getOwners: () => api.get('/superadmin/owners'),
};

// ── Superadmin Categories ─────────────────────────────
export const superadminCategoryApi = {
  getAll: (store_type: string) => api.get('/superadmin/categories', { params: { store_type } }),
  add: (name: string, store_type: string) => api.post('/superadmin/categories', { name, store_type }),
  update: (id: string, name: string) => api.patch(`/superadmin/categories/${id}`, { name }),
  toggle: (id: string, is_disabled: boolean) => api.patch(`/superadmin/categories/${id}`, { is_disabled }),
  remove: (id: string) => api.delete(`/superadmin/categories/${id}`),
};

// ── Superadmin Templates ──────────────────────────────
export const superadminTemplateApi = {
  getAll:   ()                                                   => api.get('/superadmin/templates'),
  getPublic: ()                                                  => api.get('/superadmin/templates/public'),
  create:   (data: Record<string, unknown>)                      => api.post('/superadmin/templates', data),
  update:   (id: string, data: Record<string, unknown>)          => api.put(`/superadmin/templates/${id}`, data),
  remove:   (id: string)                                         => api.delete(`/superadmin/templates/${id}`),
  apply:    (template_id: string)                                => api.patch('/superadmin/templates/apply', { template_id }),
};
