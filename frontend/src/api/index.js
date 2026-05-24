import client from './client';

export const authApi = {
  setupStatus: () => client.get('/auth/setup-status'),
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  me: () => client.get('/auth/me'),
  logout: () => client.post('/auth/logout'),
};

export const employeesApi = {
  list: (params) => client.get('/employees', { params }),
  create: (data) => client.post('/employees', data),
  update: (id, data) => client.put(`/employees/${id}`, data),
  remove: (id) => client.delete(`/employees/${id}`),
};

export const leadsApi = {
  list: (params) => client.get('/leads', { params }),
  get: (id) => client.get(`/leads/${id}`),
  create: (data) => client.post('/leads', data),
  bulkImport: (data) => client.post('/leads/bulk-import', data),
  bulkDelete: (ids) => client.post('/leads/bulk-delete', { ids }),
  update: (id, data) => client.put(`/leads/${id}`, data),
  remove: (id) => client.delete(`/leads/${id}`),
  assign: (id, employeeId) => client.post(`/leads/${id}/assign`, { employeeId }),
  addNote: (id, content) => client.post(`/leads/${id}/notes`, { content }),
  addFollowUp: (id, data) => client.post(`/leads/${id}/follow-up`, data),
};

export const callsApi = {
  list: (params) => client.get('/calls', { params }),
  get: (id) => client.get(`/calls/${id}`),
  initiate: (data) => client.post('/calls/initiate', data),
  byEmployee: (employeeId) => client.get(`/calls/employee/${employeeId}`),
  byLead: (leadId) => client.get(`/calls/lead/${leadId}`),
};

export const reportsApi = {
  dashboard: () => client.get('/reports/dashboard'),
  employees: (params) => client.get('/reports/employees', { params }),
  employeePerformance: (id, params) => client.get(`/reports/employees/${id}/performance`, { params }),
  calls: (params) => client.get('/reports/calls', { params }),
  campaigns: (params) => client.get('/reports/campaigns', { params }),
  conversions: (params) => client.get('/reports/conversions', { params }),
  exportEmployees: () =>
    client.get('/reports/employees/export', { responseType: 'blob' }),
};

export const followUpsApi = {
  list: (params) => client.get('/follow-ups', { params }),
  dashboard: () => client.get('/follow-ups/dashboard'),
  complete: (id) => client.patch(`/follow-ups/${id}/complete`),
};

export const notificationsApi = {
  list: (params) => client.get('/notifications', { params }),
  poll: (params) => client.get('/notifications/poll', { params }),
  read: (id) => client.patch(`/notifications/${id}/read`),
  readAll: () => client.patch('/notifications/read-all'),
};

export const settingsApi = {
  get: () => client.get('/settings'),
  update: (data) => client.put('/settings', data),
  usersForPromotion: () => client.get('/settings/users-for-promotion'),
  assignSuperAdmin: (data) => client.post('/settings/super-admin', data),
};
