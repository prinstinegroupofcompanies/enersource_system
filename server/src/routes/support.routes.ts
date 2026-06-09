import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission } from '../middleware/auth.js';
import * as supportService from '../services/support/support.service.js';
import { prisma } from '../lib/prisma.js';

const router = Router();
router.use(authenticate);

router.get('/summary', requirePermission('support', 'view'), async (_req, res, next) => {
  try {
    res.json(await supportService.getSupportSummary());
  } catch (e) {
    next(e);
  }
});

router.get('/meta/customers', requirePermission('support', 'view'), async (_req, res, next) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      select: { id: true, companyName: true },
      orderBy: { companyName: 'asc' },
    });
    res.json(customers);
  } catch (e) {
    next(e);
  }
});

router.get('/meta/users', requirePermission('support', 'view'), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: 'asc' },
    });
    res.json(users);
  } catch (e) {
    next(e);
  }
});

router.get('/', requirePermission('support', 'view'), async (req, res, next) => {
  try {
    res.json(
      await supportService.listTickets({
        status: req.query.status as string | undefined,
        type: req.query.type as string | undefined,
        priority: req.query.priority as string | undefined,
        search: req.query.search as string | undefined,
      })
    );
  } catch (e) {
    next(e);
  }
});

router.get('/:id', requirePermission('support', 'view'), async (req, res, next) => {
  try {
    res.json(await supportService.getTicket(String(req.params.id)));
  } catch (e) {
    next(e);
  }
});

router.post('/', requirePermission('support', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().min(1),
        description: z.string().optional(),
        type: z.string().optional(),
        priority: z.string().optional(),
        customerId: z.string().uuid().optional(),
        assignedToId: z.string().uuid().optional(),
      })
      .parse(req.body);
    res.status(201).json(await supportService.createTicket(body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', requirePermission('support', 'edit'), async (req, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        priority: z.string().optional(),
        status: z.string().optional(),
        assignedToId: z.string().uuid().nullable().optional(),
      })
      .parse(req.body);
    res.json(await supportService.updateTicket(String(req.params.id), body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.post('/:id/comments', requirePermission('support', 'create'), async (req, res, next) => {
  try {
    const body = z.object({ body: z.string().min(1) }).parse(req.body);
    res.status(201).json(
      await supportService.addComment(String(req.params.id), body.body, req.user!.id)
    );
  } catch (e) {
    next(e);
  }
});

export default router;
