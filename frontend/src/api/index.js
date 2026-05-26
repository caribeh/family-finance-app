import api from './client';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const userApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
  deleteMe: () => api.delete('/users/me'),
};

export const adminApi = {
  getMembers: () => api.get('/admin/members'),
  createMember: (data) => api.post('/admin/members', data),
  updateMember: (id, data) => api.put(`/admin/members/${id}`, data),
  deleteMember: (id) => api.delete(`/admin/members/${id}`),
};

export const fixedIncomesApi = {
  getAll: () => api.get('/fixed-incomes'),
  create: (data) => api.post('/fixed-incomes', data),
  update: (id, data) => api.put(`/fixed-incomes/${id}`, data),
  delete: (id) => api.delete(`/fixed-incomes/${id}`),
};

export const fixedExpensesApi = {
  getAll: () => api.get('/fixed-expenses'),
  create: (data) => api.post('/fixed-expenses', data),
  update: (id, data) => api.put(`/fixed-expenses/${id}`, data),
  markPaid: (id, bankAccountId) => api.patch(`/fixed-expenses/${id}/mark-paid`, { bank_account_id: bankAccountId }),
  delete: (id) => api.delete(`/fixed-expenses/${id}`),
};

export const weeklyBudgetApi = {
  get: (week, year) => api.get('/weekly-budget', { params: { week, year } }),
  getMonthWeeks: (month, year) => api.get('/weekly-budget/month', { params: { month, year } }),
  upsert: (data) => api.put('/weekly-budget', data),
};

export const debtsApi = {
  getAll: () => api.get('/debts'),
  create: (data) => api.post('/debts', data),
  payInstallment: (id, bankAccountId, amount) => api.patch(`/debts/${id}/pay-installment`, { bank_account_id: bankAccountId, amount }),
  delete: (id) => api.delete(`/debts/${id}`),
};

export const creditCardsApi = {
  getAll: () => api.get('/credit-cards'),
  create: (data) => api.post('/credit-cards', data),
  getInvoice: (id) => api.get(`/credit-cards/${id}/invoice`),
  addExpense: (id, data) => api.post(`/credit-cards/${id}/expenses`, data),
  delete: (id) => api.delete(`/credit-cards/${id}`),
};

export const mealVouchersApi = {
  getAll: () => api.get('/meal-vouchers'),
  create: (data) => api.post('/meal-vouchers', data),
  addCredit: (id, data) => api.post(`/meal-vouchers/${id}/credit`, data),
  addExpense: (id, data) => api.post(`/meal-vouchers/${id}/expenses`, data),
  delete: (id) => api.delete(`/meal-vouchers/${id}`),
};

export const dailyExpensesApi = {
  getAll: (month, year) => api.get('/daily-expenses', { params: { month, year } }),
  create: (data) => api.post('/daily-expenses', data),
  update: (id, data) => api.put(`/daily-expenses/${id}`, data),
  delete: (id) => api.delete(`/daily-expenses/${id}`),
};

export const dailyControlApi = {
  getAll: (month, year, type) => api.get('/daily-control', { params: { month, year, type } }),
  create: (data) => api.post('/daily-control', data),
  delete: (id) => api.delete(`/daily-control/${id}`),
};

export const bankAccountsApi = {
  getAll: () => api.get('/bank-accounts'),
  create: (data) => api.post('/bank-accounts', data),
  update: (id, data) => api.put(`/bank-accounts/${id}`, data),
  delete: (id) => api.delete(`/bank-accounts/${id}`),
};

export const investmentsApi = {
  getAll: () => api.get('/investments'),
  create: (data) => api.post('/investments', data),
  redeem: (id, data) => api.post(`/investments/${id}/redeem`, data),
  update: (id, data) => api.put(`/investments/${id}`, data),
  delete: (id) => api.delete(`/investments/${id}`),
};

export const subscriptionsApi = {
  getAll: () => api.get('/subscriptions'),
  create: (data) => api.post('/subscriptions', data),
  cancel: (id) => api.post(`/subscriptions/${id}/cancel`),
  delete: (id) => api.delete(`/subscriptions/${id}`),
};

export const benefitCardsApi = {
  getAll: () => api.get('/benefit-cards'),
  create: (data) => api.post('/benefit-cards', data),
  delete: (id) => api.delete(`/benefit-cards/${id}`),
};

export const reportsApi = {
  getDashboard: (month, year) => api.get('/reports/dashboard', { params: { month, year } }),
  getMonthlyReport: (month, year) => api.get('/reports/monthly', { params: { month, year } }),
};
