import { api, getApiBase } from './api';
import type { ChartOfAccount, FinanceSummary, JournalEntry, TrialBalance } from '../types/finance';

export const financeApi = {
  summary: (token: string) => api.get<FinanceSummary>('/finance/summary', token),
  accounts: (token: string, params?: { category?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return api.get<ChartOfAccount[]>(`/finance/accounts${qs ? `?${qs}` : ''}`, token);
  },
  importDefaults: (token: string) =>
    api.post<{ imported: number }>('/finance/accounts/import-defaults', {}, token),
  createAccount: (token: string, body: unknown) =>
    api.post<ChartOfAccount>('/finance/accounts', body, token),
  journals: (token: string, status?: string) =>
    api.get<JournalEntry[]>(`/finance/journals${status ? `?status=${status}` : ''}`, token),
  getJournal: (token: string, id: string) => api.get<JournalEntry>(`/finance/journals/${id}`, token),
  createJournal: (token: string, body: unknown) =>
    api.post<JournalEntry>('/finance/journals', body, token),
  submitJournal: (token: string, id: string) =>
    api.post<JournalEntry>(`/finance/journals/${id}/submit`, {}, token),
  approveJournal: (token: string, id: string) =>
    api.post<JournalEntry>(`/finance/journals/${id}/approve`, {}, token),
  postJournal: (token: string, id: string) =>
    api.post<JournalEntry>(`/finance/journals/${id}/post`, {}, token),
  reverseJournal: (token: string, id: string) =>
    api.post<JournalEntry>(`/finance/journals/${id}/reverse`, {}, token),
  cancelJournal: (token: string, id: string) =>
    api.post(`/finance/journals/${id}/cancel`, {}, token),
  trialBalance: (token: string, period = 'monthly') =>
    api.get<TrialBalance>(`/finance/trial-balance?period=${period}`, token),
  incomeStatement: (token: string, period = 'monthly') =>
    api.get<Record<string, unknown>>(`/finance/reports/income-statement?period=${period}`, token),
  balanceSheet: (token: string) =>
    api.get<Record<string, unknown>>('/finance/reports/balance-sheet', token),
  cashFlow: (token: string, period = 'monthly') =>
    api.get<Record<string, unknown>>(`/finance/reports/cash-flow?period=${period}`, token),
  ledger: (token: string, params?: { period?: string; accountId?: string }) => {
    const q = new URLSearchParams();
    if (params?.period) q.set('period', params.period);
    if (params?.accountId) q.set('accountId', params.accountId);
    return api.get<Record<string, unknown>>(`/finance/ledger?${q}`, token);
  },
  exportCsv: (path: string, token: string) =>
    fetch(`${getApiBase()}${path}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.blob()),
};

export function formatMoney(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}
