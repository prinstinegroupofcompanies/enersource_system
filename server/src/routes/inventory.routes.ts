import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission } from '../middleware/auth.js';
import * as itemsService from '../services/inventory/items.service.js';
import * as stockService from '../services/inventory/stock.service.js';
import * as transfersService from '../services/inventory/transfers.service.js';
import * as reportsService from '../services/inventory/reports.service.js';

const router = Router();
router.use(authenticate);

router.get('/summary', requirePermission('inventory', 'view'), async (_req, res, next) => {
  try {
    res.json(await reportsService.getSummary());
  } catch (e) {
    next(e);
  }
});

router.get('/warehouses', requirePermission('inventory', 'view'), async (_req, res, next) => {
  try {
    res.json(await itemsService.listWarehouses());
  } catch (e) {
    next(e);
  }
});

router.get('/items', requirePermission('inventory', 'view'), async (req, res, next) => {
  try {
    res.json(
      await itemsService.listItems({
        category: req.query.category as string | undefined,
        search: req.query.search as string | undefined,
        lowStock: req.query.lowStock === 'true',
      })
    );
  } catch (e) {
    next(e);
  }
});

router.post('/items', requirePermission('inventory', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        sku: z.string().min(1),
        name: z.string().min(1),
        category: z.string().min(1),
        unit: z.string().optional(),
        unitCost: z.number().optional(),
        reorderLevel: z.number().optional(),
        expiryDate: z.string().optional(),
        description: z.string().optional(),
      })
      .parse(req.body);
    res.status(201).json(await itemsService.createItem(body));
  } catch (e) {
    next(e);
  }
});

router.patch('/items/:id', requirePermission('inventory', 'edit'), async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().optional(),
        unitCost: z.number().optional(),
        reorderLevel: z.number().optional(),
        expiryDate: z.string().nullable().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body);
    res.json(await itemsService.updateItem(String(req.params.id), body));
  } catch (e) {
    next(e);
  }
});

router.post('/items/seed-defaults', requirePermission('inventory', 'create'), async (_req, res, next) => {
  try {
    res.json(await itemsService.seedInventoryDefaults());
  } catch (e) {
    next(e);
  }
});

router.get('/movements', requirePermission('inventory', 'view'), async (req, res, next) => {
  try {
    res.json(
      await reportsService.getMovementHistory({
        itemId: req.query.itemId as string | undefined,
        type: req.query.type as string | undefined,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
      })
    );
  } catch (e) {
    next(e);
  }
});

router.post('/movements', requirePermission('inventory', 'edit'), async (req, res, next) => {
  try {
    const body = z
      .object({
        type: z.enum(['RECEIPT', 'ISSUE', 'ADJUSTMENT']),
        itemId: z.string().uuid(),
        warehouseId: z.string().uuid(),
        quantity: z.number(),
        unitCost: z.number().optional(),
        reference: z.string().optional(),
        notes: z.string().optional(),
      })
      .parse(req.body);
    res.status(201).json(await stockService.recordMovement({ ...body, createdById: req.user!.id }));
  } catch (e) {
    next(e);
  }
});

router.get('/transfers', requirePermission('inventory', 'view'), async (_req, res, next) => {
  try {
    res.json(await transfersService.listTransfers());
  } catch (e) {
    next(e);
  }
});

router.post('/transfers', requirePermission('inventory', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        fromWarehouseId: z.string().uuid(),
        toWarehouseId: z.string().uuid(),
        notes: z.string().optional(),
        lines: z.array(z.object({ itemId: z.string().uuid(), quantity: z.number().positive() })).min(1),
      })
      .parse(req.body);
    res.status(201).json(await transfersService.createTransfer(body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.post('/transfers/:id/complete', requirePermission('inventory', 'edit'), async (req, res, next) => {
  try {
    res.json(await transfersService.completeTransfer(String(req.params.id), req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.get('/reports/stock-summary', requirePermission('inventory', 'view'), async (_req, res, next) => {
  try {
    res.json(await reportsService.getStockSummary());
  } catch (e) {
    next(e);
  }
});

router.get('/reports/valuation', requirePermission('inventory', 'view'), async (_req, res, next) => {
  try {
    res.json(await reportsService.getValuationReport());
  } catch (e) {
    next(e);
  }
});

router.get('/reports/low-stock', requirePermission('inventory', 'view'), async (_req, res, next) => {
  try {
    res.json(await reportsService.getLowStockAlerts());
  } catch (e) {
    next(e);
  }
});

router.get('/reports/expiry', requirePermission('inventory', 'view'), async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string, 10) || 90;
    res.json(await reportsService.getExpiryAlerts(days));
  } catch (e) {
    next(e);
  }
});

export default router;
