export interface ReportKpi {
  key: string;
  label: string;
  value: string | number;
  module: string;
}

export interface ReportsSummary {
  roleSlug: string;
  dashboardLabel: string;
  kpis: ReportKpi[];
  revenueTrend: { month: string; revenue: number; expenses: number }[];
  modules: string[];
}

export interface OperationalSection {
  key: string;
  title: string;
  metrics: Record<string, number>;
  link: string;
}

export interface ReportCatalogItem {
  id: string;
  title: string;
  description: string;
  module: string;
  path: string;
  exportPath?: string;
}

export interface PowerBiConfig {
  enabled: boolean;
  embedUrl: string;
  title: string;
  message: string;
}
