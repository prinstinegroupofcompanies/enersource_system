import { prisma } from '../../lib/prisma.js';
import { calcLineAmount, calcTotals, nextNumber, type LineInput } from '../../utils/sales.js';
import { createAuditLog } from '../audit.service.js';

export async function listQuotations(status?: string) {
  return prisma.quotation.findMany({
    where: status ? { status } : undefined,
    include: {
      customer: { select: { id: true, companyName: true } },
      lines: { orderBy: { lineOrder: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function createQuotation(
  data: {
    customerId: string;
    title: string;
    validUntil?: string;
    taxRate?: number;
    notes?: string;
    lines: LineInput[];
  },
  createdById: string
) {
  const { subtotal, taxAmount, total } = calcTotals(data.lines, data.taxRate ?? 0);
  const quoteNumber = await nextNumber('QT', prisma.quotation);

  return prisma.quotation.create({
    data: {
      quoteNumber,
      customerId: data.customerId,
      title: data.title,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      taxRate: data.taxRate ?? 0,
      subtotal,
      taxAmount,
      total,
      notes: data.notes,
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

export async function updateQuotationStatus(id: string, status: string, actorId: string) {
  const q = await prisma.quotation.update({
    where: { id },
    data: { status },
    include: { customer: true, lines: true },
  });
  await createAuditLog({
    actorId,
    action: `QUOTATION_${status}`,
    entityType: 'Quotation',
    entityId: id,
  });
  return q;
}

export async function convertToSalesOrder(quotationId: string, createdById: string) {
  const quote = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { lines: true },
  });
  if (!quote) throw new Error('Quotation not found');
  if (quote.status !== 'ACCEPTED') throw new Error('Only accepted quotations can convert to orders');

  const orderNumber = await nextNumber('SO', prisma.salesOrder);
  const order = await prisma.salesOrder.create({
    data: {
      orderNumber,
      customerId: quote.customerId,
      quotationId: quote.id,
      title: quote.title,
      status: 'CONFIRMED',
      subtotal: quote.subtotal,
      taxRate: quote.taxRate,
      taxAmount: quote.taxAmount,
      total: quote.total,
      notes: quote.notes,
      createdById,
      lines: {
        create: quote.lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          amount: l.amount,
          lineOrder: l.lineOrder,
        })),
      },
    },
    include: { customer: true, lines: true },
  });

  await createAuditLog({
    actorId: createdById,
    action: 'QUOTATION_CONVERTED',
    entityType: 'SalesOrder',
    entityId: order.id,
  });

  return order;
}
