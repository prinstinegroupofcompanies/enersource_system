import { prisma } from '../../lib/prisma.js';
import { roundMoney } from '../../utils/finance.js';
import * as itemsService from './items.service.js';

export async function getSummary() {
  const items = await itemsService.listItems();
  const lowStock = items.filter((i) => i.isLowStock);
  const totalValue = roundMoney(items.reduce((s, i) => s + i.valuation, 0));
  const totalUnits = roundMoney(items.reduce((s, i) => s + i.quantityOnHand, 0));
  const warehouses = await prisma.warehouse.count({ where: { isActive: true } });
  const recentMovements = await prisma.stockMovement.count({
    where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
  });

  return {
    itemCount: items.length,
    warehouseCount: warehouses,
    totalValuation: totalValue,
    totalQuantity: totalUnits,
    lowStockCount: lowStock.length,
    movementsLast30Days: recentMovements,
    lowStockItems: lowStock.slice(0, 5).map((i) => ({
      sku: i.sku,
      name: i.name,
      quantityOnHand: i.quantityOnHand,
      reorderLevel: i.reorderLevel,
    })),
  };
}

export async function getStockSummary() {
  const items = await itemsService.listItems();
  return items.map((i) => ({
    id: i.id,
    sku: i.sku,
    name: i.name,
    category: i.category,
    unit: i.unit,
    quantityOnHand: i.quantityOnHand,
    unitCost: i.unitCost,
    valuation: i.valuation,
    reorderLevel: i.reorderLevel,
    isLowStock: i.isLowStock,
    warehouses: i.balances.map((b) => ({
      warehouse: b.warehouse.name,
      quantity: b.quantity,
    })),
  }));
}

export async function getMovementHistory(filters?: {
  itemId?: string;
  type?: string;
  from?: string;
  to?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.itemId) where.itemId = filters.itemId;
  if (filters?.type) where.type = filters.type;
  if (filters?.from || filters?.to) {
    where.createdAt = {
      ...(filters.from && { gte: new Date(filters.from) }),
      ...(filters.to && { lte: new Date(filters.to) }),
    };
  }

  return prisma.stockMovement.findMany({
    where,
    include: {
      item: { select: { sku: true, name: true } },
      warehouse: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}

export async function getValuationReport() {
  const items = await itemsService.listItems();
  const byCategory = new Map<string, { count: number; quantity: number; value: number }>();

  for (const item of items) {
    const cur = byCategory.get(item.category) ?? { count: 0, quantity: 0, value: 0 };
    cur.count += 1;
    cur.quantity = roundMoney(cur.quantity + item.quantityOnHand);
    cur.value = roundMoney(cur.value + item.valuation);
    byCategory.set(item.category, cur);
  }

  return {
    total: roundMoney(items.reduce((s, i) => s + i.valuation, 0)),
    byCategory: [...byCategory.entries()].map(([category, data]) => ({ category, ...data })),
    items: items.map((i) => ({ sku: i.sku, name: i.name, valuation: i.valuation })),
  };
}

export async function getLowStockAlerts() {
  return itemsService.listItems({ lowStock: true });
}

export async function getExpiryAlerts(withinDays = 90) {
  const deadline = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000);
  return prisma.inventoryItem.findMany({
    where: {
      isActive: true,
      expiryDate: { lte: deadline, not: null },
    },
    orderBy: { expiryDate: 'asc' },
  });
}
