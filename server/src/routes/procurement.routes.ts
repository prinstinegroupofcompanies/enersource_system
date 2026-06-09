import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import * as requisitionsService from '../services/procurement/requisitions.service.js';
import * as paymentsService from '../services/procurement/payments.service.js';
import * as pettyCashService from '../services/procurement/pettyCash.service.js';

const router = Router();
router.use(authenticate);

const lineSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
});

router.get('/summary', requirePermission('procurement', 'view'), async (_req, res, next) => {
  try {
    res.json(await pettyCashService.getProcurementSummary());
  } catch (e) {
    next(e);
  }
});

// Requisitions
router.get('/requisitions', requirePermission('procurement', 'view'), async (req, res, next) => {
  try {
    res.json(await requisitionsService.listRequisitions(req.query.status as string | undefined));
  } catch (e) {
    next(e);
  }
});

router.post('/requisitions', requirePermission('procurement', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().min(1),
        type: z.string(),
        description: z.string().optional(),
        projectReference: z.string().optional(),
        departmentId: z.string().uuid().optional(),
        lines: z.array(lineSchema).min(1),
      })
      .parse(req.body);
    res.status(201).json(await requisitionsService.createRequisition(body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.post('/requisitions/:id/approve', requirePermission('procurement', 'approve'), async (req, res, next) => {
  try {
    const { comments } = z.object({ comments: z.string().optional() }).parse(req.body ?? {});
    res.json(await requisitionsService.approveRequisitionStep(String(req.params.id), req.user!.id, comments));
  } catch (e) {
    next(e);
  }
});

router.post('/requisitions/:id/reject', requirePermission('procurement', 'approve'), async (req, res, next) => {
  try {
    const { comments } = z.object({ comments: z.string().optional() }).parse(req.body ?? {});
    res.json(await requisitionsService.rejectRequisition(String(req.params.id), req.user!.id, comments));
  } catch (e) {
    next(e);
  }
});

// Payment requests
router.get('/payments', requirePermission('procurement', 'view'), async (req, res, next) => {
  try {
    res.json(await paymentsService.listPaymentRequests(req.query.status as string | undefined));
  } catch (e) {
    next(e);
  }
});

router.post(
  '/payments',
  requirePermission('procurement', 'create'),
  upload.single('attachment'),
  async (req, res, next) => {
    try {
      const body = z
        .object({
          title: z.string().min(1),
          amount: z.coerce.number().positive(),
          description: z.string().optional(),
          requisitionId: z.string().uuid().optional(),
        })
        .parse(req.body);

      const file = req.file;
      res.status(201).json(
        await paymentsService.createPaymentRequest(
          {
            ...body,
            attachmentName: file?.originalname,
            attachmentPath: file?.filename,
          },
          req.user!.id
        )
      );
    } catch (e) {
      next(e);
    }
  }
);

router.post('/payments/:id/approve', requirePermission('procurement', 'approve'), async (req, res, next) => {
  try {
    const { step } = z.object({ step: z.string() }).parse(req.body);
    res.json(await paymentsService.approvePaymentRequest(String(req.params.id), req.user!.id, step));
  } catch (e) {
    next(e);
  }
});

router.post('/payments/:id/reject', requirePermission('procurement', 'approve'), async (req, res, next) => {
  try {
    const { comments } = z.object({ comments: z.string().optional() }).parse(req.body ?? {});
    res.json(await paymentsService.rejectPaymentRequest(String(req.params.id), req.user!.id, comments));
  } catch (e) {
    next(e);
  }
});

router.post('/payments/:id/pay', requirePermission('procurement', 'approve'), async (req, res, next) => {
  try {
    res.json(await paymentsService.markPaymentPaid(String(req.params.id), req.user!.id));
  } catch (e) {
    next(e);
  }
});

// Petty cash (under procurement API for convenience; permission petty-cash)
router.get('/petty-cash/summary', requirePermission('petty-cash', 'view'), async (req, res, next) => {
  try {
    const period = (req.query.period as 'daily' | 'monthly') ?? 'monthly';
    res.json(await pettyCashService.getPettyCashReport(period));
  } catch (e) {
    next(e);
  }
});

router.get('/petty-cash/funds', requirePermission('petty-cash', 'view'), async (_req, res, next) => {
  try {
    res.json(await pettyCashService.listFunds());
  } catch (e) {
    next(e);
  }
});

router.post('/petty-cash/funds', requirePermission('petty-cash', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({ name: z.string(), custodianName: z.string().optional(), allocatedAmount: z.number() })
      .parse(req.body);
    res.status(201).json(await pettyCashService.createFund(body));
  } catch (e) {
    next(e);
  }
});

router.post('/petty-cash/funds/:id/allocate', requirePermission('petty-cash', 'edit'), async (req, res, next) => {
  try {
    const { amount } = z.object({ amount: z.number().positive() }).parse(req.body);
    res.json(await pettyCashService.allocateFund(String(req.params.id), amount, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.post(
  '/petty-cash/expenses',
  requirePermission('petty-cash', 'create'),
  upload.single('receipt'),
  async (req, res, next) => {
    try {
      const body = z
        .object({
          fundId: z.string().uuid(),
          amount: z.coerce.number().positive(),
          description: z.string(),
          reference: z.string().optional(),
        })
        .parse(req.body);
      const file = req.file;
      res.status(201).json(
        await pettyCashService.recordExpense(
          body.fundId,
          {
            amount: body.amount,
            description: body.description,
            reference: body.reference,
            receiptName: file?.originalname,
            receiptPath: file?.filename,
          },
          req.user!.id
        )
      );
    } catch (e) {
      next(e);
    }
  }
);

router.post('/petty-cash/reimbursements', requirePermission('petty-cash', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({ fundId: z.string().uuid(), amount: z.number().positive(), description: z.string() })
      .parse(req.body);
    res.status(201).json(await pettyCashService.requestReimbursement(body.fundId, body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.post('/petty-cash/reimbursements/:id/approve', requirePermission('petty-cash', 'approve'), async (req, res, next) => {
  try {
    res.json(await pettyCashService.approveReimbursement(String(req.params.id), req.user!.id));
  } catch (e) {
    next(e);
  }
});

export default router;
