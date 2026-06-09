import { api } from './api';
import type { DocumentDetail, DocumentListItem, DocumentsSummary } from '../types/phase9';

export const DOCUMENT_CATEGORIES = [
  'GENERAL',
  'POLICY',
  'CONTRACT',
  'TECHNICAL',
  'FINANCE',
  'HR',
  'PROJECT',
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'General',
  POLICY: 'Policy',
  CONTRACT: 'Contract',
  TECHNICAL: 'Technical',
  FINANCE: 'Finance',
  HR: 'Human Resources',
  PROJECT: 'Project',
};

export const documentsApi = {
  summary: (token: string) => api.get<DocumentsSummary>('/documents/summary', token),
  list: (token: string, params?: { category?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return api.get<DocumentListItem[]>(`/documents${qs ? `?${qs}` : ''}`, token);
  },
  get: (token: string, id: string) => api.get<DocumentDetail>(`/documents/${id}`, token),
  upload: (token: string, formData: FormData) => api.upload<DocumentDetail>('/documents', formData, token),
  uploadVersion: (token: string, id: string, formData: FormData) =>
    api.upload(`/documents/${id}/versions`, formData, token),
};
