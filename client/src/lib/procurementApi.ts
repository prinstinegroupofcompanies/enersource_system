import { api, getApiBase } from './api';

export const procurementApi = {
  summary: (token: string) => api.get<Record<string, number>>('/procurement/summary', token),
  requisitions: (token: string, status?: string) =>
    api.get<Record<string, unknown>[]>(`/procurement/requisitions${status ? `?status=${status}` : ''}`, token),
  createRequisition: (token: string, body: unknown) =>
    api.post('/procurement/requisitions', body, token),
  approveRequisition: (token: string, id: string, comments?: string) =>
    api.post(`/procurement/requisitions/${id}/approve`, { comments }, token),
  rejectRequisition: (token: string, id: string, comments?: string) =>
    api.post(`/procurement/requisitions/${id}/reject`, { comments }, token),
  payments: (token: string, status?: string) =>
    api.get<Record<string, unknown>[]>(`/procurement/payments${status ? `?status=${status}` : ''}`, token),
  createPayment: async (token: string, formData: FormData) => {
    const res = await fetch(`${getApiBase()}/procurement/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Upload failed');
    return data;
  },
  approvePayment: (token: string, id: string, step: string) =>
    api.post(`/procurement/payments/${id}/approve`, { step }, token),
  markPaid: (token: string, id: string) => api.post(`/procurement/payments/${id}/pay`, {}, token),
};

export const pettyCashApi = {
  report: (token: string, period = 'monthly') =>
    api.get<Record<string, unknown>>(`/procurement/petty-cash/summary?period=${period}`, token),
  funds: (token: string) => api.get<Record<string, unknown>[]>('/procurement/petty-cash/funds', token),
  recordExpense: async (token: string, formData: FormData) => {
    const res = await fetch(`${getApiBase()}/procurement/petty-cash/expenses`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Failed');
    return data;
  },
  allocate: (token: string, fundId: string, amount: number) =>
    api.post(`/procurement/petty-cash/funds/${fundId}/allocate`, { amount }, token),
  reimburse: (token: string, body: unknown) =>
    api.post('/procurement/petty-cash/reimbursements', body, token),
  approveReimbursement: (token: string, id: string) =>
    api.post(`/procurement/petty-cash/reimbursements/${id}/approve`, {}, token),
};

export { formatMoney } from './financeApi';

export const WORKFLOW_LABELS: Record<string, string> = {
  STAFF_SUBMISSION: 'Staff submission',
  SUPERVISOR_REVIEW: 'Supervisor review',
  FINANCE_APPROVAL: 'Finance approval',
  MANAGEMENT_APPROVAL: 'Management approval',
  PROCUREMENT_PROCESSING: 'Procurement processing',
};
