import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission } from '../middleware/auth.js';
import * as customersService from '../services/sales/customers.service.js';
import * as quotationsService from '../services/sales/quotations.service.js';
import * as ordersService from '../services/sales/orders.service.js';
import * as contractsService from '../services/sales/contracts.service.js';
import * as invoicesService from '../services/sales/invoices.service.js';
import * as receivablesService from '../services/sales/receivables.service.js';
import * as payablesService from '../services/sales/payables.service.js';
import * as summaryService from '../services/sales/summary.service.js';

const router = Router();
router.use(authenticate);

const lineSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
});

router.get('/summary', requirePermission('sales', 'view'), async (_req, res, next) => {
  try {
    res.json(await summaryService.getSalesSummary());
  } catch (e) {
    next(e);
  }
});

// Customers
router.get('/customers', requirePermission('sales', 'view'), async (req, res, next) => {
  try {
    res.json(await customersService.listCustomers(req.query.search as string | undefined));
  } catch (e) {
    next(e);
  }
});

router.post('/customers', requirePermission('sales', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        companyName: z.string().min(1),
        contactPerson: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
      })
      .parse(req.body);
    res.status(201).json(await customersService.createCustomer(body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

// Quotations
router.get('/quotations', requirePermission('sales', 'view'), async (req, res, next) => {
  try {
    res.json(await quotationsService.listQuotations(req.query.status as string | undefined));
  } catch (e) {
    next(e);
  }
});

router.post('/quotations', requirePermission('sales', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        customerId: z.string().uuid(),
        title: z.string().min(1),
        validUntil: z.string().optional(),
        taxRate: z.number().optional(),
        notes: z.string().optional(),
        lines: z.array(lineSchema).min(1),
      })
      .parse(req.body);
    res.status(201).json(await quotationsService.createQuotation(body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.patch('/quotations/:id/status', requirePermission('sales', 'edit'), async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.string() }).parse(req.body);
    res.json(await quotationsService.updateQuotationStatus(String(req.params.id), status, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.post('/quotations/:id/convert', requirePermission('sales', 'create'), async (req, res, next) => {
  try {
    res.status(201).json(
      await quotationsService.convertToSalesOrder(String(req.params.id), req.user!.id)
    );
  } catch (e) {
    next(e);
  }
});

// Sales orders
router.get('/orders', requirePermission('sales', 'view'), async (req, res, next) => {
  try {
    res.json(await ordersService.listSalesOrders(req.query.status as string | undefined));
  } catch (e) {
    next(e);
  }
});

router.post('/orders', requirePermission('sales', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        customerId: z.string().uuid(),
        title: z.string().min(1),
        taxRate: z.number().optional(),
        notes: z.string().optional(),
        quotationId: z.string().uuid().optional(),
        lines: z.array(lineSchema).min(1),
      })
      .parse(req.body);
    res.status(201).json(await ordersService.createSalesOrder(body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.patch('/orders/:id/status', requirePermission('sales', 'edit'), async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.string() }).parse(req.body);
    res.json(await ordersService.updateOrderStatus(String(req.params.id), status));
  } catch (e) {
    next(e);
  }
});

// Contracts
router.get('/contracts', requirePermission('sales', 'view'), async (req, res, next) => {
  try {
    res.json(await contractsService.listContracts(req.query.status as string | undefined));
  } catch (e) {
    next(e);
  }
});

router.post('/contracts', requirePermission('sales', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        customerId: z.string().uuid(),
        salesOrderId: z.string().uuid().optional(),
        title: z.string().min(1),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        value: z.number().min(0),
        terms: z.string().optional(),
      })
      .parse(req.body);
    res.status(201).json(await contractsService.createContract(body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.patch('/contracts/:id/status', requirePermission('sales', 'edit'), async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.string() }).parse(req.body);
    res.json(await contractsService.updateContractStatus(String(req.params.id), status));
  } catch (e) {
    next(e);
  }
});

// Invoices
router.get('/invoices', requirePermission('sales', 'view'), async (req, res, next) => {
  try {
    res.json(await invoicesService.listInvoices(req.query.status as string | undefined));
  } catch (e) {
    next(e);
  }
});

router.post('/invoices', requirePermission('sales', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        customerId: z.string().uuid(),
        salesOrderId: z.string().uuid().optional(),
        dueDate: z.string(),
        taxRate: z.number().optional(),
        notes: z.string().optional(),
        isRecurring: z.boolean().optional(),
        recurringRule: z.string().optional(),
        lines: z.array(lineSchema).min(1),
      })
      .parse(req.body);
    res.status(201).json(await invoicesService.createInvoice(body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.post('/orders/:id/invoice', requirePermission('sales', 'create'), async (req, res, next) => {
  try {
    const { dueDate } = z.object({ dueDate: z.string() }).parse(req.body);
    res.status(201).json(
      await invoicesService.createInvoiceFromOrder(String(req.params.id), dueDate, req.user!.id)
    );
  } catch (e) {
    next(e);
  }
});

router.post('/invoices/:id/send', requirePermission('sales', 'edit'), async (req, res, next) => {
  try {
    res.json(await invoicesService.sendInvoice(String(req.params.id), req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.post('/invoices/:id/payment', requirePermission('sales', 'edit'), async (req, res, next) => {
  try {
    const body = z
      .object({ amount: z.number().positive(), method: z.string().optional(), reference: z.string().optional() })
      .parse(req.body);
    res.json(await invoicesService.recordPayment(String(req.params.id), body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.post('/invoices/:id/cancel', requirePermission('sales', 'edit'), async (req, res, next) => {
  try {
    res.json(await invoicesService.cancelInvoice(String(req.params.id), req.user!.id));
  } catch (e) {
    next(e);
  }
});

// Receivables & Payables
router.get('/receivables', requirePermission('sales', 'view'), async (_req, res, next) => {
  try {
    res.json(await receivablesService.getReceivablesAging());
  } catch (e) {
    next(e);
  }
});

router.get('/payables', requirePermission('sales', 'view'), async (_req, res, next) => {
  try {
    res.json(await payablesService.getPayablesAging());
  } catch (e) {
    next(e);
  }
});

router.get('/suppliers', requirePermission('sales', 'view'), async (_req, res, next) => {
  try {
    res.json(await payablesService.listSuppliers());
  } catch (e) {
    next(e);
  }
});

router.post('/suppliers', requirePermission('sales', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(1),
        contactPerson: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
      })
      .parse(req.body);
    res.status(201).json(await payablesService.createSupplier(body));
  } catch (e) {
    next(e);
  }
});

router.get('/vendor-invoices', requirePermission('sales', 'view'), async (req, res, next) => {
  try {
    res.json(await payablesService.listVendorInvoices(req.query.status as string | undefined));
  } catch (e) {
    next(e);
  }
});

router.post('/vendor-invoices', requirePermission('sales', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        supplierId: z.string().uuid(),
        dueDate: z.string(),
        subtotal: z.number().positive(),
        taxAmount: z.number().optional(),
        description: z.string().optional(),
      })
      .parse(req.body);
    res.status(201).json(
      await payablesService.createVendorInvoice({ ...body, createdById: req.user!.id })
    );
  } catch (e) {
    next(e);
  }
});

router.post('/vendor-invoices/:id/pay', requirePermission('sales', 'edit'), async (req, res, next) => {
  try {
    const { amount } = z.object({ amount: z.number().positive() }).parse(req.body);
    res.json(await payablesService.payVendorBill(String(req.params.id), amount));
  } catch (e) {
    next(e);
  }
});

export default router;
