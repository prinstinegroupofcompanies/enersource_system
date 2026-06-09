import { prisma } from '../lib/prisma.js';

export async function createAuditLog(params: {
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  previousValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      previousValue: params.previousValue ? JSON.stringify(params.previousValue) : undefined,
      newValue: params.newValue ? JSON.stringify(params.newValue) : undefined,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}

export async function listAuditLogs(filters?: {
  entityType?: string;
  action?: string;
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.entityType) where.entityType = filters.entityType;
  if (filters?.action) where.action = { contains: filters.action };
  if (filters?.from || filters?.to) {
    where.createdAt = {
      ...(filters.from && { gte: new Date(filters.from) }),
      ...(filters.to && { lte: new Date(filters.to) }),
    };
  }
  if (filters?.search) {
    where.OR = [
      { action: { contains: filters.search } },
      { entityType: { contains: filters.search } },
      { entityId: { contains: filters.search } },
    ];
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      actor: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: filters?.limit ?? 200,
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    actor: log.actor
      ? { id: log.actor.id, name: `${log.actor.firstName} ${log.actor.lastName}`, email: log.actor.email }
      : null,
    ipAddress: log.ipAddress,
    createdAt: log.createdAt,
    hasChanges: Boolean(log.previousValue || log.newValue),
  }));
}

export async function getAuditLog(id: string) {
  const log = await prisma.auditLog.findUnique({
    where: { id },
    include: {
      actor: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
  if (!log) return null;
  return {
    ...log,
    previousValue: log.previousValue ? JSON.parse(log.previousValue) : null,
    newValue: log.newValue ? JSON.parse(log.newValue) : null,
    actor: log.actor
      ? { id: log.actor.id, name: `${log.actor.firstName} ${log.actor.lastName}`, email: log.actor.email }
      : null,
  };
}
