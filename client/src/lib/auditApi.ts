import { api } from './api';
import type { AuditLogEntry } from '../types/audit';

export const auditApi = {
  list: (token: string, params?: { entityType?: string; action?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.entityType) q.set('entityType', params.entityType);
    if (params?.action) q.set('action', params.action);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return api.get<AuditLogEntry[]>(`/audit${qs ? `?${qs}` : ''}`, token);
  },
};
