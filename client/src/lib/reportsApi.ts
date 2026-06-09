import { api, getApiBase } from './api';
import type { OperationalSection, PowerBiConfig, ReportCatalogItem, ReportsSummary } from '../types/phase11';

export const reportsApi = {
  summary: (token: string) => api.get<ReportsSummary>('/reports/summary', token),
  financial: (token: string) => api.get<Record<string, unknown>>('/reports/financial', token),
  operational: (token: string) => api.get<{ sections: OperationalSection[] }>('/reports/operational', token),
  catalog: (token: string) => api.get<{ catalog: ReportCatalogItem[]; total: number }>('/reports/catalog', token),
  snapshot: (token: string) => api.get<Record<string, number>>('/reports/snapshot', token),
  powerBi: (token: string) => api.get<PowerBiConfig>('/reports/power-bi', token),
  exportExecutiveSummary: async (token: string) => {
    const res = await fetch(`${getApiBase()}/reports/export/executive-summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'executive-summary.csv';
    a.click();
    URL.revokeObjectURL(url);
  },
};

export { formatMoney } from './financeApi';
