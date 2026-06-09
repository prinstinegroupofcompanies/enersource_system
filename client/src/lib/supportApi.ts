import { api } from './api';
import type { SupportSummary, SupportTicket, SupportTicketDetail } from '../types/phase10';

export const TICKET_TYPES = ['INTERNAL', 'CUSTOMER'] as const;
export const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

export const TICKET_TYPE_LABELS: Record<string, string> = {
  INTERNAL: 'Internal',
  CUSTOMER: 'Customer',
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const TICKET_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const supportApi = {
  summary: (token: string) => api.get<SupportSummary>('/support/summary', token),
  list: (token: string, params?: { status?: string; type?: string; priority?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.type) q.set('type', params.type);
    if (params?.priority) q.set('priority', params.priority);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return api.get<SupportTicket[]>(`/support${qs ? `?${qs}` : ''}`, token);
  },
  get: (token: string, id: string) => api.get<SupportTicketDetail>(`/support/${id}`, token),
  create: (token: string, body: unknown) => api.post<SupportTicketDetail>('/support', body, token),
  update: (token: string, id: string, body: unknown) =>
    api.patch<SupportTicketDetail>(`/support/${id}`, body, token),
  addComment: (token: string, id: string, body: string) =>
    api.post(`/support/${id}/comments`, { body }, token),
  customers: (token: string) =>
    api.get<{ id: string; companyName: string }[]>('/support/meta/customers', token),
};
