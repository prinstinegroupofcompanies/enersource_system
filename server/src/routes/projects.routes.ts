import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission } from '../middleware/auth.js';
import * as projectsService from '../services/projects/projects.service.js';
import { prisma } from '../lib/prisma.js';

const router = Router();
router.use(authenticate);

router.get('/meta/users', requirePermission('projects', 'view'), async (_req, res, next) => {
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

router.get('/meta/customers', requirePermission('projects', 'view'), async (_req, res, next) => {
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

router.get('/summary', requirePermission('projects', 'view'), async (_req, res, next) => {
  try {
    res.json(await projectsService.getDashboardSummary());
  } catch (e) {
    next(e);
  }
});

router.get('/', requirePermission('projects', 'view'), async (req, res, next) => {
  try {
    res.json(
      await projectsService.listProjects({
        status: req.query.status as string | undefined,
        type: req.query.type as string | undefined,
        search: req.query.search as string | undefined,
      })
    );
  } catch (e) {
    next(e);
  }
});

router.get('/:id', requirePermission('projects', 'view'), async (req, res, next) => {
  try {
    res.json(await projectsService.getProject(String(req.params.id)));
  } catch (e) {
    next(e);
  }
});

router.post('/', requirePermission('projects', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().min(1),
        type: z.string(),
        description: z.string().optional(),
        location: z.string().optional(),
        customerId: z.string().uuid().optional(),
        budget: z.number().min(0),
        startDate: z.string().optional(),
        targetEndDate: z.string().optional(),
        memberUserIds: z.array(z.string().uuid()).optional(),
      })
      .parse(req.body);
    res.status(201).json(await projectsService.createProject(body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', requirePermission('projects', 'edit'), async (req, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().optional(),
        status: z.string().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        budget: z.number().optional(),
        progressPercent: z.number().min(0).max(100).optional(),
        targetEndDate: z.string().optional(),
        startDate: z.string().optional(),
      })
      .parse(req.body);
    res.json(await projectsService.updateProject(String(req.params.id), body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.post('/:id/tasks', requirePermission('projects', 'edit'), async (req, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().min(1),
        description: z.string().optional(),
        assignedToId: z.string().uuid().optional(),
        dueDate: z.string().optional(),
        priority: z.string().optional(),
      })
      .parse(req.body);
    res.status(201).json(await projectsService.addTask(String(req.params.id), body));
  } catch (e) {
    next(e);
  }
});

router.patch('/tasks/:taskId', requirePermission('projects', 'edit'), async (req, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().optional(),
        status: z.string().optional(),
        assignedToId: z.string().uuid().nullable().optional(),
        dueDate: z.string().optional(),
      })
      .parse(req.body);
    res.json(await projectsService.updateTask(String(req.params.taskId), body));
  } catch (e) {
    next(e);
  }
});

router.post('/:id/milestones', requirePermission('projects', 'edit'), async (req, res, next) => {
  try {
    const body = z.object({ title: z.string(), dueDate: z.string().optional() }).parse(req.body);
    res.status(201).json(await projectsService.addMilestone(String(req.params.id), body));
  } catch (e) {
    next(e);
  }
});

router.post('/milestones/:id/complete', requirePermission('projects', 'edit'), async (req, res, next) => {
  try {
    res.json(await projectsService.completeMilestone(String(req.params.id)));
  } catch (e) {
    next(e);
  }
});

router.post('/:id/materials', requirePermission('projects', 'edit'), async (req, res, next) => {
  try {
    const body = z
      .object({
        inventoryItemId: z.string().uuid().optional(),
        description: z.string(),
        quantity: z.number().positive(),
        unitCost: z.number().min(0),
      })
      .parse(req.body);
    res.status(201).json(
      await projectsService.recordMaterialUsage(String(req.params.id), body, req.user!.id)
    );
  } catch (e) {
    next(e);
  }
});

export default router;
