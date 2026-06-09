import { prisma } from '../../lib/prisma.js';
import { refreshVendorOverdue } from '../../utils/sales.js';
import { roundMoney } from '../../utils/finance.js';
import { nextNumber } from '../../utils/sales.js';

export async function listSuppliers() {
  return prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
}

export async function createSupplier(data: {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
}) {
  return prisma.supplier.create({ data });
}

export async function listVendorInvoices(status?: string) {
  await refreshVendorOverdue();
  return prisma.vendorInvoice.findMany({
    where: status ? { status } : undefined,
    include: { supplier: true },
    orderBy: { dueDate: 'asc' },
  });
}

export async function createVendorInvoice(data: {
  supplierId: string;
  dueDate: string;
  subtotal: number;
  taxAmount?: number;
  description?: string;
  createdById?: string;
}) {
  const billNumber = await nextNumber('BILL', prisma.vendorInvoice);
  const total = roundMoney(data.subtotal + (data.taxAmount ?? 0));
  return prisma.vendorInvoice.create({
    data: {
      billNumber,
      supplierId: data.supplierId,
      dueDate: new Date(data.dueDate),
      subtotal: data.subtotal,
      taxAmount: data.taxAmount ?? 0,
      total,
      description: data.description,
      createdById: data.createdById,
    },
    include: { supplier: true },
  });
}

export async function payVendorBill(id: string, amount: number) {
  const bill = await prisma.vendorInvoice.findUnique({ where: { id } });
  if (!bill) throw new Error('Bill not found');
  const newPaid = roundMoney(bill.amountPaid + amount);
  const status = newPaid >= bill.total ? 'PAID' : bill.status;
  return prisma.vendorInvoice.update({
    where: { id },
    data: { amountPaid: newPaid, status },
    include: { supplier: true },
  });
}

export async function getPayablesAging() {
  await refreshVendorOverdue();
  const open = await prisma.vendorInvoice.findMany({
    where: { status: { in: ['PENDING', 'APPROVED', 'OVERDUE'] } },
    include: { supplier: true },
  });

  const total = roundMoney(open.reduce((s, b) => s + (b.total - b.amountPaid), 0));

  return {
    summary: { totalOutstanding: total, billCount: open.length },
    bills: open.map((b) => ({
      id: b.id,
      billNumber: b.billNumber,
      supplier: b.supplier.name,
      dueDate: b.dueDate,
      total: b.total,
      amountPaid: b.amountPaid,
      balance: roundMoney(b.total - b.amountPaid),
      status: b.status,
    })),
  };
}
