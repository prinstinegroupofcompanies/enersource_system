import { prisma } from '../../lib/prisma.js';
import { roundMoney } from '../../utils/finance.js';
import { formatCsv } from '../finance/reports.service.js';
import * as financeReports from '../finance/reports.service.js';
import * as salesSummary from '../sales/summary.service.js';
import * as inventoryReports from '../inventory/reports.service.js';
import * as projectsService from '../projects/projects.service.js';
import * as crmService from '../crm/crm.service.js';
import * as hrService from '../hr/hr.service.js';
import * as assetsService from '../assets/assets.service.js';
import * as supportService from '../support/support.service.js';
import * as pettyCashService from '../procurement/pettyCash.service.js';
import { ROLE_PERMISSION_MAP } from '../../constants/permissions.js';

const ROLE_LABELS: Record<string, string> = {
  'super-administrator': 'Executive Analytics',
  'managing-director': 'Executive Analytics',
  'finance-manager': 'Finance Analytics',
  accountant: 'Finance Analytics',
  'sales-officer': 'Sales Analytics',
  'project-manager': 'Project Analytics',
  'hr-manager': 'HR Analytics',
  'inventory-officer': 'Inventory Analytics',
  'procurement-officer': 'Procurement Analytics',
  'customer-support-officer': 'Support Analytics',
};

function modulesForRole(roleSlug: string): string[] {
  return ROLE_PERMISSION_MAP[roleSlug] ?? ['dashboard'];
}

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function getReportSummary(roleSlug: string, userId: string) {
  const modules = modulesForRole(roleSlug);
  const has = (m: string) => modules.includes(m) || roleSlug === 'super-administrator';

  const [finance, sales, inventory, projects, crm, hr, assets, support, pettyCash] = await Promise.all([
    has('finance') ? safe(() => financeReports.getIncomeStatement({ period: 'monthly' })) : null,
    has('sales') ? safe(() => salesSummary.getSalesSummary()) : null,
    has('inventory') ? safe(() => inventoryReports.getSummary()) : null,
    has('projects') ? safe(() => projectsService.getDashboardSummary()) : null,
    has('crm') ? safe(() => crmService.getDashboardSummary(userId)) : null,
    has('hr') ? safe(() => hrService.getDashboardSummary()) : null,
    has('assets') ? safe(() => assetsService.getAssetsSummary()) : null,
    has('support') ? safe(() => supportService.getSupportSummary()) : null,
    has('petty-cash') ? safe(() => pettyCashService.getPettyCashReport('monthly')) : null,
  ]);

  const kpis: { key: string; label: string; value: string | number; module: string }[] = [];

  if (finance) {
    kpis.push(
      { key: 'revenue', label: 'Monthly revenue', value: finance.revenue.total, module: 'finance' },
      { key: 'netProfit', label: 'Net profit', value: finance.netProfit, module: 'finance' },
      { key: 'expenses', label: 'Total expenses', value: roundMoney(finance.operatingExpenses.total + finance.costOfSales), module: 'finance' }
    );
  }
  if (sales) {
    kpis.push(
      { key: 'totalSales', label: 'Total sales', value: sales.totalSales, module: 'sales' },
      { key: 'pendingInvoices', label: 'Outstanding AR', value: sales.pendingInvoices, module: 'sales' },
      { key: 'overdueInvoices', label: 'Overdue invoices', value: sales.overdueInvoices, module: 'sales' }
    );
  }
  if (inventory) {
    kpis.push(
      { key: 'inventoryValue', label: 'Inventory value', value: inventory.totalValuation, module: 'inventory' },
      { key: 'lowStock', label: 'Low stock items', value: inventory.lowStockCount, module: 'inventory' }
    );
  }
  if (projects) {
    kpis.push(
      { key: 'activeProjects', label: 'Active projects', value: projects.activeProjects, module: 'projects' },
      { key: 'delayedProjects', label: 'Delayed projects', value: projects.delayedProjects, module: 'projects' },
      { key: 'budgetPerformance', label: 'Budget performance %', value: projects.budgetPerformance, module: 'projects' }
    );
  }
  if (crm) {
    kpis.push(
      { key: 'openLeads', label: 'Open leads', value: crm.openLeads, module: 'crm' },
      { key: 'pipelineValue', label: 'Pipeline value', value: crm.pipelineValue, module: 'crm' },
      { key: 'conversionRate', label: 'Conversion rate %', value: crm.conversionRate, module: 'crm' }
    );
  }
  if (hr) {
    kpis.push(
      { key: 'totalEmployees', label: 'Employees', value: hr.totalEmployees, module: 'hr' },
      { key: 'attendanceRate', label: 'Attendance rate %', value: hr.attendanceRate, module: 'hr' },
      { key: 'pendingAppraisals', label: 'Pending appraisals', value: hr.pendingAppraisals, module: 'hr' }
    );
  }
  if (assets) {
    kpis.push(
      { key: 'totalAssets', label: 'Active assets', value: assets.totalAssets, module: 'assets' },
      { key: 'bookValue', label: 'Asset book value', value: assets.totalBookValue, module: 'assets' }
    );
  }
  if (support) {
    kpis.push(
      { key: 'openTickets', label: 'Open tickets', value: support.openTickets, module: 'support' },
      { key: 'urgentTickets', label: 'Urgent tickets', value: support.urgentTickets, module: 'support' }
    );
  }
  if (pettyCash) {
    kpis.push(
      { key: 'pettyCashBalance', label: 'Petty cash balance', value: Number(pettyCash.totalBalance ?? 0), module: 'petty-cash' },
      { key: 'periodExpenses', label: 'Petty cash expenses', value: Number(pettyCash.periodExpenses ?? 0), module: 'petty-cash' }
    );
  }

  const revenueTrend = await buildRevenueTrend(has('finance'));

  return {
    roleSlug,
    dashboardLabel: ROLE_LABELS[roleSlug] ?? 'Operational Analytics',
    kpis,
    revenueTrend,
    modules: modules.filter((m) => m !== 'dashboard'),
  };
}

async function buildRevenueTrend(includeFinance: boolean) {
  if (!includeFinance) return [];

  const months: { month: string; revenue: number; expenses: number }[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const from = new Date(d.getFullYear(), d.getMonth(), 1);
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const income = await safe(() =>
      financeReports.getIncomeStatement({
        from: from.toISOString(),
        to: to.toISOString(),
      })
    );

    months.push({
      month: from.toLocaleString('en', { month: 'short' }),
      revenue: income?.revenue.total ?? 0,
      expenses: income ? roundMoney(income.operatingExpenses.total + income.costOfSales) : 0,
    });
  }

  return months;
}

export async function getFinancialReports(roleSlug: string) {
  const modules = modulesForRole(roleSlug);
  if (!modules.includes('finance') && roleSlug !== 'super-administrator') {
    return { available: false, message: 'Finance reports require finance module access.' };
  }

  const [income, balance, cashFlow, sales] = await Promise.all([
    financeReports.getIncomeStatement({ period: 'monthly' }),
    financeReports.getBalanceSheet(),
    financeReports.getCashFlowStatement({ period: 'monthly' }),
    safe(() => salesSummary.getSalesSummary()),
  ]);

  return {
    available: true,
    incomeStatement: income,
    balanceSheet: balance,
    cashFlow,
    sales: sales
      ? {
          monthlyRevenue: sales.monthlyRevenue,
          pendingInvoices: sales.pendingInvoices,
          overdueInvoices: sales.overdueInvoices,
          totalSales: sales.totalSales,
        }
      : null,
    links: [
      { label: 'Full financial statements', path: '/finance/reports' },
      { label: 'Trial balance', path: '/finance/trial-balance' },
      { label: 'General ledger', path: '/finance/ledger' },
      { label: 'Accounts receivable', path: '/sales/receivables' },
    ],
  };
}

export async function getOperationalReports(roleSlug: string, userId: string) {
  const modules = modulesForRole(roleSlug);
  const has = (m: string) => modules.includes(m) || roleSlug === 'super-administrator';

  const [inventory, projects, crm, hr, support, assets] = await Promise.all([
    has('inventory') ? safe(() => inventoryReports.getSummary()) : null,
    has('projects') ? safe(() => projectsService.getDashboardSummary()) : null,
    has('crm') ? safe(() => crmService.getDashboardSummary(userId)) : null,
    has('hr') ? safe(() => hrService.getDashboardSummary()) : null,
    has('support') ? safe(() => supportService.getSupportSummary()) : null,
    has('assets') ? safe(() => assetsService.getAssetsSummary()) : null,
  ]);

  const sections: { key: string; title: string; metrics: Record<string, number>; link: string }[] = [];

  if (inventory) {
    sections.push({
      key: 'inventory',
      title: 'Inventory',
      metrics: {
        items: inventory.itemCount,
        valuation: inventory.totalValuation,
        lowStock: inventory.lowStockCount,
        movements30d: inventory.movementsLast30Days,
      },
      link: '/inventory/reports',
    });
  }
  if (projects) {
    sections.push({
      key: 'projects',
      title: 'Projects',
      metrics: {
        active: projects.activeProjects,
        completed: projects.completedProjects,
        delayed: projects.delayedProjects,
        budgetPerformance: projects.budgetPerformance,
      },
      link: '/projects',
    });
  }
  if (crm) {
    sections.push({
      key: 'crm',
      title: 'CRM & Sales Pipeline',
      metrics: {
        openLeads: crm.openLeads,
        pipelineValue: crm.pipelineValue,
        pendingReminders: crm.pendingReminders,
        conversionRate: crm.conversionRate,
      },
      link: '/crm/pipeline',
    });
  }
  if (hr) {
    sections.push({
      key: 'hr',
      title: 'Human Resources',
      metrics: {
        employees: hr.totalEmployees,
        presentToday: hr.presentToday,
        attendanceRate: hr.attendanceRate,
        pendingAppraisals: hr.pendingAppraisals,
      },
      link: '/hr',
    });
  }
  if (support) {
    sections.push({
      key: 'support',
      title: 'Support Tickets',
      metrics: {
        open: support.openTickets,
        inProgress: support.inProgressTickets,
        customerOpen: support.customerOpenTickets,
        urgent: support.urgentTickets,
      },
      link: '/support/tickets',
    });
  }
  if (assets) {
    sections.push({
      key: 'assets',
      title: 'Fixed Assets',
      metrics: {
        count: assets.totalAssets,
        totalCost: assets.totalCost,
        bookValue: assets.totalBookValue,
        depreciation: assets.totalDepreciation,
      },
      link: '/assets/registry',
    });
  }

  return { sections };
}

export function getReportCatalog(roleSlug: string) {
  const modules = modulesForRole(roleSlug);
  const has = (m: string) => modules.includes(m) || roleSlug === 'super-administrator';

  const catalog: { id: string; title: string; description: string; module: string; path: string; exportPath?: string }[] =
    [];

  if (has('finance')) {
    catalog.push(
      { id: 'income-statement', title: 'Income Statement', description: 'Revenue, expenses, and net profit', module: 'finance', path: '/finance/reports', exportPath: '/api/finance/export/trial-balance' },
      { id: 'balance-sheet', title: 'Balance Sheet', description: 'Assets, liabilities, and equity', module: 'finance', path: '/finance/reports' },
      { id: 'trial-balance', title: 'Trial Balance', description: 'Account balances with debit/credit totals', module: 'finance', path: '/finance/trial-balance', exportPath: '/api/finance/export/trial-balance' },
      { id: 'ledger', title: 'General Ledger', description: 'Posted journal drill-down', module: 'finance', path: '/finance/ledger', exportPath: '/api/finance/export/ledger' }
    );
  }
  if (has('sales')) {
    catalog.push(
      { id: 'ar-aging', title: 'Accounts Receivable', description: 'Customer balances and aging', module: 'sales', path: '/sales/receivables' },
      { id: 'sales-summary', title: 'Sales Summary', description: 'Orders, invoices, and targets', module: 'sales', path: '/sales' }
    );
  }
  if (has('inventory')) {
    catalog.push(
      { id: 'stock-valuation', title: 'Stock Valuation', description: 'Inventory value by category', module: 'inventory', path: '/inventory/reports' },
      { id: 'low-stock', title: 'Low Stock Alerts', description: 'Items below reorder level', module: 'inventory', path: '/inventory/reports' }
    );
  }
  if (has('petty-cash')) {
    catalog.push({
      id: 'petty-cash',
      title: 'Petty Cash Report',
      description: 'Daily and monthly fund reconciliation',
      module: 'petty-cash',
      path: '/petty-cash/reports',
    });
  }
  if (has('projects')) {
    catalog.push({ id: 'project-performance', title: 'Project Performance', description: 'Budget and milestone tracking', module: 'projects', path: '/projects' });
  }
  if (has('hr')) {
    catalog.push({ id: 'hr-summary', title: 'HR Summary', description: 'Attendance, KPIs, and appraisals', module: 'hr', path: '/hr' });
  }
  if (has('crm')) {
    catalog.push({ id: 'pipeline', title: 'Sales Pipeline', description: 'Lead stages and conversion', module: 'crm', path: '/crm/pipeline' });
  }

  return { catalog, total: catalog.length };
}

export function getPowerBiConfig() {
  const embedUrl = process.env.POWER_BI_EMBED_URL ?? '';
  return {
    enabled: Boolean(embedUrl),
    embedUrl,
    title: process.env.POWER_BI_DASHBOARD_TITLE ?? 'Enersource Executive Dashboard',
    message: embedUrl
      ? 'Power BI dashboard embedded from your organization workspace.'
      : 'Set POWER_BI_EMBED_URL in server .env to enable embedded Power BI analytics.',
  };
}

export async function exportExecutiveSummary(roleSlug: string, userId: string) {
  const summary = await getReportSummary(roleSlug, userId);
  const rows = summary.kpis.map((k) => ({
    module: k.module,
    metric: k.label,
    value: k.value,
  }));
  return formatCsv(rows, ['module', 'metric', 'value']);
}

export async function getCrossModuleSnapshot() {
  const [userCount, projectCount, invoiceOutstanding, openTickets] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.project.count({ where: { status: { in: ['ACTIVE', 'IN_PROGRESS', 'PLANNING'] } } }),
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: { status: { in: ['SENT', 'OVERDUE'] } },
    }),
    prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
  ]);

  return {
    activeUsers: userCount,
    activeProjects: projectCount,
    outstandingInvoices: roundMoney(invoiceOutstanding._sum.total ?? 0),
    openTickets,
  };
}
