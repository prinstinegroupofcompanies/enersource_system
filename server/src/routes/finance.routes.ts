import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission } from '../middleware/auth.js';
import * as accountsService from '../services/finance/accounts.service.js';
import * as journalService from '../services/finance/journal.service.js';
import * as ledgerService from '../services/finance/ledger.service.js';
import * as reportsService from '../services/finance/reports.service.js';

const router = Router();
router.use(authenticate);

const lineSchema = z.object({
  accountId: z.string().uuid(),
  description: z.string().optional(),
  debit: z.number().min(0),
  credit: z.number().min(0),
});

// Chart of Accounts
router.get('/accounts', requirePermission('finance', 'view'), async (req, res, next) => {
  try {
    const accounts = await accountsService.listAccounts({
      category: req.query.category as string | undefined,
      search: req.query.search as string | undefined,
      activeOnly: req.query.activeOnly !== 'false',
    });
    res.json(accounts);
  } catch (e) {
    next(e);
  }
});

router.get('/accounts/categories', requirePermission('finance', 'view'), async (_req, res, next) => {
  try {
    res.json(await accountsService.getCategories());
  } catch (e) {
    next(e);
  }
});

router.get('/accounts/:id', requirePermission('finance', 'view'), async (req, res, next) => {
  try {
    res.json(await accountsService.getAccount(String(req.params.id)));
  } catch (e) {
    next(e);
  }
});

router.post('/accounts', requirePermission('finance', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        code: z.string().min(1),
        name: z.string().min(1),
        category: z.string().min(1),
        subCategory: z.string().optional(),
        normalBalance: z.enum(['DEBIT', 'CREDIT']).optional(),
        description: z.string().optional(),
        parentId: z.string().uuid().optional(),
      })
      .parse(req.body);
    const account = await accountsService.createAccount(body, req.user!.id);
    res.status(201).json(account);
  } catch (e) {
    next(e);
  }
});

router.patch('/accounts/:id', requirePermission('finance', 'edit'), async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().optional(),
        subCategory: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        parentId: z.string().uuid().nullable().optional(),
      })
      .parse(req.body);
    res.json(await accountsService.updateAccount(String(req.params.id), body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.post('/accounts/import-defaults', requirePermission('finance', 'create'), async (req, res, next) => {
  try {
    res.json(await accountsService.importDefaultChart(req.user!.id));
  } catch (e) {
    next(e);
  }
});

// Journals
router.get('/journals', requirePermission('finance', 'view'), async (req, res, next) => {
  try {
    res.json(
      await journalService.listJournals({
        status: req.query.status as string | undefined,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
      })
    );
  } catch (e) {
    next(e);
  }
});

router.get('/journals/:id', requirePermission('finance', 'view'), async (req, res, next) => {
  try {
    res.json(await journalService.getJournal(String(req.params.id)));
  } catch (e) {
    next(e);
  }
});

router.post('/journals', requirePermission('finance', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        entryDate: z.string(),
        reference: z.string().optional(),
        description: z.string().min(1),
        isRecurring: z.boolean().optional(),
        recurringRule: z.string().optional(),
        lines: z.array(lineSchema).min(2),
      })
      .parse(req.body);
    res.status(201).json(await journalService.createJournal(body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.patch('/journals/:id', requirePermission('finance', 'edit'), async (req, res, next) => {
  try {
    const body = z
      .object({
        entryDate: z.string().optional(),
        reference: z.string().optional(),
        description: z.string().optional(),
        lines: z.array(lineSchema).min(2).optional(),
      })
      .parse(req.body);
    res.json(await journalService.updateJournal(String(req.params.id), body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.post('/journals/:id/submit', requirePermission('finance', 'edit'), async (req, res, next) => {
  try {
    res.json(await journalService.submitJournal(String(req.params.id), req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.post('/journals/:id/approve', requirePermission('finance', 'approve'), async (req, res, next) => {
  try {
    res.json(await journalService.approveJournal(String(req.params.id), req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.post('/journals/:id/post', requirePermission('finance', 'approve'), async (req, res, next) => {
  try {
    res.json(await journalService.postJournal(String(req.params.id), req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.post('/journals/:id/reverse', requirePermission('finance', 'approve'), async (req, res, next) => {
  try {
    const body = z.object({ entryDate: z.string().optional() }).parse(req.body ?? {});
    res.json(
      await journalService.reverseJournal(String(req.params.id), req.user!.id, body.entryDate)
    );
  } catch (e) {
    next(e);
  }
});

router.post('/journals/:id/cancel', requirePermission('finance', 'edit'), async (req, res, next) => {
  try {
    res.json(await journalService.cancelJournal(String(req.params.id), req.user!.id));
  } catch (e) {
    next(e);
  }
});

// Ledger
router.get('/ledger', requirePermission('finance', 'view'), async (req, res, next) => {
  try {
    res.json(
      await ledgerService.getGeneralLedger({
        accountId: req.query.accountId as string | undefined,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
        period: req.query.period as string | undefined,
      })
    );
  } catch (e) {
    next(e);
  }
});

router.get('/ledger/:accountId', requirePermission('finance', 'view'), async (req, res, next) => {
  try {
    res.json(
      await ledgerService.getAccountHistory(
        String(req.params.accountId),
        req.query.from as string | undefined,
        req.query.to as string | undefined
      )
    );
  } catch (e) {
    next(e);
  }
});

// Reports
router.get('/trial-balance', requirePermission('finance', 'view'), async (req, res, next) => {
  try {
    res.json(
      await reportsService.getTrialBalance({
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
        period: req.query.period as string | undefined,
      })
    );
  } catch (e) {
    next(e);
  }
});

router.get('/reports/income-statement', requirePermission('finance', 'view'), async (req, res, next) => {
  try {
    res.json(
      await reportsService.getIncomeStatement({
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
        period: req.query.period as string | undefined,
      })
    );
  } catch (e) {
    next(e);
  }
});

router.get('/reports/balance-sheet', requirePermission('finance', 'view'), async (req, res, next) => {
  try {
    res.json(await reportsService.getBalanceSheet(req.query.asOf as string | undefined));
  } catch (e) {
    next(e);
  }
});

router.get('/reports/cash-flow', requirePermission('finance', 'view'), async (req, res, next) => {
  try {
    res.json(
      await reportsService.getCashFlowStatement({
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
        period: req.query.period as string | undefined,
      })
    );
  } catch (e) {
    next(e);
  }
});

router.get('/summary', requirePermission('finance', 'view'), async (_req, res, next) => {
  try {
    const [accounts, journals, income, balance] = await Promise.all([
      accountsService.listAccounts({ activeOnly: true }),
      journalService.listJournals({ status: 'PENDING_APPROVAL' }),
      reportsService.getIncomeStatement({ period: 'monthly' }),
      reportsService.getBalanceSheet(),
    ]);

    const revenueAccounts = accounts.filter((a) => a.category === 'Revenue');
    const expenseAccounts = accounts.filter((a) => a.category === 'Expenses');

    res.json({
      totalAccounts: accounts.length,
      pendingApproval: journals.length,
      monthlyRevenue: income.revenue.total,
      netProfit: income.netProfit,
      totalAssets: balance.assets.total,
      totalLiabilities: balance.liabilities.total,
      cashBalance: accounts
        .filter((a) => ['1000', '1010', '1020'].includes(a.code))
        .reduce((s, a) => s + a.balance, 0),
      revenueAccounts: revenueAccounts.length,
      expenseAccounts: expenseAccounts.length,
    });
  } catch (e) {
    next(e);
  }
});

// CSV Export
router.get('/export/trial-balance', requirePermission('finance', 'export'), async (req, res, next) => {
  try {
    const tb = await reportsService.getTrialBalance({
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      period: req.query.period as string | undefined,
    });
    const rows = tb.rows.map((r) => ({
      code: r.code,
      name: r.name,
      category: r.category,
      debit: r.debit,
      credit: r.credit,
      balance: r.balance,
    }));
    const csv = reportsService.formatCsv(rows, ['code', 'name', 'category', 'debit', 'credit', 'balance']);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=trial-balance.csv');
    res.send(csv);
  } catch (e) {
    next(e);
  }
});

router.get('/export/ledger', requirePermission('finance', 'export'), async (req, res, next) => {
  try {
    const ledger = await ledgerService.getGeneralLedger({
      accountId: req.query.accountId as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      period: req.query.period as string | undefined,
    });
    const rows: Record<string, string | number>[] = [];
    for (const acc of ledger.accounts) {
      for (const m of acc.movements) {
        rows.push({
          account: acc.account.code,
          date: m.date.slice(0, 10),
          entry: m.entryNumber,
          debit: m.debit,
          credit: m.credit,
          balance: m.balance,
        });
      }
    }
    const csv = reportsService.formatCsv(rows, ['account', 'date', 'entry', 'debit', 'credit', 'balance']);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=general-ledger.csv');
    res.send(csv);
  } catch (e) {
    next(e);
  }
});

export default router;
