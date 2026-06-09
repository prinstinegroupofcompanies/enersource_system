import { prisma } from '../../lib/prisma.js';
import { calcLineAmount, calcTotals, nextNumber, refreshInvoiceStatuses, type LineInput } from '../../utils/sales.js';
import { roundMoney } from '../../utils/finance.js';
import { createAuditLog } from '../audit.service.js';

export async function listInvoices(status?: string) {
  await refreshInvoiceStatuses();
  return prisma.invoice.findMany({
    where: status ? { status } : undefined,
    include: {
      customer: { select: { id: true, companyName: true, email: true } },
      salesOrder: { select: { orderNumber: true } },
      lines: { orderBy: { lineOrder: 'asc' } },
    },
    orderBy: { issueDate: 'desc' },
    take: 100,
  });
}

export async function createInvoice(
  data: {
    customerId: string;
    salesOrderId?: string;
    dueDate: string;
    taxRate?: number;
    notes?: string;
    isRecurring?: boolean;
    recurringRule?: string;
    lines: LineInput[];
  },
  createdById: string
) {
  const { subtotal, taxAmount, total } = calcTotals(data.lines, data.taxRate ?? 0);
  const invoiceNumber = await nextNumber('INV', prisma.invoice);

  return prisma.invoice.create({
    data: {
      invoiceNumber,
      customerId: data.customerId,
      salesOrderId: data.salesOrderId,
      dueDate: new Date(data.dueDate),
      taxRate: data.taxRate ?? 0,
      subtotal,
      taxAmount,
      total,
      notes: data.notes,
      isRecurring: data.isRecurring ?? false,
      recurringRule: data.recurringRule,
      createdById,
      lines: {
        create: data.lines.map((l, i) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          amount: calcLineAmount(l.quantity, l.unitPrice),
          lineOrder: i,
        })),
      },
    },
    include: { customer: true, lines: true },
  });
}

export async function createInvoiceFromOrder(salesOrderId: string, dueDate: string, createdById: string) {
  const order = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: { lines: true },
  });
  if (!order) throw new Error('Sales order not found');

  return createInvoice(
    {
      customerId: order.customerId,
      salesOrderId: order.id,
      dueDate,
      taxRate: order.taxRate,
      notes: order.notes ?? undefined,
      lines: order.lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      })),
    },
    createdById
  );
}

export async function sendInvoice(id: string, actorId: string) {
  const inv = await prisma.invoice.update({
    where: { id },
    data: { status: 'SENT', sentAt: new Date() },
    include: { customer: true, lines: true },
  });
  await createAuditLog({
    actorId,
    action: 'INVOICE_SENT',
    entityType: 'Invoice',
    entityId: id,
    newValue: { email: inv.customer.email },
  });
  return inv;
}

export async function recordPayment(
  invoiceId: string,
  data: { amount: number; method?: string; reference?: string },
  actorId: string
) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error('Invoice not found');

  const newPaid = roundMoney(invoice.amountPaid + data.amount);
  if (newPaid > invoice.total) throw new Error('Payment exceeds invoice total');

  await prisma.invoicePayment.create({
    data: {
      invoiceId,
      amount: data.amount,
      method: data.method,
      reference: data.reference,
      recordedById: actorId,
    },
  });

  const status = newPaid >= invoice.total ? 'PAID' : invoice.status === 'DRAFT' ? 'SENT' : invoice.status;

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      amountPaid: newPaid,
      status: status === 'PAID' ? 'PAID' : status,
      paidAt: newPaid >= invoice.total ? new Date() : undefined,
    },
    include: { customer: true, payments: true, lines: true },
  });
}

export async function cancelInvoice(id: string, actorId: string) {
  const inv = await prisma.invoice.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });
  await createAuditLog({ actorId, action: 'INVOICE_CANCELLED', entityType: 'Invoice', entityId: id });
  return inv;
}
