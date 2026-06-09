import { api } from './api';
import type { CrmClient, CrmReminder, CrmSummary, Lead, LeadDetail, PipelineColumn } from '../types/crm';

export const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: 'Website',
  REFERRAL: 'Referral',
  TRADE_SHOW: 'Trade show',
  COLD_CALL: 'Cold call',
  PARTNER: 'Partner',
  OTHER: 'Other',
};

export const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
};

export const ACTIVITY_LABELS: Record<string, string> = {
  CALL: 'Call',
  EMAIL: 'Email',
  MEETING: 'Meeting',
  SITE_VISIT: 'Site visit',
  NOTE: 'Note',
};

export const LEAD_SOURCES = ['WEBSITE', 'REFERRAL', 'TRADE_SHOW', 'COLD_CALL', 'PARTNER', 'OTHER'] as const;
export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] as const;
export const PIPELINE_STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'] as const;
export const ACTIVITY_TYPES = ['CALL', 'EMAIL', 'MEETING', 'SITE_VISIT', 'NOTE'] as const;

export const crmApi = {
  summary: (token: string) => api.get<CrmSummary>('/crm/summary', token),
  pipeline: (token: string) => api.get<PipelineColumn[]>('/crm/pipeline', token),
  leads: (token: string, params?: { status?: string; source?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.source) q.set('source', params.source);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return api.get<Lead[]>(`/crm/leads${qs ? `?${qs}` : ''}`, token);
  },
  getLead: (token: string, id: string) => api.get<LeadDetail>(`/crm/leads/${id}`, token),
  createLead: (token: string, body: unknown) => api.post<Lead>('/crm/leads', body, token),
  updateLead: (token: string, id: string, body: unknown) => api.patch<Lead>(`/crm/leads/${id}`, body, token),
  convertLead: (token: string, id: string) => api.post(`/crm/leads/${id}/convert`, {}, token),
  clients: (token: string, search?: string) =>
    api.get<CrmClient[]>(`/crm/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`, token),
  getClient: (token: string, id: string) => api.get<CrmClient>(`/crm/clients/${id}`, token),
  activities: (token: string) => api.get<Record<string, unknown>[]>('/crm/activities', token),
  logActivity: (token: string, body: unknown) => api.post('/crm/activities', body, token),
  reminders: (token: string, params?: { status?: string; overdue?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.overdue) q.set('overdue', 'true');
    const qs = q.toString();
    return api.get<CrmReminder[]>(`/crm/reminders${qs ? `?${qs}` : ''}`, token);
  },
  createReminder: (token: string, body: unknown) => api.post<CrmReminder>('/crm/reminders', body, token),
  completeReminder: (token: string, id: string) => api.post(`/crm/reminders/${id}/complete`, {}, token),
  users: (token: string) =>
    api.get<{ id: string; firstName: string; lastName: string }[]>('/crm/meta/users', token),
};

export { formatMoney } from './financeApi';
