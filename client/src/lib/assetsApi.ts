import { api } from './api';
import type { Asset, AssetsSummary } from '../types/phase10';

export const ASSET_CATEGORIES = ['VEHICLE', 'EQUIPMENT', 'IT', 'TOOL', 'OTHER'] as const;
export const ASSET_STATUSES = ['ACTIVE', 'MAINTENANCE', 'DISPOSED'] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  VEHICLE: 'Vehicle',
  EQUIPMENT: 'Equipment',
  IT: 'IT Hardware',
  TOOL: 'Tool',
  OTHER: 'Other',
};

export const ASSET_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  MAINTENANCE: 'In maintenance',
  DISPOSED: 'Disposed',
};

export const assetsApi = {
  summary: (token: string) => api.get<AssetsSummary>('/assets/summary', token),
  list: (token: string, params?: { status?: string; category?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.category) q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return api.get<Asset[]>(`/assets${qs ? `?${qs}` : ''}`, token);
  },
  create: (token: string, body: unknown) => api.post<Asset>('/assets', body, token),
  update: (token: string, id: string, body: unknown) => api.patch<Asset>(`/assets/${id}`, body, token),
  runDepreciation: (token: string) =>
    api.post<{ updatedAssets: number }>('/assets/actions/run-depreciation', {}, token),
};

export { formatMoney } from './financeApi';
