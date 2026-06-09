import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission } from '../middleware/auth.js';
import * as hrService from '../services/hr/hr.service.js';
import { prisma } from '../lib/prisma.js';

const router = Router();
router.use(authenticate);

router.get('/meta/departments', requirePermission('hr', 'view'), async (_req, res, next) => {
  try {
    const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
    res.json(departments);
  } catch (e) {
    next(e);
  }
});

router.get('/meta/employees', requirePermission('hr', 'view'), async (_req, res, next) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, employeeNumber: true, firstName: true, lastName: true },
      orderBy: { firstName: 'asc' },
    });
    res.json(employees);
  } catch (e) {
    next(e);
  }
});

router.get('/summary', requirePermission('hr', 'view'), async (_req, res, next) => {
  try {
    res.json(await hrService.getDashboardSummary());
  } catch (e) {
    next(e);
  }
});

router.get('/employees', requirePermission('hr', 'view'), async (req, res, next) => {
  try {
    res.json(
      await hrService.listEmployees({
        status: req.query.status as string | undefined,
        departmentId: req.query.departmentId as string | undefined,
        search: req.query.search as string | undefined,
      })
    );
  } catch (e) {
    next(e);
  }
});

router.get('/employees/:id', requirePermission('hr', 'view'), async (req, res, next) => {
  try {
    res.json(await hrService.getEmployee(String(req.params.id)));
  } catch (e) {
    next(e);
  }
});

router.post('/employees', requirePermission('hr', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().optional(),
        jobTitle: z.string().optional(),
        employmentType: z.string().optional(),
        departmentId: z.string().uuid().optional(),
        managerId: z.string().uuid().optional(),
        hireDate: z.string().optional(),
        userId: z.string().uuid().optional(),
        emergencyContact: z.string().optional(),
      })
      .parse(req.body);
    res.status(201).json(await hrService.createEmployee(body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.patch('/employees/:id', requirePermission('hr', 'edit'), async (req, res, next) => {
  try {
    const body = z
      .object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        jobTitle: z.string().optional(),
        employmentType: z.string().optional(),
        status: z.string().optional(),
        departmentId: z.string().uuid().optional(),
        managerId: z.string().uuid().nullable().optional(),
        hireDate: z.string().optional(),
        terminationDate: z.string().optional(),
        emergencyContact: z.string().optional(),
      })
      .parse(req.body);
    res.json(await hrService.updateEmployee(String(req.params.id), body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.get('/attendance', requirePermission('hr', 'view'), async (req, res, next) => {
  try {
    res.json(
      await hrService.listAttendance({
        date: req.query.date as string | undefined,
        employeeId: req.query.employeeId as string | undefined,
        status: req.query.status as string | undefined,
      })
    );
  } catch (e) {
    next(e);
  }
});

router.post('/attendance', requirePermission('hr', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        employeeId: z.string().uuid(),
        date: z.string().optional(),
        checkIn: z.string().optional(),
        checkOut: z.string().optional(),
        status: z.string().optional(),
        notes: z.string().optional(),
      })
      .parse(req.body);
    res.status(201).json(await hrService.recordAttendance(body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.get('/kpis', requirePermission('hr', 'view'), async (req, res, next) => {
  try {
    res.json(
      await hrService.listKpis({
        employeeId: req.query.employeeId as string | undefined,
        periodLabel: req.query.periodLabel as string | undefined,
      })
    );
  } catch (e) {
    next(e);
  }
});

router.post('/kpis', requirePermission('hr', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        employeeId: z.string().uuid(),
        title: z.string().min(1),
        description: z.string().optional(),
        periodLabel: z.string().min(1),
        targetValue: z.number().positive(),
        actualValue: z.number().min(0).optional(),
        unit: z.string().optional(),
      })
      .parse(req.body);
    res.status(201).json(await hrService.createKpi(body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.patch('/kpis/:id', requirePermission('hr', 'edit'), async (req, res, next) => {
  try {
    const body = z
      .object({
        actualValue: z.number().optional(),
        targetValue: z.number().optional(),
        status: z.string().optional(),
        description: z.string().optional(),
      })
      .parse(req.body);
    res.json(await hrService.updateKpi(String(req.params.id), body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.get('/appraisals', requirePermission('hr', 'view'), async (req, res, next) => {
  try {
    res.json(
      await hrService.listAppraisals({
        employeeId: req.query.employeeId as string | undefined,
        status: req.query.status as string | undefined,
      })
    );
  } catch (e) {
    next(e);
  }
});

router.post('/appraisals', requirePermission('hr', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        employeeId: z.string().uuid(),
        reviewPeriod: z.string().min(1),
        overallRating: z.number().min(1).max(5).optional(),
        strengths: z.string().optional(),
        improvements: z.string().optional(),
        goals: z.string().optional(),
      })
      .parse(req.body);
    res.status(201).json(await hrService.createAppraisal(body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.patch('/appraisals/:id', requirePermission('hr', 'edit'), async (req, res, next) => {
  try {
    const body = z
      .object({
        overallRating: z.number().min(1).max(5).optional(),
        strengths: z.string().optional(),
        improvements: z.string().optional(),
        goals: z.string().optional(),
        status: z.string().optional(),
      })
      .parse(req.body);
    res.json(await hrService.updateAppraisal(String(req.params.id), body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.post('/appraisals/:id/complete', requirePermission('hr', 'approve'), async (req, res, next) => {
  try {
    res.json(
      await hrService.updateAppraisal(String(req.params.id), { status: 'COMPLETED' }, req.user!.id)
    );
  } catch (e) {
    next(e);
  }
});

export default router;
