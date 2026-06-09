import { prisma } from '../lib/prisma.js';
import { roundMoney } from './finance.js';

export interface LineInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export function calcLineAmount(quantity: number, unitPrice: number): number {
  return roundMoney(quantity * unitPrice);
}

export function calcTotals(lines: LineInput[], taxRate = 0) {
  const subtotal = roundMoney(lines.reduce((s, l) => s + calcLineAmount(l.quantity, l.unitPrice), 0));
  const taxAmount = roundMoney(subtotal * (taxRate / 100));
  const total = roundMoney(subtotal + taxAmount);
  return { subtotal, taxAmount, total };
}

export async function nextNumber(
  prefix: string,
  model: { count: () => Promise<number> }
): Promise<string> {
  const count = await model.count();
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(count + 1).padStart(5, '0')}`;
}

export async function refreshInvoiceStatuses() {
  const now = new Date();
  const candidates = await prisma.invoice.findMany({
    where: { status: 'SENT', dueDate: { lt: now } },
  });
  for (const inv of candidates) {
    if (inv.amountPaid < inv.total) {
      await prisma.invoice.update({ where: { id: inv.id }, data: { status: 'OVERDUE' } });
    }
  }
}

export async function refreshVendorOverdue() {
  const now = new Date();
  await prisma.vendorInvoice.updateMany({
    where: { status: { in: ['PENDING', 'APPROVED'] }, dueDate: { lt: now } },
    data: { status: 'OVERDUE' },
  });
}
