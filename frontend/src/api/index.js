import client from './client';

export const authApi = {
  setupStatus: () => client.get('/auth/setup-status'),
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  oauthProviders: () => client.get('/auth/oauth/providers'),
  me: () => client.get('/auth/me'),
  updateProfile: (data) => client.patch('/auth/profile', data),
  logout: () => client.post('/auth/logout'),
};

export const billingApi = {
  plans: () => client.get('/billing/plans'),
  confirmPayment: (data) => client.post('/billing/confirm-payment', data),
  activate: (data) => client.post('/billing/activate', data),
  subscription: () => client.get('/billing/subscription'),
  checkout: (plan) => client.post('/billing/checkout', { plan }),
};

export const companiesApi = {
  getMe: () => client.get('/companies/me'),
  updateMe: (data) => client.patch('/companies/me', data),
};

export const employeesApi = {
  list: (params) => client.get('/employees', { params }),
  create: (data) => client.post('/employees', data),
  import: (data) => client.post('/employees/import', data),
  update: (id, data) => client.put(`/employees/${id}`, data),
  remove: (id) => client.delete(`/employees/${id}`),
};

export const leadsApi = {
  list: (params) => client.get('/leads', { params }),
  get: (id) => client.get(`/leads/${id}`),
  create: (data) => client.post('/leads', data),
  bulkImport: (data) => client.post('/leads/bulk-import', data),
  update: (id, data) => client.put(`/leads/${id}`, data),
  remove: (id) => client.delete(`/leads/${id}`),
  assign: (id, employeeId) =>
    client.post(`/leads/${id}/assign`, { employeeId }),
  addNote: (id, content) =>
    client.post(`/leads/${id}/notes`, { content }),
  addFollowUp: (id, data) => client.post(`/leads/${id}/follow-up`, data),
  bulkDelete: (ids) => client.post('/leads/bulk-delete', { ids }),
  activities: (id) => client.get(`/leads/${id}/activities`),
};

export const callsApi = {
  list: (params) => client.get('/calls', { params }),
  initiate: (data) => client.post('/calls/initiate', data),
};

export const reportsApi = {
  dashboard: () => client.get('/reports/dashboard'),
  employeePerformance: (employeeId, params) =>
    client.get(`/reports/employees/${employeeId}/performance`, { params }),
  leadSources: () => client.get('/reports/lead-sources'),
  campaigns: () => client.get('/reports/campaigns'),
};

export const followUpsApi = {
  list: (params) => client.get('/follow-ups', { params }),
  dashboard: () => client.get('/follow-ups/dashboard'),
  complete: (id) => client.patch(`/follow-ups/${id}/complete`),
};

export const notificationsApi = {
  list: (params) => client.get('/notifications', { params }),
  markRead: (id) => client.patch(`/notifications/${id}/read`),
  markAllRead: () => client.patch('/notifications/read-all'),
};

export const settingsApi = {
  get: () => client.get('/settings'),
  update: (data) => client.put('/settings', data),
  assignSuperAdmin: (data) => client.post('/settings/super-admin', data),
  usersForPromotion: () => client.get('/settings/users-for-promotion'),
};
