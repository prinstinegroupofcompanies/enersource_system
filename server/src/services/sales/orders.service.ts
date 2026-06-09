import { prisma } from '../../lib/prisma.js';
import { calcLineAmount, calcTotals, nextNumber, type LineInput } from '../../utils/sales.js';

export async function listSalesOrders(status?: string) {
  return prisma.salesOrder.findMany({
    where: status ? { status } : undefined,
    include: {
      customer: { select: { id: true, companyName: true } },
      quotation: { select: { quoteNumber: true } },
      lines: { orderBy: { lineOrder: 'asc' } },
    },
    orderBy: { orderDate: 'desc' },
    take: 100,
  });
}

export async function createSalesOrder(
  data: {
    customerId: string;
    title: string;
    taxRate?: number;
    notes?: string;
    lines: LineInput[];
    quotationId?: string;
  },
  createdById: string
) {
  const { subtotal, taxAmount, total } = calcTotals(data.lines, data.taxRate ?? 0);
  const orderNumber = await nextNumber('SO', prisma.salesOrder);

  return prisma.salesOrder.create({
    data: {
      orderNumber,
      customerId: data.customerId,
      quotationId: data.quotationId,
      title: data.title,
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

export async function updateOrderStatus(id: string, status: string) {
  return prisma.salesOrder.update({
    where: { id },
    data: { status },
    include: { customer: true, lines: true },
  });
}
