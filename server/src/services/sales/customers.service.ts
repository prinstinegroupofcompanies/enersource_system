import { prisma } from '../../lib/prisma.js';
import { createAuditLog } from '../audit.service.js';

export async function listCustomers(search?: string) {
  return prisma.customer.findMany({
    where: {
      isActive: true,
      ...(search && {
        OR: [
          { companyName: { contains: search } },
          { contactPerson: { contains: search } },
          { email: { contains: search } },
        ],
      }),
    },
    orderBy: { companyName: 'asc' },
    include: { _count: { select: { invoices: true, quotations: true } } },
  });
}

export async function createCustomer(
  data: {
    companyName: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
  },
  actorId: string
) {
  const customer = await prisma.customer.create({
    data: { ...data, createdById: actorId },
  });
  await createAuditLog({
    actorId,
    action: 'CUSTOMER_CREATED',
    entityType: 'Customer',
    entityId: customer.id,
  });
  return customer;
}

export async function updateCustomer(
  id: string,
  data: Partial<{
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    isActive: boolean;
  }>,
  actorId: string
) {
  return prisma.customer.update({ where: { id }, data });
}
