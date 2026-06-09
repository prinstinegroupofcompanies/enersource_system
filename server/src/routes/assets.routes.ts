import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission } from '../middleware/auth.js';
import * as assetsService from '../services/assets/assets.service.js';

const router = Router();
router.use(authenticate);

router.get('/summary', requirePermission('assets', 'view'), async (_req, res, next) => {
  try {
    res.json(await assetsService.getAssetsSummary());
  } catch (e) {
    next(e);
  }
});

router.get('/', requirePermission('assets', 'view'), async (req, res, next) => {
  try {
    res.json(
      await assetsService.listAssets({
        status: req.query.status as string | undefined,
        category: req.query.category as string | undefined,
        search: req.query.search as string | undefined,
      })
    );
  } catch (e) {
    next(e);
  }
});

router.post('/actions/run-depreciation', requirePermission('assets', 'approve'), async (req, res, next) => {
  try {
    res.json(await assetsService.runDepreciation(req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.get('/:id', requirePermission('assets', 'view'), async (req, res, next) => {
  try {
    res.json(await assetsService.getAsset(String(req.params.id)));
  } catch (e) {
    next(e);
  }
});

router.post('/', requirePermission('assets', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        purchaseDate: z.string().optional(),
        purchaseCost: z.number().min(0),
        salvageValue: z.number().min(0).optional(),
        usefulLifeMonths: z.number().int().positive().optional(),
        location: z.string().optional(),
      })
      .parse(req.body);
    res.status(201).json(await assetsService.createAsset(body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', requirePermission('assets', 'edit'), async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        status: z.string().optional(),
        location: z.string().optional(),
        assignedEmployeeId: z.string().uuid().nullable().optional(),
      })
      .parse(req.body);
    res.json(await assetsService.updateAsset(String(req.params.id), body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

export default router;
