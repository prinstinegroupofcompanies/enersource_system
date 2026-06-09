import { prisma } from '../../lib/prisma.js';
import { roundMoney } from '../../utils/finance.js';
import { nextNumber } from '../../utils/sales.js';
import { isProjectDelayed } from '../../constants/projects.js';
import { createAuditLog } from '../audit.service.js';
import { adjustBalance, recordMovement } from '../inventory/stock.service.js';

async function syncDelayedProjects() {
  const overdue = await prisma.project.findMany({
    where: {
      status: { in: ['PLANNING', 'ACTIVE'] },
      targetEndDate: { lt: new Date() },
    },
  });
  for (const p of overdue) {
    await prisma.project.update({ where: { id: p.id }, data: { status: 'DELAYED' } });
  }
}

const projectInclude = {
  customer: { select: { id: true, companyName: true } },
  tasks: { orderBy: { createdAt: 'asc' as const } },
  milestones: { orderBy: { dueDate: 'asc' as const } },
  materialUsage: {
    include: { inventoryItem: { select: { sku: true, name: true } } },
    orderBy: { usedAt: 'desc' as const },
  },
  members: true,
};

export async function listProjects(filters?: { status?: string; type?: string; search?: string }) {
  await syncDelayedProjects();
  const projects = await prisma.project.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.search && {
        OR: [
          { title: { contains: filters.search } },
          { projectNumber: { contains: filters.search } },
        ],
      }),
    },
    include: {
      customer: { select: { companyName: true } },
      _count: { select: { tasks: true, milestones: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  return projects.map((p) => ({
    ...p,
    isDelayed: isProjectDelayed(p.targetEndDate, p.status) || p.status === 'DELAYED',
    budgetUsedPercent: p.budget > 0 ? Math.round((p.actualCost / p.budget) * 100) : 0,
  }));
}

export async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: projectInclude,
  });
  if (!project) throw new Error('Project not found');

  const tasksDone = project.tasks.filter((t) => t.status === 'DONE').length;
  const taskProgress = project.tasks.length
    ? Math.round((tasksDone / project.tasks.length) * 100)
    : project.progressPercent;

  return {
    ...project,
    isDelayed: isProjectDelayed(project.targetEndDate, project.status),
    budgetUsedPercent: project.budget > 0 ? Math.round((project.actualCost / project.budget) * 100) : 0,
    taskProgress,
    budgetRemaining: roundMoney(Math.max(0, project.budget - project.actualCost)),
  };
}

export async function createProject(
  data: {
    title: string;
    type: string;
    description?: string;
    location?: string;
    customerId?: string;
    budget: number;
    startDate?: string;
    targetEndDate?: string;
    memberUserIds?: string[];
  },
  managerId: string
) {
  const projectNumber = await nextNumber('PRJ', prisma.project);

  const project = await prisma.project.create({
    data: {
      projectNumber,
      title: data.title,
      type: data.type,
      description: data.description,
      location: data.location,
      customerId: data.customerId,
      managerId,
      budget: data.budget,
      status: 'PLANNING',
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      targetEndDate: data.targetEndDate ? new Date(data.targetEndDate) : undefined,
      members: {
        create: [
          { userId: managerId, role: 'MANAGER' },
          ...(data.memberUserIds ?? [])
            .filter((id) => id !== managerId)
            .map((userId) => ({ userId, role: 'MEMBER' })),
        ],
      },
    },
    include: projectInclude,
  });

  await createAuditLog({
    actorId: managerId,
    action: 'PROJECT_CREATED',
    entityType: 'Project',
    entityId: project.id,
  });

  return project;
}

export async function updateProject(
  id: string,
  data: Partial<{
    title: string;
    status: string;
    description: string;
    location: string;
    budget: number;
    progressPercent: number;
    targetEndDate: string;
    startDate: string;
  }>,
  actorId: string
) {
  const updates: Record<string, unknown> = { ...data };
  if (data.targetEndDate) updates.targetEndDate = new Date(data.targetEndDate);
  if (data.startDate) updates.startDate = new Date(data.startDate);
  if (data.status === 'COMPLETED') updates.completedAt = new Date();

  const project = await prisma.project.update({
    where: { id },
    data: updates,
    include: projectInclude,
  });

  await createAuditLog({ actorId, action: 'PROJECT_UPDATED', entityType: 'Project', entityId: id });
  return project;
}

export async function addTask(
  projectId: string,
  data: {
    title: string;
    description?: string;
    assignedToId?: string;
    dueDate?: string;
    priority?: string;
  }
) {
  return prisma.projectTask.create({
    data: {
      projectId,
      title: data.title,
      description: data.description,
      assignedToId: data.assignedToId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      priority: data.priority ?? 'MEDIUM',
    },
  });
}

export async function updateTask(
  id: string,
  data: Partial<{ title: string; status: string; assignedToId: string | null; dueDate: string }>
) {
  return prisma.projectTask.update({
    where: { id },
    data: {
      ...data,
      ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
      ...(data.status === 'DONE' && { completedAt: new Date() }),
    },
  });
}

export async function addMilestone(
  projectId: string,
  data: { title: string; dueDate?: string }
) {
  return prisma.projectMilestone.create({
    data: {
      projectId,
      title: data.title,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
  });
}

export async function completeMilestone(id: string) {
  return prisma.projectMilestone.update({
    where: { id },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });
}

export async function recordMaterialUsage(
  projectId: string,
  data: {
    inventoryItemId?: string;
    description: string;
    quantity: number;
    unitCost: number;
  },
  recordedById: string
) {
  const amount = roundMoney(data.quantity * data.unitCost);

  const usage = await prisma.projectMaterialUsage.create({
    data: {
      projectId,
      inventoryItemId: data.inventoryItemId,
      description: data.description,
      quantity: data.quantity,
      unitCost: data.unitCost,
      amount,
      recordedById,
    },
  });

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (project) {
    await prisma.project.update({
      where: { id: projectId },
      data: { actualCost: roundMoney(project.actualCost + amount) },
    });
  }

  if (data.inventoryItemId) {
    const mainWh = await prisma.warehouse.findFirst({ where: { code: 'MAIN' } });
    if (mainWh) {
      try {
        await adjustBalance(data.inventoryItemId, mainWh.id, -data.quantity);
        await recordMovement({
          type: 'ISSUE',
          itemId: data.inventoryItemId,
          warehouseId: mainWh.id,
          quantity: data.quantity,
          reference: project?.projectNumber,
          notes: `Project material: ${data.description}`,
          createdById: recordedById,
        });
      } catch {
        /* insufficient stock — still record usage */
      }
    }
  }

  return usage;
}

export async function getDashboardSummary() {
  await syncDelayedProjects();
  const projects = await prisma.project.findMany({
    include: { customer: { select: { companyName: true } } },
  });

  const active = projects.filter((p) => p.status === 'ACTIVE').length;
  const completed = projects.filter((p) => p.status === 'COMPLETED').length;
  const delayed = projects.filter(
    (p) => p.status === 'DELAYED' || isProjectDelayed(p.targetEndDate, p.status)
  ).length;

  const totalBudget = roundMoney(projects.reduce((s, p) => s + p.budget, 0));
  const totalSpent = roundMoney(projects.reduce((s, p) => s + p.actualCost, 0));
  const budgetPerformance =
    totalBudget > 0 ? Math.round((1 - totalSpent / totalBudget) * 100) : 100;

  return {
    activeProjects: active,
    completedProjects: completed,
    delayedProjects: delayed,
    totalProjects: projects.length,
    totalBudget,
    totalSpent,
    budgetPerformance: Math.max(0, Math.min(100, budgetPerformance)),
    recent: projects.slice(0, 5).map((p) => ({
      id: p.id,
      projectNumber: p.projectNumber,
      title: p.title,
      status: p.status,
      customer: p.customer?.companyName,
      progressPercent: p.progressPercent,
      isDelayed: isProjectDelayed(p.targetEndDate, p.status),
    })),
  };
}
