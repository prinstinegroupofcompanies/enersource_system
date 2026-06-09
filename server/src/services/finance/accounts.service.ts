import { prisma } from '../../lib/prisma.js';
import { DEFAULT_CHART_OF_ACCOUNTS } from '../../constants/chartOfAccounts.js';
import { createAuditLog } from '../audit.service.js';

export async function listAccounts(filters?: {
  category?: string;
  search?: string;
  activeOnly?: boolean;
}) {
  return prisma.chartOfAccount.findMany({
    where: {
      ...(filters?.category && { category: filters.category }),
      ...(filters?.activeOnly !== false && { isActive: true }),
      ...(filters?.search && {
        OR: [
          { code: { contains: filters.search } },
          { name: { contains: filters.search } },
        ],
      }),
    },
    orderBy: { code: 'asc' },
  });
}

export async function getAccount(id: string) {
  const account = await prisma.chartOfAccount.findUnique({
    where: { id },
    include: { children: true },
  });
  if (!account) throw new Error('Account not found');
  return account;
}

export async function createAccount(
  data: {
    code: string;
    name: string;
    category: string;
    subCategory?: string;
    normalBalance?: string;
    description?: string;
    parentId?: string;
  },
  actorId: string
) {
  const existing = await prisma.chartOfAccount.findUnique({ where: { code: data.code } });
  if (existing) throw new Error('Account code already exists');

  const account = await prisma.chartOfAccount.create({
    data: {
      code: data.code,
      name: data.name,
      category: data.category,
      subCategory: data.subCategory,
      normalBalance: data.normalBalance ?? inferNormalBalance(data.category),
      description: data.description,
      parentId: data.parentId,
    },
  });

  await createAuditLog({
    actorId,
    action: 'ACCOUNT_CREATED',
    entityType: 'ChartOfAccount',
    entityId: account.id,
    newValue: { code: account.code, name: account.name },
  });

  return account;
}

export async function updateAccount(
  id: string,
  data: Partial<{
    name: string;
    subCategory: string;
    description: string;
    isActive: boolean;
    parentId: string | null;
  }>,
  actorId: string
) {
  const previous = await prisma.chartOfAccount.findUnique({ where: { id } });
  if (!previous) throw new Error('Account not found');

  const account = await prisma.chartOfAccount.update({ where: { id }, data });

  await createAuditLog({
    actorId,
    action: 'ACCOUNT_UPDATED',
    entityType: 'ChartOfAccount',
    entityId: id,
    previousValue: previous,
    newValue: data,
  });

  return account;
}

export async function importDefaultChart(actorId?: string) {
  let created = 0;
  for (const tpl of DEFAULT_CHART_OF_ACCOUNTS) {
    const result = await prisma.chartOfAccount.upsert({
      where: { code: tpl.code },
      update: {
        name: tpl.name,
        category: tpl.category,
        subCategory: tpl.subCategory,
        normalBalance: tpl.normalBalance,
      },
      create: {
        code: tpl.code,
        name: tpl.name,
        category: tpl.category,
        subCategory: tpl.subCategory,
        normalBalance: tpl.normalBalance,
      },
    });
    if (result) created++;
  }

  if (actorId) {
    await createAuditLog({
      actorId,
      action: 'COA_IMPORTED',
      entityType: 'ChartOfAccount',
      newValue: { count: DEFAULT_CHART_OF_ACCOUNTS.length },
    });
  }

  return { imported: DEFAULT_CHART_OF_ACCOUNTS.length };
}

export async function getCategories() {
  const rows = await prisma.chartOfAccount.groupBy({
    by: ['category'],
    _count: { id: true },
    where: { isActive: true },
  });
  return rows.map((r) => ({ category: r.category, count: r._count.id }));
}

function inferNormalBalance(category: string): string {
  if (['Liabilities', 'Equity', 'Revenue'].includes(category)) return 'CREDIT';
  if (category === 'Other') return 'CREDIT';
  return 'DEBIT';
}
