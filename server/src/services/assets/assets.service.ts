import { prisma } from '../../lib/prisma.js';
import { roundMoney } from '../../utils/finance.js';
import { nextNumber } from '../../utils/sales.js';
import { computeDepreciation } from '../../constants/assets.js';
import { createAuditLog } from '../audit.service.js';

function enrichAsset<T extends {
  purchaseCost: number;
  salvageValue: number;
  usefulLifeMonths: number;
  purchaseDate: Date | null;
  accumulatedDepreciation: number;
}>(asset: T) {
  const dep = computeDepreciation(asset);
  return { ...asset, ...dep };
}

export async function getAssetsSummary() {
  const assets = await prisma.asset.findMany({ where: { status: { not: 'DISPOSED' } } });
  const enriched = assets.map(enrichAsset);

  const totalCost = roundMoney(enriched.reduce((s, a) => s + a.purchaseCost, 0));
  const totalBookValue = roundMoney(enriched.reduce((s, a) => s + a.bookValue, 0));
  const totalDepreciation = roundMoney(enriched.reduce((s, a) => s + a.accumulatedDepreciation, 0));

  return {
    totalAssets: assets.length,
    totalCost,
    totalBookValue,
    totalDepreciation,
    byCategory: Object.entries(
      assets.reduce<Record<string, number>>((acc, a) => {
        acc[a.category] = (acc[a.category] ?? 0) + 1;
        return acc;
      }, {})
    ).map(([category, count]) => ({ category, count })),
  };
}

export async function listAssets(filters?: { status?: string; category?: string; search?: string }) {
  const assets = await prisma.asset.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.category && { category: filters.category }),
      ...(filters?.search && {
        OR: [{ name: { contains: filters.search } }, { assetNumber: { contains: filters.search } }],
      }),
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  return assets.map(enrichAsset);
}

export async function getAsset(id: string) {
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) throw new Error('Asset not found');
  return enrichAsset(asset);
}

export async function createAsset(
  data: {
    name: string;
    description?: string;
    category?: string;
    purchaseDate?: string;
    purchaseCost: number;
    salvageValue?: number;
    usefulLifeMonths?: number;
    location?: string;
  },
  actorId: string
) {
  const assetNumber = await nextNumber('AST', prisma.asset);

  const asset = await prisma.asset.create({
    data: {
      assetNumber,
      name: data.name,
      description: data.description,
      category: data.category ?? 'EQUIPMENT',
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
      purchaseCost: data.purchaseCost,
      salvageValue: data.salvageValue ?? 0,
      usefulLifeMonths: data.usefulLifeMonths ?? 60,
      location: data.location,
      createdById: actorId,
    },
  });

  await createAuditLog({ actorId, action: 'ASSET_CREATED', entityType: 'Asset', entityId: asset.id });
  return enrichAsset(asset);
}

export async function updateAsset(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    category: string;
    status: string;
    location: string;
    assignedEmployeeId: string | null;
    accumulatedDepreciation: number;
  }>,
  actorId: string
) {
  const asset = await prisma.asset.update({ where: { id }, data });
  await createAuditLog({ actorId, action: 'ASSET_UPDATED', entityType: 'Asset', entityId: id });
  return enrichAsset(asset);
}

export async function runDepreciation(actorId: string) {
  const assets = await prisma.asset.findMany({ where: { status: 'ACTIVE' } });
  let updated = 0;

  for (const asset of assets) {
    const dep = computeDepreciation(asset);
    if (dep.accumulatedDepreciation > asset.accumulatedDepreciation) {
      await prisma.asset.update({
        where: { id: asset.id },
        data: { accumulatedDepreciation: dep.accumulatedDepreciation },
      });
      updated++;
    }
  }

  await createAuditLog({
    actorId,
    action: 'DEPRECIATION_RUN',
    entityType: 'Asset',
    newValue: { updated },
  });

  return { updatedAssets: updated };
}
