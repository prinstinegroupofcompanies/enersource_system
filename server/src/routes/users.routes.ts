import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission } from '../middleware/auth.js';
import * as userService from '../services/user.service.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.use(authenticate);

router.get('/me', async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.user!.id);
    res.json(profile);
  } catch (e) {
    next(e);
  }
});

router.patch('/me', async (req, res, next) => {
  try {
    const body = z
      .object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        phone: z.string().optional(),
        avatarUrl: z.string().url().optional(),
      })
      .parse(req.body);
    const profile = await userService.updateProfile(req.user!.id, body);
    res.json(profile);
  } catch (e) {
    next(e);
  }
});

router.get('/', requirePermission('users', 'view'), async (req, res, next) => {
  try {
    const users = await userService.listUsers({
      departmentId: req.query.departmentId as string | undefined,
      roleId: req.query.roleId as string | undefined,
      search: req.query.search as string | undefined,
    });
    res.json(users);
  } catch (e) {
    next(e);
  }
});

router.post('/', requirePermission('users', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phone: z.string().optional(),
        roleId: z.string().uuid(),
        departmentId: z.string().uuid().optional(),
      })
      .parse(req.body);
    const user = await userService.createUser(body, req.user!.id);
    const { passwordHash: _, ...safe } = user;
    res.status(201).json(safe);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', requirePermission('users', 'edit'), async (req, res, next) => {
  try {
    const body = z
      .object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        phone: z.string().optional(),
        roleId: z.string().uuid().optional(),
        departmentId: z.string().uuid().nullable().optional(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body);
    const id = String(req.params.id);
    const user = await userService.updateUser(id, body, req.user!.id);
    res.json(user);
  } catch (e) {
    next(e);
  }
});

router.get('/roles', requirePermission('users', 'view'), async (_req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(roles);
  } catch (e) {
    next(e);
  }
});

router.get('/departments', authenticate, async (_req, res, next) => {
  try {
    const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
    res.json(departments);
  } catch (e) {
    next(e);
  }
});

export default router;
