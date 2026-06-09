import { prisma } from '../../lib/prisma.js';
import { nextNumber } from '../../utils/sales.js';

export async function listContracts(status?: string) {
  return prisma.contract.findMany({
    where: status ? { status } : undefined,
    include: {
      customer: { select: { id: true, companyName: true } },
      salesOrder: { select: { orderNumber: true, total: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createContract(
  data: {
    customerId: string;
    salesOrderId?: string;
    title: string;
    startDate?: string;
    endDate?: string;
    value: number;
    terms?: string;
  },
  createdById: string
) {
  const contractNumber = await nextNumber('CT', prisma.contract);
  return prisma.contract.create({
    data: {
      contractNumber,
      customerId: data.customerId,
      salesOrderId: data.salesOrderId,
      title: data.title,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      value: data.value,
      terms: data.terms,
      createdById,
    },
    include: { customer: true, salesOrder: true },
  });
}

export async function updateContractStatus(id: string, status: string) {
  return prisma.contract.update({
    where: { id },
    data: { status },
    include: { customer: true },
  });
}
