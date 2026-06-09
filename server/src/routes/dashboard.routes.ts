import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import * as reportsService from '../services/finance/reports.service.js';
import * as salesSummaryService from '../services/sales/summary.service.js';
import * as inventoryReportsService from '../services/inventory/reports.service.js';
import * as projectsService from '../services/projects/projects.service.js';
import * as crmService from '../services/crm/crm.service.js';
import * as hrService from '../services/hr/hr.service.js';
import * as communicationService from '../services/communication/communication.service.js';
import * as documentsService from '../services/documents/documents.service.js';
import * as assetsService from '../services/assets/assets.service.js';
import * as supportService from '../services/support/support.service.js';
import { ROLE_PERMISSION_MAP } from '../constants/permissions.js';

const router = Router();

router.use(authenticate);

router.get('/summary', async (req, res, next) => {
  try {
    const roleSlug = req.user!.roleSlug;

    const [userCount, notificationCount, unreadNotifications] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.notification.count({ where: { userId: req.user!.id } }),
      prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
    ]);

    const roleMetrics: Record<string, Record<string, number | string>> = {
      'super-administrator': {
        label: 'Executive Overview',
        revenue: 0,
        expenses: 0,
        activeProjects: 0,
        inventoryValue: 0,
      },
      'finance-manager': {
        label: 'Finance Dashboard',
        pendingInvoices: 0,
        monthlyRevenue: 0,
        payables: 0,
        receivables: 0,
      },
      'sales-officer': {
        label: 'Sales Dashboard',
        totalSales: 0,
        monthlyRevenue: 0,
        pendingInvoices: 0,
        salesTargets: 0,
      },
      'project-manager': {
        label: 'Projects Dashboard',
        activeProjects: 0,
        completedProjects: 0,
        delayedProjects: 0,
        budgetPerformance: 100,
      },
    };

    let metrics = roleMetrics[roleSlug] ?? {
      label: 'My Dashboard',
      tasksToday: 0,
      notifications: unreadNotifications,
    };

    const salesRoles = ['sales-officer', 'super-administrator', 'managing-director'];
    if (salesRoles.includes(roleSlug)) {
      try {
        const sales = await salesSummaryService.getSalesSummary();
        metrics = {
          label: 'Sales Dashboard',
          totalSales: sales.totalSales,
          monthlyRevenue: sales.monthlyRevenue,
          pendingInvoices: sales.pendingInvoices,
          overdueInvoices: sales.overdueInvoices,
          targetProgress: sales.targetProgress,
        };
      } catch {
        /* optional */
      }
    }

    const crmRoles = ['sales-officer', 'customer-support-officer', 'super-administrator', 'managing-director'];
    if (crmRoles.includes(roleSlug)) {
      try {
        const c = await crmService.getDashboardSummary(req.user!.id);
        metrics = {
          ...metrics,
          ...(roleSlug === 'customer-support-officer' ? { label: 'CRM Dashboard' } : {}),
          openLeads: c.openLeads,
          pipelineValue: c.pipelineValue,
          pendingReminders: c.pendingReminders,
          overdueReminders: c.overdueReminders,
          conversionRate: c.conversionRate,
        };
      } catch {
        /* optional */
      }
    }

    const projectRoles = ['project-manager', 'super-administrator', 'managing-director'];
    if (projectRoles.includes(roleSlug)) {
      try {
        const p = await projectsService.getDashboardSummary();
        metrics = {
          label: 'Projects Dashboard',
          activeProjects: p.activeProjects,
          completedProjects: p.completedProjects,
          delayedProjects: p.delayedProjects,
          budgetPerformance: p.budgetPerformance,
          totalBudget: p.totalBudget,
          totalSpent: p.totalSpent,
        };
      } catch {
        /* optional */
      }
    }

    const inventoryRoles = ['inventory-officer', 'project-manager', 'super-administrator', 'procurement-officer'];
    if (inventoryRoles.includes(roleSlug) && roleSlug !== 'project-manager') {
      try {
        const inv = await inventoryReportsService.getSummary();
        metrics = {
          label: 'Inventory Dashboard',
          totalValuation: inv.totalValuation,
          itemCount: inv.itemCount,
          lowStockCount: inv.lowStockCount,
          warehouseCount: inv.warehouseCount,
        };
      } catch {
        /* optional */
      }
    }

    const financeRoles = ['super-administrator', 'finance-manager', 'accountant', 'managing-director'];
    if (financeRoles.includes(roleSlug) && !['sales-officer', 'inventory-officer'].includes(roleSlug)) {
      try {
        const [income, balance, pendingJournals] = await Promise.all([
          reportsService.getIncomeStatement({ period: 'monthly' }),
          reportsService.getBalanceSheet(),
          prisma.journalEntry.count({ where: { status: 'PENDING_APPROVAL' } }),
        ]);
        metrics = {
          label: 'Finance Dashboard',
          monthlyRevenue: income.revenue.total,
          netProfit: income.netProfit,
          totalAssets: balance.assets.total,
          pendingApproval: pendingJournals,
        };
      } catch {
        /* finance tables may not exist yet */
      }
    }

    const hrRoles = ['hr-manager', 'super-administrator', 'managing-director'];
    if (hrRoles.includes(roleSlug)) {
      try {
        const h = await hrService.getDashboardSummary();
        metrics = {
          label: 'HR Dashboard',
          totalEmployees: h.totalEmployees,
          activeEmployees: h.activeEmployees,
          presentToday: h.presentToday,
          attendanceRate: h.attendanceRate,
          pendingAppraisals: h.pendingAppraisals,
          averageKpiScore: h.averageKpiScore,
        };
      } catch {
        /* optional */
      }
    }

    res.json({
      welcome: roleSlug,
      metrics,
      system: {
        activeUsers: userCount,
        notifications: notificationCount,
        unreadNotifications,
      },
      modules: getModulesForRole(roleSlug),
      phase: 11,
      message: 'Enersource ERP is fully live — explore Reports & BI for cross-module analytics.',
    });
  } catch (e) {
    next(e);
  }
});

function getModulesForRole(roleSlug: string) {
  const MODULE_CATALOG = [
    { key: 'finance', name: 'Financial Management' },
    { key: 'sales', name: 'Sales & Revenue' },
    { key: 'inventory', name: 'Inventory' },
    { key: 'procurement', name: 'Procurement' },
    { key: 'petty-cash', name: 'Petty Cash' },
    { key: 'projects', name: 'Projects' },
    { key: 'crm', name: 'CRM' },
    { key: 'hr', name: 'Human Resources' },
    { key: 'communication', name: 'Communication' },
    { key: 'documents', name: 'Documents' },
    { key: 'assets', name: 'Asset Registry' },
    { key: 'support', name: 'Support Tickets' },
    { key: 'reports', name: 'Reports & BI' },
    { key: 'audit', name: 'Audit Trail' },
  ];

  const allowed = new Set<string>(ROLE_PERMISSION_MAP[roleSlug] ?? ['dashboard', 'support']);
  const liveModules = new Set(MODULE_CATALOG.map((m) => m.key));

  return MODULE_CATALOG.map((m) => ({
    key: m.key,
    name: m.name,
    status: 'live',
    enabled: liveModules.has(m.key) && (allowed.has(m.key) || roleSlug === 'super-administrator'),
  }));
}

export default router;
