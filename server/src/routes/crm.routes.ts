import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission } from '../middleware/auth.js';
import * as crmService from '../services/crm/crm.service.js';
import { prisma } from '../lib/prisma.js';

const router = Router();
router.use(authenticate);

router.get('/meta/users', requirePermission('crm', 'view'), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: 'asc' },
    });
    res.json(users);
  } catch (e) {
    next(e);
  }
});

router.get('/summary', requirePermission('crm', 'view'), async (req, res, next) => {
  try {
    res.json(await crmService.getDashboardSummary(req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.get('/pipeline', requirePermission('crm', 'view'), async (_req, res, next) => {
  try {
    res.json(await crmService.getPipeline());
  } catch (e) {
    next(e);
  }
});

router.get('/leads', requirePermission('crm', 'view'), async (req, res, next) => {
  try {
    res.json(
      await crmService.listLeads({
        status: req.query.status as string | undefined,
        source: req.query.source as string | undefined,
        search: req.query.search as string | undefined,
        assignedToId: req.query.assignedToId as string | undefined,
      })
    );
  } catch (e) {
    next(e);
  }
});

router.get('/leads/:id', requirePermission('crm', 'view'), async (req, res, next) => {
  try {
    res.json(await crmService.getLead(String(req.params.id)));
  } catch (e) {
    next(e);
  }
});

router.post('/leads', requirePermission('crm', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        companyName: z.string().min(1),
        contactPerson: z.string().optional(),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().optional(),
        source: z.string().optional(),
        estimatedValue: z.number().min(0).optional(),
        notes: z.string().optional(),
        assignedToId: z.string().uuid().optional(),
        nextFollowUpAt: z.string().optional(),
      })
      .parse(req.body);
    res.status(201).json(await crmService.createLead(body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.patch('/leads/:id', requirePermission('crm', 'edit'), async (req, res, next) => {
  try {
    const body = z
      .object({
        companyName: z.string().optional(),
        contactPerson: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        source: z.string().optional(),
        status: z.string().optional(),
        estimatedValue: z.number().optional(),
        notes: z.string().optional(),
        assignedToId: z.string().uuid().optional(),
        nextFollowUpAt: z.string().optional(),
      })
      .parse(req.body);
    res.json(await crmService.updateLead(String(req.params.id), body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.post('/leads/:id/convert', requirePermission('crm', 'edit'), async (req, res, next) => {
  try {
    res.json(await crmService.convertLeadToCustomer(String(req.params.id), req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.get('/clients', requirePermission('crm', 'view'), async (req, res, next) => {
  try {
    res.json(await crmService.listClients(req.query.search as string | undefined));
  } catch (e) {
    next(e);
  }
});

router.get('/clients/:id', requirePermission('crm', 'view'), async (req, res, next) => {
  try {
    res.json(await crmService.getClient(String(req.params.id)));
  } catch (e) {
    next(e);
  }
});

router.get('/activities', requirePermission('crm', 'view'), async (_req, res, next) => {
  try {
    const activities = await prisma.crmActivity.findMany({
      orderBy: { activityDate: 'desc' },
      take: 50,
      include: {
        lead: { select: { leadNumber: true, companyName: true } },
        customer: { select: { companyName: true } },
      },
    });
    res.json(activities);
  } catch (e) {
    next(e);
  }
});

router.post('/activities', requirePermission('crm', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        type: z.string(),
        subject: z.string().min(1),
        notes: z.string().optional(),
        activityDate: z.string().optional(),
        leadId: z.string().uuid().optional(),
        customerId: z.string().uuid().optional(),
      })
      .parse(req.body);
    res.status(201).json(await crmService.logActivity(body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.get('/reminders', requirePermission('crm', 'view'), async (req, res, next) => {
  try {
    res.json(
      await crmService.listReminders({
        status: req.query.status as string | undefined,
        assignedToId: req.query.assignedToId as string | undefined,
        overdue: req.query.overdue === 'true',
      })
    );
  } catch (e) {
    next(e);
  }
});

router.post('/reminders', requirePermission('crm', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().min(1),
        dueAt: z.string(),
        leadId: z.string().uuid().optional(),
        customerId: z.string().uuid().optional(),
        assignedToId: z.string().uuid().optional(),
      })
      .parse(req.body);
    res.status(201).json(await crmService.createReminder(body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.post('/reminders/:id/complete', requirePermission('crm', 'edit'), async (req, res, next) => {
  try {
    res.json(await crmService.completeReminder(String(req.params.id)));
  } catch (e) {
    next(e);
  }
});

export default router;
