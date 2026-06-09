import { api } from './api';
import type { ProjectDetail, ProjectListItem, ProjectSummary } from '../types/projects';

export const PROJECT_TYPES = ['INSTALLATION', 'MAINTENANCE', 'ENGINEERING'] as const;
export const PROJECT_STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'DELAYED', 'CANCELLED'] as const;

export const STATUS_LABELS: Record<string, string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  DELAYED: 'Delayed',
  CANCELLED: 'Cancelled',
};

export const TYPE_LABELS: Record<string, string> = {
  INSTALLATION: 'Installation',
  MAINTENANCE: 'Maintenance',
  ENGINEERING: 'Engineering',
};

export const projectsApi = {
  summary: (token: string) => api.get<ProjectSummary>('/projects/summary', token),
  list: (token: string, params?: { status?: string; type?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.type) q.set('type', params.type);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return api.get<ProjectListItem[]>(`/projects${qs ? `?${qs}` : ''}`, token);
  },
  get: (token: string, id: string) => api.get<ProjectDetail>(`/projects/${id}`, token),
  create: (token: string, body: unknown) => api.post<ProjectDetail>('/projects', body, token),
  update: (token: string, id: string, body: unknown) =>
    api.patch<ProjectDetail>(`/projects/${id}`, body, token),
  addTask: (token: string, projectId: string, body: unknown) =>
    api.post(`/projects/${projectId}/tasks`, body, token),
  updateTask: (token: string, taskId: string, body: unknown) =>
    api.patch(`/projects/tasks/${taskId}`, body, token),
  addMilestone: (token: string, projectId: string, body: unknown) =>
    api.post(`/projects/${projectId}/milestones`, body, token),
  completeMilestone: (token: string, id: string) =>
    api.post(`/projects/milestones/${id}/complete`, {}, token),
  recordMaterial: (token: string, projectId: string, body: unknown) =>
    api.post(`/projects/${projectId}/materials`, body, token),
  users: (token: string) =>
    api.get<{ id: string; firstName: string; lastName: string; email: string }[]>(
      '/projects/meta/users',
      token
    ),
  customers: (token: string) =>
    api.get<{ id: string; companyName: string }[]>('/projects/meta/customers', token),
};

export { formatMoney } from './financeApi';
