import { prisma } from '../../lib/prisma.js';
import { nextNumber } from '../../utils/sales.js';
import { createAuditLog } from '../audit.service.js';

const ticketInclude = {
  customer: { select: { id: true, companyName: true } },
  comments: { orderBy: { createdAt: 'asc' as const } },
  _count: { select: { comments: true } },
};

export async function getSupportSummary() {
  const [open, inProgress, customerOpen, urgent, recent] = await Promise.all([
    prisma.supportTicket.count({ where: { status: 'OPEN' } }),
    prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.supportTicket.count({ where: { type: 'CUSTOMER', status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.supportTicket.count({ where: { priority: 'URGENT', status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { customer: { select: { companyName: true } } },
    }),
  ]);

  return {
    openTickets: open,
    inProgressTickets: inProgress,
    customerOpenTickets: customerOpen,
    urgentTickets: urgent,
    recent: recent.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      title: t.title,
      type: t.type,
      priority: t.priority,
      status: t.status,
      customer: t.customer?.companyName,
      createdAt: t.createdAt,
    })),
  };
}

export async function listTickets(filters?: {
  status?: string;
  type?: string;
  priority?: string;
  assignedToId?: string;
  search?: string;
}) {
  return prisma.supportTicket.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.priority && { priority: filters.priority }),
      ...(filters?.assignedToId && { assignedToId: filters.assignedToId }),
      ...(filters?.search && {
        OR: [{ title: { contains: filters.search } }, { ticketNumber: { contains: filters.search } }],
      }),
    },
    include: {
      customer: { select: { companyName: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
}

export async function getTicket(id: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: ticketInclude,
  });
  if (!ticket) throw new Error('Ticket not found');
  return ticket;
}

export async function createTicket(
  data: {
    title: string;
    description?: string;
    type?: string;
    priority?: string;
    customerId?: string;
    assignedToId?: string;
  },
  requesterId: string
) {
  const ticketNumber = await nextNumber('TKT', prisma.supportTicket);

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber,
      title: data.title,
      description: data.description,
      type: data.type ?? 'INTERNAL',
      priority: data.priority ?? 'MEDIUM',
      customerId: data.customerId,
      requesterId,
      assignedToId: data.assignedToId,
    },
    include: ticketInclude,
  });

  await createAuditLog({
    actorId: requesterId,
    action: 'TICKET_CREATED',
    entityType: 'SupportTicket',
    entityId: ticket.id,
  });

  return ticket;
}

export async function updateTicket(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    priority: string;
    status: string;
    assignedToId: string | null;
  }>,
  actorId: string
) {
  const updates: Record<string, unknown> = { ...data };
  if (data.status === 'RESOLVED' || data.status === 'CLOSED') {
    updates.resolvedAt = new Date();
  }

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: updates,
    include: ticketInclude,
  });

  await createAuditLog({ actorId, action: 'TICKET_UPDATED', entityType: 'SupportTicket', entityId: id });
  return ticket;
}

export async function addComment(ticketId: string, body: string, authorId: string) {
  const comment = await prisma.ticketComment.create({
    data: { ticketId, authorId, body },
  });

  await prisma.supportTicket.update({ where: { id: ticketId }, data: { updatedAt: new Date() } });
  return comment;
}
