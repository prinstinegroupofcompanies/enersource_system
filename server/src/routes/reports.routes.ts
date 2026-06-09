import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import * as reportingService from '../services/reports/reporting.service.js';

const router = Router();
router.use(authenticate);

router.get('/summary', requirePermission('reports', 'view'), async (req, res, next) => {
  try {
    res.json(await reportingService.getReportSummary(req.user!.roleSlug, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.get('/financial', requirePermission('reports', 'view'), async (req, res, next) => {
  try {
    res.json(await reportingService.getFinancialReports(req.user!.roleSlug));
  } catch (e) {
    next(e);
  }
});

router.get('/operational', requirePermission('reports', 'view'), async (req, res, next) => {
  try {
    res.json(await reportingService.getOperationalReports(req.user!.roleSlug, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.get('/catalog', requirePermission('reports', 'view'), async (req, res, next) => {
  try {
    res.json(reportingService.getReportCatalog(req.user!.roleSlug));
  } catch (e) {
    next(e);
  }
});

router.get('/snapshot', requirePermission('reports', 'view'), async (_req, res, next) => {
  try {
    res.json(await reportingService.getCrossModuleSnapshot());
  } catch (e) {
    next(e);
  }
});

router.get('/power-bi', requirePermission('reports', 'view'), async (_req, res, next) => {
  try {
    res.json(reportingService.getPowerBiConfig());
  } catch (e) {
    next(e);
  }
});

router.get('/export/executive-summary', requirePermission('reports', 'export'), async (req, res, next) => {
  try {
    const csv = await reportingService.exportExecutiveSummary(req.user!.roleSlug, req.user!.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=executive-summary.csv');
    res.send(csv);
  } catch (e) {
    next(e);
  }
});

export default router;
