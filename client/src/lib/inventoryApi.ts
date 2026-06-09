import { api } from './api';
import type { InventoryItem, InventorySummary, Warehouse } from '../types/inventory';

export const inventoryApi = {
  summary: (token: string) => api.get<InventorySummary>('/inventory/summary', token),
  warehouses: (token: string) => api.get<Warehouse[]>('/inventory/warehouses', token),
  items: (token: string, params?: { category?: string; search?: string; lowStock?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    if (params?.lowStock) q.set('lowStock', 'true');
    const qs = q.toString();
    return api.get<InventoryItem[]>(`/inventory/items${qs ? `?${qs}` : ''}`, token);
  },
  createItem: (token: string, body: unknown) => api.post('/inventory/items', body, token),
  seedDefaults: (token: string) => api.post('/inventory/items/seed-defaults', {}, token),
  movements: (token: string) => api.get<Record<string, unknown>[]>('/inventory/movements', token),
  recordMovement: (token: string, body: unknown) => api.post('/inventory/movements', body, token),
  transfers: (token: string) => api.get<Record<string, unknown>[]>('/inventory/transfers', token),
  createTransfer: (token: string, body: unknown) => api.post('/inventory/transfers', body, token),
  completeTransfer: (token: string, id: string) =>
    api.post(`/inventory/transfers/${id}/complete`, {}, token),
  valuation: (token: string) => api.get<Record<string, unknown>>('/inventory/reports/valuation', token),
  lowStock: (token: string) => api.get<InventoryItem[]>('/inventory/reports/low-stock', token),
};

export { formatMoney } from './financeApi';
