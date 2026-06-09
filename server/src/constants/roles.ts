export const ROLE_SLUGS = {
  SUPER_ADMIN: 'super-administrator',
  MANAGING_DIRECTOR: 'managing-director',
  FINANCE_MANAGER: 'finance-manager',
  ACCOUNTANT: 'accountant',
  PROCUREMENT_OFFICER: 'procurement-officer',
  HR_MANAGER: 'hr-manager',
  INVENTORY_OFFICER: 'inventory-officer',
  PROJECT_MANAGER: 'project-manager',
  SALES_OFFICER: 'sales-officer',
  CUSTOMER_SUPPORT: 'customer-support-officer',
  STAFF: 'staff-user',
} as const;

export const ROLE_DEFINITIONS = [
  { name: 'Super Administrator', slug: ROLE_SLUGS.SUPER_ADMIN, description: 'Full system access' },
  { name: 'Managing Director', slug: ROLE_SLUGS.MANAGING_DIRECTOR, description: 'Executive oversight' },
  { name: 'Finance Manager', slug: ROLE_SLUGS.FINANCE_MANAGER, description: 'Financial operations' },
  { name: 'Accountant', slug: ROLE_SLUGS.ACCOUNTANT, description: 'Accounting and journals' },
  { name: 'Procurement Officer', slug: ROLE_SLUGS.PROCUREMENT_OFFICER, description: 'Purchasing and vendors' },
  { name: 'HR Manager', slug: ROLE_SLUGS.HR_MANAGER, description: 'Human resources' },
  { name: 'Inventory Officer', slug: ROLE_SLUGS.INVENTORY_OFFICER, description: 'Stock and warehouse' },
  { name: 'Project Manager', slug: ROLE_SLUGS.PROJECT_MANAGER, description: 'Solar project delivery' },
  { name: 'Sales Officer', slug: ROLE_SLUGS.SALES_OFFICER, description: 'Sales and CRM' },
  { name: 'Customer Support Officer', slug: ROLE_SLUGS.CUSTOMER_SUPPORT, description: 'Client support tickets' },
  { name: 'Staff / User', slug: ROLE_SLUGS.STAFF, description: 'General staff access' },
] as const;
