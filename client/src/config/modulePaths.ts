/** Canonical frontend paths for ERP modules */
export const MODULE_PATHS: Record<string, string> = {
  dashboard: '/',
  users: '/users',
  finance: '/finance',
  sales: '/sales',
  inventory: '/inventory',
  procurement: '/procurement',
  'petty-cash': '/petty-cash',
  projects: '/projects',
  crm: '/crm',
  hr: '/hr',
  communication: '/communication',
  documents: '/documents',
  assets: '/assets',
  support: '/support',
  reports: '/reports',
  audit: '/audit',
  settings: '/profile',
};

export function modulePath(key: string): string {
  return MODULE_PATHS[key] ?? `/module/${key}`;
}
