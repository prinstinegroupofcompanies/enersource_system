export const MODULES = [
  'dashboard',
  'users',
  'finance',
  'sales',
  'inventory',
  'procurement',
  'petty-cash',
  'projects',
  'crm',
  'hr',
  'communication',
  'documents',
  'assets',
  'support',
  'reports',
  'audit',
  'settings',
] as const;

export type Module = (typeof MODULES)[number];

export const ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'export'] as const;
export type Action = (typeof ACTIONS)[number];

export function permissionKey(module: string, action: string): string {
  return `${module}:${action}`;
}

export const ALL_PERMISSIONS: { module: Module; action: Action; description: string }[] = [];

for (const module of MODULES) {
  for (const action of ACTIONS) {
    ALL_PERMISSIONS.push({
      module,
      action,
      description: `${action} ${module.replace(/-/g, ' ')}`,
    });
  }
}

/** Role → default permission modules (view at minimum) */
export const ROLE_PERMISSION_MAP: Record<string, Module[]> = {
  'super-administrator': [...MODULES],
  'managing-director': [
    'dashboard', 'finance', 'sales', 'inventory', 'procurement', 'projects',
    'crm', 'hr', 'reports', 'audit', 'settings',
  ],
  'finance-manager': ['dashboard', 'finance', 'sales', 'petty-cash', 'procurement', 'reports'],
  accountant: ['dashboard', 'finance', 'petty-cash', 'reports'],
  'procurement-officer': ['dashboard', 'procurement', 'inventory', 'reports'],
  'hr-manager': ['dashboard', 'hr', 'reports'],
  'inventory-officer': ['dashboard', 'inventory', 'procurement', 'reports'],
  'project-manager': ['dashboard', 'projects', 'inventory', 'crm', 'reports'],
  'sales-officer': ['dashboard', 'sales', 'crm', 'reports'],
  'customer-support-officer': ['dashboard', 'crm', 'support', 'communication'],
  'staff-user': ['dashboard', 'procurement', 'communication', 'support', 'projects'],
};

export function permissionsForRole(slug: string): { module: string; action: string }[] {
  const modules = ROLE_PERMISSION_MAP[slug] ?? ['dashboard'];
  const result: { module: string; action: string }[] = [];

  for (const module of modules) {
    result.push({ module, action: 'view' });
    if (slug === 'super-administrator') {
      for (const action of ACTIONS) {
        if (action !== 'view') result.push({ module, action });
      }
    } else if (['finance-manager', 'managing-director'].includes(slug) && module === 'finance') {
      result.push({ module, action: 'create' }, { module, action: 'edit' }, { module, action: 'approve' }, { module, action: 'export' });
    } else if (slug === 'hr-manager' && module === 'hr') {
      result.push({ module, action: 'create' }, { module, action: 'edit' }, { module, action: 'approve' });
    } else if (
      ['sales-officer', 'customer-support-officer', 'project-manager', 'managing-director'].includes(slug) &&
      module === 'crm'
    ) {
      result.push({ module, action: 'create' }, { module, action: 'edit' });
    } else if (
      ['staff-user', 'customer-support-officer', 'hr-manager', 'managing-director'].includes(slug) &&
      module === 'communication'
    ) {
      result.push({ module, action: 'create' });
    } else if (['hr-manager', 'finance-manager', 'managing-director'].includes(slug) && module === 'documents') {
      result.push({ module, action: 'create' }, { module, action: 'edit' });
    } else if (['finance-manager', 'managing-director'].includes(slug) && module === 'assets') {
      result.push({ module, action: 'create' }, { module, action: 'edit' }, { module, action: 'approve' });
    } else if (
      ['finance-manager', 'managing-director', 'accountant', 'project-manager', 'hr-manager', 'inventory-officer', 'procurement-officer', 'sales-officer'].includes(slug) &&
      module === 'reports'
    ) {
      result.push({ module, action: 'export' });
    } else if (
      ['customer-support-officer', 'staff-user', 'managing-director'].includes(slug) &&
      module === 'support'
    ) {
      result.push({ module, action: 'create' }, { module, action: 'edit' });
    }
  }

  if (slug === 'super-administrator') {
    result.push({ module: 'users', action: 'view' }, { module: 'users', action: 'create' }, { module: 'users', action: 'edit' }, { module: 'users', action: 'delete' });
    result.push({ module: 'audit', action: 'view' }, { module: 'settings', action: 'edit' });
  }

  const seen = new Set<string>();
  return result.filter((p) => {
    const key = permissionKey(p.module, p.action);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
