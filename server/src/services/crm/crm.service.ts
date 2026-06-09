import { prisma } from '../../lib/prisma.js';
import { roundMoney } from '../../utils/finance.js';
import { nextNumber } from '../../utils/sales.js';
import { PIPELINE_STAGES } from '../../constants/crm.js';
import { createAuditLog } from '../audit.service.js';

export async function getDashboardSummary(userId?: string) {
  const now = new Date();
  const leads = await prisma.lead.findMany({
    where: { status: { notIn: ['LOST'] } },
  });

  const pipeline = PIPELINE_STAGES.map((stage) => ({
    stage,
    count: leads.filter((l) => l.status === stage).length,
    value: roundMoney(
      leads.filter((l) => l.status === stage).reduce((s, l) => s + l.estimatedValue, 0)
    ),
  }));

  const won = leads.filter((l) => l.status === 'WON').length;
  const open = leads.filter((l) => PIPELINE_STAGES.includes(l.status as (typeof PIPELINE_STAGES)[number])).length;

  const reminderWhere = userId
    ? { assignedToId: userId, status: 'PENDING' as const }
    : { status: 'PENDING' as const };

  const [pendingReminders, overdueReminders, clients, recentActivities] = await Promise.all([
    prisma.crmReminder.count({ where: reminderWhere }),
    prisma.crmReminder.count({
      where: { ...reminderWhere, dueAt: { lt: now } },
    }),
    prisma.customer.count({ where: { isActive: true } }),
    prisma.crmActivity.findMany({
      orderBy: { activityDate: 'desc' },
      take: 8,
      include: {
        lead: { select: { leadNumber: true, companyName: true } },
        customer: { select: { companyName: true } },
      },
    }),
  ]);

  const conversionRate =
    leads.length > 0 ? Math.round((won / leads.length) * 100) : 0;

  return {
    openLeads: open,
    wonLeads: won,
    totalLeads: leads.length,
    pipelineValue: roundMoney(
      leads
        .filter((l) => PIPELINE_STAGES.includes(l.status as (typeof PIPELINE_STAGES)[number]))
        .reduce((s, l) => s + l.estimatedValue, 0)
    ),
    conversionRate,
    activeClients: clients,
    pendingReminders,
    overdueReminders,
    pipeline,
    recentActivities: recentActivities.map((a) => ({
      id: a.id,
      type: a.type,
      subject: a.subject,
      activityDate: a.activityDate,
      lead: a.lead ? `${a.lead.leadNumber} — ${a.lead.companyName}` : undefined,
      customer: a.customer?.companyName,
    })),
  };
}

export async function listLeads(filters?: {
  status?: string;
  source?: string;
  search?: string;
  assignedToId?: string;
}) {
  return prisma.lead.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.source && { source: filters.source }),
      ...(filters?.assignedToId && { assignedToId: filters.assignedToId }),
      ...(filters?.search && {
        OR: [
          { companyName: { contains: filters.search } },
          { contactPerson: { contains: filters.search } },
          { leadNumber: { contains: filters.search } },
        ],
      }),
    },
    orderBy: { updatedAt: 'desc' },
    take: 200,
    include: {
      _count: { select: { activities: true, reminders: true } },
    },
  });
}

export async function getLead(id: string) {
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      activities: { orderBy: { activityDate: 'desc' } },
      reminders: { orderBy: { dueAt: 'asc' } },
      customer: { select: { id: true, companyName: true } },
    },
  });
  if (!lead) throw new Error('Lead not found');
  return lead;
}

export async function createLead(
  data: {
    companyName: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    source?: string;
    estimatedValue?: number;
    notes?: string;
    assignedToId?: string;
    nextFollowUpAt?: string;
  },
  createdById: string
) {
  const leadNumber = await nextNumber('LD', prisma.lead);

  const lead = await prisma.lead.create({
    data: {
      leadNumber,
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      source: data.source ?? 'WEBSITE',
      estimatedValue: data.estimatedValue ?? 0,
      notes: data.notes,
      assignedToId: data.assignedToId ?? createdById,
      nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : undefined,
      createdById,
    },
  });

  await createAuditLog({
    actorId: createdById,
    action: 'LEAD_CREATED',
    entityType: 'Lead',
    entityId: lead.id,
  });

  return lead;
}

export async function updateLead(
  id: string,
  data: Partial<{
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    source: string;
    status: string;
    estimatedValue: number;
    notes: string;
    assignedToId: string;
    nextFollowUpAt: string;
  }>,
  actorId: string
) {
  const updates: Record<string, unknown> = { ...data };
  if (data.nextFollowUpAt) updates.nextFollowUpAt = new Date(data.nextFollowUpAt);
  if (data.status === 'WON' || data.status === 'LOST') updates.convertedAt = new Date();

  const lead = await prisma.lead.update({ where: { id }, data: updates });
  await createAuditLog({ actorId, action: 'LEAD_UPDATED', entityType: 'Lead', entityId: id });
  return lead;
}

export async function convertLeadToCustomer(id: string, actorId: string) {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) throw new Error('Lead not found');
  if (lead.customerId) return prisma.customer.findUnique({ where: { id: lead.customerId } });

  const customer = await prisma.customer.create({
    data: {
      companyName: lead.companyName,
      contactPerson: lead.contactPerson,
      email: lead.email,
      phone: lead.phone,
      createdById: actorId,
    },
  });

  await prisma.lead.update({
    where: { id },
    data: {
      status: 'WON',
      customerId: customer.id,
      convertedAt: new Date(),
    },
  });

  await createAuditLog({
    actorId,
    action: 'LEAD_CONVERTED',
    entityType: 'Lead',
    entityId: id,
    newValue: { customerId: customer.id },
  });

  return customer;
}

export async function getPipeline() {
  const leads = await prisma.lead.findMany({
    where: { status: { in: [...PIPELINE_STAGES] } },
    orderBy: { updatedAt: 'desc' },
  });

  return PIPELINE_STAGES.map((stage) => ({
    stage,
    leads: leads.filter((l) => l.status === stage),
    totalValue: roundMoney(
      leads.filter((l) => l.status === stage).reduce((s, l) => s + l.estimatedValue, 0)
    ),
  }));
}

export async function listClients(search?: string) {
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
    include: {
      _count: { select: { invoices: true, quotations: true, projects: true, activities: true } },
      activities: { orderBy: { activityDate: 'desc' }, take: 1 },
      reminders: { where: { status: 'PENDING' }, orderBy: { dueAt: 'asc' }, take: 1 },
    },
  });
}

export async function getClient(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      activities: { orderBy: { activityDate: 'desc' } },
      reminders: { orderBy: { dueAt: 'asc' } },
      leads: { select: { id: true, leadNumber: true, status: true } },
      _count: { select: { invoices: true, quotations: true, projects: true } },
    },
  });
  if (!customer) throw new Error('Client not found');
  return customer;
}

export async function logActivity(
  data: {
    type: string;
    subject: string;
    notes?: string;
    activityDate?: string;
    leadId?: string;
    customerId?: string;
  },
  createdById: string
) {
  if (!data.leadId && !data.customerId) throw new Error('Lead or customer required');

  return prisma.crmActivity.create({
    data: {
      type: data.type,
      subject: data.subject,
      notes: data.notes,
      activityDate: data.activityDate ? new Date(data.activityDate) : new Date(),
      leadId: data.leadId,
      customerId: data.customerId,
      createdById,
    },
  });
}

export async function listReminders(filters?: {
  status?: string;
  assignedToId?: string;
  overdue?: boolean;
}) {
  const now = new Date();
  return prisma.crmReminder.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.assignedToId && { assignedToId: filters.assignedToId }),
      ...(filters?.overdue && { status: 'PENDING', dueAt: { lt: now } }),
    },
    orderBy: { dueAt: 'asc' },
    take: 100,
    include: {
      lead: { select: { leadNumber: true, companyName: true } },
      customer: { select: { companyName: true } },
    },
  });
}

export async function createReminder(
  data: {
    title: string;
    dueAt: string;
    leadId?: string;
    customerId?: string;
    assignedToId?: string;
  },
  createdById: string
) {
  if (!data.leadId && !data.customerId) throw new Error('Lead or customer required');

  const reminder = await prisma.crmReminder.create({
    data: {
      title: data.title,
      dueAt: new Date(data.dueAt),
      leadId: data.leadId,
      customerId: data.customerId,
      assignedToId: data.assignedToId ?? createdById,
      createdById,
    },
    include: {
      lead: { select: { leadNumber: true, companyName: true } },
      customer: { select: { companyName: true } },
    },
  });

  if (data.leadId) {
    await prisma.lead.update({
      where: { id: data.leadId },
      data: { nextFollowUpAt: new Date(data.dueAt) },
    });
  }

  return reminder;
}

export async function completeReminder(id: string) {
  return prisma.crmReminder.update({
    where: { id },
    data: { status: 'DONE', completedAt: new Date() },
  });
}
